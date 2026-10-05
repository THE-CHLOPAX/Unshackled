import { Emitter } from '@tgdf';

import { PLAYER_CLASSES, BIOMES } from './constants';

export type GameEventsMap = {
  'game-over': undefined;
  'level-complete': undefined;
  'player-damage-taken': undefined;
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

export type PlayerClassId = (typeof PLAYER_CLASSES)[number];

export type BiomeId = (typeof BIOMES)[number];

export type PlayerProfile = {
  id: string;
  name: string;
  class: PlayerClassId;
};

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
