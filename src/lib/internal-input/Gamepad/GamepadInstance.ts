import { AxisListener, ButtonListener, GamepadButtonState } from '../types';
import {
  GAMEPAD_BUTTON_CODE_MAPPING,
  GAMEPAD_AXIS_CODE_MAPPING,
  GamepadButton as GamepadButtonName,
  GamepadAxis as GamepadAxisName,
} from '../constants';

const DEFAULT_PRESS_THRESHOLD_MS = 50;

/**
 * Class representing a connected gamepad instance
 * Manages gamepad state and emits events for button presses and axis changes
 */
export class GamepadInstance {
  private _disabled: boolean = false;
  private _gamepad: Gamepad;
  private _previousButtonStates: Map<number, GamepadButtonState>;
  private _previousAxisValues: Map<number, number>;
  private _connected: boolean;
  private _axisDeadzone: number;
  private _animationFrameId: number | null;
  private _buttonListeners: ButtonListener[];
  private _axisListeners: AxisListener[];
  private _anyInteractionListeners: Array<() => void>;

  constructor(gamepad: Gamepad, axisDeadzone: number = 0.1) {
    this._gamepad = gamepad;
    this._connected = true;
    this._axisDeadzone = axisDeadzone;
    this._animationFrameId = null;
    this._buttonListeners = [];
    this._axisListeners = [];
    this._anyInteractionListeners = [];

    // Initialize previous states
    this._previousButtonStates = new Map();
    this._previousAxisValues = new Map();

    // Store initial button states
    for (let i = 0; i < gamepad.buttons.length; i++) {
      this._previousButtonStates.set(i, {
        pressed: gamepad.buttons[i].pressed,
        value: gamepad.buttons[i].value,
      });
    }

    // Store initial axis values
    for (let i = 0; i < gamepad.axes.length; i++) {
      this._previousAxisValues.set(i, gamepad.axes[i]);
    }

    // Start the internal update loop
    this._startUpdateLoop();
  }

  /**
   * Get the current gamepad instance
   */
  public get gamepad(): Gamepad {
    return this._gamepad;
  }

  /**
   * Get the gamepad index
   */
  public get index(): number {
    return this._gamepad.index;
  }

  /**
   * Get the gamepad ID
   */
  public get id(): string {
    return this._gamepad.id;
  }

  /**
   * Check if the gamepad is connected
   */
  public get connected(): boolean {
    return this._connected;
  }

  /**
   * Check if the gamepad is disabled
   */
  public get disabled(): boolean {
    return this._disabled;
  }

  public disable(): void {
    this._disabled = true;
  }

  public enable(): void {
    this._disabled = false;
  }

  /**
   * Start the internal update loop
   */
  private _startUpdateLoop(): void {
    const update = () => {
      if (!this._connected) {
        return;
      }

      // Get the latest gamepad state
      const gamepads = navigator.getGamepads();
      const latestGamepad = gamepads[this._gamepad.index];

      if (latestGamepad) {
        this._update(latestGamepad);
      }

      // Continue the loop
      this._animationFrameId = requestAnimationFrame(update);
    };

    this._animationFrameId = requestAnimationFrame(update);
  }

  /**
   * Update the gamepad state and emit events for changes
   */
  private _update(gamepad: Gamepad): void {
    if (!this._connected || this._disabled) {
      return;
    }

    this._gamepad = gamepad;

    // Check for button changes
    for (let i = 0; i < gamepad.buttons.length; i++) {
      const button = gamepad.buttons[i];
      const previousState = this._previousButtonStates.get(i);

      if (previousState) {
        const stateChanged =
          button.pressed !== previousState.pressed || button.value !== previousState.value;
        const isPressed = button.pressed || button.value > 0;

        // Trigger any interaction listeners on state change
        if (stateChanged) {
          this._triggerAnyInteractionListeners();
        }

        // Always trigger button listeners if button is pressed (for continuous 'press' events)
        // or if state changed (for 'down' and 'up' events)
        if (isPressed || stateChanged) {
          this._triggerButtonListeners(
            i,
            button.pressed,
            button.value,
            previousState.pressed,
            previousState.value
          );
        }

        // Update previous state
        if (stateChanged) {
          this._previousButtonStates.set(i, {
            pressed: button.pressed,
            value: button.value,
          });
        }
      }
    }

    // Check for axis changes
    for (let i = 0; i < gamepad.axes.length; i++) {
      const axisValue = gamepad.axes[i];
      const previousValue = this._previousAxisValues.get(i);

      if (previousValue !== undefined) {
        // Apply deadzone
        const currentValue = Math.abs(axisValue) < this._axisDeadzone ? 0 : axisValue;
        const prevValue = Math.abs(previousValue) < this._axisDeadzone ? 0 : previousValue;

        // Emit event if axis value changed significantly
        if (currentValue !== prevValue) {
          // Trigger any interaction listeners
          this._triggerAnyInteractionListeners();

          // Trigger custom axis listeners
          this._triggerAxisListeners(i, currentValue);

          // Update previous value
          this._previousAxisValues.set(i, axisValue);
        }
      }
    }
  }

