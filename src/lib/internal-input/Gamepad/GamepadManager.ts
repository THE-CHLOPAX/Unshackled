import { Emitter } from '../../internal-3d/Emitter';
import { GamepadInstance } from './GamepadInstance';

export type GamepadManagerEventMap = {
  gamepadconnected: { gamepad: GamepadInstance };
  gamepaddisconnected: { gamepad: GamepadInstance };
};

export class GamepadManager {
  private static _instance: GamepadManager | null = null;

  private _connectedGamepads: Map<number, GamepadInstance> = new Map();
  private _events: Emitter<GamepadManagerEventMap> = new Emitter<GamepadManagerEventMap>();
  private _initialized = false;

  public static getInstance(): GamepadManager {
    if (!GamepadManager._instance) {
      GamepadManager._instance = new GamepadManager();
      GamepadManager._instance._initialize();
    }
    return GamepadManager._instance;
  }

  public get events(): Emitter<GamepadManagerEventMap> {
    return this._events;
  }

  public getConnectedGamepads(): Map<number, GamepadInstance> {
    return this._connectedGamepads;
  }

  public getGamepad(index: number): GamepadInstance | undefined {
    return this._connectedGamepads.get(index);
  }

  public scanForConnectedGamepads(): void {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return;

    for (const gamepad of navigator.getGamepads()) {
      if (!gamepad || this._connectedGamepads.has(gamepad.index)) continue;
      this._addGamepad(gamepad);
    }
  }

  private _initialize(): void {
    if (this._initialized) return;

    window.addEventListener('gamepadconnected', this._handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', this._handleGamepadDisconnected);

    this._initialized = true;

    this.scanForConnectedGamepads();
  }

  private _addGamepad(gamepad: Gamepad): GamepadInstance {
    const gamepadInstance = new GamepadInstance(gamepad);
    this._connectedGamepads = new Map(this._connectedGamepads).set(gamepad.index, gamepadInstance);
    this._events.trigger('gamepadconnected', { gamepad: gamepadInstance });
    return gamepadInstance;
  }

  private _handleGamepadConnected = (e: GamepadEvent): void => {
    if (this._connectedGamepads.has(e.gamepad.index)) return;
    this._addGamepad(e.gamepad);
  };

  private _handleGamepadDisconnected = (e: GamepadEvent): void => {
    const existing = this._connectedGamepads.get(e.gamepad.index);
    if (!existing) return;

    const updatedGamepads = new Map(this._connectedGamepads);
    updatedGamepads.delete(e.gamepad.index);
    this._connectedGamepads = updatedGamepads;

    existing.destroy();

    this._events.trigger('gamepaddisconnected', { gamepad: existing });
  };
}
