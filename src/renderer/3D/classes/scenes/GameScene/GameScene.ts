import * as THREE from 'three';
import { AssetRecord, Scene } from '@tgdf';

import { MAIN_CROWD_ID, NAVMESH_AGENT_RADIUS } from '3D/constants';

import { loadAssetRecord } from './loadAssetRecord';
import { ShadersManager } from './ShadersManager/ShadersManager';
import { OrtographicCamera } from '../../cameras/OrtographicCamera';

const GAME_GRAVITY = new THREE.Vector3(0, -9.81, 0);

export abstract class GameScene extends Scene {
  public camera: OrtographicCamera;
  public abstract readonly preloadedAssets: AssetRecord[];

  private _shadersManager = new ShadersManager();

  constructor() {
    super();

    const aspectRatio = window.innerWidth / window.innerHeight;
    const frustumSize = 9;

    this.camera = new OrtographicCamera({
      left: (-frustumSize * aspectRatio) / 2,
      right: (frustumSize * aspectRatio) / 2,
      top: frustumSize / 2,
      bottom: -frustumSize / 2,
      near: 0.1,
      far: 40,
    });

    this.camera.setZoom(1);

    this.add(this._shadersManager.warmupGroup);
    this.events.on('rendererChange', ({ renderer }) =>
      this._shadersManager.warmup(renderer, this, this.camera)
    );
  }

  public async initializePhysics(): Promise<void> {
    await this.initializePhysicsWorld(GAME_GRAVITY);
  }

  public async preloadAssets(): Promise<void> {
    await Promise.all(this.preloadedAssets.map(loadAssetRecord));
    return Promise.resolve();
  }

  public async buildSceneContent(): Promise<void> {}

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
