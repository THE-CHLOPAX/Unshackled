import { Mock } from 'moq.ts';
import { describe, it, expect, vi } from 'vitest';
import { Emitter, GameObjectEventMap } from '@tgdf';

import { PlayerProfile } from 'renderer/types';

import { Entity } from '../classes/gameObjects/Entity';
import { applyPlayerProfile } from './applyPlayerProfile';
import { Player } from '../classes/gameObjects/players/Player';
import { HealthPointsController } from '../classes/gameObjectComponents/HealthPointsController';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

function createPlayer() {
  const entity = new Mock<Entity>()
    .setup((e) => e.isAwake)
    .returns(false)
    .setup((e) => e.events)
    .returns(new Emitter<GameObjectEventMap>())
    .object();

  const healthPointsController = new HealthPointsController(entity, { maxHealthPoints: 100 });

  return { name: '', healthPointsController } as unknown as Player;
}

function createProfile(overrides: Partial<PlayerProfile> = {}): PlayerProfile {
  return {
    id: 'profile-1',
    name: 'Brother Ansel',
    class: 'monk',
    currentHealthPoints: 100,
    maxHealthPoints: 100,
    ...overrides,
  };
}

describe('applyPlayerProfile', () => {
  it('names the player after the profile', () => {
    const player = createPlayer();

    applyPlayerProfile(player, createProfile());

    expect(player.name).toBe('Brother Ansel');
  });

  it('applies max and current health from the profile', () => {
    const player = createPlayer();

    applyPlayerProfile(player, createProfile({ currentHealthPoints: 40, maxHealthPoints: 150 }));

    expect(player.healthPointsController.maxHealthPoints).toBe(150);
    expect(player.healthPointsController.healthPoints).toBe(40);
  });

  it('keeps current health above the class default when the profile max allows it', () => {
    const player = createPlayer();

    applyPlayerProfile(player, createProfile({ currentHealthPoints: 130, maxHealthPoints: 150 }));

    expect(player.healthPointsController.healthPoints).toBe(130);
  });
});
