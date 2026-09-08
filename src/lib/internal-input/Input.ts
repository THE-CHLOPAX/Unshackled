import { logger } from '@tgdf';

import { InputState } from './types';
import { MouseInput } from './MouseInput';
import { GamepadInput } from './GamepadInput';
import { KeyboardInput } from './KeyboardInput';

export type InputNotifiable = {
  onInputNotify(inputState: InputState): void;
};

/**
 * Singleton Input class that manages keyboard, mouse, and gamepad inputs.
 * This class is initialized once and can be accessed from anywhere in the application,
 * both in React components and in three.js scenes/classes.
 */
export class Input {
  private static _instance: Input | null = null;

  private _keyboard: KeyboardInput = new KeyboardInput();
  private _mouse: MouseInput = new MouseInput();
  private _gamepad: GamepadInput = new GamepadInput();

  private _initialized = false;
  private _notifiables: Set<InputNotifiable> = new Set();
  private _inputState: InputState = {
    keyboard: {
      isKeyPressed: (key: string) => this._keyboard.isKeyPressed(key),
    },
    mouse: {
      getX: () => this._mouse.mouseX,
      getY: () => this._mouse.mouseY,
      getWheelDelta: () => this._mouse.wheelDelta,
      isButtonPressed: (button) => this._mouse.isButtonPressed(button),
    },
    gamepad: {
      isButtonPressed: (button) => this._gamepad.isButtonPressed(button),
      getAxisValue: (axis) => this._gamepad.getAxisValue(axis),
    },
  };

  /**
   * Get the singleton instance of Input.
   * Initializes it if it hasn't been initialized yet.
   */
  public static getInstance(): Input {
    if (!Input._instance) {
      Input._instance = new Input();
      Input._instance._initialize();
    }
    return Input._instance;
  }

  /**
   * Register a GameObject to receive input callbacks
   */
  public registerNotifiable(notifiable: InputNotifiable): void {
    this._notifiables.add(notifiable);
  }

  /**
   * Unregister a GameObject from receiving input callbacks
   */
  public unregisterNotifiable(notifiable: InputNotifiable): void {
    this._notifiables.delete(notifiable);
  }

  /**
   * Get the current input state
   */
  public getState(): InputState {
    return this._inputState;
  }

  public get keyboard(): KeyboardInput {
    return this._keyboard;
  }

  public get mouse(): MouseInput {
    return this._mouse;
  }

  public get gamepad(): GamepadInput {
    return this._gamepad;
  }

  public disableAllInput() {
    this._keyboard.disable();
    this._mouse.disable();
    this._gamepad.disable();
  }

  public enableAllInput() {
    this._keyboard.enable();
    this._mouse.enable();
    this._gamepad.enable();
  }

  /**
   * Initialize all event listeners
   */
  private _initialize(): void {
    if (this._initialized) return;

    const onInput = () => this._notifyObjects();

    // Initialize keyboard input with callback
    this._keyboard.initialize(onInput);

    // Initialize mouse input with callback
    this._mouse.initialize(onInput);

    // Initialize gamepad input with callback
    this._gamepad.initialize(onInput);

    this._initialized = true;
  }

  /**
   * Notify all registered InputNotifiables of input changes
   */
  private _notifyObjects(): void {
    const state = this.getState();

    for (const notifiable of this._notifiables) {
      try {
        notifiable.onInputNotify(state);
      } catch (error) {
        logger({
          message: `Error in InputNotifiable.onInputNotify: ${error}`,
          type: 'error',
        });
      }
    }
  }

  /**
   * Cleanup all listeners (typically called on app shutdown)
   */
  public dispose(): void {
    this._keyboard.dispose();
    this._mouse.dispose();
    this._gamepad.dispose();
    this._notifiables.clear();

    this._initialized = false;
  }
}

// Export a singleton instance for direct imports
export const input = Input.getInstance();
