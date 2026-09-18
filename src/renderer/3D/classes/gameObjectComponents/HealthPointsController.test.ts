import { Mock, IMock } from 'moq.ts';
import { Emitter, GameObjectEventMap } from '@tgdf';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { Entity } from '../gameObjects/Entity';
import { HealthPointsController } from './HealthPointsController';

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

function createController(initialHealthPoints = 100) {
  const { entityMock } = createEntityMock();
  const controller = new HealthPointsController(entityMock.object(), { initialHealthPoints });

  return { controller, entityMock };
}

describe('HealthPointsController', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('throws when initialHealthPoints is zero', () => {
      const { entityMock } = createEntityMock();

      expect(
        () => new HealthPointsController(entityMock.object(), { initialHealthPoints: 0 })
      ).toThrow();
    });

    it('throws when initialHealthPoints is negative', () => {
      const { entityMock } = createEntityMock();

      expect(
        () => new HealthPointsController(entityMock.object(), { initialHealthPoints: -10 })
      ).toThrow();
    });

    it('sets healthPoints to initialHealthPoints when it is positive', () => {
      const { controller } = createController(50);

      expect(controller.healthPoints).toBe(50);
      expect(controller.initialHealthPoints).toBe(50);
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

    it('clamps health points at initialHealthPoints instead of overhealing', () => {
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

  describe('resetHealth', () => {
    it('restores health to initialHealthPoints and clears isDead', () => {
      const { controller } = createController(10);
      controller.inflictDamage(10);
      expect(controller.isDead).toBe(true);

      controller.resetHealth();

      expect(controller.healthPoints).toBe(10);
      expect(controller.isDead).toBe(false);
    });
  });

});
