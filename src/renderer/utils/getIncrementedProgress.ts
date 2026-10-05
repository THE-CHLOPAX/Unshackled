import { CAMPAIGN } from 'renderer/constants';
import { RunIdentifier, RunProgress } from 'renderer/types';

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

export function getIncrementedProgress(
  run: RunIdentifier,
  completedLevelId: string
): RunIdentifier {
  const completedLevelIds = run.completedLevelIds.includes(completedLevelId)
    ? run.completedLevelIds
    : [...run.completedLevelIds, completedLevelId];

  return { ...run, progress: getNextProgress(run.progress), completedLevelIds };
}
