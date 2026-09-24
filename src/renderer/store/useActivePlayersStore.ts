import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { devtools } from 'zustand/middleware';
import { GamepadInstance, GamepadManager, useGamepadStore } from '@tgdf';

export const MAX_PLAYERS = 4;

export type ActivePlayerState = {
  id: string;
  name: string;
  controls: 'keyboard' | 'gamepad';
  gamepadIndex?: number; // Only for gamepad controls
};

export type ActivePlayersState = {
  enableAdditionalPlayers: boolean;
  basePlayer: ActivePlayerState;
  additionalPlayers: Set<ActivePlayerState>;
  getActivePlayers: () => Set<ActivePlayerState>;
  getUnoccupiedGamepads: () => Set<GamepadInstance>;
  getKeyboardPlayers: () => Set<ActivePlayerState>;
  setEnableAdditionalPlayers: (enabled: boolean) => void;
  setAdditionalPlayers: (players: Set<ActivePlayerState>) => void;
  removeAdditionalPlayer: (playerId: string) => void;
  setBasePlayer: (player: ActivePlayerState) => void;
  changePlayerControls: (
    playerId: string,
    controls: 'keyboard' | 'gamepad',
    gamepadIndex?: number
  ) => void;
  syncConnectedGamepads: () => void;
};

const initialBasePlayer: ActivePlayerState = {
  id: uuidv4(),
  name: 'Player 1',
  controls: 'keyboard',
};

export const useActivePlayersStore = create<ActivePlayersState>()(
  devtools(
    (set, get) => ({
      enableAdditionalPlayers: false,
      basePlayer: initialBasePlayer,
      additionalPlayers: new Set([]),

      getActivePlayers: () => {
        const { basePlayer, additionalPlayers } = get();

        return new Set([basePlayer, ...additionalPlayers]);
      },

      getKeyboardPlayers: () => {
        const { getActivePlayers } = get();
        return new Set(
          Array.from(getActivePlayers()).filter((player) => player.controls === 'keyboard')
        );
      },

      getUnoccupiedGamepads: () => {
        const { connectedGamepads } = useGamepadStore.getState();
        const occupiedGamepadIndices = new Set(
          Array.from(get().getActivePlayers())
            .filter((player) => player.controls === 'gamepad' && player.gamepadIndex !== undefined)
            .map((player) => player.gamepadIndex)
        );

        return new Set(
          Array.from(connectedGamepads.values()).filter(
            (gamepad) => !occupiedGamepadIndices.has(gamepad.gamepad.index)
          )
        );
      },

      setEnableAdditionalPlayers: (enabled: boolean) => {
        if (!enabled) {
          set({ enableAdditionalPlayers: false, additionalPlayers: new Set() });
          return;
        }

        set({ enableAdditionalPlayers: true });
        get().syncConnectedGamepads();
      },

      setAdditionalPlayers: (players: Set<ActivePlayerState>) => {
        set({
          additionalPlayers: players,
        });
      },

      removeAdditionalPlayer: (playerId: string) => {
        const { additionalPlayers } = get();
        const updatedPlayers = new Set(
          Array.from(additionalPlayers)
            // Remove the player with the specified ID
            .filter((player) => player.id !== playerId)
            // Reassign player names based on their new position in the set
            .map((player, index) => ({
              ...player,
              name: `Player ${index + 2}`,
            }))
        );
        set({
          additionalPlayers: updatedPlayers,
        });
      },

      setBasePlayer: (player: ActivePlayerState) => {
        set({
          basePlayer: player,
        });
      },

      changePlayerControls: (playerId, controls, gamepadIndex) => {
        const { basePlayer, additionalPlayers, getUnoccupiedGamepads, getKeyboardPlayers } = get();

        let resolvedGamepadIndex = gamepadIndex;

        if (controls === 'gamepad') {
          const unoccupiedGamepad = getUnoccupiedGamepads().values().next().value;
          if (!unoccupiedGamepad) return;
          resolvedGamepadIndex = unoccupiedGamepad.gamepad.index;
        }

        if (controls === 'keyboard') {
          const keyboardTakenByAnotherPlayer = Array.from(getKeyboardPlayers()).some(
            (player) => player.id !== playerId
          );
          if (keyboardTakenByAnotherPlayer) return;
          resolvedGamepadIndex = undefined;
        }

        let updatedBasePlayer = basePlayer;
        const updatedAdditionalPlayers = new Set<ActivePlayerState>();

        if (basePlayer.id === playerId) {
          updatedBasePlayer = { ...basePlayer, controls, gamepadIndex: resolvedGamepadIndex };
          additionalPlayers.forEach((player) => updatedAdditionalPlayers.add(player));
        } else {
          updatedBasePlayer = { ...basePlayer };
          additionalPlayers.forEach((player) => {
            if (player.id === playerId) {
              updatedAdditionalPlayers.add({
                ...player,
                controls,
                gamepadIndex: resolvedGamepadIndex,
              });
            } else {
              updatedAdditionalPlayers.add(player);
            }
          });
        }

        set({
          basePlayer: updatedBasePlayer,
          additionalPlayers: updatedAdditionalPlayers,
        });
      },

      syncConnectedGamepads: () => {
        GamepadManager.getInstance().scanForConnectedGamepads();

        for (const gamepad of get().getUnoccupiedGamepads()) {
          if (get().getActivePlayers().size >= MAX_PLAYERS) break;
          registerGamepadPlayer(gamepad);
        }
      },
    }),
    {
      name: 'active-players-store',
    }
  )
);

