import { InputState, throttleWithLastValue } from '@tgdf';

import { State } from '3D/classes/states';
import { AIAttackAction } from '3D/types';
import { EntityAI } from '3D/classes/gameObjects/EntityAI';
import { FMOD_EVENTS, type FMODEventDefinition } from 'FMOD';
import { shouldAttack } from '3D/classes/states/utils/shouldAttack';
import { getBestAttack } from '3D/classes/states/utils/getBestAttack';
import { getTargetEnemy } from '3D/classes/states/utils/getTargetEnemy';
import { FMODLoopedSound } from '3D/classes/gameObjectComponents/FMODSoundController';

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
    private readonly _animationName: string,
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
    this.entity.animationController.playAnimation(this._animationName, {
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
