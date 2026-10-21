import { describe, it, expect, vi } from 'vitest';
import { Emitter, GameObjectEventMap } from '@tgdf';

import { Entity } from '3D/classes/gameObjects/Entity/Entity';
import {
  GENERAL_REPLENISH_RATE_PER_S,
  SHORT_TERM_STAMINA_REPLENISH_TIMEOUT_S,
  StaminaPointsController,
  StaminaPointsControllerOptions,
} from '3D/classes/gameObjectComponents/StaminaPointsController/StaminaPointsController';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

const MAX_LONG_TERM = 300;
const MAX_SHORT_TERM = 100;
const STEP_S = 0.1;
const REPLENISHED_PER_STEP = GENERAL_REPLENISH_RATE_PER_S * STEP_S;

function createController(options: Partial<StaminaPointsControllerOptions> = {}) {
  const events = new Emitter<GameObjectEventMap>();
  const entity = { isAwake: false, events } as unknown as Entity;
  const controller = new StaminaPointsController(entity, {
    maxLongTermStamina: MAX_LONG_TERM,
    maxShortTermStamina: MAX_SHORT_TERM,
    ...options,
  });

  const update = (deltaTime: number) => events.trigger('update', { deltaTime });
  const waitForTimeout = () => update(SHORT_TERM_STAMINA_REPLENISH_TIMEOUT_S);
  const step = (times = 1) => {
    for (let i = 0; i < times; i++) update(STEP_S);
  };

  return { controller, update, waitForTimeout, step };
}

function totalStamina(controller: StaminaPointsController): number {
  return controller.shortTermStamina + controller.longTermStamina;
}

