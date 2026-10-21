import type * as THREE from 'three';
import type { GameScene } from '3D/classes/scenes/GameScene/GameScene';

import { Emitter } from '@tgdf';

import { BIOMES } from 'renderer/constants';

export type GameEventsMap = {
  'game-over': undefined;
  'level-complete': undefined;
  'player-damage-taken': { playerProfileId: string };
};

export enum PlayerActionType {
  IDLE = 'idle',
  RUN = 'run',
  SPRINT = 'sprint',
  ACTION_UP = 'action-up',
  ACTION_DOWN = 'action-down',
  ACTION_LEFT = 'action-left',
  ACTION_RIGHT = 'action-right',
  ACTION_FOCUS = 'action-focus',
}

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

export enum WorldTileCodes {
  // Dungeon
  DungeonFloorFlat = 0x773333,
  DungeonFloorFull = 0x552222,
  DungeonFloorFullElevated = 0x663333,
  DungeonWallBrickTall = 0x888888,
  DungeonWallBrickTallCorner = 0xaaaaaa,
  DungeonWallBrickDoorFrame = 0xccc,
  DungeonWallTorch = 0xffaa33,
  DungeonDoor = 0x8a5a2b,
  DungeonPillar = 0x5a5a5a,
  DungeonPillarCorner = 0x6b6b6b,
  // Shared
  Empty = 0,
  SpawnMarker = 0x00ff00,
  LevelEndMarker = 0xff00ff,
  Flame = 0xff0000,
  SkeletonSpawner = 0x00ffff,
}

export type WorldObjectArgs = { cell?: WorldCell };

export type WorldObjectDefitionBase = {
  code: number;
  label: string;
  offset?: THREE.Vector3;
  collider?: boolean;
  disableModelScaling?: boolean;
};

export type InstancedWorldObjectDefinition = WorldObjectDefitionBase & {
  type: 'instanced';
  getGeometry(): THREE.BufferGeometry;
  getMaterial(): THREE.Material | THREE.Material[];
};

export type EntityWorldObjectDefinition = WorldObjectDefitionBase & {
  type: 'entity';
  object: new (scene: GameScene, args: WorldObjectArgs) => THREE.Object3D;
};

export type WorldVec2 = { x: number; z: number };

export type WorldChunkBoundary = {
  start: WorldVec2;
  end: WorldVec2;
};

export type LevelGeneratedData = {
  floorGroup: THREE.Group;
};

export type WorldObjectDefinition = InstancedWorldObjectDefinition | EntityWorldObjectDefinition;

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