function registerGamepadPlayer(gamepadInstance: GamepadInstance): void {
  const {
    enableAdditionalPlayers,
    basePlayer,
    additionalPlayers,
    setBasePlayer,
    getActivePlayers,
  } = useActivePlayersStore.getState();

  if (getActivePlayers().size >= MAX_PLAYERS) return;

  if (!enableAdditionalPlayers) {
    // If base player doesn't have gamepad controls, switch them to the new gamepad
    if (basePlayer.controls !== 'gamepad') {
      const updatedBasePlayer = {
        ...basePlayer,
        controls: 'gamepad' as const,
        gamepadIndex: gamepadInstance.gamepad.index,
      };
      setBasePlayer(updatedBasePlayer);
    }
    return;
  }

  const activePlayers = getActivePlayers();

  const newPlayer: ActivePlayerState = {
    id: uuidv4(),
    name: `Player ${activePlayers.size + 1}`,
    controls: 'gamepad',
    gamepadIndex: gamepadInstance.gamepad.index,
  };

  useActivePlayersStore.setState({ additionalPlayers: new Set([...additionalPlayers, newPlayer]) });
}

// Listen for gamepad connections to add new players, or switch base player to gamepad controls
// if enableAdditionalPlayers is false and the base player doesn't already have gamepad controls.
useGamepadStore.getState().gamepadEvents.on('gamepadconnected', ({ gamepad }) => {
  registerGamepadPlayer(gamepad);
});

// Listen for gamepad disconnections to remove players or switch to keyboard controls
// if it's the base player.
useGamepadStore
  .getState()
  .gamepadEvents.on('gamepaddisconnected', ({ gamepad: gamepadInstance }) => {
    const { additionalPlayers, basePlayer, setBasePlayer, removeAdditionalPlayer } =
      useActivePlayersStore.getState();

    // Check if it's the base player's gamepad.
    // If so, just change their controls to keyboard instead of removing them
    if (
      basePlayer.controls === 'gamepad' &&
      basePlayer.gamepadIndex === gamepadInstance.gamepad.index
    ) {
      const updatedBasePlayer = {
        ...basePlayer,
        controls: 'keyboard' as const,
        gamepadIndex: undefined,
      };
      setBasePlayer(updatedBasePlayer);
      return;
    }

    // Otherwise, find and remove the additional player using that gamepad
    const playerToRemove = Array.from(additionalPlayers).find(
      (player) =>
        player.controls === 'gamepad' && player.gamepadIndex === gamepadInstance.gamepad.index
    );
    if (playerToRemove) {
      removeAdditionalPlayer(playerToRemove.id);
    }
  });