describe('StaminaPointsController', () => {
  describe('constructor', () => {
    it('starts with both pools full', () => {
      const { controller } = createController();

      expect(controller.shortTermStamina).toBe(MAX_SHORT_TERM);
      expect(controller.longTermStamina).toBe(MAX_LONG_TERM);
    });

    it('throws when a max is negative', () => {
      expect(() => createController({ maxShortTermStamina: -1 })).toThrow();
      expect(() => createController({ maxLongTermStamina: -1 })).toThrow();
    });

    it('allows a max of zero', () => {
      const { controller } = createController({ maxShortTermStamina: 0, maxLongTermStamina: 0 });

      expect(controller.shortTermStamina).toBe(0);
      expect(controller.longTermStamina).toBe(0);
    });
  });

  describe('draining and restoring', () => {
    it('drains short-term stamina up to what is available', () => {
      const { controller } = createController();

      expect(controller.drainShortTermStamina(30)).toBe(30);
      expect(controller.drainShortTermStamina(100)).toBe(70);
      expect(controller.shortTermStamina).toBe(0);
    });

    it('restores short-term stamina up to its max', () => {
      const { controller } = createController();
      controller.drainShortTermStamina(50);

      controller.restoreShortTermStamina(80);

      expect(controller.shortTermStamina).toBe(MAX_SHORT_TERM);
    });

    it('drains and restores long-term stamina within its range', () => {
      const { controller } = createController();

      expect(controller.drainLongTermStamina(350)).toBe(MAX_LONG_TERM);
      expect(controller.longTermStamina).toBe(0);

      controller.restoreLongTermStamina(500);
      expect(controller.longTermStamina).toBe(MAX_LONG_TERM);
    });

    it('ignores non-positive amounts', () => {
      const { controller } = createController();
      controller.drainShortTermStamina(50);
      controller.drainLongTermStamina(50);

      expect(controller.drainShortTermStamina(-10)).toBe(0);
      expect(controller.drainLongTermStamina(0)).toBe(0);
      controller.restoreShortTermStamina(-10);
      controller.restoreLongTermStamina(0);

      expect(controller.shortTermStamina).toBe(50);
      expect(controller.longTermStamina).toBe(MAX_LONG_TERM - 50);
    });
  });

  describe('setting stamina', () => {
    it('sets short-term stamina clamped to its max', () => {
      const { controller } = createController();

      controller.setShortTermStamina(40);
      expect(controller.shortTermStamina).toBe(40);

      controller.setShortTermStamina(MAX_SHORT_TERM + 50);
      expect(controller.shortTermStamina).toBe(MAX_SHORT_TERM);
    });

    it('sets long-term stamina clamped to its max', () => {
      const { controller } = createController();

      controller.setLongTermStamina(120);
      expect(controller.longTermStamina).toBe(120);

      controller.setLongTermStamina(MAX_LONG_TERM + 50);
      expect(controller.longTermStamina).toBe(MAX_LONG_TERM);
    });

    it('does not set stamina below zero', () => {
      const { controller } = createController();

      controller.setShortTermStamina(-10);
      controller.setLongTermStamina(-10);

      expect(controller.shortTermStamina).toBe(0);
      expect(controller.longTermStamina).toBe(0);
    });

    it('does not set a max below zero', () => {
      const { controller } = createController();

      controller.setMaxShortTermStamina(-10);
      controller.setMaxLongTermStamina(-10);

      expect(controller.maxShortTermStamina).toBe(0);
      expect(controller.maxLongTermStamina).toBe(0);
      expect(controller.shortTermStamina).toBe(0);
      expect(controller.longTermStamina).toBe(0);
    });

    it('lowers current stamina when a max is set below it', () => {
      const { controller } = createController();

      controller.setMaxShortTermStamina(60);
      controller.setMaxLongTermStamina(150);

      expect(controller.maxShortTermStamina).toBe(60);
      expect(controller.maxLongTermStamina).toBe(150);
      expect(controller.shortTermStamina).toBe(60);
      expect(controller.longTermStamina).toBe(150);
    });

    it('keeps current stamina when a max is raised above it', () => {
      const { controller } = createController();

      controller.setMaxShortTermStamina(MAX_SHORT_TERM * 2);
      controller.setMaxLongTermStamina(MAX_LONG_TERM * 2);

      expect(controller.shortTermStamina).toBe(MAX_SHORT_TERM);
      expect(controller.longTermStamina).toBe(MAX_LONG_TERM);

      controller.restoreShortTermStamina(MAX_SHORT_TERM * 5);
      controller.restoreLongTermStamina(MAX_LONG_TERM * 5);

      expect(controller.shortTermStamina).toBe(MAX_SHORT_TERM * 2);
      expect(controller.longTermStamina).toBe(MAX_LONG_TERM * 2);
    });
  });

  describe('events', () => {
    function listen(controller: StaminaPointsController) {
      const onShortTerm = vi.fn();
      const onLongTerm = vi.fn();
      const onMaxShortTerm = vi.fn();
      const onMaxLongTerm = vi.fn();
      controller.events.on('short-term-stamina-change', onShortTerm);
      controller.events.on('long-term-stamina-change', onLongTerm);
      controller.events.on('max-short-term-stamina-change', onMaxShortTerm);
      controller.events.on('max-long-term-stamina-change', onMaxLongTerm);
      return { onShortTerm, onLongTerm, onMaxShortTerm, onMaxLongTerm };
    }

    it('triggers the max events when a max changes', () => {
      const { controller } = createController();
      const { onMaxShortTerm, onMaxLongTerm } = listen(controller);

      controller.setMaxShortTermStamina(150);
      controller.setMaxLongTermStamina(400);

      expect(onMaxShortTerm).toHaveBeenCalledExactlyOnceWith(150);
      expect(onMaxLongTerm).toHaveBeenCalledExactlyOnceWith(400);
    });

    it('does not trigger the max events when a max does not change', () => {
      const { controller } = createController();
      const { onMaxShortTerm, onMaxLongTerm } = listen(controller);

      controller.setMaxShortTermStamina(MAX_SHORT_TERM);
      controller.setMaxLongTermStamina(MAX_LONG_TERM);

      expect(onMaxShortTerm).not.toHaveBeenCalled();
      expect(onMaxLongTerm).not.toHaveBeenCalled();
    });

    it('triggers the max event with the clamped max', () => {
      const { controller } = createController();
      const { onMaxShortTerm, onMaxLongTerm } = listen(controller);

      controller.setMaxShortTermStamina(-10);
      controller.setMaxLongTermStamina(-10);

      expect(onMaxShortTerm).toHaveBeenCalledExactlyOnceWith(0);
      expect(onMaxLongTerm).toHaveBeenCalledExactlyOnceWith(0);
    });

    it('does not trigger the max events again when the clamped max does not change', () => {
      const { controller } = createController();
      controller.setMaxShortTermStamina(-10);
      controller.setMaxLongTermStamina(-10);
      const { onMaxShortTerm, onMaxLongTerm } = listen(controller);

      controller.setMaxShortTermStamina(-5);
      controller.setMaxLongTermStamina(-5);

      expect(onMaxShortTerm).not.toHaveBeenCalled();
      expect(onMaxLongTerm).not.toHaveBeenCalled();
    });

    it('triggers the stamina event before the max event when lowering a max clamps stamina', () => {
      const { controller } = createController();
      const { onShortTerm, onLongTerm, onMaxShortTerm, onMaxLongTerm } = listen(controller);

      controller.setMaxShortTermStamina(60);
      controller.setMaxLongTermStamina(150);

      expect(onShortTerm.mock.invocationCallOrder[0]).toBeLessThan(
        onMaxShortTerm.mock.invocationCallOrder[0]
      );
      expect(onLongTerm.mock.invocationCallOrder[0]).toBeLessThan(
        onMaxLongTerm.mock.invocationCallOrder[0]
      );
    });

    it('exposes already clamped stamina to max event listeners', () => {
      const { controller } = createController();
      let shortTermSeen: number | undefined;
      let longTermSeen: number | undefined;
      controller.events.on('max-short-term-stamina-change', () => {
        shortTermSeen = controller.shortTermStamina;
      });
      controller.events.on('max-long-term-stamina-change', () => {
        longTermSeen = controller.longTermStamina;
      });

      controller.setMaxShortTermStamina(60);
      controller.setMaxLongTermStamina(150);

      expect(shortTermSeen).toBe(60);
      expect(longTermSeen).toBe(150);
    });

    it('triggers the stamina events when lowering a max clamps current stamina', () => {
      const { controller } = createController();
      const { onShortTerm, onLongTerm } = listen(controller);

      controller.setMaxShortTermStamina(60);
      controller.setMaxLongTermStamina(150);

      expect(onShortTerm).toHaveBeenCalledExactlyOnceWith(60);
      expect(onLongTerm).toHaveBeenCalledExactlyOnceWith(150);
    });

    it('does not trigger the stamina events when a max changes without clamping', () => {
      const { controller } = createController();
      controller.drainShortTermStamina(50);
      controller.drainLongTermStamina(200);
      const { onShortTerm, onLongTerm } = listen(controller);

      controller.setMaxShortTermStamina(MAX_SHORT_TERM * 2);
      controller.setMaxLongTermStamina(MAX_LONG_TERM * 2);
      controller.setMaxShortTermStamina(60);
      controller.setMaxLongTermStamina(150);

      expect(onShortTerm).not.toHaveBeenCalled();
      expect(onLongTerm).not.toHaveBeenCalled();
    });

    it('triggers only the short-term event when short-term stamina changes', () => {
      const { controller } = createController();
      const { onShortTerm, onLongTerm } = listen(controller);

      controller.drainShortTermStamina(30);
      controller.restoreShortTermStamina(10);

      expect(onShortTerm.mock.calls).toEqual([[70], [80]]);
      expect(onLongTerm).not.toHaveBeenCalled();
    });

    it('triggers only the long-term event when long-term stamina changes', () => {
      const { controller } = createController();
      const { onShortTerm, onLongTerm } = listen(controller);

      controller.drainLongTermStamina(100);
      controller.restoreLongTermStamina(40);

      expect(onLongTerm.mock.calls).toEqual([[200], [240]]);
      expect(onShortTerm).not.toHaveBeenCalled();
    });

    it('triggers the events from the setters', () => {
      const { controller } = createController();
      const { onShortTerm, onLongTerm } = listen(controller);

      controller.setShortTermStamina(25);
      controller.setLongTermStamina(75);

      expect(onShortTerm).toHaveBeenCalledExactlyOnceWith(25);
      expect(onLongTerm).toHaveBeenCalledExactlyOnceWith(75);
    });

    it('does not trigger when the value does not change', () => {
      const { controller } = createController();
      const { onShortTerm, onLongTerm } = listen(controller);

      controller.restoreShortTermStamina(10);
      controller.restoreLongTermStamina(10);
      controller.setShortTermStamina(MAX_SHORT_TERM);
      controller.setLongTermStamina(MAX_LONG_TERM);
      controller.drainShortTermStamina(0);

      expect(onShortTerm).not.toHaveBeenCalled();
      expect(onLongTerm).not.toHaveBeenCalled();
    });

    it('triggers both events while replenishing', () => {
      const { controller, waitForTimeout, step } = createController();
      controller.drainShortTermStamina(50);
      const { onShortTerm, onLongTerm } = listen(controller);

      waitForTimeout();
      step();

      expect(onShortTerm).toHaveBeenCalledExactlyOnceWith(50 + REPLENISHED_PER_STEP);
      expect(onLongTerm).toHaveBeenCalledExactlyOnceWith(MAX_LONG_TERM - REPLENISHED_PER_STEP);
    });

    it('removes all listeners when destroyed', () => {
      const { controller } = createController();
      const { onShortTerm, onLongTerm } = listen(controller);

      controller.destroy();
      controller.drainShortTermStamina(10);
      controller.drainLongTermStamina(10);

      expect(onShortTerm).not.toHaveBeenCalled();
      expect(onLongTerm).not.toHaveBeenCalled();
    });
  });

  describe('replenishing short-term stamina', () => {
    it('does not replenish before the timeout has passed since the last drain attempt', () => {
      const { controller, waitForTimeout } = createController();
      controller.drainShortTermStamina(50);

      waitForTimeout();

      expect(controller.shortTermStamina).toBe(50);
      expect(controller.longTermStamina).toBe(MAX_LONG_TERM);
    });

    it('replenishes once the timeout has passed since the last drain attempt', () => {
      const { controller, waitForTimeout, step } = createController();
      controller.drainShortTermStamina(50);

      waitForTimeout();
      step();

      expect(controller.shortTermStamina).toBeCloseTo(50 + REPLENISHED_PER_STEP);
    });

    it('restarts the timeout on a drain attempt even when nothing could be drained', () => {
      const { controller, update, waitForTimeout, step } = createController();
      controller.drainShortTermStamina(MAX_SHORT_TERM);
      update(SHORT_TERM_STAMINA_REPLENISH_TIMEOUT_S - STEP_S);

      expect(controller.drainShortTermStamina(10)).toBe(0);
      step(2);
      expect(controller.shortTermStamina).toBe(0);

      waitForTimeout();
      expect(controller.shortTermStamina).toBeGreaterThan(0);
    });

    it('keeps waiting while drain attempts continue', () => {
      const { controller, update } = createController();
      controller.drainShortTermStamina(50);

      for (let i = 0; i < 30; i++) {
        controller.drainShortTermStamina(0);
        update(STEP_S);
      }

      expect(controller.shortTermStamina).toBe(50);
      expect(controller.longTermStamina).toBe(MAX_LONG_TERM);
    });

    it('replenishes at the replenish rate', () => {
      const { controller, waitForTimeout, step } = createController();
      controller.drainShortTermStamina(MAX_SHORT_TERM);

      waitForTimeout();
      step(4);

      expect(controller.shortTermStamina).toBeCloseTo(4 * REPLENISHED_PER_STEP);
    });

    it('drains long-term stamina by exactly the amount short-term stamina is replenished', () => {
      const { controller, waitForTimeout, step } = createController();
      controller.drainShortTermStamina(60);
      const totalBefore = totalStamina(controller);

      waitForTimeout();
      step(5);

      expect(controller.shortTermStamina).toBeCloseTo(40 + 5 * REPLENISHED_PER_STEP);
      expect(controller.longTermStamina).toBeCloseTo(MAX_LONG_TERM - 5 * REPLENISHED_PER_STEP);
      expect(totalStamina(controller)).toBeCloseTo(totalBefore);
    });

    it('does not take more long-term stamina than short-term stamina can still hold', () => {
      const { controller, waitForTimeout, step } = createController();
      controller.drainShortTermStamina(2);
      const totalBefore = totalStamina(controller);

      waitForTimeout();
      step();

      expect(controller.shortTermStamina).toBe(MAX_SHORT_TERM);
      expect(controller.longTermStamina).toBeCloseTo(MAX_LONG_TERM - 2);
      expect(totalStamina(controller)).toBeCloseTo(totalBefore);
    });

    it('does not replenish when short-term stamina is at max', () => {
      const { controller, waitForTimeout, step } = createController();
      const onShortTerm = vi.fn();
      const onLongTerm = vi.fn();
      controller.events.on('short-term-stamina-change', onShortTerm);
      controller.events.on('long-term-stamina-change', onLongTerm);

      waitForTimeout();
      step(10);

      expect(controller.shortTermStamina).toBe(MAX_SHORT_TERM);
      expect(controller.longTermStamina).toBe(MAX_LONG_TERM);
      expect(onShortTerm).not.toHaveBeenCalled();
      expect(onLongTerm).not.toHaveBeenCalled();
    });

    it('does not replenish when long-term stamina is empty', () => {
      const { controller, waitForTimeout, step } = createController();
      controller.drainLongTermStamina(MAX_LONG_TERM);
      controller.drainShortTermStamina(50);

      waitForTimeout();
      step(10);

      expect(controller.shortTermStamina).toBe(50);
      expect(controller.longTermStamina).toBe(0);
    });

    it('replenishes only as much as long-term stamina has left', () => {
      const { controller, waitForTimeout, step } = createController();
      controller.drainLongTermStamina(MAX_LONG_TERM - 20);
      controller.drainShortTermStamina(MAX_SHORT_TERM);

      waitForTimeout();
      step(20);

      expect(controller.shortTermStamina).toBeCloseTo(20);
      expect(controller.longTermStamina).toBeCloseTo(0);
    });
  });
});
