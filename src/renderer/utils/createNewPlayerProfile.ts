import { PlayerClassId, PlayerProfile } from 'renderer/types';
import { PLAYER_CLASS_CONFIGS } from '3D/classes/gameObjects/players/playerClassConfigs';

export function createNewPlayerProfile(
  id: string,
  name: string,
  classId: PlayerClassId
): PlayerProfile {
  const { maxHealthPoints } = PLAYER_CLASS_CONFIGS[classId].healthOptions;

  return {
    id,
    name,
    class: classId,
    currentHealthPoints: maxHealthPoints,
    maxHealthPoints,
  };
}
