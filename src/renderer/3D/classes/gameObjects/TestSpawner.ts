import { Scene } from '@tgdf';
import * as THREE from 'three';

import { Spawner } from '3D/classes/gameObjects/Spawner';
import { PlayerActionType, WorldObjectArgs } from '3D/types';
import { Skeleton } from '3D/classes/gameObjects/mobs/Skeleton/Skeleton';

import { HintBillboardRenderer } from '../gameObjectComponents/HintBillboardRenderer/HintBillboardRenderer';
import { InteractionController } from '../gameObjectComponents/InteractionController/InteractionController';

const SPAWN_ACTION = PlayerActionType.ACTION_DOWN;

const INTERACTION_RADIUS = 1;
const NAME_DISPLAY_RADIUS = INTERACTION_RADIUS * 2;
const HINT_OFFSET = new THREE.Vector3(0, 2, 0);

const SPAWN_TELEGRAPH_DIAMETER = 1.5;
const SPAWN_TELEGRAPH_DURATION_SECONDS = 1;

const SPAWN_HITBOX_SIZE = new THREE.Vector3(1, 1, 1);
const SPAWN_HITBOX_DAMAGE = 10;

export class TestSpawner extends Spawner {
  constructor(scene: Scene, args: WorldObjectArgs = {}) {
    super(
      scene,
      {
        entityFactory: (gameScene, navMesh, crowd) => new Skeleton(gameScene, navMesh, crowd),
        telegraphDiameter: SPAWN_TELEGRAPH_DIAMETER,
        telegraphDurationSeconds: SPAWN_TELEGRAPH_DURATION_SECONDS,
        spawnIntervalSeconds: 0,
        maxSpawnedEntities: Infinity,
        maxAliveEntities: Infinity,
        spawnHitbox: {
          size: SPAWN_HITBOX_SIZE,
          damage: SPAWN_HITBOX_DAMAGE,
        },
        autoSpawn: false,
      },
      args
    );

    this.name = 'TestSpawner';

    const hintRenderer = this.addComponent(
      'HintBillboardRenderer',
      new HintBillboardRenderer(this, { offset: HINT_OFFSET })
    );

    this.addComponent(
      'InteractionController',
      new InteractionController(this, hintRenderer, {
        interactionRadius: INTERACTION_RADIUS,
        name: {
          label: 'Test Spawner',
          radius: NAME_DISPLAY_RADIUS,
        },
        interactions: {
          [SPAWN_ACTION]: {
            hint: { icon: 'A', label: 'Spawn Skeleton' },
            onInteract: () => this.requestSpawn(),
          },
        },
      })
    );
  }
}
