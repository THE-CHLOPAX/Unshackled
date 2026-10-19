import * as THREE from 'three';

import { ANIMATION_CLIP_NAMES } from '3D/constants';

import { State } from '../State';
import { Player } from '../../gameObjects/players/Player';

const DEFAULT_SPEED: number = 3;

export class RollState extends State {
  private _isComplete: boolean = false;
  private _direction: THREE.Vector3 = new THREE.Vector3();

  public static COOLDOWN_ID: string = 'roll-state-player-cooldown';
  public static COOLDOWN_MS: number = 1000;
  public static STAMINA_COST: number = 15;

  constructor(public entity: Player) {
    super(entity);
  }

  public get isComplete(): boolean {
    return this._isComplete;
  }

  public override onEnter(): void {
    this.entity.staminaPointsController.drainShortTermStamina(RollState.STAMINA_COST);

    this.entity.rigidBody.setSensor(true);
    this.entity.getWorldDirection(this._direction);

    this.entity.animationController.playAnimation(ANIMATION_CLIP_NAMES.PLAYER.ROLL, {
      clampWhenFinished: true,
      playbackRate: 1.2,
      onComplete: () => {
        this._isComplete = true;
      },
    });

    this.entity.cooldownController.startCooldown(RollState.COOLDOWN_ID, RollState.COOLDOWN_MS);
  }

  public override onExit(): void {
    this.entity.rigidBody.setSensor(false);
  }

  public override onUpdate(_deltaTime: number): void {
    if (this._isComplete) return;

    this.entity.movementController.move(this._direction, DEFAULT_SPEED);
  }

  public override onInput(): void {}
}
