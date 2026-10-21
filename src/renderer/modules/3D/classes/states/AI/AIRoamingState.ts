import * as THREE from 'three';
import { InputState, logger } from '@tgdf';

import { State } from '3D/classes/states';
import { AIAttackAction } from '3D/types';
import { EntityAI } from '3D/classes/gameObjects/EntityAI';
import { FMOD_EVENTS, type FMODEventDefinition } from 'FMOD';
import { getBestAttack } from '3D/classes/states/utils/getBestAttack';
import { getTargetEnemy } from '3D/classes/states/utils/getTargetEnemy';
import { FMODLoopedSound } from '3D/classes/gameObjectComponents/FMODSoundController';
import { getRandomNavMeshPointInRadius } from '3D/utils/getRandomNavMeshPointInRadius';

export type AIRoamingOptions = {
  radius: number;
  footstepEvent?: FMODEventDefinition;
  interval: {
    min: number;
    max: number;
  };
};

const FOOTSTEP_INTERVAL_MS = 600;
const STUCK_CHECK_INTERVAL_SECONDS = 1;
const STUCK_DISTANCE_THRESHOLD = 0.05;

export class AIRoamingState extends State {
  private _shouldTransitionToIdle: boolean = false;
  private _stuckCheckElapsedSeconds = 0;
  private _lastCheckedPosition: THREE.Vector3 | null = null;
  private _bestAttack: AIAttackAction | null = null;
  private _footsteps: FMODLoopedSound | null = null;

  constructor(
    public entity: EntityAI,
    private readonly _animationName: string,
    private _roamingOptions: AIRoamingOptions
  ) {
    super(entity);
  }

  public get shouldTransitionToIdle(): boolean {
    return this._shouldTransitionToIdle;
  }

  public get bestAttack(): AIAttackAction | null {
    return this._bestAttack;
  }

  public override onEnter(): void {
    this.entity.animationController.playAnimation(this._animationName, {
      loop: true,
    });
    this._footsteps = this.entity.fmodSoundController.playLoopedSound(
      this._roamingOptions.footstepEvent ?? FMOD_EVENTS.GENERIC_FOOTSTEP,
      { intervalMs: FOOTSTEP_INTERVAL_MS }
    );
    this._roamToRandomPoint()
      .catch((error) => {
        logger({ message: error.message, type: 'error' });
        this._shouldTransitionToIdle = true;
      })
      .finally(() => {
        this._shouldTransitionToIdle = true; // After roaming to a random point, transition back to idle
      });
  }
  public override onExit(): void {
    if (this._footsteps) {
      this.entity.fmodSoundController.stopLoopedSound(this._footsteps);
      this._footsteps = null;
    }
    this.entity.movementController.resetMoveTo();
  }

  public override onInput(_inputState: InputState): void {}

  public override onUpdate(deltaTime: number): void {
    this._checkForStuckMovement(deltaTime);

    const targetEnemy = getTargetEnemy(this.entity);
    this._bestAttack = targetEnemy ? getBestAttack(this.entity, targetEnemy) : null;
  }

  private _checkForStuckMovement(deltaTime: number): void {
    if (this._shouldTransitionToIdle) return;

    this._stuckCheckElapsedSeconds += deltaTime;
    if (this._stuckCheckElapsedSeconds < STUCK_CHECK_INTERVAL_SECONDS) return;
    this._stuckCheckElapsedSeconds = 0;

    const currentPosition = this.entity.position;

    if (
      this._lastCheckedPosition !== null &&
      this._lastCheckedPosition.distanceTo(currentPosition) < STUCK_DISTANCE_THRESHOLD
    ) {
      this.entity.movementController.resetMoveTo();
      this._shouldTransitionToIdle = true;
      return;
    }

    this._lastCheckedPosition = (this._lastCheckedPosition ?? new THREE.Vector3()).copy(
      currentPosition
    );
  }

  private _roamToRandomPoint(): Promise<void> {
    return new Promise((resolve, reject) => {
      const navMesh = this.entity.navMesh;

      const randomNavMeshPoint = getRandomNavMeshPointInRadius(
        navMesh,
        this.entity.spawnPosition,
        this._roamingOptions.radius
      );

      if (!randomNavMeshPoint) {
        reject(new Error('Failed to find a random point on the NavMesh'));
        return;
      }

      const path = this.entity.navMeshAgent.calculatePath(randomNavMeshPoint);
      if (path === null) {
        reject(new Error('Failed to calculate path to target'));
        return;
      }

      this.entity.movementController
        .moveAlongPath(path, this.entity.movementController.walkSpeed)
        .then(() => resolve())
        .catch(() => {});
    });
  }
}
