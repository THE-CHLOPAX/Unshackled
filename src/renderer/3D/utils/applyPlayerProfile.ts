import { PlayerProfile } from 'renderer/types';

import { Player } from '../classes/gameObjects/players/Player';

export function applyPlayerProfile(player: Player, playerProfile: PlayerProfile): void {
  player.name = playerProfile.name;
  player.healthPointsController.setMaxHealthPoints(playerProfile.maxHealthPoints);
  player.healthPointsController.setHealthPoints(playerProfile.currentHealthPoints);
  player.staminaPointsController.setMaxShortTermStamina(playerProfile.maxShortTermStamina);
  player.staminaPointsController.setMaxLongTermStamina(playerProfile.maxLongTermStamina);
  player.staminaPointsController.setShortTermStamina(playerProfile.currentShortTermStamina);
  player.staminaPointsController.setLongTermStamina(playerProfile.currentLongTermStamina);
}
