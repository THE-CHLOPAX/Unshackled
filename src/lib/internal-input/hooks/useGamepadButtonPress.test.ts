import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

const { MockGamepadInstance } = vi.hoisted(() => {
  class MockGamepadInstance {
    public index: number;
    public destroy = vi.fn();
    public pressedButtons = new Set<number>();
    private _interactionListeners: Array<() => void> = [];

    constructor(gamepad: { index: number }) {
      this.index = gamepad.index;
    }

    public isButtonPressed(index: number): boolean {
      return this.pressedButtons.has(index);
    }

    public getAxis(): number {
      return 0;
    }

    public onAnyInteraction(handler: () => void): () => void {
      this._interactionListeners.push(handler);
      return () => {
        this._interactionListeners = this._interactionListeners.filter((l) => l !== handler);
      };
    }

    public setPressed(index: number, pressed: boolean): void {
      if (pressed) {
        this.pressedButtons.add(index);
      } else {
        this.pressedButtons.delete(index);
      }
      for (const listener of this._interactionListeners) {
        listener();
      }
    }
  }
  return { MockGamepadInstance };
});

vi.mock('../Gamepad/GamepadInstance', () => ({
  GamepadInstance: MockGamepadInstance,
}));

import { GAMEPAD_BUTTON_CODE_MAPPING, GamepadButton, GamepadManager } from '@tgdf';

import { useGamepadButtonPress } from './useGamepadButtonPress';

const manager = GamepadManager.getInstance();

function dispatchGamepadEvent(
  type: 'gamepadconnected' | 'gamepaddisconnected',
  index: number
): void {
  window.dispatchEvent(
    Object.assign(new Event(type), { gamepad: { index } as unknown as Gamepad })
  );
}

function setButton(button: GamepadButton, pressed: boolean): void {
  const gamepad = manager.getGamepad(0) as unknown as InstanceType<typeof MockGamepadInstance>;
  gamepad.setPressed(GAMEPAD_BUTTON_CODE_MAPPING[button], pressed);
}

describe('useGamepadButtonPress', () => {
  beforeEach(() => {
    for (const index of [...manager.getConnectedGamepads().keys()]) {
      dispatchGamepadEvent('gamepaddisconnected', index);
    }
    dispatchGamepadEvent('gamepadconnected', 0);
  });

  it('calls the callback once per press, not while held', () => {
    const callback = vi.fn();
    renderHook(() => useGamepadButtonPress('START', callback));

    setButton('START', true);
    setButton('A', true);
    setButton('START', false);
    setButton('START', true);

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('ignores other buttons', () => {
    const callback = vi.fn();
    renderHook(() => useGamepadButtonPress('START', callback));

    setButton('B', true);

    expect(callback).not.toHaveBeenCalled();
  });

  it('calls the latest callback after a re-render', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ cb }) => useGamepadButtonPress('START', cb), {
      initialProps: { cb: first },
    });

    rerender({ cb: second });
    setButton('START', true);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it('listens to the new button when the button argument changes', () => {
    const callback = vi.fn();
    const { rerender } = renderHook(({ button }) => useGamepadButtonPress(button, callback), {
      initialProps: { button: 'START' as GamepadButton },
    });

    rerender({ button: 'B' });
    setButton('START', true);
    expect(callback).not.toHaveBeenCalled();

    setButton('B', true);
    expect(callback).toHaveBeenCalledOnce();
  });

  it('stops listening after unmount', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useGamepadButtonPress('START', callback));

    unmount();
    setButton('START', true);

    expect(callback).not.toHaveBeenCalled();
  });
});
