import { Emitter, GameObject } from '@tgdf';
import { describe, it, expect, vi } from 'vitest';

import { Entity } from 'renderer/3D/classes/gameObjects/Entity';
import { Player } from 'renderer/3D/classes/gameObjects/players/Player';

import { MockGameScene } from '../MockGameScene';
import {
  ProgressTracker,
  ProgressTrackerObjective,
  OBJECTIVE_ENTITIES_KILLED,
  OBJECTIVE_SURVIVED_TIME,
} from './ProgressTracker';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

type FakeEntityEvents = { death: void };

class FakeObjectiveEntity extends GameObject {
  public healthPointsController = { events: new Emitter<FakeEntityEvents>() };
}

class OtherEntity extends GameObject {
  public healthPointsController = { events: new Emitter<FakeEntityEvents>() };
}

function createScene(): MockGameScene {
  return new MockGameScene();
}

function createObjectiveEntity(scene: MockGameScene): FakeObjectiveEntity {
  const entity = new FakeObjectiveEntity({ scene });
  scene.add(entity);
  return entity;
}

function killEntity(entity: FakeObjectiveEntity | OtherEntity): void {
  entity.healthPointsController.events.trigger('death');
}

function createFakePlayer(isDead: boolean): Player {
  return { healthPointsController: { isDead } } as unknown as Player;
}

function createTracker(
  scene: MockGameScene,
  objective: ProgressTrackerObjective,
  players: Player[]
): ProgressTracker {
  return new ProgressTracker(scene, scene.options.emitter, { objective, players });
}

function survivedTimeObjective(timeGoalAmount: number): ProgressTrackerObjective {
  return { type: OBJECTIVE_SURVIVED_TIME, timeGoalAmount };
}

function entitiesKilledObjective(killedGoalAmount: number): ProgressTrackerObjective {
  return {
    type: OBJECTIVE_ENTITIES_KILLED,
    objectiveClasses: [FakeObjectiveEntity as unknown as typeof Entity],
    killedGoalAmount,
  };
}

