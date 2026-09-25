import { useEffect, useRef } from 'react';
import { GamepadButton, Input, InputState } from '@tgdf';

import { InputNotifiable } from '../Input';

/**
 * Hook that executes a callback when a specific gamepad button is pressed.
 *
 * @param button - The button to listen for
 * @param callback - Function to call when the button is pressed
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useGamepadButtonPress(GAMEPAD_MAPPINGS.START, () => {
 *     console.log('Start pressed!');
 *   }, []);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useGamepadButtonPress(button: GamepadButton, callback: () => void): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    let wasPressed = false;

    const notifiable: InputNotifiable = {
      onInputNotify: (inputState: InputState) => {
        const isPressed = inputState.gamepad.isButtonPressed(button);
        if (isPressed && !wasPressed) {
          callbackRef.current();
        }
        wasPressed = isPressed;
      },
    };

    Input.registerNotifiable(notifiable);

    return () => {
      Input.unregisterNotifiable(notifiable);
    };
  }, [button]);
}
