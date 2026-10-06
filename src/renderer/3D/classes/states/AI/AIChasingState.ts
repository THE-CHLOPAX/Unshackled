import { InputState, throttleWithLastValue } from '@tgdf';

import { FMOD_EVENTS, type FMODEventDefinition } from 'renderer/FMOD';

import { State } from '..';
import { shouldAttack } from '../utils/shouldAttack';
import { EntityAI } from '../../gameObjects/EntityAI';
import { getBestAttack } from '../utils/getBestAttack';
import { getTargetEnemy } from '../utils/getTargetEnemy';
import { AIAttackAction, AnimationClipNamesShared } from '../../../types';
import { FMODLoopedSound } from '../../gameObjectComponents/FMODSoundController';

const UPDATE_THROTTLE_INTERVAL_MS = 250;
const FOOTSTEP_INTERVAL_MS = 370;

export type AIChasingOptions = {
  footstepEvent: FMODEventDefinition;
};

export class AIChasingState extends State {
  private _bestAttack: AIAttackAction | null = null;
  private _pathfindingFailed = false;
  private _footsteps: FMODLoopedSound | null = null;

  constructor(
    public entity: EntityAI,
    public readonly options?: AIChasingOptions
  ) {
    super(entity);
  }

  public get bestAttack(): AIAttackAction | null {
    return this._bestAttack;
  }

  public get hasPathfindingFailed(): boolean {
    return this._pathfindingFailed;
  }

  public onEnter(): void {
    this._footsteps = this.entity.fmodSoundController.playLoopedSound(
      this.options?.footstepEvent ?? FMOD_EVENTS.GENERIC_FOOTSTEP,
      { intervalMs: FOOTSTEP_INTERVAL_MS }
    );
    this.entity.animationController.playAnimation(AnimationClipNamesShared.RUN, {
      loop: true,
    });
  }

  public onExit(): void {
    if (this._footsteps) {
      this.entity.fmodSoundController.stopLoopedSound(this._footsteps);
      this._footsteps = null;
    }
    this.entity.movementController.resetMoveTo();
  }

  public onInput(_inputState: InputState): void {}

  public onUpdate(_deltaTime: number): void {
    this._throttledUpdate();
  }

  private _throttledUpdate = throttleWithLastValue(
    (): void => {
      const targetEnemy = getTargetEnemy(this.entity);
      if (targetEnemy === null) {
        this._bestAttack = null;
        return;
      }

      this._bestAttack = getBestAttack(this.entity, targetEnemy);
      if (this._bestAttack === null) return;

      if (shouldAttack(this.entity, this._bestAttack)) return;

      const path = this.entity.navMeshAgent.calculatePath(targetEnemy.position);
      if (path === null || path.length === 0) {
        this._pathfindingFailed = true;
        return;
      }

      this._pathfindingFailed = false;
      this.entity.movementController.moveAlongPath(path);
    },
    UPDATE_THROTTLE_INTERVAL_MS,
    undefined
  );
}
