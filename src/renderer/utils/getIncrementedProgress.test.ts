import { describe, it, expect, vi } from 'vitest';

import { RunIdentifier, RunProgress } from 'renderer/types';

import { getIncrementedProgress } from './getIncrementedProgress';

vi.mock('renderer/constants', () => ({
  CAMPAIGN: [
    { id: 'dungeon', levelCount: 2, levels: [], bossLevels: [{ id: 'boss', mapUrl: 'boss.json' }] },
    { id: 'caves', levelCount: 2, levels: [], bossLevels: [] },
    { id: 'crypt', levelCount: 1, levels: [], bossLevels: [{ id: 'boss', mapUrl: 'boss.json' }] },
  ],
}));

function createRun(progress: RunProgress): RunIdentifier {
  return {
    version: 1,
    id: 'run',
    name: 'Run',
    createdAt: 0,
    updatedAt: 0,
    progress,
    completedLevelIds: [],
    players: [],
  };
}

function increment(biomeId: string, levelIndex: number): RunProgress {
  return getIncrementedProgress(createRun({ biomeId, levelIndex } as RunProgress), 'level')
    .progress;
}

describe('getIncrementedProgress', () => {
  it('advances to the next regular level within the biome', () => {
    expect(increment('dungeon', 0)).toEqual({ biomeId: 'dungeon', levelIndex: 1 });
  });

  it('advances to the boss level after the last regular level', () => {
    expect(increment('dungeon', 1)).toEqual({ biomeId: 'dungeon', levelIndex: 2 });
  });

  it('switches to the next biome after the boss level', () => {
    expect(increment('dungeon', 2)).toEqual({ biomeId: 'caves', levelIndex: 0 });
  });

  it('skips the boss level when the biome has no boss levels', () => {
    expect(increment('caves', 1)).toEqual({ biomeId: 'crypt', levelIndex: 0 });
  });

  it('keeps progress unchanged after the boss level of the last biome', () => {
    expect(increment('crypt', 1)).toEqual({ biomeId: 'crypt', levelIndex: 1 });
  });

  it('adds the completed level id to completedLevelIds', () => {
    const run = createRun({ biomeId: 'dungeon', levelIndex: 0 } as RunProgress);

    expect(getIncrementedProgress(run, 'intro').completedLevelIds).toEqual(['intro']);
  });

  it('does not duplicate an already completed level id', () => {
    const run = {
      ...createRun({ biomeId: 'dungeon', levelIndex: 0 } as RunProgress),
      completedLevelIds: ['intro'],
    };

    expect(getIncrementedProgress(run, 'intro').completedLevelIds).toEqual(['intro']);
  });
});
