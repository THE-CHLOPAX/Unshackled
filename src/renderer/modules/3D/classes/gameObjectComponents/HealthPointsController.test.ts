import { Mock, IMock } from 'moq.ts';
import { Emitter, GameObjectEventMap } from '@tgdf';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { Entity } from '3D/classes/gameObjects/Entity';
import { HealthPointsController } from '3D/classes/gameObjectComponents/HealthPointsController';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

function createEntityMock() {
  const gameObjectEvents = new Emitter<GameObjectEventMap>();

  const entityMock: IMock<Entity> = new Mock<Entity>()
    .setup((e) => e.isAwake)
    .returns(false)
    .setup((e) => e.events)
    .returns(gameObjectEvents);

  return { entityMock };
}

function createController(maxHealthPoints = 100) {
  const { entityMock } = createEntityMock();
  const controller = new HealthPointsController(entityMock.object(), { maxHealthPoints });

  return { controller, entityMock };
}

describe('HealthPointsController', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setMaxHealthPoints', () => {
    it('changes max health without changing current health', () => {
      const { controller } = createController(100);

      controller.setMaxHealthPoints(150);

      expect(controller.maxHealthPoints).toBe(150);
      expect(controller.healthPoints).toBe(100);
    });

    it('lets health be set and healed up to the new max', () => {
      const { controller } = createController(100);

      controller.setMaxHealthPoints(150);
      controller.setHealthPoints(120);
      expect(controller.healthPoints).toBe(120);

      controller.healDamage(100);
      expect(controller.healthPoints).toBe(150);
    });

    it('clamps current health down when the max is lowered', () => {
      const { controller } = createController(100);

      controller.setMaxHealthPoints(60);

      expect(controller.healthPoints).toBe(60);
    });

    it('resets health to the current max', () => {
      const { controller } = createController(100);

      controller.setMaxHealthPoints(150);
      controller.inflictDamage(50);
      controller.resetHealth();

      expect(controller.healthPoints).toBe(150);
    });

    it('throws when the max is not positive', () => {
      const { controller } = createController(100);

      expect(() => controller.setMaxHealthPoints(0)).toThrow();
    });
  });

  describe('setHealthPoints', () => {
    it('sets health without changing maxHealthPoints', () => {
      const { controller } = createController(100);

      controller.setHealthPoints(40);

      expect(controller.healthPoints).toBe(40);
      expect(controller.maxHealthPoints).toBe(100);
      expect(controller.isDead).toBe(false);
    });

    it('clamps to the 0..maxHealthPoints range', () => {
      const { controller } = createController(100);

      controller.setHealthPoints(150);
      expect(controller.healthPoints).toBe(100);

      controller.setHealthPoints(-10);
      expect(controller.healthPoints).toBe(0);
    });

    it('marks the entity as dead when set to zero', () => {
      const { controller } = createController(100);

      controller.setHealthPoints(0);

      expect(controller.isDead).toBe(true);
    });

    it('heals up to maxHealthPoints afterwards', () => {
      const { controller } = createController(100);

      controller.setHealthPoints(40);
      controller.healDamage(100);

      expect(controller.healthPoints).toBe(100);
    });

    it('does not trigger any events', () => {
      const { controller } = createController(100);
      const listener = vi.fn();
      controller.events.on('damagetaken', listener);
      controller.events.on('heal', listener);
      controller.events.on('death', listener);

      controller.setHealthPoints(0);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('constructor', () => {
    it('throws when maxHealthPoints is zero', () => {
      const { entityMock } = createEntityMock();

      expect(
        () => new HealthPointsController(entityMock.object(), { maxHealthPoints: 0 })
      ).toThrow();
    });

    it('throws when maxHealthPoints is negative', () => {
      const { entityMock } = createEntityMock();

      expect(
        () => new HealthPointsController(entityMock.object(), { maxHealthPoints: -10 })
      ).toThrow();
    });

    it('sets healthPoints to maxHealthPoints when it is positive', () => {
      const { controller } = createController(50);

      expect(controller.healthPoints).toBe(50);
      expect(controller.maxHealthPoints).toBe(50);
      expect(controller.isDead).toBe(false);
    });
  });

  describe('inflictDamage', () => {
    it('reduces health points and triggers damagetaken with the correct payload', () => {
      const { controller } = createController(100);
      const listener = vi.fn();
      controller.events.on('damagetaken', listener);

      controller.inflictDamage(30);

      expect(controller.healthPoints).toBe(70);
      expect(listener).toHaveBeenCalledWith({ currentHealth: 70, damageAmount: 30 });
    });

    it('clamps health points at zero instead of going negative', () => {
      const { controller } = createController(10);

      controller.inflictDamage(100);

      expect(controller.healthPoints).toBe(0);
    });

    it('sets isDead and triggers death once health reaches zero', () => {
      const { controller } = createController(10);
      const deathListener = vi.fn();
      controller.events.on('death', deathListener);

      controller.inflictDamage(10);

      expect(controller.isDead).toBe(true);
      expect(deathListener).toHaveBeenCalledOnce();
    });

    it('ignores non-positive damage amounts without changing health or triggering an event', () => {
      const { controller } = createController(100);
      const listener = vi.fn();
      controller.events.on('damagetaken', listener);

      controller.inflictDamage(0);
      controller.inflictDamage(-5);

      expect(controller.healthPoints).toBe(100);
      expect(listener).not.toHaveBeenCalled();
    });

    it('is a no-op once already dead', () => {
      const { controller } = createController(10);
      controller.inflictDamage(10);
      const listener = vi.fn();
      controller.events.on('damagetaken', listener);

      controller.inflictDamage(5);

      expect(listener).not.toHaveBeenCalled();
    });

    it('is a no-op while immune to damage', () => {
      const { controller } = createController(100);
      controller.isImmuneToDamage = true;
      const listener = vi.fn();
      controller.events.on('damagetaken', listener);

      controller.inflictDamage(30);

      expect(controller.healthPoints).toBe(100);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('healDamage', () => {
    it('increases health points and triggers heal with the correct payload', () => {
      const { controller } = createController(100);
      controller.inflictDamage(50);
      const listener = vi.fn();
      controller.events.on('heal', listener);

      controller.healDamage(20);

      expect(controller.healthPoints).toBe(70);
      expect(listener).toHaveBeenCalledWith({ currentHealth: 70, healAmount: 20 });
    });

    it('clamps health points at maxHealthPoints instead of overhealing', () => {
      const { controller } = createController(100);

      controller.healDamage(20);

      expect(controller.healthPoints).toBe(100);
    });

    it('triggers heal with the actual amount gained when clamped', () => {
      const { controller } = createController(100);
      controller.inflictDamage(10);
      const listener = vi.fn();
      controller.events.on('heal', listener);

      controller.healDamage(20);

      expect(controller.healthPoints).toBe(100);
      expect(listener).toHaveBeenCalledWith({ currentHealth: 100, healAmount: 10 });
    });

    it('ignores non-positive heal amounts without changing health or triggering an event', () => {
      const { controller } = createController(100);
      const listener = vi.fn();
      controller.events.on('heal', listener);

      controller.healDamage(0);
      controller.healDamage(-5);

      expect(controller.healthPoints).toBe(100);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('onDestroyed', () => {
    it('removes all event listeners when destroyed', () => {
      const { controller } = createController(10);
      const damageListener = vi.fn();
      const healListener = vi.fn();
      const deathListener = vi.fn();
      controller.events.on('damagetaken', damageListener);
      controller.events.on('heal', healListener);
      controller.events.on('death', deathListener);

      controller.destroy();

      expect(controller.events.listeners).toHaveLength(0);

      controller.inflictDamage(5);
      controller.inflictDamage(5);
      controller.healDamage(5);

      expect(damageListener).not.toHaveBeenCalled();
      expect(deathListener).not.toHaveBeenCalled();
      expect(healListener).not.toHaveBeenCalled();
    });
  });

  describe('resetHealth', () => {
    it('restores health to maxHealthPoints and clears isDead', () => {
      const { controller } = createController(10);
      controller.inflictDamage(10);
      expect(controller.isDead).toBe(true);

      controller.resetHealth();

      expect(controller.healthPoints).toBe(10);
      expect(controller.isDead).toBe(false);
    });
  });
});
