import { PlayerProfile } from 'renderer/types';
import { playerConfig } from '3D/classes/gameObjects/Player/config';

export function createNewPlayerProfile(id: string, name: string): PlayerProfile {
  const { maxHealthPoints } = playerConfig.healthOptions;
  const { maxShortTermStamina, maxLongTermStamina } = playerConfig.staminaOptions;

  return {
    id,
    name,
    currentHealthPoints: maxHealthPoints,
    maxHealthPoints,
    currentShortTermStamina: maxShortTermStamina,
    maxShortTermStamina,
    currentLongTermStamina: maxLongTermStamina,
    maxLongTermStamina,
  };
}
