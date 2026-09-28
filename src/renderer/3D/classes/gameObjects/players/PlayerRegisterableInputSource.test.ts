import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GamepadButton, InputNotifiable, InputState, RegisterableInputSource } from '@tgdf';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

import { PlayerActionType } from '../../../types';
import { PlayerActionEvent, PlayerRegisterableInputSource } from './PlayerRegisterableInputSource';

class FakeInputSource implements RegisterableInputSource {
  public readonly pressedKeys = new Set<string>();
  public readonly pressedButtons = new Set<GamepadButton>();
  private readonly _notifiables = new Set<InputNotifiable>();

  public getState(): InputState {
    return {
      keyboard: { isKeyPressed: (key) => this.pressedKeys.has(key.toLowerCase()) },
      mouse: { getX: () => 0, getY: () => 0, getWheelDelta: () => 0, isButtonPressed: () => false },
      gamepad: {
        isButtonPressed: (button) => this.pressedButtons.has(button),
        getAxisValue: () => 0,
      },
    };
  }

  public registerNotifiable(notifiable: InputNotifiable): void {
    this._notifiables.add(notifiable);
  }

  public unregisterNotifiable(notifiable: InputNotifiable): void {
    this._notifiables.delete(notifiable);
  }

  public pressKey(event: { key: string; code: string }): void {
    this.pressedKeys.add(event.key.toLowerCase());
    this.pressedKeys.add(event.code.toLowerCase());
    this._notify();
  }

  public pressButton(button: GamepadButton): void {
    this.pressedButtons.add(button);
    this._notify();
  }

  private _notify(): void {
    const state = this.getState();
    this._notifiables.forEach((notifiable) => notifiable.onInputNotify(state));
  }
}

const ACTION_TYPES = [
  PlayerActionType.ACTION_UP,
  PlayerActionType.ACTION_DOWN,
  PlayerActionType.ACTION_LEFT,
  PlayerActionType.ACTION_RIGHT,
  PlayerActionType.ACTION_FOCUS,
];

describe('PlayerRegisterableInputSource', () => {
  let source: FakeInputSource;
  let playerInput: PlayerRegisterableInputSource;
  let actions: PlayerActionEvent[];

  beforeEach(() => {
    source = new FakeInputSource();
    playerInput = new PlayerRegisterableInputSource(source);
    actions = [];
    playerInput.events.on('player-action', (action) => actions.push(action));
  });

  function triggeredActionTypes(): PlayerActionType[] {
    return actions.map((action) => action.type).filter((type) => ACTION_TYPES.includes(type));
  }

  it.each([
    { key: 'a', code: 'KeyA' },
    { key: 'b', code: 'KeyB' },
    { key: 'x', code: 'KeyX' },
    { key: 'y', code: 'KeyY' },
  ])('does not treat the keyboard "$code" key as the gamepad button of the same name', (event) => {
    source.pressKey(event);

    expect(triggeredActionTypes()).toEqual([]);
  });

  it.each([
    { event: { key: 'ArrowUp', code: 'ArrowUp' }, action: PlayerActionType.ACTION_UP },
    { event: { key: 'ArrowDown', code: 'ArrowDown' }, action: PlayerActionType.ACTION_DOWN },
    { event: { key: 'ArrowLeft', code: 'ArrowLeft' }, action: PlayerActionType.ACTION_LEFT },
    { event: { key: 'ArrowRight', code: 'ArrowRight' }, action: PlayerActionType.ACTION_RIGHT },
    { event: { key: ' ', code: 'Space' }, action: PlayerActionType.ACTION_FOCUS },
  ])('maps the "$event.code" key to $action', ({ event, action }) => {
    source.pressKey(event);

    expect(triggeredActionTypes()).toEqual([action]);
  });

  it.each([
    { button: 'Y' as const, action: PlayerActionType.ACTION_UP },
    { button: 'A' as const, action: PlayerActionType.ACTION_DOWN },
    { button: 'X' as const, action: PlayerActionType.ACTION_LEFT },
    { button: 'B' as const, action: PlayerActionType.ACTION_RIGHT },
    { button: 'RB' as const, action: PlayerActionType.ACTION_FOCUS },
  ])('maps the gamepad "$button" button to $action', ({ button, action }) => {
    source.pressButton(button);

    expect(triggeredActionTypes()).toEqual([action]);
  });

  it('still maps WASD keys to movement', () => {
    source.pressKey({ key: 'a', code: 'KeyA' });

    expect(actions).toContainEqual(expect.objectContaining({ type: PlayerActionType.RUN }));
  });
});
