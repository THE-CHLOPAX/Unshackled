import { Emitter } from '@tgdf';

import { BIOMES } from './constants';

export type GameEventsMap = {
  'game-over': undefined;
  'level-complete': undefined;
  'player-damage-taken': { playerProfileId: string };
};

export type WorldCell = {
  code: number;
  rotation: number;
};

export type WorldOutputData = {
  version: 2;
  width: number;
  height: number;
  layers: Map<number, WorldCell>[];
};

export type GameEventsEmitter = Emitter<GameEventsMap>;

export type BiomeId = (typeof BIOMES)[number];

export type PlayerProfile = {
  id: string;
  name: string;
  currentHealthPoints: number;
  maxHealthPoints: number;
  currentShortTermStamina: number;
  currentLongTermStamina: number;
  maxShortTermStamina: number;
  maxLongTermStamina: number;
};

export type PlayerStatistics = Omit<PlayerProfile, 'id'>;

export type LevelIdentifier = {
  id: string;
  mapUrl: string;
};

export type BiomeIdentifier = {
  id: BiomeId;
  levelCount: number;
  levels: LevelIdentifier[];
  bossLevels: LevelIdentifier[];
};

export type RunProgress = {
  biomeId: BiomeId;
  levelIndex: number;
};

export type CampaignIdentifier = BiomeIdentifier[];

export type RunIdentifier = {
  version: 1;
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  progress: RunProgress;
  completedLevelIds: string[];
  players: PlayerProfile[];
};
