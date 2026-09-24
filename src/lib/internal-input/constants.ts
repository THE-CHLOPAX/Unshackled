/**
 * Unified input-mapping constants for keyboard and gamepad, used in place of
 * raw string literals ('KeyW', 'RB', ...) at call sites so typos are caught
 * at compile time and renames only ever need to happen in one place.
 */

function keyMirror<const T extends string>(keys: readonly T[]): { readonly [K in T]: K } {
  return Object.fromEntries(keys.map((key) => [key, key])) as { readonly [K in T]: K };
}

// ---------------------------------------------------------------------------
// Keyboard
// ---------------------------------------------------------------------------

/**
 * KeyboardEvent.code values used by this game. Each value equals its own key
 * name (e.g. KEYBOARD_MAPPINGS.KeyA === 'KeyA') - this exists purely so call
 * sites reference a typed constant instead of a bare string literal.
 */
export const KEYBOARD_MAPPINGS = keyMirror([
  'KeyA',
  'KeyB',
  'KeyC',
  'KeyD',
  'KeyE',
  'KeyF',
  'KeyG',
  'KeyH',
  'KeyI',
  'KeyJ',
  'KeyK',
  'KeyL',
  'KeyM',
  'KeyN',
  'KeyO',
  'KeyP',
  'KeyQ',
  'KeyR',
  'KeyS',
  'KeyT',
  'KeyU',
  'KeyV',
  'KeyW',
  'KeyX',
  'KeyY',
  'KeyZ',
  'Digit0',
  'Digit1',
  'Digit2',
  'Digit3',
  'Digit4',
  'Digit5',
  'Digit6',
  'Digit7',
  'Digit8',
  'Digit9',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ShiftLeft',
  'ShiftRight',
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'Space',
  'Enter',
  'Escape',
  'Tab',
  'Backspace',
]);

export type KeyboardMapping = keyof typeof KEYBOARD_MAPPINGS;

// ---------------------------------------------------------------------------
// Gamepad
// ---------------------------------------------------------------------------

/**
 * Standard gamepad button indices (Xbox layout)
 * This follows the W3C standard mapping used by most modern controllers
 */
export const GAMEPAD_BUTTON_CODE_MAPPING = {
  // Face buttons (right side)
  A: 0, // Bottom button (Xbox A, PS Cross)
  B: 1, // Right button (Xbox B, PS Circle)
  X: 2, // Left button (Xbox X, PS Square)
  Y: 3, // Top button (Xbox Y, PS Triangle)

  // Shoulder buttons
  LB: 4, // Left bumper (L1)
  RB: 5, // Right bumper (R1)
  LT: 6, // Left trigger (L2)
  RT: 7, // Right trigger (R2)

  // Center buttons
  SELECT: 8, // Select/Back/Share button
  START: 9, // Start/Options button

  // Stick buttons
  L3: 10, // Left stick press
  R3: 11, // Right stick press

  // D-Pad
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_LEFT: 14,
  DPAD_RIGHT: 15,
} as const satisfies Record<string, number>;

/**
 * Standard gamepad axis indices
 */
export const GAMEPAD_AXIS_CODE_MAPPING = {
  LEFT_STICK_X: 0, // Left stick horizontal (-1 = left, +1 = right)
  LEFT_STICK_Y: 1, // Left stick vertical (-1 = up, +1 = down)
  RIGHT_STICK_X: 2, // Right stick horizontal (-1 = left, +1 = right)
  RIGHT_STICK_Y: 3, // Right stick vertical (-1 = up, +1 = down)
} as const satisfies Record<string, number>;

/**
 * Standard Gamepad button mappings based on the W3C Gamepad API standard
 * https://www.w3.org/TR/gamepad/#remapping
 */
export type GamepadButton = keyof typeof GAMEPAD_BUTTON_CODE_MAPPING;

export type GamepadAxis = keyof typeof GAMEPAD_AXIS_CODE_MAPPING;

/**
 * Gamepad button/axis names used in place of raw string literals ('RB',
 * 'LEFT_STICK_X', ...) at call sites - the gamepad counterpart to
 * KEYBOARD_MAPPINGS.
 */
export const GAMEPAD_MAPPINGS = keyMirror([
  ...(Object.keys(GAMEPAD_BUTTON_CODE_MAPPING) as GamepadButton[]),
  ...(Object.keys(GAMEPAD_AXIS_CODE_MAPPING) as GamepadAxis[]),
]);

/**
 * Reverse mapping for button indices to names
 */
export const GAMEPAD_BUTTON_INDEX_TO_NAME: Record<number, GamepadButton> = Object.fromEntries(
  Object.entries(GAMEPAD_BUTTON_CODE_MAPPING).map(([name, index]) => [index, name as GamepadButton])
) as Record<number, GamepadButton>;

/**
 * Reverse mapping for axis indices to names
 */
export const GAMEPAD_AXIS_INDEX_TO_NAME: Record<number, GamepadAxis> = Object.fromEntries(
  Object.entries(GAMEPAD_AXIS_CODE_MAPPING).map(([name, index]) => [index, name as GamepadAxis])
) as Record<number, GamepadAxis>;
