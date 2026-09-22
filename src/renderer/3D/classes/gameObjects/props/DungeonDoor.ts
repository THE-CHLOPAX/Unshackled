import * as THREE from 'three';
import { assert, GameObject, getModelFromStore, isMesh, RigidBody, Scene } from '@tgdf';

import { MODELS } from '3D/constants';
//import { WorldObjectArgs } from '3D/types';

import { Player } from '../players/Player';
import { DoorInteractionZone } from './DoorInteractionZone';

// Placeholder footprint for the interact sensor; tune to match the door model's actual size.
const INTERACTION_ZONE_SIZE = new THREE.Vector3(2, 2, 1.5);

export class DungeonDoor extends GameObject {
  constructor(scene: Scene) {
    super({ scene, skipUpdate: true });

    const doorModel = getModelFromStore(MODELS.DUNGEON_DOOR.id);
    assert(isMesh(doorModel), 'Model is not a mesh');

    doorModel.scale.setScalar(0.6);

    this.add(doorModel);
    doorModel.rotation.z = Math.PI / 2;

    this.addComponent(
      'RigidBody',
      new RigidBody(this, {
        type: 'kinematic',
        colliderShape: 'box',
      })
    );

    this.add(
      new DoorInteractionZone(scene, {
        size: INTERACTION_ZONE_SIZE,
        onInteract: (player) => this.onInteract(player),
      })
    );
  }

  protected override onAwake(): void {}

  protected onInteract(_player: Player): void {}
}