describe('ProgressTracker', () => {
  describe('survived-time objective', () => {
    it('accumulates elapsed time on every scene update', () => {
      const scene = createScene();
      const tracker = createTracker(scene, survivedTimeObjective(10), [createFakePlayer(false)]);

      scene.events.trigger('update', { deltaTime: 3 });
      scene.events.trigger('update', { deltaTime: 4 });

      expect(tracker.timeElapsed).toBe(7);
    });

    it('does not trigger objectiveComplete before the time goal is reached', () => {
      const scene = createScene();
      createTracker(scene, survivedTimeObjective(10), [createFakePlayer(false)]);
      const completeListener = vi.fn();
      scene.options.emitter.on('level-complete', completeListener);

      scene.events.trigger('update', { deltaTime: 5 });

      expect(completeListener).not.toHaveBeenCalled();
    });

    it('triggers objectiveComplete exactly once when the time goal is reached, even across later ticks', () => {
      const scene = createScene();
      createTracker(scene, survivedTimeObjective(10), [createFakePlayer(false)]);
      const completeListener = vi.fn();
      scene.options.emitter.on('level-complete', completeListener);

      scene.events.trigger('update', { deltaTime: 10 });
      scene.events.trigger('update', { deltaTime: 1 });
      scene.events.trigger('update', { deltaTime: 1 });

      expect(completeListener).toHaveBeenCalledOnce();
    });

    it('freezes elapsed time once the objective is resolved', () => {
      const scene = createScene();
      const tracker = createTracker(scene, survivedTimeObjective(10), [createFakePlayer(false)]);

      scene.events.trigger('update', { deltaTime: 10 });
      scene.events.trigger('update', { deltaTime: 5 });

      expect(tracker.timeElapsed).toBe(10);
    });
  });

  describe('entities-killed objective', () => {
    it('increments objectiveEntitiesKilled only for tracked objective classes', () => {
      const scene = createScene();
      const tracker = createTracker(scene, entitiesKilledObjective(2), [createFakePlayer(false)]);
      const objectiveEntity = createObjectiveEntity(scene);
      const otherEntity = new OtherEntity({ scene });
      scene.add(otherEntity);

      killEntity(otherEntity);
      expect(tracker.objectiveEntitiesKilled).toBe(0);

      killEntity(objectiveEntity);
      expect(tracker.objectiveEntitiesKilled).toBe(1);
    });

    it('does not trigger objectiveComplete before the kill goal is reached', () => {
      const scene = createScene();
      createTracker(scene, entitiesKilledObjective(2), [createFakePlayer(false)]);
      const completeListener = vi.fn();
      scene.options.emitter.on('level-complete', completeListener);

      killEntity(createObjectiveEntity(scene));

      expect(completeListener).not.toHaveBeenCalled();
    });

    it('triggers objectiveComplete exactly once when the kill goal is reached', () => {
      const scene = createScene();
      createTracker(scene, entitiesKilledObjective(2), [createFakePlayer(false)]);
      const completeListener = vi.fn();
      scene.options.emitter.on('level-complete', completeListener);

      killEntity(createObjectiveEntity(scene));
      killEntity(createObjectiveEntity(scene));
      killEntity(createObjectiveEntity(scene));

      expect(completeListener).toHaveBeenCalledOnce();
    });

    it('still triggers objectiveFailed when all players die before the kill goal is reached', () => {
      const scene = createScene();
      createTracker(scene, entitiesKilledObjective(5), [createFakePlayer(true)]);
      const failedListener = vi.fn();
      scene.options.emitter.on('game-over', failedListener);

      scene.events.trigger('update', { deltaTime: 1 });

      expect(failedListener).toHaveBeenCalledOnce();
    });

    it('does not trigger objectiveComplete for a kill happening after objectiveFailed already resolved the objective', () => {
      const scene = createScene();
      createTracker(scene, entitiesKilledObjective(1), [createFakePlayer(true)]);
      const objectiveEntity = createObjectiveEntity(scene);
      const completeListener = vi.fn();
      const failedListener = vi.fn();
      scene.options.emitter.on('level-complete', completeListener);
      scene.options.emitter.on('game-over', failedListener);

      // All players are already dead, so this tick resolves the objective as failed.
      scene.events.trigger('update', { deltaTime: 1 });
      expect(failedListener).toHaveBeenCalledOnce();

      // A kill that reaches the goal afterwards must not also complete the objective.
      killEntity(objectiveEntity);

      expect(completeListener).not.toHaveBeenCalled();
    });
  });

  describe('objectiveFailed', () => {
    it('triggers objectiveFailed exactly once when all players are dead', () => {
      const scene = createScene();
      createTracker(scene, survivedTimeObjective(10), [createFakePlayer(true)]);
      const failedListener = vi.fn();
      scene.options.emitter.on('game-over', failedListener);

      scene.events.trigger('update', { deltaTime: 1 });
      scene.events.trigger('update', { deltaTime: 1 });

      expect(failedListener).toHaveBeenCalledOnce();
    });

    it('does not trigger objectiveFailed when only some players are dead', () => {
      const scene = createScene();
      createTracker(scene, survivedTimeObjective(10), [
        createFakePlayer(true),
        createFakePlayer(false),
      ]);
      const failedListener = vi.fn();
      scene.options.emitter.on('game-over', failedListener);

      scene.events.trigger('update', { deltaTime: 1 });

      expect(failedListener).not.toHaveBeenCalled();
    });

    it('does not trigger objectiveFailed when there are no players', () => {
      const scene = createScene();
      createTracker(scene, survivedTimeObjective(10), []);
      const failedListener = vi.fn();
      scene.options.emitter.on('game-over', failedListener);

      scene.events.trigger('update', { deltaTime: 1 });

      expect(failedListener).not.toHaveBeenCalled();
    });
  });
});
