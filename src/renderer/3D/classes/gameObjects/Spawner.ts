import type { GameScene } from '3D/classes/scenes/GameScene/GameScene';

import { gsap } from 'gsap';
import * as THREE from 'three';
import { GameObject, Scene } from '@tgdf';
import { Crowd, NavMesh } from '@recast-navigation/core';

import { WorldObjectArgs } from '3D/types';
import { COLORS } from 'renderer/constants';
import { MAIN_CROWD_ID } from '3D/constants';
import { isEntityAi } from '3D/utils/isEntityAi';
import { Entity } from '3D/classes/gameObjects/Entity';
import { flashEmissive } from '3D/utils/flashMaterial';
import { ArcaneCircle } from '3D/classes/gameObjects/ArcaneCircle';
import { DamageHitbox } from '3D/classes/gameObjects/DamageHitbox';

const SPAWN_TELEGRAPH_FADE_SECONDS = 0.5;
const DEFAULT_SPAWN_JITTER = 0.75;
const DEFAULT_SPAWN_HITBOX_DURATION_SECONDS = 0.15;

export type SpawnerHitboxOptions = {
  size: THREE.Vector3;
  damage: number;
  durationSeconds?: number;
};

export type SpawnerOptions = {
  entityFactory: (scene: GameScene, navMesh: NavMesh, crowd: Crowd) => Entity;
  telegraphDiameter: number;
  telegraphDurationSeconds: number;
  spawnIntervalSeconds: number;
  maxSpawnedEntities: number;
  maxAliveEntities: number;
  spawnHitbox: SpawnerHitboxOptions;
  telegraphColor?: THREE.ColorRepresentation;
  spawnJitter?: number;
};

type PendingSpawnTelegraph = {
  circle: ArcaneCircle;
  origin: THREE.Vector3;
  elapsedSeconds: number;
};

export class Spawner extends GameObject {
  private _elapsedSeconds = 0;
  private _active = true;
  private _spawnIntervalRunning = false;
  private _pendingImmediateSpawn = false;
  private _pendingTelegraph: PendingSpawnTelegraph | null = null;
  private _spawnedEntities = 0;
  private _livingEntities = new Set<Entity>();

  constructor(
    scene: Scene,
    public readonly options: SpawnerOptions,
    _args: WorldObjectArgs = {}
  ) {
    super({ scene });

    this.name = 'Spawner';
    this.visible = false;
  }

  protected override onAwake(): void {
    super.onAwake();
    this._pendingImmediateSpawn = true;
  }

  protected override onUpdate(deltaTime: number): void {
    if (!this._active) return;

    const scene = this.scene;

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
    if (this._elapsedSeconds < this.options.spawnIntervalSeconds) return;
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
    return this._spawnedEntities >= this.options.maxSpawnedEntities;
  }

  private _syncSpawnIntervalState(): void {
    const isBelowThreshold = this._livingEntities.size < this.options.maxAliveEntities;
    const hasReachedSpawnCap = this._hasReachedSpawnCap();

    if (!hasReachedSpawnCap && isBelowThreshold && !this._spawnIntervalRunning) {
      this._spawnIntervalRunning = true;
      this._elapsedSeconds = 0;
    } else if (hasReachedSpawnCap || !isBelowThreshold) {
      this._spawnIntervalRunning = false;
    }
  }

  private _beginTelegraphedSpawn(scene: Scene): void {
    const origin = this.getWorldPosition(new THREE.Vector3());

    const circle = new ArcaneCircle(scene, {
      diameter: this.options.telegraphDiameter,
      color: this.options.telegraphColor ?? COLORS.RED,
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
    scene: Scene,
    navMesh: NavMesh,
    crowd: Crowd
  ): void {
    if (!this._pendingTelegraph) return;

    this._pendingTelegraph.elapsedSeconds += deltaTime;
    if (this._pendingTelegraph.elapsedSeconds < this.options.telegraphDurationSeconds) return;

    const { circle, origin } = this._pendingTelegraph;
    this._pendingTelegraph = null;

    circle.destroy();
    this._spawnEntity(scene, origin, navMesh, crowd);
  }

  private _spawnEntity(scene: Scene, origin: THREE.Vector3, navMesh: NavMesh, crowd: Crowd): void {
    const entity = this.options.entityFactory(scene as GameScene, navMesh, crowd);
    const jitter = this.options.spawnJitter ?? DEFAULT_SPAWN_JITTER;
    entity.position.set(
      origin.x + (Math.random() - 0.5) * jitter,
      origin.y,
      origin.z + (Math.random() - 0.5) * jitter
    );

    const randomRotation = Math.random() * Math.PI * 2;
    entity.rotateY(randomRotation);

    flashEmissive({
      entity,
      color: COLORS.ORANGE,
      intensity: 2,
      duration: 0.5,
      fadeOut: { duration: 0.5 },
    });

    this._spawnedEntities++;
    this._trackEntity(entity);
    scene.add(entity);

    this._spawnEntryHitbox(scene, entity.position);
  }

  private _spawnEntryHitbox(scene: Scene, position: THREE.Vector3): void {
    const {
      size,
      damage,
      durationSeconds = DEFAULT_SPAWN_HITBOX_DURATION_SECONDS,
    } = this.options.spawnHitbox;

    const hitbox = new DamageHitbox(scene, size, damage, (other) => isEntityAi(other));
    hitbox.position.set(position.x, size.y / 2, position.z);
    scene.add(hitbox);

    gsap.delayedCall(durationSeconds, () => {
      hitbox.destroy();
      hitbox.removeFromParent();
    });
  }

  private _trackEntity(entity: Entity): void {
    this._livingEntities.add(entity);
    entity.healthPointsController.events.once('death', () => {
      this._livingEntities.delete(entity);
    });
  }
}
