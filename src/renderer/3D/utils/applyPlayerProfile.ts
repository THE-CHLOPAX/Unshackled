import { PlayerProfile } from 'renderer/types';

import { Player } from '../classes/gameObjects/players/Player';

export function applyPlayerProfile(player: Player, playerProfile: PlayerProfile): void {
  player.healthPointsController.setHealthPoints(playerProfile.currentHealthPoints);
}
