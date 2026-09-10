import * as THREE from 'three';
import { assert, AssetRecord, Scene } from '@tgdf';

import { LevelRecord } from '3D/types';
import { loadWorldMap } from '3D/utils/loadWorldMap';
import { MAIN_CROWD_ID, NAVMESH_AGENT_RADIUS } from '3D/constants';
import { generateChunkedLevel } from '3D/utils/generateChunkedLevel';

import { loadAssetRecord } from './loadAssetRecord';
import { ShadersManager } from './ShadersManager/ShadersManager';
import { OrtographicCamera, OrtographicCameraOptions } from '../../cameras/OrtographicCamera';

const GAME_GRAVITY = new THREE.Vector3(0, -9.81, 0);
const LEVEL_CHUNK_SIZE = 16;

export abstract class GameScene extends Scene {
  public camera: OrtographicCamera;

  public abstract readonly levelVariants: LevelRecord[];
  public abstract readonly preloadedAssets: AssetRecord[];

  private _shadersManager = new ShadersManager();

  constructor() {
    super();

    const aspectRatio = window.innerWidth / window.innerHeight;
    const frustumSize = 9;

    this.camera = this.createCamera({
      left: (-frustumSize * aspectRatio) / 2,
      right: (frustumSize * aspectRatio) / 2,
      top: frustumSize / 2,
      bottom: -frustumSize / 2,
      near: -6,
      far: 40,
    });

    this.camera.setZoom(0.85);

    this.add(this._shadersManager.warmupGroup);
    this.events.on('rendererChange', ({ renderer }) =>
      this._shadersManager.warmup(renderer, this, this.camera)
    );
  }

  protected createCamera(options: OrtographicCameraOptions): OrtographicCamera {
    return new OrtographicCamera(options);
  }

  public async initializePhysics(): Promise<void> {
    await this.initializePhysicsWorld(GAME_GRAVITY);
  }

  public async preloadAssets(): Promise<void> {
    await Promise.all(this.preloadedAssets.map(loadAssetRecord));
    return Promise.resolve();
  }

  public async generateLevel(): Promise<void> {
    try {
      if (this.levelVariants.length === 0) {
        throw new Error('No level variants available for this scene');
      }

      const randomizedIndex = Math.floor(Math.random() * this.levelVariants.length);
      const randomizedLevelVariant = this.levelVariants[randomizedIndex];

      const levelData = await loadWorldMap(randomizedLevelVariant.url);
      const { floorGroup } = await generateChunkedLevel(this, levelData.map, LEVEL_CHUNK_SIZE);
      assert(floorGroup.isGroup, 'Floor group is not a THREE.Group instance');
      await this.initializeNavMeshManager(floorGroup);
      return Promise.resolve();
    } catch (error) {
      throw new Error(String(error));
    }
  }

  public async completeLevelInitialization(): Promise<void> {
    if (!this.navMeshManager || !this.physics) {
      throw new Error('Failed to initialize NavMeshManager or PhysicsManager');
    }

    this.navMeshManager.addCrowd(MAIN_CROWD_ID, {
      maxAgents: 100,
      maxAgentRadius: NAVMESH_AGENT_RADIUS,
    });

    this.onInit();
  }

  public override update(deltaTime: number, renderer: THREE.WebGLRenderer | null): void {
    super.update(deltaTime, renderer);
    if (process.env.NODE_ENV === 'development') {
      this._shadersManager.checkForLateCompiles(this.renderer);
    }
  }

  protected onInit(): void {}
}
