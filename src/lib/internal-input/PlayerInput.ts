import { InputState, MouseButton } from './types';
import { GamepadInstance } from './Gamepad/GamepadInstance';
import { Input, InputNotifiable, RegisterableInputSource } from './Input';
import { GamepadManager, GamepadManagerEventMap } from './Gamepad/GamepadManager';
import {
  GAMEPAD_AXIS_CODE_MAPPING,
  GAMEPAD_BUTTON_CODE_MAPPING,
  GamepadAxis as GamepadAxisName,
  GamepadButton as GamepadButtonName,
} from './constants';

export type PlayerInputBinding = { type: 'keyboard' } | { type: 'gamepad'; index: number };

const globalInput = Input.getInstance();

export class PlayerInput implements RegisterableInputSource {
  private readonly _binding: PlayerInputBinding;
  private readonly _notifiables: Set<InputNotifiable> = new Set();
  private readonly _keyboardBridge: InputNotifiable = { onInputNotify: () => this._notify() };
  private _unsubscribeGamepadInteraction: (() => void) | null = null;
  private _disposed = false;

  private constructor(binding: PlayerInputBinding) {
    this._binding = binding;

    if (binding.type === 'keyboard') {
      globalInput.registerNotifiable(this._keyboardBridge);
    } else {
      this._subscribeGamepadPush();
    }
  }

  public static keyboard(): PlayerInput {
    return new PlayerInput({ type: 'keyboard' });
  }

  public static gamepad(index: number): PlayerInput {
    return new PlayerInput({ type: 'gamepad', index });
  }

  public get binding(): PlayerInputBinding {
    return this._binding;
  }

  public registerNotifiable(notifiable: InputNotifiable): void {
    this._notifiables.add(notifiable);
  }

  public unregisterNotifiable(notifiable: InputNotifiable): void {
    this._notifiables.delete(notifiable);
  }

  public dispose(): void {
    if (this._disposed) return;
    this._disposed = true;

    if (this._binding.type === 'keyboard') {
      globalInput.unregisterNotifiable(this._keyboardBridge);
    } else {
      GamepadManager.getInstance().events.off('gamepadconnected', this._handleGamepadConnected);
      this._unsubscribeGamepadInteraction?.();
      this._unsubscribeGamepadInteraction = null;
    }

    this._notifiables.clear();
  }

  public getState(): InputState {
    return {
      keyboard: {
        isKeyPressed: (key: string) => this._isKeyPressed(key),
      },
      mouse: {
        getX: () => this._mouseValue((mouse) => mouse.mouseX, 0),
        getY: () => this._mouseValue((mouse) => mouse.mouseY, 0),
        getWheelDelta: () => this._mouseValue((mouse) => mouse.wheelDelta, 0),
        isButtonPressed: (button: MouseButton) =>
          this._mouseValue((mouse) => mouse.isButtonPressed(button), false),
      },
      gamepad: {
        isButtonPressed: (button: GamepadButtonName) => this._isGamepadButtonPressed(button),
        getAxisValue: (axis: GamepadAxisName | number) => this._getGamepadAxisValue(axis),
      },
    };
  }

  private _notify(): void {
    const state = this.getState();
    for (const notifiable of this._notifiables) {
      notifiable.onInputNotify(state);
    }
  }

  private _subscribeGamepadPush(): void {
    const manager = GamepadManager.getInstance();
    const gamepad = this._getGamepadInstance();

    if (gamepad) {
      this._bindGamepadInteraction(gamepad);
    }

    manager.events.on('gamepadconnected', this._handleGamepadConnected);
  }

  private _handleGamepadConnected = ({
    gamepad,
  }: GamepadManagerEventMap['gamepadconnected']): void => {
    if (this._binding.type !== 'gamepad' || gamepad.index !== this._binding.index) return;
    this._bindGamepadInteraction(gamepad);
  };

  private _bindGamepadInteraction(gamepad: GamepadInstance): void {
    this._unsubscribeGamepadInteraction?.();
    this._unsubscribeGamepadInteraction = gamepad.onAnyInteraction(() => this._notify());
  }

  private _isKeyPressed(key: string): boolean {
    if (this._binding.type !== 'keyboard') return false;
    return globalInput.keyboard.isKeyPressed(key);
  }

  private _mouseValue<T>(read: (mouse: typeof globalInput.mouse) => T, fallback: T): T {
    if (this._binding.type !== 'keyboard') return fallback;
    return read(globalInput.mouse);
  }

  private _isGamepadButtonPressed(button: GamepadButtonName): boolean {
    const gamepad = this._getGamepadInstance();
    if (!gamepad) return false;
    return gamepad.isButtonPressed(GAMEPAD_BUTTON_CODE_MAPPING[button]);
  }

  private _getGamepadAxisValue(axis: GamepadAxisName | number): number {
    const gamepad = this._getGamepadInstance();
    if (!gamepad) return 0;
    const axisIndex = typeof axis === 'number' ? axis : GAMEPAD_AXIS_CODE_MAPPING[axis];
    return gamepad.getAxis(axisIndex) ?? 0;
  }

  private _getGamepadInstance() {
    if (this._binding.type !== 'gamepad') return undefined;
    return GamepadManager.getInstance().getGamepad(this._binding.index);
  }
}
