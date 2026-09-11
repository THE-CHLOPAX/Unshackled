import { Scene } from '@tgdf';
import * as THREE from 'three';

import { WorldObjectArgs } from '3D/types';
import { Spawner } from '3D/classes/gameObjects/Spawner';
import { Skeleton } from '3D/classes/gameObjects/mobs/Skeleton/Skeleton';

const SKELETON_SPAWN_INTERVAL_SECONDS = 20;
const SKELETON_ALIVE_THRESHOLD = 1;
const SKELETON_SPAWNED_MAX = 2;

const SPAWN_TELEGRAPH_DIAMETER = 1.5;
const SPAWN_TELEGRAPH_DURATION_SECONDS = 3;

const SPAWN_HITBOX_SIZE = new THREE.Vector3(1, 1, 1);
const SPAWN_HITBOX_DAMAGE = 10;

export class SkeletonSpawner extends Spawner {
  constructor(scene: Scene, args: WorldObjectArgs = {}) {
    super(
      scene,
      {
        entityFactory: (gameScene, navMesh, crowd) => new Skeleton(gameScene, navMesh, crowd),
        telegraphDiameter: SPAWN_TELEGRAPH_DIAMETER,
        telegraphDurationSeconds: SPAWN_TELEGRAPH_DURATION_SECONDS,
        spawnIntervalSeconds: SKELETON_SPAWN_INTERVAL_SECONDS,
        maxSpawnedEntities: SKELETON_SPAWNED_MAX,
        maxAliveEntities: SKELETON_ALIVE_THRESHOLD,
        spawnHitbox: {
          size: SPAWN_HITBOX_SIZE,
          damage: SPAWN_HITBOX_DAMAGE,
        },
      },
      args
    );

    this.name = 'SkeletonSpawner';
  }
}
