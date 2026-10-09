import { describe, it, expect, beforeEach } from 'vitest';

import { PlayerProfile, RunIdentifier } from 'renderer/types';

import { useRunStore } from './useRunStore';

function createProfile(id: string): PlayerProfile {
  return { id, name: id, class: 'monk', currentHealthPoints: 100 };
}

function createRun(players: PlayerProfile[]): RunIdentifier {
  return {
    version: 1,
    id: 'run',
    name: 'Run',
    createdAt: 0,
    updatedAt: 0,
    progress: { biomeId: 'dungeon', levelIndex: 0 },
    completedLevelIds: [],
    players,
  };
}

describe('useRunStore', () => {
  beforeEach(() => {
    useRunStore.setState({ currentRun: null });
  });

  describe('updatePlayerProfile', () => {
    it('merges changes into the matching profile only', () => {
      useRunStore.getState().setCurrentRun(createRun([createProfile('a'), createProfile('b')]));

      useRunStore.getState().updatePlayerProfile('a', { currentHealthPoints: 42, name: 'Renamed' });

      const players = useRunStore.getState().currentRun?.players;
      expect(players?.[0]).toEqual({
        ...createProfile('a'),
        currentHealthPoints: 42,
        name: 'Renamed',
      });
      expect(players?.[1]).toEqual(createProfile('b'));
    });

    it('does nothing when there is no current run', () => {
      useRunStore.getState().updatePlayerProfile('a', { currentHealthPoints: 42 });

      expect(useRunStore.getState().currentRun).toBeNull();
    });

    it('keeps the same run reference when the profile does not exist', () => {
      const run = createRun([createProfile('a')]);
      useRunStore.getState().setCurrentRun(run);

      useRunStore.getState().updatePlayerProfile('missing', { currentHealthPoints: 42 });

      expect(useRunStore.getState().currentRun).toBe(run);
    });
  });
});
