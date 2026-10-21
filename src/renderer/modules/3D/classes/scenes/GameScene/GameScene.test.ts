import { Mock } from 'moq.ts';
import { describe, it, expect, vi } from 'vitest';
import { Emitter, GameObjectEventMap } from '@tgdf';

import { Entity } from '3D/classes/gameObjects/Entity';
import { Player } from '3D/classes/gameObjects/players/Player';
import { MockGameScene } from '3D/classes/scenes/GameScene/MockGameScene';
import { HealthPointsController } from '3D/classes/gameObjectComponents/HealthPointsController';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

function createPlayer(playerProfileId: string) {
  const entity = new Mock<Entity>()
    .setup((e) => e.isAwake)
    .returns(false)
    .setup((e) => e.events)
    .returns(new Emitter<GameObjectEventMap>())
    .object();

  const healthPointsController = new HealthPointsController(entity, { maxHealthPoints: 100 });
  const player = { healthPointsController, playerProfileId } as unknown as Player;

  return { player, healthPointsController };
}

function createSceneWithListener() {
  const scene = new MockGameScene();
  const listener = vi.fn();
  scene.options.emitter.on('player-damage-taken', listener);

  return { scene, listener };
}

describe('GameScene', () => {
  describe('player-damage-taken', () => {
    it('fires with the player profile id when a registered player takes damage', () => {
      const { scene, listener } = createSceneWithListener();
      const { player, healthPointsController } = createPlayer('profile-1');

      scene.registerPlayer(player);
      healthPointsController.inflictDamage(10);

      expect(listener).toHaveBeenCalledOnce();
      expect(listener).toHaveBeenCalledWith({ playerProfileId: 'profile-1' });
    });

    it('does not fire for healing', () => {
      const { scene, listener } = createSceneWithListener();
      const { player, healthPointsController } = createPlayer('profile-1');

      scene.registerPlayer(player);
      healthPointsController.inflictDamage(10);
      listener.mockClear();
      healthPointsController.healDamage(5);

      expect(listener).not.toHaveBeenCalled();
    });

    it('identifies which player took damage', () => {
      const { scene, listener } = createSceneWithListener();
      const first = createPlayer('profile-1');
      const second = createPlayer('profile-2');

      scene.registerPlayer(first.player);
      scene.registerPlayer(second.player);
      second.healthPointsController.inflictDamage(10);

      expect(listener).toHaveBeenCalledOnce();
      expect(listener).toHaveBeenCalledWith({ playerProfileId: 'profile-2' });
    });

    it('does not fire for players that are not registered', () => {
      const { listener } = createSceneWithListener();
      const { healthPointsController } = createPlayer('profile-1');

      healthPointsController.inflictDamage(10);

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
