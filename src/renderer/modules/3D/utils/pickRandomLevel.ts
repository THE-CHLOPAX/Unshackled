import { CAMPAIGN } from 'renderer/constants';
import { LevelIdentifier, RunProgress } from 'renderer/types';

export function pickRandomLevel(
  { biomeId, levelIndex }: RunProgress,
  random: () => number = Math.random
): LevelIdentifier {
  const biome = CAMPAIGN.find(({ id }) => id === biomeId);

  if (!biome) {
    throw new Error(`Unknown biome: ${biomeId}`);
  }

  const isBossLevel = levelIndex >= biome.levelCount;
  const variants = isBossLevel ? biome.bossLevels : biome.levels;

  if (variants.length === 0) {
    throw new Error(
      `No ${isBossLevel ? 'boss ' : ''}level variants available for biome: ${biomeId}`
    );
  }

  return variants[Math.floor(random() * variants.length)];
}
