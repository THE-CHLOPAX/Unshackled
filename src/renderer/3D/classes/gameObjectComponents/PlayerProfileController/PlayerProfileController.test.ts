import { Emitter, GameObjectEventMap } from '@tgdf';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useRunStore } from 'Store/useRunStore';
import { PlayerProfile, RunIdentifier } from 'renderer/types';

import { Entity } from '../../gameObjects/Entity';
import { HealthPointsController } from '../HealthPointsController';
import { PlayerProfileController } from './PlayerProfileController';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

function createProfile(id: string): PlayerProfile {
  return { id, name: id, class: 'monk', currentHealthPoints: 100, maxHealthPoints: 100 };
}

function createRun(players: PlayerProfile[]): RunIdentifier {
  return {
    version: 1,
    id: 'run',
    name: 'Run',
    createdAt: 0,
    updatedAt: 0,
    progress: { biomeId: 'dungeon', levelIndex: 0 },
    completedLevelIds: [],
    players,
  };
}

function createController(playerProfileId = 'profile-1') {
  const entity = {
    isAwake: false,
    name: '',
    events: new Emitter<GameObjectEventMap>(),
  } as unknown as Entity;

  const healthPointsController = new HealthPointsController(entity, { maxHealthPoints: 100 });
  const controller = new PlayerProfileController(entity, playerProfileId, healthPointsController);

  return { controller, healthPointsController, entity };
}

function getStoredHealthPoints(id: string): number | undefined {
  return useRunStore
    .getState()
    .currentRun?.players.find((profile) => profile.id === id)?.currentHealthPoints;
}

describe('PlayerProfileController', () => {
  beforeEach(() => {
    useRunStore
      .getState()
      .setCurrentRun(createRun([createProfile('profile-1'), createProfile('profile-2')]));
  });

  it('syncs health after damage, healing and death without touching other profiles', () => {
    const { healthPointsController } = createController();

    healthPointsController.inflictDamage(30);
    expect(getStoredHealthPoints('profile-1')).toBe(70);

    healthPointsController.healDamage(10);
    expect(getStoredHealthPoints('profile-1')).toBe(80);

    healthPointsController.inflictDamage(200);
    expect(getStoredHealthPoints('profile-1')).toBe(0);

    expect(getStoredHealthPoints('profile-2')).toBe(100);
  });

  it('does not write to the store when health is set without events', () => {
    const run = useRunStore.getState().currentRun;
    const { healthPointsController } = createController();

    healthPointsController.setHealthPoints(40);

    expect(useRunStore.getState().currentRun).toBe(run);
  });

  it('leaves the store untouched when the profile is not in the run', () => {
    const run = useRunStore.getState().currentRun;
    const { healthPointsController } = createController('missing');

    healthPointsController.inflictDamage(30);

    expect(useRunStore.getState().currentRun).toBe(run);
  });

  it('does nothing when there is no current run', () => {
    useRunStore.getState().setCurrentRun(null);
    const { healthPointsController } = createController();

    healthPointsController.inflictDamage(30);

    expect(useRunStore.getState().currentRun).toBeNull();
  });

  it('stops syncing once destroyed', () => {
    const { controller, healthPointsController } = createController();

    controller.destroy();
    healthPointsController.inflictDamage(30);

    expect(getStoredHealthPoints('profile-1')).toBe(100);
  });
});
