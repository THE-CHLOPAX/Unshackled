import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

type FakeGamepadOverrides = {
  index: number;
};

// GamepadManager is transitively pulled in through the `@tgdf` barrel, so we
// mock only the leaf GamepadInstance class (real GamepadManager singleton is
// used as-is) - same approach as GamepadManager.test.ts / PlayerInput.test.ts.
const { MockGamepadInstance } = vi.hoisted(() => {
  class MockGamepadInstance {
    public gamepad: { index: number };
    public destroy = vi.fn();

    constructor(gamepad: FakeGamepadOverrides) {
      this.gamepad = gamepad;
    }
  }
  return { MockGamepadInstance };
});

vi.mock('../../lib/internal-input/Gamepad/GamepadInstance', () => ({
  GamepadInstance: MockGamepadInstance,
}));

import { GamepadManager, useGamepadStore } from '@tgdf';

import { ActivePlayerState, MAX_PLAYERS, useActivePlayersStore } from './useActivePlayersStore';

function dispatchGamepadEvent(
  type: 'gamepadconnected' | 'gamepaddisconnected',
  index: number
): void {
  const gamepad = { index } as unknown as Gamepad;
  window.dispatchEvent(Object.assign(new Event(type), { gamepad }));
}

function connectGamepad(index: number): void {
  dispatchGamepadEvent('gamepadconnected', index);
}

function disconnectGamepad(index: number): void {
  dispatchGamepadEvent('gamepaddisconnected', index);
}

const initialBasePlayer: ActivePlayerState = {
  id: 'base-player-id',
  name: 'Player 1',
  controls: 'keyboard',
};

function resetStore(): void {
  useActivePlayersStore.setState({
    enableAdditionalPlayers: false,
    basePlayer: { ...initialBasePlayer },
    additionalPlayers: new Set(),
  });
}

