import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

import { GamepadManager, PlayerInput } from '@tgdf';

function dispatchGamepadEvent(
  type: 'gamepadconnected' | 'gamepaddisconnected',
  gamepad: { index: number } & FakeGamepadOverrides
): void {
  window.dispatchEvent(Object.assign(new Event(type), { gamepad: gamepad as unknown as Gamepad }));
}

function connectFakeGamepad(index: number, overrides: FakeGamepadOverrides = {}): void {
  dispatchGamepadEvent('gamepadconnected', { index, ...overrides });
}

function disconnectGamepad(index: number): void {
  dispatchGamepadEvent('gamepaddisconnected', { index });
}

function triggerGamepadInteraction(manager: GamepadManager, index: number): void {
  const gamepad = manager.getGamepad(index) as unknown as { triggerInteraction: () => void };
  gamepad.triggerInteraction();
}

function pressKey(key: string, code: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, code }));
}

function releaseKey(key: string, code: string): void {
  window.dispatchEvent(new KeyboardEvent('keyup', { key, code }));
}

describe('PlayerInput', () => {
  const manager = GamepadManager.getInstance();

  beforeEach(() => {
    // Leave every test with a clean slate regardless of run order.
    const staleIndices = [...manager.getConnectedGamepads().keys()];
    for (const index of staleIndices) {
      disconnectGamepad(index);
    }
  });

  afterEach(() => {
    releaseKey('w', 'KeyW');
    window.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));
  });

  describe('keyboard binding', () => {
    it('reflects real, live keyboard state for a keyboard-bound player', () => {
      const input = PlayerInput.keyboard();
      expect(input.getState().keyboard.isKeyPressed('w')).toBe(false);

      pressKey('w', 'KeyW');
      expect(input.getState().keyboard.isKeyPressed('w')).toBe(true);

      releaseKey('w', 'KeyW');
      expect(input.getState().keyboard.isKeyPressed('w')).toBe(false);
    });

    it('reflects real mouse state for a keyboard-bound player', () => {
      const input = PlayerInput.keyboard();

      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 120, clientY: 80 }));
      window.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: 42 }));

      const state = input.getState();
      expect(state.mouse.getX()).toBe(120);
      expect(state.mouse.getY()).toBe(80);
      expect(state.mouse.isButtonPressed('left')).toBe(true);
      expect(state.mouse.getWheelDelta()).toBe(42);
    });

    it('never reports gamepad input for a keyboard-bound player, even with a gamepad connected', () => {
      const isButtonPressed = vi.fn(() => true);
      const getAxis = vi.fn(() => 1);
      connectFakeGamepad(0, { isButtonPressed, getAxis });
      const input = PlayerInput.keyboard();

      expect(input.getState().gamepad.isButtonPressed('A')).toBe(false);
      expect(input.getState().gamepad.getAxisValue('LEFT_STICK_X')).toBe(0);
      expect(isButtonPressed).not.toHaveBeenCalled();
      expect(getAxis).not.toHaveBeenCalled();
    });
  });

  describe('gamepad binding', () => {
    it('never reports keyboard input for a gamepad-bound player, even while a key is held', () => {
      const input = PlayerInput.gamepad(0);
      pressKey('w', 'KeyW');

      expect(input.getState().keyboard.isKeyPressed('w')).toBe(false);
    });

    it('never reports mouse input for a gamepad-bound player', () => {
      const input = PlayerInput.gamepad(0);
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 60 }));
      window.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));

      const state = input.getState();
      expect(state.mouse.getX()).toBe(0);
      expect(state.mouse.getY()).toBe(0);
      expect(state.mouse.isButtonPressed('left')).toBe(false);
    });

    it('reads button state from the GamepadInstance bound to its index', () => {
      connectFakeGamepad(1, { isButtonPressed: (index) => index === 0 });

      const input = PlayerInput.gamepad(1);

      expect(input.getState().gamepad.isButtonPressed('A')).toBe(true);
    });

    it('maps named buttons/axes to their W3C indices before reading the gamepad', () => {
      const isButtonPressed = vi.fn(() => false);
      const getAxis = vi.fn(() => 0);
      connectFakeGamepad(0, { isButtonPressed, getAxis });
      const input = PlayerInput.gamepad(0);

      input.getState().gamepad.isButtonPressed('RB');
      input.getState().gamepad.getAxisValue('RIGHT_STICK_Y');

      expect(isButtonPressed).toHaveBeenCalledWith(5);
      expect(getAxis).toHaveBeenCalledWith(3);
    });

    it('passes a numeric axis straight through without remapping', () => {
      const getAxis = vi.fn(() => 0);
      connectFakeGamepad(0, { getAxis });
      const input = PlayerInput.gamepad(0);

      input.getState().gamepad.getAxisValue(6);

      expect(getAxis).toHaveBeenCalledWith(6);
    });

    it('only reads from the gamepad at its own bound index, not other indices', () => {
      connectFakeGamepad(2, { isButtonPressed: () => true });

      const inputForIndexZero = PlayerInput.gamepad(0);
      const inputForIndexTwo = PlayerInput.gamepad(2);

      expect(inputForIndexZero.getState().gamepad.isButtonPressed('A')).toBe(false);
      expect(inputForIndexTwo.getState().gamepad.isButtonPressed('A')).toBe(true);
    });

    it('returns false/0 when no gamepad is connected at the bound index', () => {
      const input = PlayerInput.gamepad(3);

      expect(input.getState().gamepad.isButtonPressed('A')).toBe(false);
      expect(input.getState().gamepad.getAxisValue('LEFT_STICK_X')).toBe(0);
    });

    it('treats an undefined axis reading (axis not present on the pad) as 0', () => {
      connectFakeGamepad(0, { getAxis: () => undefined });
      const input = PlayerInput.gamepad(0);

      expect(input.getState().gamepad.getAxisValue('LEFT_STICK_Y')).toBe(0);
    });
  });

  describe('push notifications', () => {
    it('notifies registered listeners on keyboard change, with its own scoped state', () => {
      const input = PlayerInput.keyboard();
      const listener = { onInputNotify: vi.fn() };
      input.registerNotifiable(listener);

      pressKey('w', 'KeyW');

      expect(listener.onInputNotify).toHaveBeenCalledOnce();
      const [state] = listener.onInputNotify.mock.calls[0];
      expect(state.keyboard.isKeyPressed('w')).toBe(true);
    });

    it('stops notifying a keyboard-bound listener once unregistered', () => {
      const input = PlayerInput.keyboard();
      const listener = { onInputNotify: vi.fn() };
      input.registerNotifiable(listener);
      input.unregisterNotifiable(listener);

      pressKey('w', 'KeyW');

      expect(listener.onInputNotify).not.toHaveBeenCalled();
    });

    it('notifies registered listeners when its bound gamepad reports any interaction', () => {
      connectFakeGamepad(0);
      const input = PlayerInput.gamepad(0);
      const listener = { onInputNotify: vi.fn() };
      input.registerNotifiable(listener);

      triggerGamepadInteraction(manager, 0);

      expect(listener.onInputNotify).toHaveBeenCalledOnce();
    });

    it('picks up push notifications once a gamepad connects after construction', () => {
      const input = PlayerInput.gamepad(5);
      const listener = { onInputNotify: vi.fn() };
      input.registerNotifiable(listener);

      connectFakeGamepad(5);
      triggerGamepadInteraction(manager, 5);

      expect(listener.onInputNotify).toHaveBeenCalledOnce();
    });

    it('does not notify a gamepad-bound listener when a different index reports interaction', () => {
      connectFakeGamepad(0);
      connectFakeGamepad(1);
      const input = PlayerInput.gamepad(0);
      const listener = { onInputNotify: vi.fn() };
      input.registerNotifiable(listener);

      triggerGamepadInteraction(manager, 1);

      expect(listener.onInputNotify).not.toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('stops notifying keyboard-bound listeners', () => {
      const input = PlayerInput.keyboard();
      const listener = { onInputNotify: vi.fn() };
      input.registerNotifiable(listener);

      input.dispose();
      pressKey('w', 'KeyW');

      expect(listener.onInputNotify).not.toHaveBeenCalled();
    });

    it('unsubscribes from its connected gamepad interactions', () => {
      connectFakeGamepad(0);
      const input = PlayerInput.gamepad(0);
      const listener = { onInputNotify: vi.fn() };
      input.registerNotifiable(listener);

      input.dispose();
      input.registerNotifiable(listener);
      triggerGamepadInteraction(manager, 0);

      expect(listener.onInputNotify).not.toHaveBeenCalled();
    });

    it('does not bind to a gamepad that connects after disposal', () => {
      const input = PlayerInput.gamepad(5);
      const listener = { onInputNotify: vi.fn() };

      input.dispose();
      input.registerNotifiable(listener);
      connectFakeGamepad(5);
      triggerGamepadInteraction(manager, 5);

      expect(listener.onInputNotify).not.toHaveBeenCalled();
    });

    it('is safe to call more than once', () => {
      const input = PlayerInput.keyboard();

      input.dispose();

      expect(() => input.dispose()).not.toThrow();
    });
  });

  describe('two players sharing the same process', () => {
    it('a keyboard player and a gamepad player read fully independent state simultaneously', () => {
      connectFakeGamepad(0, { isButtonPressed: () => true });

      const player1 = PlayerInput.keyboard();
      const player2 = PlayerInput.gamepad(0);

      pressKey('w', 'KeyW');

      expect(player1.getState().keyboard.isKeyPressed('w')).toBe(true);
      expect(player2.getState().keyboard.isKeyPressed('w')).toBe(false);

      expect(player2.getState().gamepad.isButtonPressed('A')).toBe(true);
      expect(player1.getState().gamepad.isButtonPressed('A')).toBe(false);
    });
  });
});
