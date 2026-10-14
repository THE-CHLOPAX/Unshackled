import type { Player } from '3D/classes/gameObjects/players/Player';

import { CAMPAIGN } from 'renderer/constants';
import { PlayerProfile, RunIdentifier, RunProgress } from 'renderer/types';

function getNextProgress({ biomeId, levelIndex }: RunProgress): RunProgress {
  const biomeIndex = CAMPAIGN.findIndex((biome) => biome.id === biomeId);
  const { levelCount, bossLevels } = CAMPAIGN[biomeIndex];
  const lastLevelIndex = bossLevels.length > 0 ? levelCount : levelCount - 1;
  const nextLevelIndex = levelIndex + 1;

  if (nextLevelIndex <= lastLevelIndex) {
    return { biomeId, levelIndex: nextLevelIndex };
  }

  const nextBiome = CAMPAIGN[biomeIndex + 1];

  if (!nextBiome) {
    return { biomeId, levelIndex };
  }

  return { biomeId: nextBiome.id, levelIndex: 0 };
}

function getUpdatedPlayerProfiles(
  players: readonly Player[],
  currentRun: RunIdentifier
): PlayerProfile[] {
  const updated = (profile: PlayerProfile, player: Player) => {
    return {
      ...profile,
      currentHealthPoints: player.healthPointsController.healthPoints,
      maxHealthPoints: player.healthPointsController.maxHealthPoints,
      currentShortTermStamina: player.staminaPointsController.shortTermStamina,
      maxShortTermStamina: player.staminaPointsController.maxShortTermStamina,
      currentLongTermStamina: player.staminaPointsController.longTermStamina,
      maxLongTermStamina: player.staminaPointsController.maxLongTermStamina,
    } satisfies PlayerProfile;
  };

  return currentRun.players.map((profile) => {
    const p = players.find((p) => p.playerProfileId === profile.id);
    return p ? updated(profile, p) : profile;
  });
}

export function getUpdatedRun(
  run: RunIdentifier,
  completedLevelId: string,
  players: readonly Player[]
): RunIdentifier {
  const completedLevelIds = run.completedLevelIds.includes(completedLevelId)
    ? run.completedLevelIds
    : [...run.completedLevelIds, completedLevelId];

  const playerProfiles = getUpdatedPlayerProfiles(players, run);

  return {
    ...run,
    progress: getNextProgress(run.progress),
    completedLevelIds,
    players: playerProfiles,
  };
}
