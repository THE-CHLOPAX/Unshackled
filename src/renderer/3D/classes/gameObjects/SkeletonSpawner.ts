import * as THREE from 'three';
import { GameObject, Scene } from '@tgdf';
import { Crowd, NavMesh } from '@recast-navigation/core';

import { WorldObjectArgs } from '3D/types';
import { MAIN_CROWD_ID } from '3D/constants';
import { GameScene } from '3D/classes/scenes/GameScene/GameScene';
import { Skeleton } from '3D/classes/gameObjects/mobs/Skeleton/Skeleton';

const SKELETON_SPAWN_INTERVAL_SECONDS = 20;
const SKELETON_ALIVE_THRESHOLD = 1;
const SKELETON_SPAWNED_MAX = 2;

const SPAWN_JITTER = 0.75;

export class SkeletonSpawner extends GameObject {
  private _elapsedSeconds = 0;
  private _active = true;
  private _spawnIntervalRunning = false;
  private _pendingImmediateSpawn = false;
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

    if (this._pendingImmediateSpawn) {
      this._pendingImmediateSpawn = false;
      if (!this._hasReachedSpawnCap()) {
        this._spawnSkeleton(scene, navMesh, crowd);
      }
      return;
    }

    this._syncSpawnIntervalState();
    if (!this._spawnIntervalRunning) return;

    this._elapsedSeconds += deltaTime;
    if (this._elapsedSeconds < SKELETON_SPAWN_INTERVAL_SECONDS) return;
    this._elapsedSeconds = 0;

    this._spawnSkeleton(scene, navMesh, crowd);
  }

  protected override onDestroyed(): void {
    super.onDestroyed();
    this._active = false;
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

  private _spawnSkeleton(scene: GameScene, navMesh: NavMesh, crowd: Crowd): void {
    const origin = this.getWorldPosition(new THREE.Vector3());

    const skeleton = new Skeleton(scene, navMesh, crowd);
    skeleton.position.set(
      origin.x + (Math.random() - 0.5) * SPAWN_JITTER,
      origin.y,
      origin.z + (Math.random() - 0.5) * SPAWN_JITTER
    );

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
