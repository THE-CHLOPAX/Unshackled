import { PlayerProfile } from 'renderer/types';
import { ActivePlayerState } from 'Store/useActivePlayersStore';

export type ActivePlayerWithProfile = {
  activePlayer: ActivePlayerState;
  playerProfile: PlayerProfile;
};

export function assignPlayerProfiles(
  activePlayers: ActivePlayerState[],
  playerProfiles: PlayerProfile[]
): ActivePlayerWithProfile[] {
  return activePlayers
    .slice(0, playerProfiles.length)
    .map((activePlayer, index) => ({ activePlayer, playerProfile: playerProfiles[index] }));
}