  private _triggerAnyInteractionListeners(): void {
    for (const listener of this._anyInteractionListeners) {
      listener();
    }
  }

  /**
   * Trigger button listeners based on type
   */
  private _triggerButtonListeners(
    buttonIndex: number,
    pressed: boolean,
    value: number,
    wasPressedBefore: boolean,
    previousValue: number
  ): void {
    // LT and RT are analog triggers (indices 6 and 7)
    const isAnalogTrigger = buttonIndex === 6 || buttonIndex === 7;
    const triggerThreshold = 0.1; // Minimum value to consider trigger pressed

    for (const listener of this._buttonListeners) {
      const listenerButtonIndex =
        typeof listener.button === 'string'
          ? GAMEPAD_BUTTON_CODE_MAPPING[listener.button]
          : listener.button;

      if (listenerButtonIndex === buttonIndex) {
        // For analog triggers (LT/RT), treat value > threshold as "pressed"
        const isPressed = isAnalogTrigger ? value > triggerThreshold : pressed;
        const wasPressed = isAnalogTrigger ? previousValue > triggerThreshold : wasPressedBefore;

        if (listener.type === 'down' && isPressed && !wasPressed) {
          // Button was just pressed down
          listener.callback(pressed, value);
        } else if (listener.type === 'press' && isPressed) {
          // Button is being held down - handle threshold
          if (listener.threshold !== undefined && listener.threshold > 0) {
            // Initialize start time if this is the first press
            if (!wasPressed) {
              listener.pressStartTime = Date.now();
            }

            // Check if threshold has been met
            if (listener.pressStartTime !== undefined) {
              const elapsed = Date.now() - listener.pressStartTime;
              if (elapsed >= listener.threshold) {
                listener.callback(pressed, value);
              }
            }
          } else {
            // No threshold, fire immediately
            listener.callback(pressed, value);
          }
        } else if (listener.type === 'up' && !isPressed && wasPressed) {
          // Button was just released
          listener.callback(pressed, value);
        } else if (!isPressed && listener.type === 'press') {
          // Button is not pressed anymore, reset the timer for press listeners
          listener.pressStartTime = undefined;
        }
      }
    }
  }

  /**
   * Trigger axis listeners
   */
  private _triggerAxisListeners(axisIndex: number, value: number): void {
    for (const listener of this._axisListeners) {
      const listenerAxisIndex =
        typeof listener.axis === 'string'
          ? GAMEPAD_AXIS_CODE_MAPPING[listener.axis]
          : listener.axis;

      if (listenerAxisIndex === axisIndex) {
        listener.callback(value);
      }
    }
  }

  /**
   * Destroy the gamepad instance, stop the update loop, and emit disconnection event
   */
  public destroy(): void {
    if (!this._connected) {
      return;
    }

    // Stop the update loop
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }

    this._connected = false;

