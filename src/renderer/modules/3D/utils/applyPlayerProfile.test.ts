import { Mock } from 'moq.ts';
import { describe, it, expect, vi } from 'vitest';
import { Emitter, GameObjectEventMap } from '@tgdf';

import { Entity } from '3D/classes/gameObjects/Entity/Entity';
import { Player } from '3D/classes/gameObjects/Player/Player';
import { applyPlayerProfile } from '3D/utils/applyPlayerProfile';
import { createProfile } from 'renderer/utils/test/createProfile';
import { HealthPointsController } from '3D/classes/gameObjectComponents/HealthPointsController/HealthPointsController';
import { StaminaPointsController } from '3D/classes/gameObjectComponents/StaminaPointsController/StaminaPointsController';

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
  const staminaPointsController = new StaminaPointsController(entity, {
    maxShortTermStamina: 100,
    maxLongTermStamina: 300,
  });

  return { name: '', healthPointsController, staminaPointsController } as unknown as Player;
}

describe('applyPlayerProfile', () => {
  it('names the player after the profile', () => {
    const player = createPlayer();

    applyPlayerProfile(player, createProfile({ name: 'Brother Ansel' }));

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

  it('applies max and current stamina for both pools from the profile', () => {
    const player = createPlayer();

    applyPlayerProfile(
      player,
      createProfile({
        maxShortTermStamina: 120,
        currentShortTermStamina: 80,
        maxLongTermStamina: 400,
        currentLongTermStamina: 350,
      })
    );

    expect(player.staminaPointsController.maxShortTermStamina).toBe(120);
    expect(player.staminaPointsController.shortTermStamina).toBe(80);
    expect(player.staminaPointsController.maxLongTermStamina).toBe(400);
    expect(player.staminaPointsController.longTermStamina).toBe(350);
  });
});
