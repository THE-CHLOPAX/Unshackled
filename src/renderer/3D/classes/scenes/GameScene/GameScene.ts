import * as THREE from 'three';
import { assert, AssetRecord, Scene } from '@tgdf';

import { loadWorldMap } from 'renderer/utils/loadWorldMap';
import { GameEventsEmitter, LevelIdentifier } from 'renderer/types';
import { generateChunkedLevel } from '3D/utils/generateChunkedLevel';
import { GAME_GRAVITY, LEVEL_CHUNK_SIZE, MAIN_CROWD_ID, NAVMESH_AGENT_RADIUS } from '3D/constants';

import { loadAssetRecord } from './loadAssetRecord';
import { Player } from '../../gameObjects/players/Player';
import { ShadersManager, WarmupFactory } from './ShadersManager/ShadersManager';
import { getDefaultWarmupMaterialFactories } from './getDefaultWarmupMaterialFactories';
import { OrtographicCamera, OrtographicCameraOptions } from '../../cameras/OrtographicCamera';
import { ProgressTracker, ProgressTrackerObjective } from './ProgressTracker/ProgressTracker';

export type GameSceneOptions = {
  emitter: GameEventsEmitter;
  level?: LevelIdentifier;
  objective?: ProgressTrackerObjective;
};

export abstract class GameScene extends Scene {
  public camera: OrtographicCamera;

  public abstract readonly preloadedAssets: AssetRecord[];

  protected additionalWarmupFactories: WarmupFactory[] = [];

  private _shadersManager = new ShadersManager();
  private _progressTracker: ProgressTracker | null = null;
  private _players: Player[] = [];

  constructor(public readonly options: GameSceneOptions) {
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

    if (options.objective) {
      this._progressTracker = new ProgressTracker(this, options.emitter, {
        players: this._players,
        objective: options.objective,
      });
    }
  }

  public get progressTracker(): ProgressTracker | null {
    return this._progressTracker;
  }

  public get players(): readonly Player[] {
    return this._players;
  }

  public registerPlayer(player: Player): void {
    this._players.push(player);
  }

  public async initializePhysics(): Promise<void> {
    await this.initializePhysicsWorld(GAME_GRAVITY);
  }

  public async precompileShaders(): Promise<void> {
    this.add(this._shadersManager.warmupGroup);
    this._shadersManager.warmup(this.renderer, this, this.camera, [
      ...getDefaultWarmupMaterialFactories(),
      ...this.additionalWarmupFactories,
    ]);
  }

  public async preloadAssets(): Promise<void> {
    await Promise.all(this.preloadedAssets.map(loadAssetRecord));
    return Promise.resolve();
  }

  public async generateLevel(): Promise<void> {
    try {
      const { level } = this.options;

      if (!level) {
        throw new Error('No level provided for this scene');
      }

      const levelData = await loadWorldMap(level.mapUrl);
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

  protected createCamera(options: OrtographicCameraOptions): OrtographicCamera {
    return new OrtographicCamera(options);
  }

  protected onInit(): void {}
}
