import { CAMPAIGN } from 'renderer/constants';
import { RunIdentifier } from 'renderer/types';

export function getIncrementedProgress(run: RunIdentifier): RunIdentifier {
  const { biomeId, levelIndex } = run.progress;
  const biomeIndex = CAMPAIGN.findIndex((biome) => biome.id === biomeId);
  const nextLevelIndex = levelIndex + 1;

  if (nextLevelIndex < CAMPAIGN[biomeIndex].levelCount) {
    return { ...run, progress: { biomeId, levelIndex: nextLevelIndex } };
  }

  const nextBiome = CAMPAIGN[biomeIndex + 1];

  if (!nextBiome) {
    return run;
  }

  return { ...run, progress: { biomeId: nextBiome.id, levelIndex: 0 } };
}
