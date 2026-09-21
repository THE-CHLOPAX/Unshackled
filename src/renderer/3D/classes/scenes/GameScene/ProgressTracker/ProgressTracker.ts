import * as THREE from 'three';
import { assert, Emitter, Scene, SceneEventsMap } from '@tgdf';

import { Entity } from 'renderer/3D/classes/gameObjects/Entity';
import { Player } from 'renderer/3D/classes/gameObjects/players/Player';

export const OBJECTIVE_ENTITIES_KILLED = 'entities-killed';
export const OBJECTIVE_SURVIVED_TIME = 'survived-time';

export type ProgressTrackerObjective =
  | {
      type: typeof OBJECTIVE_ENTITIES_KILLED;
      objectiveClasses: (typeof Entity)[];
      killedGoalAmount: number;
    }
  | {
      type: typeof OBJECTIVE_SURVIVED_TIME;
      timeGoalAmount: number;
    };

export type ProgressTrackerOptions = {
  players: Player[];
  objective: ProgressTrackerObjective;
};

export type ProgressTrackerEventsMap = {
  objectiveComplete: undefined;
  objectiveFailed: undefined;
};

export class ProgressTracker {
  private _timeElapsed = 0;
  private _objectiveEntitiesKilled = 0;
  private _objectiveResolved = false;

  private _events: Emitter<ProgressTrackerEventsMap> = new Emitter();

  constructor(
    public readonly scene: Scene,
    public readonly options: ProgressTrackerOptions
  ) {
    scene.events.on('update', this._onUpdate.bind(this));
    scene.events.on('objectAdded', this._onSceneObjectAdded.bind(this));
  }

  public get timeElapsed(): number {
    return this._timeElapsed;
  }

  public get objectiveEntitiesKilled(): number {
    return this._objectiveEntitiesKilled;
  }

  public get events(): Emitter<ProgressTrackerEventsMap> {
    return this._events;
  }

  private _onUpdate({ deltaTime }: SceneEventsMap['update']): void {
    if (this._objectiveResolved) return;
    this._updateTimeElapsed({ deltaTime });
    if (this._objectiveResolved) return;

    const allPlayersDead =
      this.options.players.length > 0 &&
      this.options.players.every((player) => player.healthPointsController.isDead);
    if (allPlayersDead) {
      this._resolveObjective('objectiveFailed');
    }
  }

  private _updateTimeElapsed({ deltaTime }: SceneEventsMap['update']): void {
    this._timeElapsed += deltaTime;

    if (this.options.objective.type !== OBJECTIVE_SURVIVED_TIME) return;

    if (this._timeElapsed >= this.options.objective.timeGoalAmount) {
      this._resolveObjective('objectiveComplete');
    }
  }

  private _onSceneObjectAdded({ object }: SceneEventsMap['objectAdded']): void {
    if (this._objectiveResolved) return;
    if (this.options.objective.type !== OBJECTIVE_ENTITIES_KILLED) return;

    const isObjectiveClass = (object: THREE.Object3D): object is Entity => {
      assert(this.options.objective.type === OBJECTIVE_ENTITIES_KILLED);
      return this.options.objective.objectiveClasses.some(
        (classType) => object instanceof classType
      );
    };

    if (isObjectiveClass(object)) {
      object.healthPointsController.events.on('death', () => {
        if (this._objectiveResolved) return;
        this._objectiveEntitiesKilled++;
        assert(this.options.objective.type === OBJECTIVE_ENTITIES_KILLED);
        if (this._objectiveEntitiesKilled === this.options.objective.killedGoalAmount) {
          this._resolveObjective('objectiveComplete');
        }
      });
    }
  }

  private _resolveObjective(event: keyof ProgressTrackerEventsMap): void {
    if (this._objectiveResolved) return;
    this._objectiveResolved = true;
    this.events.trigger(event);
  }
}
