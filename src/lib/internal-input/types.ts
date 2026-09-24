import { GamepadButton as GamepadButtonName, GamepadAxis as GamepadAxisName } from './constants';

export type KeyMatcher = string | string[] | ((e: KeyboardEvent) => boolean);

export type MouseButton = 'left' | 'right' | 'middle';
export type ButtonMatcher = MouseButton | MouseButton[] | ((e: MouseEvent) => boolean);

export type InputState = {
  keyboard: {
    isKeyPressed: (key: string) => boolean;
  };
  mouse: {
    getX: () => number;
    getY: () => number;
    getWheelDelta: () => number;
    isButtonPressed: (button: MouseButton) => boolean;
  };
  gamepad: {
    isButtonPressed: (button: GamepadButtonName) => boolean;
    getAxisValue: (axis: GamepadAxisName | number) => number;
  };
};

export type MouseHandlerRecord = {
  matcher: ButtonMatcher;
  handler: (e: MouseEvent) => void;
};

export type KeyboardHandlerRecord = {
  matcher: KeyMatcher;
  handler: (e: KeyboardEvent) => void;
};

export type GamepadButtonState = {
  pressed: boolean;
  value: number;
};

export type ButtonListener = {
  button: GamepadButtonName | number;
  callback: (pressed: boolean, value: number) => void;
  type: 'down' | 'press' | 'up';
  threshold?: number; // Milliseconds threshold for 'press' type
  pressStartTime?: number; // Internal tracking for press threshold
};

export type AxisListener = {
  axis: GamepadAxisName | number;
  callback: (value: number) => void;
};
