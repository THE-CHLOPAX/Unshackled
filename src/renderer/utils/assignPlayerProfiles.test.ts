import { describe, it, expect, vi } from 'vitest';

import { ActivePlayerState } from 'Store/useActivePlayersStore';
import { createProfile } from 'renderer/utils/test/createProfile';

vi.mock('Store/useActivePlayersStore', () => ({}));

import { assignPlayerProfiles } from 'renderer/utils/assignPlayerProfiles';

function createActivePlayer(id: string): ActivePlayerState {
  return { id, name: id, controls: 'keyboard' };
}

describe('assignPlayerProfiles', () => {
  it('pairs active players with profiles by index', () => {
    const activePlayers = [createActivePlayer('p1'), createActivePlayer('p2')];
    const profiles = [createProfile({ id: 'a' }), createProfile({ id: 'b' })];

    expect(assignPlayerProfiles(activePlayers, profiles)).toEqual([
      { activePlayer: activePlayers[0], playerProfile: profiles[0] },
      { activePlayer: activePlayers[1], playerProfile: profiles[1] },
    ]);
  });

  it('skips active players without a profile', () => {
    const activePlayers = [createActivePlayer('p1'), createActivePlayer('p2')];

    expect(assignPlayerProfiles(activePlayers, [createProfile({ id: 'a' })])).toHaveLength(1);
  });

  it('skips profiles without an active player', () => {
    const profiles = [createProfile({ id: 'a' }), createProfile({ id: 'b' })];

    expect(assignPlayerProfiles([createActivePlayer('p1')], profiles)).toEqual([
      { activePlayer: expect.objectContaining({ id: 'p1' }), playerProfile: profiles[0] },
    ]);
  });

  it('returns an empty list when there is no run', () => {
    expect(assignPlayerProfiles([createActivePlayer('p1')], [])).toEqual([]);
  });
});
