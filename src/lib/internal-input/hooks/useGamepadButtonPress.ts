import { useEffect, useState } from 'react';
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
  const [isPressed, setIsPressed] = useState(false);

  const notifiableObject: InputNotifiable = {
    onInputNotify: (inputState: InputState) => {
      setIsPressed(inputState.gamepad.isButtonPressed(button));
    },
  };

  useEffect(() => {
    if (isPressed) {
      callback();
    }
  }, [isPressed]);

  useEffect(() => {
    Input.registerNotifiable(notifiableObject);

    return () => {
      Input.unregisterNotifiable(notifiableObject);
    };
  }, []);
}
