import { describe, it, expect, vi } from 'vitest';

import { pickRandomLevel } from './pickRandomLevel';

vi.mock('renderer/constants', () => ({
  CAMPAIGN: [
    {
      id: 'dungeon',
      levelCount: 2,
      levels: [
        { id: 'a', mapUrl: 'a.json' },
        { id: 'b', mapUrl: 'b.json' },
      ],
      bossLevels: [{ id: 'boss', mapUrl: 'boss.json' }],
    },
  ],
}));

describe('pickRandomLevel', () => {
  it('picks a regular level variant before the boss', () => {
    expect(pickRandomLevel({ biomeId: 'dungeon', levelIndex: 0 }, () => 0).id).toBe('a');
    expect(pickRandomLevel({ biomeId: 'dungeon', levelIndex: 1 }, () => 0.9999).id).toBe('b');
  });

  it('picks a boss level variant once all regular levels are done', () => {
    expect(pickRandomLevel({ biomeId: 'dungeon', levelIndex: 2 }).id).toBe('boss');
  });

  it('throws for an unknown biome', () => {
    expect(() => pickRandomLevel({ biomeId: 'unknown' as 'dungeon', levelIndex: 0 })).toThrow(
      'Unknown biome: unknown'
    );
  });
});
