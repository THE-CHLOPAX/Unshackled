import * as THREE from 'three';
import { assert, Scene, SceneEventsMap } from '@tgdf';

import { EntityClass } from '3D/types';
import { Entity } from '3D/classes/gameObjects/Entity';
import { Player } from '3D/classes/gameObjects/players/Player';
import { GameEventsEmitter, GameEventsMap } from 'renderer/types';

export const OBJECTIVE_ENTITIES_KILLED = 'entities-killed';
export const OBJECTIVE_SURVIVED_TIME = 'survived-time';

export type ProgressTrackerObjective =
  | {
      type: typeof OBJECTIVE_ENTITIES_KILLED;
      objectiveClasses: EntityClass[];
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

export class ProgressTracker {
  private _timeElapsed = 0;
  private _objectiveEntitiesKilled = 0;
  private _objectiveResolved = false;
  private _trackedObjectiveEntities = new WeakSet<Entity>();

  constructor(
    public readonly scene: Scene,
    public readonly emitter: GameEventsEmitter,
    public readonly options: ProgressTrackerOptions
  ) {
    scene.events.on('update', this._onUpdate.bind(this));
    scene.events.on('object-added', this._onSceneObjectAdded.bind(this));
  }

  public get timeElapsed(): number {
    return this._timeElapsed;
  }

  public get objectiveEntitiesKilled(): number {
    return this._objectiveEntitiesKilled;
  }

  private _onUpdate({ deltaTime }: SceneEventsMap['update']): void {
    if (this._objectiveResolved) return;
    this._updateTimeElapsed({ deltaTime });
    if (this._objectiveResolved) return;

    const allPlayersDead =
      this.options.players.length > 0 &&
      this.options.players.every((player) => player.healthPointsController.isDead);

    if (allPlayersDead) {
      this._resolveObjective('game-over');
    }
  }

  private _updateTimeElapsed({ deltaTime }: SceneEventsMap['update']): void {
    this._timeElapsed += deltaTime;

    if (this.options.objective.type !== OBJECTIVE_SURVIVED_TIME) return;

    if (this._timeElapsed >= this.options.objective.timeGoalAmount) {
      this._resolveObjective('level-complete');
    }
  }

  private _onSceneObjectAdded({ object }: SceneEventsMap['object-added']): void {
    if (this._objectiveResolved) return;
    if (this.options.objective.type !== OBJECTIVE_ENTITIES_KILLED) return;

    const isObjectiveClass = (object: THREE.Object3D): object is Entity => {
      assert(this.options.objective.type === OBJECTIVE_ENTITIES_KILLED);
      return this.options.objective.objectiveClasses.some(
        (classType) => object instanceof classType
      );
    };

    if (isObjectiveClass(object) && !this._trackedObjectiveEntities.has(object)) {
      this._trackedObjectiveEntities.add(object);
      object.healthPointsController.events.once('death', () => {
        if (this._objectiveResolved) return;
        this._objectiveEntitiesKilled++;
        assert(this.options.objective.type === OBJECTIVE_ENTITIES_KILLED);
        if (this._objectiveEntitiesKilled === this.options.objective.killedGoalAmount) {
          this._resolveObjective('level-complete');
        }
      });
    }
  }

  private _resolveObjective(event: keyof GameEventsMap): void {
    if (this._objectiveResolved) return;
    this._objectiveResolved = true;
    this.emitter.trigger(event);
  }
}