    this._previousButtonStates.clear();
    this._previousAxisValues.clear();
  }

  /**
   * Get button state by index
   */
  public getButton(index: number): GamepadButton | undefined {
    return this._gamepad.buttons[index];
  }

  /**
   * Get axis value by index
   */
  public getAxis(index: number): number | undefined {
    const value = this._gamepad.axes[index];
    if (value === undefined) {
      return undefined;
    }
    // Apply deadzone
    return Math.abs(value) < this._axisDeadzone ? 0 : value;
  }

  /**
   * Check if a specific button is pressed
   */
  public isButtonPressed(index: number): boolean {
    return this._gamepad.buttons[index]?.pressed ?? false;
  }

  /**
   * Add a listener for button down events (fired once when button is pressed)
   */
  public addButtonDownListener(
    button: GamepadButtonName | number,
    callback: (pressed: boolean, value: number) => void,
    once?: boolean
  ): () => void {
    const wrappedCallback = (pressed: boolean, value: number) => {
      callback(pressed, value);
      if (once) {
        this.removeButtonDownListener(button, wrappedCallback);
      }
    };
    this._buttonListeners.push({ button, callback: wrappedCallback, type: 'down' });
    return () => {
      this.removeButtonDownListener(button, wrappedCallback);
    };
  }

  /**
   * Add a listener for button press events (fired continuously while button is held)
   * @param button - The button to listen for
   * @param callback - The callback function to execute
   * @param thresholdMs - How long the button must be held (in ms) before the callback starts firing
   */
  public addButtonPressListener(
    button: GamepadButtonName | number,
    callback: (pressed: boolean, value: number) => void,
    thresholdMs?: number,
    once?: boolean
  ): () => void {
    const wrappedCallback = (pressed: boolean, value: number) => {
      callback(pressed, value);
      if (once) {
        this.removeButtonPressListener(button, wrappedCallback);
      }
    };
    this._buttonListeners.push({
      button,
      callback: wrappedCallback,
      type: 'press',
      threshold: thresholdMs ?? DEFAULT_PRESS_THRESHOLD_MS,
    });
    return () => {
      this.removeButtonPressListener(button, wrappedCallback);
    };
  }

  /**
   * Add a listener for button up events (fired once when button is released)
   */
  public addButtonUpListener(
    button: GamepadButtonName | number,
    callback: (pressed: boolean, value: number) => void,
    once?: boolean
  ): () => void {
    const wrappedCallback = (pressed: boolean, value: number) => {
      callback(pressed, value);
      if (once) {
        this.removeButtonUpListener(button, wrappedCallback);
      }
    };
    this._buttonListeners.push({ button, callback: wrappedCallback, type: 'up' });
    return () => {
      this.removeButtonUpListener(button, wrappedCallback);
    };
  }

  /**
   * Add a listener for axis change events
   */
  public addAxisMoveListener(
    axis: GamepadAxisName | number,
    callback: (value: number) => void,
    once?: boolean
  ): () => void {
    const wrappedCallback = (value: number) => {
      callback(value);
      if (once) {
        this.removeAxisMoveListener(axis, wrappedCallback);
      }
    };
    this._axisListeners.push({ axis, callback: wrappedCallback });
    return () => {
      this.removeAxisMoveListener(axis, wrappedCallback);
    };
  }

  public onAnyInteraction(handler: () => void, once?: boolean): () => void {
    const interactionListener = () => {
      handler();
      if (once) {
        this.removeAnyInteractionListener(interactionListener);
      }
    };

    this._anyInteractionListeners.push(interactionListener);
    return () => {
      this._anyInteractionListeners = this._anyInteractionListeners.filter(
        (listener) => listener !== interactionListener
      );
    };
  }

  public removeAnyInteractionListener(handler: () => void): void {
    this._anyInteractionListeners = this._anyInteractionListeners.filter(
      (listener) => listener !== handler
    );
  }

  /**
   * Remove a specific button down listener
   */
  public removeButtonDownListener(
    button: GamepadButtonName | number,
    callback: (pressed: boolean, value: number) => void
  ): void {
    this._buttonListeners = this._buttonListeners.filter(
      (listener) =>
        !(listener.button === button && listener.callback === callback && listener.type === 'down')
    );
  }

  /**
   * Remove a specific button press listener
   */
  public removeButtonPressListener(
    button: GamepadButtonName | number,
    callback: (pressed: boolean, value: number) => void
  ): void {
    this._buttonListeners = this._buttonListeners.filter(
      (listener) =>
        !(listener.button === button && listener.callback === callback && listener.type === 'press')
    );
  }

  /**
   * Remove a specific button up listener
   */
  public removeButtonUpListener(
    button: GamepadButtonName | number,
    callback: (pressed: boolean, value: number) => void
  ): void {
    this._buttonListeners = this._buttonListeners.filter(
      (listener) =>
        !(listener.button === button && listener.callback === callback && listener.type === 'up')
    );
  }

  /**
   * Remove a specific axis listener
   */
  public removeAxisMoveListener(
    axis: GamepadAxisName | number,
    callback: (value: number) => void
  ): void {
    this._axisListeners = this._axisListeners.filter(
      (listener) => !(listener.axis === axis && listener.callback === callback)
    );
  }

  /**
   * Remove all button and axis listeners
   */
  public removeAllListeners(): void {
    this._buttonListeners = [];
    this._axisListeners = [];
  }
}
