import type { Player } from '3D/classes/gameObjects/Player/Player';

import { describe, it, expect, vi } from 'vitest';

import { getUpdatedRun } from 'renderer/utils/getUpdatedRun';
import { createProfile } from 'renderer/utils/test/createProfile';
import { PlayerProfile, RunIdentifier, RunProgress } from 'renderer/types';

vi.mock('renderer/constants', () => ({
  CAMPAIGN: [
    { id: 'dungeon', levelCount: 2, levels: [], bossLevels: [{ id: 'boss', mapUrl: 'boss.json' }] },
    { id: 'caves', levelCount: 2, levels: [], bossLevels: [] },
    { id: 'crypt', levelCount: 1, levels: [], bossLevels: [{ id: 'boss', mapUrl: 'boss.json' }] },
  ],
}));

type LiveStats = {
  healthPoints: number;
  maxHealthPoints: number;
  shortTermStamina: number;
  maxShortTermStamina: number;
  longTermStamina: number;
  maxLongTermStamina: number;
};

const LIVE_STATS: LiveStats = {
  healthPoints: 40,
  maxHealthPoints: 120,
  shortTermStamina: 30,
  maxShortTermStamina: 110,
  longTermStamina: 250,
  maxLongTermStamina: 320,
};

function createRun(overrides: Partial<RunIdentifier> = {}): RunIdentifier {
  return {
    version: 1,
    id: 'run',
    name: 'Run',
    createdAt: 0,
    updatedAt: 0,
    progress: { biomeId: 'dungeon', levelIndex: 0 },
    completedLevelIds: [],
    players: [],
    ...overrides,
  };
}

function createPlayer(playerProfileId: string, stats: Partial<LiveStats> = {}): Player {
  const {
    healthPoints,
    maxHealthPoints,
    shortTermStamina,
    maxShortTermStamina,
    longTermStamina,
    maxLongTermStamina,
  } = { ...LIVE_STATS, ...stats };

  return {
    playerProfileId,
    healthPointsController: { healthPoints, maxHealthPoints },
    staminaPointsController: {
      shortTermStamina,
      maxShortTermStamina,
      longTermStamina,
      maxLongTermStamina,
    },
  } as unknown as Player;
}

function getProgressAfter(biomeId: string, levelIndex: number): RunProgress {
  const run = createRun({ progress: { biomeId, levelIndex } as RunProgress });
  return getUpdatedRun(run, 'level', []).progress;
}

function getProfile(run: RunIdentifier, id: string): PlayerProfile | undefined {
  return run.players.find((profile) => profile.id === id);
}

describe('getUpdatedRun', () => {
  describe('progress', () => {
    it('advances to the next regular level within the biome', () => {
      expect(getProgressAfter('dungeon', 0)).toEqual({ biomeId: 'dungeon', levelIndex: 1 });
    });

    it('advances to the boss level after the last regular level', () => {
      expect(getProgressAfter('dungeon', 1)).toEqual({ biomeId: 'dungeon', levelIndex: 2 });
    });

    it('switches to the next biome after the boss level', () => {
      expect(getProgressAfter('dungeon', 2)).toEqual({ biomeId: 'caves', levelIndex: 0 });
    });

    it('skips the boss level when the biome has no boss levels', () => {
      expect(getProgressAfter('caves', 1)).toEqual({ biomeId: 'crypt', levelIndex: 0 });
    });

    it('keeps progress unchanged after the boss level of the last biome', () => {
      expect(getProgressAfter('crypt', 1)).toEqual({ biomeId: 'crypt', levelIndex: 1 });
    });
  });

  describe('completed levels', () => {
    it('adds the completed level id to completedLevelIds', () => {
      expect(getUpdatedRun(createRun(), 'intro', []).completedLevelIds).toEqual(['intro']);
    });

    it('does not duplicate an already completed level id', () => {
      const run = createRun({ completedLevelIds: ['intro'] });

      expect(getUpdatedRun(run, 'intro', []).completedLevelIds).toEqual(['intro']);
    });
  });

  describe('player profiles', () => {
    it('saves the live health and stamina of each player into their profile', () => {
      const run = createRun({ players: [createProfile({ id: 'a' })] });

      const updatedRun = getUpdatedRun(run, 'level', [createPlayer('a')]);

      expect(getProfile(updatedRun, 'a')).toMatchObject({
        currentHealthPoints: LIVE_STATS.healthPoints,
        maxHealthPoints: LIVE_STATS.maxHealthPoints,
        currentShortTermStamina: LIVE_STATS.shortTermStamina,
        maxShortTermStamina: LIVE_STATS.maxShortTermStamina,
        currentLongTermStamina: LIVE_STATS.longTermStamina,
        maxLongTermStamina: LIVE_STATS.maxLongTermStamina,
      });
    });

    it('keeps the profile identity fields', () => {
      const profile = createProfile({ id: 'a', name: 'Brother Ansel' });
      const run = createRun({ players: [profile] });

      const updatedRun = getUpdatedRun(run, 'level', [createPlayer('a')]);

      expect(getProfile(updatedRun, 'a')).toMatchObject({
        id: 'a',
        name: 'Brother Ansel',
      });
    });

    it('updates each profile from its own player', () => {
      const run = createRun({ players: [createProfile({ id: 'a' }), createProfile({ id: 'b' })] });

      const updatedRun = getUpdatedRun(run, 'level', [
        createPlayer('a', { healthPoints: 10 }),
        createPlayer('b', { healthPoints: 90 }),
      ]);

      expect(getProfile(updatedRun, 'a')?.currentHealthPoints).toBe(10);
      expect(getProfile(updatedRun, 'b')?.currentHealthPoints).toBe(90);
    });

    it('keeps profiles without a live player unchanged', () => {
      const benchedProfile = createProfile({ id: 'b' });
      const run = createRun({ players: [createProfile({ id: 'a' }), benchedProfile] });

      const updatedRun = getUpdatedRun(run, 'level', [createPlayer('a')]);

      expect(updatedRun.players).toHaveLength(2);
      expect(getProfile(updatedRun, 'b')).toBe(benchedProfile);
    });

    it('keeps the original profile order regardless of player order', () => {
      const run = createRun({
        players: [
          createProfile({ id: 'a' }),
          createProfile({ id: 'b' }),
          createProfile({ id: 'c' }),
        ],
      });

      const updatedRun = getUpdatedRun(run, 'level', [createPlayer('c'), createPlayer('a')]);

      expect(updatedRun.players.map(({ id }) => id)).toEqual(['a', 'b', 'c']);
    });

    it('ignores players whose profile is not in the run', () => {
      const run = createRun({ players: [createProfile({ id: 'a' })] });

      const updatedRun = getUpdatedRun(run, 'level', [createPlayer('unknown')]);

      expect(updatedRun.players).toEqual(run.players);
    });

    it('does not mutate the original run', () => {
      const profile = createProfile({ id: 'a' });
      const run = createRun({ players: [profile] });
      const profileBefore = { ...profile };

      getUpdatedRun(run, 'level', [createPlayer('a')]);

      expect(run.players[0]).toBe(profile);
      expect(profile).toEqual(profileBefore);
      expect(run.progress).toEqual({ biomeId: 'dungeon', levelIndex: 0 });
      expect(run.completedLevelIds).toEqual([]);
    });
  });
});
