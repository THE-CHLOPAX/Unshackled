import * as THREE from 'three';
import { GameObject, Input, RigidBody, Scene } from '@tgdf';

import { PlayerActionType } from '3D/types';
import { isPlayer } from '3D/utils/isPlayer';
import { mapInputToControls } from '3D/utils/mapInputToControls';

import { Player } from '../players/Player';

export type DoorInteractionZoneOptions = {
  size: THREE.Vector3;
  onInteract: (player: Player) => void;
};

export class DoorInteractionZone extends GameObject {
  private readonly _rigidBody: RigidBody;
  private readonly _onInteract: (player: Player) => void;
  private readonly _overlappingPlayers = new Set<Player>();
  private _wasActionDownPressed = false;

  constructor(scene: Scene, options: DoorInteractionZoneOptions) {
    super({ scene });

    this._onInteract = options.onInteract;

    this._rigidBody = this.addComponent(
      'RigidBody',
      new RigidBody(this, {
        type: 'kinematic',
        sensor: true,
        enableCollisionDetection: true,
        colliderShape: 'box',
        colliderSize: options.size,
      })
    );
  }

  protected override onAwake(): void {
    super.onAwake();

    this._rigidBody.addCollisionListener(
      `door-interaction-zone-${this.id}`,
      ({ otherBody, started }) => {
        const otherObject = otherBody.gameObject;
        if (!isPlayer(otherObject)) return;

        if (started) {
          this._overlappingPlayers.add(otherObject);
        } else {
          this._overlappingPlayers.delete(otherObject);
        }
      }
    );
  }

  protected override onUpdate(deltaTime: number): void {
    super.onUpdate(deltaTime);

    if (this._overlappingPlayers.size === 0) {
      this._wasActionDownPressed = false;
      return;
    }

    const controlsStates = mapInputToControls(Input.getState());
    const isActionDownPressed = controlsStates.some(
      (controlState) => controlState.type === PlayerActionType.ACTION_DOWN
    );

    if (isActionDownPressed && !this._wasActionDownPressed) {
      this._overlappingPlayers.forEach((player) => this._onInteract(player));
    }

    this._wasActionDownPressed = isActionDownPressed;
  }
}
