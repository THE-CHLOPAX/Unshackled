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

vi.mock('../internal-input/Gamepad/GamepadInstance', () => ({
  GamepadInstance: MockGamepadInstance,
}));

import { useGamepadStore } from './useGamepadStore';
import { GamepadManager } from '../internal-input/Gamepad/GamepadManager';

function dispatchGamepadEvent(type: 'gamepadconnected' | 'gamepaddisconnected', index: number): void {
  const gamepad = { index } as unknown as Gamepad;
  window.dispatchEvent(Object.assign(new Event(type), { gamepad }));
}

describe('useGamepadStore', () => {
  const manager = GamepadManager.getInstance();

  beforeEach(() => {
    // Leave every test with a clean slate regardless of run order.
    const staleIndices = [...manager.getConnectedGamepads().keys()];
    for (const index of staleIndices) {
      dispatchGamepadEvent('gamepaddisconnected', index);
    }
  });

  it('starts with no connected gamepads', () => {
    expect(useGamepadStore.getState().connectedGamepads.size).toBe(0);
  });

  it('exposes the same event emitter instance as GamepadManager', () => {
    expect(useGamepadStore.getState().gamepadEvents).toBe(manager.events);
  });

  it('mirrors GamepadManager into the store when a gamepad connects', () => {
    dispatchGamepadEvent('gamepadconnected', 1);

    const { connectedGamepads } = useGamepadStore.getState();
    expect(connectedGamepads.has(1)).toBe(true);
    expect(connectedGamepads).toBe(manager.getConnectedGamepads());
  });

  it('mirrors GamepadManager into the store when a gamepad disconnects', () => {
    dispatchGamepadEvent('gamepadconnected', 2);
    dispatchGamepadEvent('gamepaddisconnected', 2);

    expect(useGamepadStore.getState().connectedGamepads.has(2)).toBe(false);
  });

  it('notifies gamepadEvents subscribers registered through the store', () => {
    // This is how useActivePlayersStore listens for connect/disconnect today.
    const handler = vi.fn();
    useGamepadStore.getState().gamepadEvents.on('gamepadconnected', handler);

    dispatchGamepadEvent('gamepadconnected', 3);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ gamepad: manager.getGamepad(3) });
  });

  it('setConnectedGamepads directly replaces the store state', () => {
    const customMap = new Map([[42, { index: 42 } as never]]);

    useGamepadStore.getState().setConnectedGamepads(customMap);

    expect(useGamepadStore.getState().connectedGamepads).toBe(customMap);
  });

  it('tracks multiple connected gamepads simultaneously', () => {
    dispatchGamepadEvent('gamepadconnected', 4);
    dispatchGamepadEvent('gamepadconnected', 5);

    const { connectedGamepads } = useGamepadStore.getState();
    expect(connectedGamepads.size).toBe(2);
    expect(connectedGamepads.has(4)).toBe(true);
    expect(connectedGamepads.has(5)).toBe(true);
  });
});
