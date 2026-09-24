import { describe, it, expect, vi, beforeEach } from 'vitest';

const { MockGamepadInstance } = vi.hoisted(() => {
  class MockGamepadInstance {
    public index: number;
    public destroy = vi.fn();

    constructor(gamepad: { index: number }) {
      this.index = gamepad.index;
    }
  }
  return { MockGamepadInstance };
});

vi.mock('./GamepadInstance', () => ({
  GamepadInstance: MockGamepadInstance,
}));

import { GamepadManager } from './GamepadManager';

function dispatchGamepadEvent(
  type: 'gamepadconnected' | 'gamepaddisconnected',
  index: number
): void {
  const gamepad = { index } as unknown as Gamepad;
  window.dispatchEvent(Object.assign(new Event(type), { gamepad }));
}

describe('GamepadManager', () => {
  const manager = GamepadManager.getInstance();

  beforeEach(() => {
    // Leave every test with a clean slate regardless of run order.
    const staleIndices = [...manager.getConnectedGamepads().keys()];
    for (const index of staleIndices) {
      dispatchGamepadEvent('gamepaddisconnected', index);
    }
  });

  it('getInstance() always returns the same singleton', () => {
    expect(GamepadManager.getInstance()).toBe(manager);
  });

  it('has no connected gamepads initially', () => {
    expect(manager.getConnectedGamepads().size).toBe(0);
  });

  it('adds a gamepad to the connected map on gamepadconnected', () => {
    dispatchGamepadEvent('gamepadconnected', 1);

    const gamepad = manager.getGamepad(1);
    expect(gamepad).toBeDefined();
    expect(gamepad?.index).toBe(1);
    expect(manager.getConnectedGamepads().size).toBe(1);
  });

  it('emits gamepadconnected with the new GamepadInstance', () => {
    const handler = vi.fn();
    manager.events.on('gamepadconnected', handler);

    dispatchGamepadEvent('gamepadconnected', 2);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ gamepad: manager.getGamepad(2) });
  });

  it('removes the gamepad from the connected map on gamepaddisconnected', () => {
    dispatchGamepadEvent('gamepadconnected', 3);
    expect(manager.getGamepad(3)).toBeDefined();

    dispatchGamepadEvent('gamepaddisconnected', 3);

    expect(manager.getGamepad(3)).toBeUndefined();
    expect(manager.getConnectedGamepads().has(3)).toBe(false);
  });

  it('destroys the GamepadInstance when it disconnects', () => {
    dispatchGamepadEvent('gamepadconnected', 4);
    const gamepad = manager.getGamepad(4);

    dispatchGamepadEvent('gamepaddisconnected', 4);

    expect(gamepad?.destroy).toHaveBeenCalledOnce();
  });

  it('emits gamepaddisconnected with the removed GamepadInstance', () => {
    dispatchGamepadEvent('gamepadconnected', 5);
    const gamepad = manager.getGamepad(5);
    const handler = vi.fn();
    manager.events.on('gamepaddisconnected', handler);

    dispatchGamepadEvent('gamepaddisconnected', 5);

    expect(handler).toHaveBeenCalledWith({ gamepad });
  });

  it('does not throw disconnecting an index that was never connected', () => {
    expect(() => dispatchGamepadEvent('gamepaddisconnected', 99)).not.toThrow();
    expect(manager.getConnectedGamepads().has(99)).toBe(false);
  });

  it('does not emit gamepaddisconnected for an index that was never connected', () => {
    const handler = vi.fn();
    manager.events.on('gamepaddisconnected', handler);

    dispatchGamepadEvent('gamepaddisconnected', 98);

    expect(handler).not.toHaveBeenCalled();
    manager.events.off('gamepaddisconnected', handler);
  });

  it('getGamepad returns undefined for an unconnected index', () => {
    expect(manager.getGamepad(123)).toBeUndefined();
  });

  it('tracks multiple gamepads independently by index', () => {
    dispatchGamepadEvent('gamepadconnected', 6);
    dispatchGamepadEvent('gamepadconnected', 7);

    expect(manager.getConnectedGamepads().size).toBe(2);
    expect(manager.getGamepad(6)?.index).toBe(6);
    expect(manager.getGamepad(7)?.index).toBe(7);

    dispatchGamepadEvent('gamepaddisconnected', 6);

    expect(manager.getConnectedGamepads().has(6)).toBe(false);
    expect(manager.getGamepad(7)?.index).toBe(7);
  });
});
