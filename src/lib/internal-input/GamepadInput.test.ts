import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

type FakeGamepadOverrides = {
  isButtonPressed?: (index: number) => boolean;
  getAxis?: (index: number) => number | undefined;
};

const { MockGamepadInstance } = vi.hoisted(() => {
  class MockGamepadInstance {
    public index: number;
    public destroy = vi.fn();
    private _isButtonPressed: (index: number) => boolean;
    private _getAxis: (index: number) => number | undefined;
    private _interactionListeners: Array<() => void> = [];

    constructor(gamepad: { index: number } & FakeGamepadOverrides) {
      this.index = gamepad.index;
      this._isButtonPressed = gamepad.isButtonPressed ?? (() => false);
      this._getAxis = gamepad.getAxis ?? (() => 0);
    }

    public isButtonPressed(index: number): boolean {
      return this._isButtonPressed(index);
    }

    public getAxis(index: number): number | undefined {
      return this._getAxis(index);
    }

    public onAnyInteraction(handler: () => void): () => void {
      this._interactionListeners.push(handler);
      return () => {
        this._interactionListeners = this._interactionListeners.filter((l) => l !== handler);
      };
    }

    public triggerInteraction(): void {
      for (const listener of this._interactionListeners) {
        listener();
      }
    }
  }
  return { MockGamepadInstance };
});

vi.mock('./Gamepad/GamepadInstance', () => ({
  GamepadInstance: MockGamepadInstance,
}));

import { GamepadManager } from '@tgdf';

import { GamepadInput } from './GamepadInput';

function dispatchGamepadEvent(
  type: 'gamepadconnected' | 'gamepaddisconnected',
  gamepad: { index: number } & FakeGamepadOverrides
): void {
  window.dispatchEvent(Object.assign(new Event(type), { gamepad: gamepad as unknown as Gamepad }));
}

function connectFakeGamepad(index: number, overrides: FakeGamepadOverrides = {}): void {
  dispatchGamepadEvent('gamepadconnected', { index, ...overrides });
}

function triggerGamepadInteraction(manager: GamepadManager, index: number): void {
  const gamepad = manager.getGamepad(index) as unknown as { triggerInteraction: () => void };
  gamepad.triggerInteraction();
}

describe('GamepadInput', () => {
  const manager = GamepadManager.getInstance();

  beforeEach(() => {
    for (const index of [...manager.getConnectedGamepads().keys()]) {
      dispatchGamepadEvent('gamepaddisconnected', { index });
    }
  });

  it('reads button and axis state from the first gamepad', () => {
    connectFakeGamepad(0, {
      isButtonPressed: (index) => index === 5,
      getAxis: (index) => (index === 1 ? -0.8 : 0),
    });
    const gamepadInput = new GamepadInput();
    gamepadInput.initialize();

    expect(gamepadInput.isButtonPressed('RB')).toBe(true);
    expect(gamepadInput.isButtonPressed('A')).toBe(false);
    expect(gamepadInput.getAxisValue('LEFT_STICK_Y')).toBe(-0.8);
  });

  it('ignores gamepads other than the first one', () => {
    connectFakeGamepad(1, { isButtonPressed: () => true, getAxis: () => 1 });
    const onInput = vi.fn();
    const gamepadInput = new GamepadInput();
    gamepadInput.initialize(onInput);

    triggerGamepadInteraction(manager, 1);

    expect(onInput).not.toHaveBeenCalled();
    expect(gamepadInput.isButtonPressed('A')).toBe(false);
    expect(gamepadInput.getAxisValue('LEFT_STICK_X')).toBe(0);
  });

  it('calls the input callback when the first gamepad reports interaction', () => {
    connectFakeGamepad(0);
    const onInput = vi.fn();
    new GamepadInput().initialize(onInput);

    triggerGamepadInteraction(manager, 0);

    expect(onInput).toHaveBeenCalledOnce();
  });

  it('binds to the first gamepad once it connects after initialization', () => {
    const onInput = vi.fn();
    new GamepadInput().initialize(onInput);

    connectFakeGamepad(0);
    triggerGamepadInteraction(manager, 0);

    expect(onInput).toHaveBeenCalledOnce();
  });

  it('reports no input and skips the callback while disabled', () => {
    connectFakeGamepad(0, { isButtonPressed: () => true, getAxis: () => 1 });
    const onInput = vi.fn();
    const gamepadInput = new GamepadInput();
    gamepadInput.initialize(onInput);

    gamepadInput.disable();
    triggerGamepadInteraction(manager, 0);

    expect(onInput).not.toHaveBeenCalled();
    expect(gamepadInput.isButtonPressed('A')).toBe(false);
    expect(gamepadInput.getAxisValue('LEFT_STICK_X')).toBe(0);
  });

  it('stops calling the callback after dispose', () => {
    connectFakeGamepad(0);
    const onInput = vi.fn();
    const gamepadInput = new GamepadInput();
    gamepadInput.initialize(onInput);

    gamepadInput.dispose();
    triggerGamepadInteraction(manager, 0);
    connectFakeGamepad(0);

    expect(onInput).not.toHaveBeenCalled();
  });
});