describe('useActivePlayersStore', () => {
  const manager = GamepadManager.getInstance();

  beforeEach(() => {
    resetStore();

    // Leave every test with a clean slate regardless of run order.
    const staleIndices = [...manager.getConnectedGamepads().keys()];
    for (const index of staleIndices) {
      disconnectGamepad(index);
    }
    useGamepadStore.getState().setConnectedGamepads(new Map());
  });

  describe('when enableAdditionalPlayers is off', () => {
    it('never registers new (additional) players, regardless of how many gamepads connect', () => {
      connectGamepad(0);
      connectGamepad(1);
      connectGamepad(2);

      const { getActivePlayers, additionalPlayers } = useActivePlayersStore.getState();
      expect(additionalPlayers.size).toBe(0);
      expect(getActivePlayers().size).toBe(1);
    });

    it('still switches the base player onto the first connected gamepad', () => {
      connectGamepad(0);

      const { basePlayer } = useActivePlayersStore.getState();
      expect(basePlayer.controls).toBe('gamepad');
      expect(basePlayer.gamepadIndex).toBe(0);
    });

    it('still unregisters (reverts the base player to keyboard) on gamepad disconnection', () => {
      connectGamepad(0);
      expect(useActivePlayersStore.getState().basePlayer.controls).toBe('gamepad');

      disconnectGamepad(0);

      const { basePlayer } = useActivePlayersStore.getState();
      expect(basePlayer.controls).toBe('keyboard');
      expect(basePlayer.gamepadIndex).toBeUndefined();
    });
  });

  describe('changePlayerControls: keyboard -> gamepad', () => {
    it('refuses the switch when no gamepad is connected', () => {
      useActivePlayersStore.getState().changePlayerControls(initialBasePlayer.id, 'gamepad');

      expect(useActivePlayersStore.getState().basePlayer.controls).toBe('keyboard');
    });

    it('refuses the switch when every connected gamepad is already occupied', () => {
      useGamepadStore
        .getState()
        .setConnectedGamepads(new Map([[0, new MockGamepadInstance({ index: 0 }) as never]]));
      useActivePlayersStore.setState({
        enableAdditionalPlayers: true,
        additionalPlayers: new Set([
          { id: 'p2', name: 'Player 2', controls: 'gamepad', gamepadIndex: 0 },
        ]),
      });

      useActivePlayersStore.getState().changePlayerControls(initialBasePlayer.id, 'gamepad');

      expect(useActivePlayersStore.getState().basePlayer.controls).toBe('keyboard');
    });

    it('allows the switch and assigns the unoccupied gamepad index when one is available', () => {
      useGamepadStore
        .getState()
        .setConnectedGamepads(new Map([[3, new MockGamepadInstance({ index: 3 }) as never]]));

      useActivePlayersStore.getState().changePlayerControls(initialBasePlayer.id, 'gamepad');

      const { basePlayer } = useActivePlayersStore.getState();
      expect(basePlayer.controls).toBe('gamepad');
      expect(basePlayer.gamepadIndex).toBe(3);
    });
  });

  describe('changePlayerControls: gamepad -> keyboard', () => {
    it('refuses the switch when another active player already has keyboard controls', () => {
      useActivePlayersStore.setState({
        enableAdditionalPlayers: true,
        additionalPlayers: new Set([
          { id: 'p2', name: 'Player 2', controls: 'gamepad', gamepadIndex: 0 },
        ]),
      });

      useActivePlayersStore.getState().changePlayerControls('p2', 'keyboard');

      const player = Array.from(useActivePlayersStore.getState().additionalPlayers).find(
        (p) => p.id === 'p2'
      );
      expect(player?.controls).toBe('gamepad');
    });

    it('allows the switch once keyboard is free', () => {
      useActivePlayersStore.setState({
        enableAdditionalPlayers: true,
        basePlayer: {
          id: 'base-player-id',
          name: 'Player 1',
          controls: 'gamepad',
          gamepadIndex: 1,
        },
        additionalPlayers: new Set([
          { id: 'p2', name: 'Player 2', controls: 'gamepad', gamepadIndex: 0 },
        ]),
      });

      useActivePlayersStore.getState().changePlayerControls('p2', 'keyboard');

      const player = Array.from(useActivePlayersStore.getState().additionalPlayers).find(
        (p) => p.id === 'p2'
      );
      expect(player?.controls).toBe('keyboard');
      expect(player?.gamepadIndex).toBeUndefined();
    });
  });

  describe('gamepadconnected window event', () => {
    beforeEach(() => {
      useActivePlayersStore.setState({ enableAdditionalPlayers: true });
    });

    it('registers a new additional player for each connected gamepad', () => {
      connectGamepad(0);
      connectGamepad(1);

      const { additionalPlayers, getActivePlayers } = useActivePlayersStore.getState();
      expect(getActivePlayers().size).toBe(3);
      expect(
        Array.from(additionalPlayers).map((p) => ({
          controls: p.controls,
          gamepadIndex: p.gamepadIndex,
        }))
      ).toEqual(
        expect.arrayContaining([
          { controls: 'gamepad', gamepadIndex: 0 },
          { controls: 'gamepad', gamepadIndex: 1 },
        ])
      );
    });

    it('does not register more than MAX_PLAYERS active players in total', () => {
      connectGamepad(0);
      connectGamepad(1);
      connectGamepad(2);
      connectGamepad(3);
      connectGamepad(4);

      expect(useActivePlayersStore.getState().getActivePlayers().size).toBe(MAX_PLAYERS);
    });
  });

  describe('gamepaddisconnected window event', () => {
    it('removes the additional player using that gamepad', () => {
      useActivePlayersStore.setState({ enableAdditionalPlayers: true });
      connectGamepad(0);
      connectGamepad(1);
      expect(useActivePlayersStore.getState().getActivePlayers().size).toBe(3);

      disconnectGamepad(0);

      const { additionalPlayers, getActivePlayers } = useActivePlayersStore.getState();
      expect(getActivePlayers().size).toBe(2);
      expect(Array.from(additionalPlayers).some((p) => p.gamepadIndex === 0)).toBe(false);
      expect(Array.from(additionalPlayers).some((p) => p.gamepadIndex === 1)).toBe(true);
    });

    it('reverts the base player to keyboard when their gamepad disconnects', () => {
      connectGamepad(0);
      expect(useActivePlayersStore.getState().basePlayer.controls).toBe('gamepad');

      disconnectGamepad(0);

      const { basePlayer } = useActivePlayersStore.getState();
      expect(basePlayer.controls).toBe('keyboard');
      expect(basePlayer.gamepadIndex).toBeUndefined();
    });

    it('leaves other active players untouched when an unrelated gamepad disconnects', () => {
      useActivePlayersStore.setState({ enableAdditionalPlayers: true });
      connectGamepad(0);
      connectGamepad(1);

      disconnectGamepad(1);

      const { additionalPlayers } = useActivePlayersStore.getState();
      expect(Array.from(additionalPlayers).some((p) => p.gamepadIndex === 0)).toBe(true);
    });
  });

  describe('setEnableAdditionalPlayers(true)', () => {
    it('looks for already-connected gamepads and registers a player for each unclaimed one', () => {
      // Both connect while additional players are still off: the first
      // claims the base player, the second is left connected-but-unclaimed.
      connectGamepad(0);
      connectGamepad(1);
      expect(useActivePlayersStore.getState().getActivePlayers().size).toBe(1);

      useActivePlayersStore.getState().setEnableAdditionalPlayers(true);

      const { basePlayer, additionalPlayers, getActivePlayers } = useActivePlayersStore.getState();
      expect(getActivePlayers().size).toBe(2);
      expect(basePlayer.gamepadIndex).toBe(0);
      expect(
        Array.from(additionalPlayers).some((p) => p.controls === 'gamepad' && p.gamepadIndex === 1)
      ).toBe(true);
    });

    it('does nothing when no gamepads are connected', () => {
      useActivePlayersStore.getState().setEnableAdditionalPlayers(true);

      expect(useActivePlayersStore.getState().getActivePlayers().size).toBe(1);
    });

    it('re-adds players for gamepads still connected after being disabled', () => {
      useActivePlayersStore.getState().setEnableAdditionalPlayers(true);
      connectGamepad(0);
      connectGamepad(1);
      useActivePlayersStore.getState().setEnableAdditionalPlayers(false);

      useActivePlayersStore.getState().setEnableAdditionalPlayers(true);

      const { additionalPlayers } = useActivePlayersStore.getState();
      expect(Array.from(additionalPlayers).map((p) => p.gamepadIndex)).toEqual(
        expect.arrayContaining([0, 1])
      );
      expect(additionalPlayers.size).toBe(2);
    });
  });

  describe('setEnableAdditionalPlayers(false)', () => {
    it('removes all additional players and keeps the base player', () => {
      useActivePlayersStore.getState().setEnableAdditionalPlayers(true);
      connectGamepad(0);
      connectGamepad(1);
      expect(useActivePlayersStore.getState().additionalPlayers.size).toBe(2);

      useActivePlayersStore.getState().setEnableAdditionalPlayers(false);

      const { enableAdditionalPlayers, basePlayer, additionalPlayers } =
        useActivePlayersStore.getState();
      expect(enableAdditionalPlayers).toBe(false);
      expect(additionalPlayers.size).toBe(0);
      expect(basePlayer.id).toBe(initialBasePlayer.id);
    });
  });
});
