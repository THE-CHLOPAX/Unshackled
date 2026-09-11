import * as THREE from 'three';
import { GameObject, Scene } from '@tgdf';
import { Crowd, NavMesh } from '@recast-navigation/core';

import { WorldObjectArgs } from '3D/types';
import { COLORS } from 'renderer/constants';
import { MAIN_CROWD_ID } from '3D/constants';
import { flashEmissive } from 'renderer/3D/utils/flashMaterial';
import { GameScene } from '3D/classes/scenes/GameScene/GameScene';
import { ArcaneCircle } from '3D/classes/gameObjects/ArcaneCircle';
import { Skeleton } from '3D/classes/gameObjects/mobs/Skeleton/Skeleton';

const SKELETON_SPAWN_INTERVAL_SECONDS = 20;
const SKELETON_ALIVE_THRESHOLD = 1;
const SKELETON_SPAWNED_MAX = 2;

const SPAWN_JITTER = 0.75;
const SPAWN_TELEGRAPH_DIAMETER = 1.5;
const SPAWN_TELEGRAPH_DURATION_SECONDS = 3;
const SPAWN_TELEGRAPH_FADE_SECONDS = 0.5;

type PendingSpawnTelegraph = {
  circle: ArcaneCircle;
  origin: THREE.Vector3;
  elapsedSeconds: number;
};

export class SkeletonSpawner extends GameObject {
  private _elapsedSeconds = 0;
  private _active = true;
  private _spawnIntervalRunning = false;
  private _pendingImmediateSpawn = false;
  private _pendingTelegraph: PendingSpawnTelegraph | null = null;
  private _spawnedSkeletons = 0;
  private _livingSkeletons = new Set<Skeleton>();

  constructor(scene: Scene, _args: WorldObjectArgs = {}) {
    super({ scene });

    this.name = 'SkeletonSpawner';
    this.visible = false;
  }

  protected override onAwake(): void {
    super.onAwake();
    this._pendingImmediateSpawn = true;
  }

  protected override onUpdate(deltaTime: number): void {
    if (!this._active) return;

    const scene = this.scene;
    if (!(scene instanceof GameScene)) return;

    const navMesh = scene.navMeshManager?.navMesh;
    const crowd = scene.navMeshManager?.getCrowd(MAIN_CROWD_ID);
    if (!navMesh || !crowd) return;

    if (this._pendingTelegraph) {
      this._updatePendingTelegraph(deltaTime, scene, navMesh, crowd);
      return;
    }

    if (this._pendingImmediateSpawn) {
      this._pendingImmediateSpawn = false;
      if (!this._hasReachedSpawnCap()) {
        this._beginTelegraphedSpawn(scene);
      }
      return;
    }

    this._syncSpawnIntervalState();
    if (!this._spawnIntervalRunning) return;

    this._elapsedSeconds += deltaTime;
    if (this._elapsedSeconds < SKELETON_SPAWN_INTERVAL_SECONDS) return;
    this._elapsedSeconds = 0;

    this._beginTelegraphedSpawn(scene);
  }

  protected override onDestroyed(): void {
    super.onDestroyed();
    this._active = false;

    if (this._pendingTelegraph) {
      this._pendingTelegraph.circle.destroy();
      this._pendingTelegraph = null;
    }
  }

  private _hasReachedSpawnCap(): boolean {
    return this._spawnedSkeletons >= SKELETON_SPAWNED_MAX;
  }

  private _syncSpawnIntervalState(): void {
    const isBelowThreshold = this._livingSkeletons.size < SKELETON_ALIVE_THRESHOLD;
    const hasReachedSpawnCap = this._hasReachedSpawnCap();

    if (!hasReachedSpawnCap && isBelowThreshold && !this._spawnIntervalRunning) {
      this._spawnIntervalRunning = true;
      this._elapsedSeconds = 0;
    } else if (hasReachedSpawnCap || !isBelowThreshold) {
      this._spawnIntervalRunning = false;
    }
  }

  private _beginTelegraphedSpawn(scene: GameScene): void {
    const origin = this.getWorldPosition(new THREE.Vector3());

    const circle = new ArcaneCircle(scene, {
      diameter: SPAWN_TELEGRAPH_DIAMETER,
      color: COLORS.RED,
      rotationDuration: 4,
      fadeIn: { duration: SPAWN_TELEGRAPH_FADE_SECONDS },
      fadeOut: { duration: SPAWN_TELEGRAPH_FADE_SECONDS },
    });
    const { x, z } = origin;
    circle.position.setX(x);
    circle.position.setZ(z);
    scene.add(circle);

    this._pendingTelegraph = { circle, origin, elapsedSeconds: 0 };
  }

  private _updatePendingTelegraph(
    deltaTime: number,
    scene: GameScene,
    navMesh: NavMesh,
    crowd: Crowd
  ): void {
    if (!this._pendingTelegraph) return;

    this._pendingTelegraph.elapsedSeconds += deltaTime;
    if (this._pendingTelegraph.elapsedSeconds < SPAWN_TELEGRAPH_DURATION_SECONDS) return;

    const { circle, origin } = this._pendingTelegraph;
    this._pendingTelegraph = null;

    circle.destroy();
    this._spawnSkeleton(scene, origin, navMesh, crowd);
  }

  private _spawnSkeleton(
    scene: GameScene,
    origin: THREE.Vector3,
    navMesh: NavMesh,
    crowd: Crowd
  ): void {
    const skeleton = new Skeleton(scene, navMesh, crowd);
    skeleton.position.setX(origin.x + (Math.random() - 0.5) * SPAWN_JITTER);
    skeleton.position.setZ(origin.z + (Math.random() - 0.5) * SPAWN_JITTER);

    flashEmissive({
      entity: skeleton,
      color: COLORS.ORANGE,
      intensity: 2,
      duration: 0.5,
      fadeOut: { duration: 0.5 },
    });

    const randomRotation = Math.random() * Math.PI * 2;
    skeleton.rotateY(randomRotation);

    this._spawnedSkeletons++;
    this._trackSkeleton(skeleton);
    scene.add(skeleton);
  }

  private _trackSkeleton(skeleton: Skeleton): void {
    this._livingSkeletons.add(skeleton);
    skeleton.healthPointsController.events.once('death', () => {
      this._livingSkeletons.delete(skeleton);
    });
  }
}
