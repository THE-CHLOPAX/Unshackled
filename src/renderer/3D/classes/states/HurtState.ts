import * as THREE from 'three';
import { InputState, MAIN_SOUND_CHANNEL } from '@tgdf';

import { COLORS } from 'renderer/constants';

import { State, DeadState } from '.';
import { Entity } from '../gameObjects/Entity';
import { AnimationClipNamesShared } from '../../types';
import { flashMaterial } from '../../utils/flashMaterial';
import { FMOD_EVENTS, FMODAudio, FMODEventInstance } from '../../../FMOD';

const HURT_FLASH_DURATION = 0.1;

export class HurtState extends State {
  private _flashEnded: boolean = false;
  private _animationEnded: boolean = false;
  private _eventInstance: FMODEventInstance | null = null;

  constructor(
    public entity: Entity,
    public nextState: State
  ) {
    super(entity);
  }

  protected override get isDamageImmune(): boolean {
    return true;
  }

  protected override onDamageTaken(): State | null {
    return null;
  }

  public onEnter(): void {
    this._eventInstance = FMODAudio.playEventInSoundChannel({
      eventPath: FMOD_EVENTS.HURT,
      channelId: MAIN_SOUND_CHANNEL,
    });

    this.entity.animationController.playAnimation(AnimationClipNamesShared.HIT, {
      loop: false,
      clampWhenFinished: true,
      onComplete: () => {
        this._animationEnded = true;
      },
    });
    const timeline = flashMaterial({
      entity: this.entity,
      material: new THREE.MeshBasicMaterial({ color: COLORS.RED }),
      duration: HURT_FLASH_DURATION,
    });

    if (timeline) {
      timeline.eventCallback('onComplete', () => {
        this._flashEnded = true;
      });
    } else {
      this._flashEnded = true;
    }
  }

  public onExit(): void {
    if (this._eventInstance === null) return;
    FMODAudio.stopEvent(this._eventInstance);
    this._eventInstance = null;
  }

  public onInput(_inputState: InputState): State {
    return this;
  }

  public onUpdate(_deltaTime: number): State {
    if (this.entity.healthPointsController.isDead) {
      return new DeadState(this.entity);
    }

    if (this._flashEnded && this._animationEnded) {
      return this.nextState;
    }

    return this;
  }
}
