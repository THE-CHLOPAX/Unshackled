import { GamepadInstance } from './Gamepad/GamepadInstance';
import { GamepadManager, GamepadManagerEventMap } from './Gamepad/GamepadManager';
import {
  GAMEPAD_AXIS_CODE_MAPPING,
  GAMEPAD_BUTTON_CODE_MAPPING,
  GamepadAxis,
  GamepadButton,
} from './constants';

export class GamepadInput {
  private _gamepadDisabled = false;
  private _onInputCallback?: () => void;
  private _unsubscribeInteraction: (() => void) | null = null;

  constructor(private readonly _gamepadIndex: number = 0) {}

  public initialize(onInputCallback?: () => void): void {
    this._onInputCallback = onInputCallback;

    const manager = GamepadManager.getInstance();
    const gamepad = manager.getGamepad(this._gamepadIndex);

    if (gamepad) {
      this._bindGamepad(gamepad);
    }

    manager.events.on('gamepadconnected', this._handleGamepadConnected);
  }

  public dispose(): void {
    GamepadManager.getInstance().events.off('gamepadconnected', this._handleGamepadConnected);
    this._unsubscribeInteraction?.();
    this._unsubscribeInteraction = null;
    this._onInputCallback = undefined;
  }

  public isButtonPressed(button: GamepadButton): boolean {
    const gamepad = this._getGamepad();
    if (!gamepad) return false;
    return gamepad.isButtonPressed(GAMEPAD_BUTTON_CODE_MAPPING[button]);
  }

  public getAxisValue(axis: GamepadAxis | number): number {
    const gamepad = this._getGamepad();
    if (!gamepad) return 0;
    const axisIndex = typeof axis === 'number' ? axis : GAMEPAD_AXIS_CODE_MAPPING[axis];
    return gamepad.getAxis(axisIndex) ?? 0;
  }

  public disable(): void {
    this._gamepadDisabled = true;
  }

  public enable(): void {
    this._gamepadDisabled = false;
  }

  public get isDisabled(): boolean {
    return this._gamepadDisabled;
  }

  private _getGamepad(): GamepadInstance | undefined {
    if (this._gamepadDisabled) return undefined;
    return GamepadManager.getInstance().getGamepad(this._gamepadIndex);
  }

  private _handleGamepadConnected = ({
    gamepad,
  }: GamepadManagerEventMap['gamepadconnected']): void => {
    if (gamepad.index !== this._gamepadIndex) return;
    this._bindGamepad(gamepad);
  };

  private _bindGamepad(gamepad: GamepadInstance): void {
    this._unsubscribeInteraction?.();
    this._unsubscribeInteraction = gamepad.onAnyInteraction(() => {
      if (this._gamepadDisabled) return;
      this._onInputCallback?.();
    });
  }
}
