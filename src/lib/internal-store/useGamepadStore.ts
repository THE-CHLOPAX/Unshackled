import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { Emitter } from '../internal-3d/Emitter';
import { GamepadInstance } from '../internal-input/Gamepad/GamepadInstance';
import { GamepadManager, GamepadManagerEventMap } from '../internal-input/Gamepad/GamepadManager';

export type GamepadEventMap = GamepadManagerEventMap;

export type GamepadState = {
  connectedGamepads: Map<number, GamepadInstance>;
  gamepadEvents: Emitter<GamepadEventMap>;
  setConnectedGamepads: (gamepads: Map<number, GamepadInstance>) => void;
};

const gamepadManager = GamepadManager.getInstance();

export const useGamepadStore = create<GamepadState>()(
  devtools(
    (set) => ({
      connectedGamepads: gamepadManager.getConnectedGamepads(),
      gamepadEvents: gamepadManager.events,

      setConnectedGamepads: (gamepads: Map<number, GamepadInstance>) =>
        set({ connectedGamepads: gamepads }),
    }),
    {
      name: 'gamepad-store',
    }
  )
);

// Mirror GamepadManager's connected-gamepads map into the store so React
// consumers re-render on connect/disconnect.
gamepadManager.events.on('gamepadconnected', () => {
  useGamepadStore.getState().setConnectedGamepads(gamepadManager.getConnectedGamepads());
});

gamepadManager.events.on('gamepaddisconnected', () => {
  useGamepadStore.getState().setConnectedGamepads(gamepadManager.getConnectedGamepads());
});
