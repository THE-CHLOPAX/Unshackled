import * as THREE from 'three';
import { SceneCamera } from '@tgdf';

import { State } from './classes/states';
import { Entity } from './classes/gameObjects/Entity';
import { Player } from './classes/gameObjects/players/Player';

export enum AnimationClipNamesShared {
  SPAWN = 'spawn',
  IDLE = 'idle',
  WALK = 'walk',
  RUN = 'run',
  SPRINT = 'sprint',
  JUMP = 'jump',
  FALL = 'fall',
  HIT = 'hit',
  STAND_UP = 'stand-up',
}

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

export type { ModelRecord, TextureRecord, AssetRecord } from '@tgdf';

export type AsyncAction = (entity: Entity) => Promise<void>;

export type ActionWithSound = {
  action: AsyncAction;
  soundPath: string;
};

export type AIAttack = ActionWithSound & {
  minRange: number;
  maxRange: number;
};

export type AIRoamingOptions = {
  radius: number;
  interval: {
    min: number;
    max: number;
  };
};

export type AIAttackOptions = {
  actions: AIAttack[];
};

export type SequenceInputType =
  | PlayerActionType.ACTION_UP
  | PlayerActionType.ACTION_RIGHT
  | PlayerActionType.ACTION_DOWN
  | PlayerActionType.ACTION_LEFT;

export type StateConstructor = abstract new (...args: never[]) => State;

export type SequenceSkill = {
  sequence: SequenceInputType[];
  availableIn: StateConstructor[];
  cooldownMs: number;
  getState?: (entity: Player, currentState: State) => State;
  callback?: AsyncAction;
};

export type FocusOptions = {
  clips: { enter: string; progress?: string; exit?: string };
};

export type GameCamera = SceneCamera & {
  addShake: (intensity: number) => void;
  pivotPoint: THREE.Vector3;
};

export enum WorldTileCodes {
  Empty = 0,
  DungeonFloorFlat = 0x773333,
  DungeonFloorFull = 0x552222,
  DungeonWallBrickTall = 0x888888,
  DungeonWallBrickTallCorner = 0xaaaaaa,
  DungeonWallTorch = 0xffaa33,
  DungeonDoor = 0x8a5a2b,
  DungeonPillar = 0x5a5a5a,
  SpawnMarker = 0x00ff00,
  LevelEndMarker = 0xff00ff,
}

export type WorldObjectDefitionBase = {
  code: number;
  label: string;
  offset?: THREE.Vector3;
};

export type InstancedWorldObjectDefinition = WorldObjectDefitionBase & {
  type: 'instanced';
  collider?: boolean;
  worldSized?: boolean;
  getGeometry(): THREE.BufferGeometry;
  getMaterial(): THREE.Material | THREE.Material[];
};

export type EntityWorldObjectDefinition = WorldObjectDefitionBase & {
  type: 'entity';
  object: new () => THREE.Object3D;
};

export type WorldObjectDefinition = InstancedWorldObjectDefinition | EntityWorldObjectDefinition;

export type WorldVec2 = { x: number; z: number };

export type WorldCell = {
  code: number;
  rotation: number;
};

export type WorldOutputData = {
  width: number;
  height: number;
  data: Map<number, WorldCell>;
};

export type WorldChunkBoundary = {
  start: WorldVec2;
  end: WorldVec2;
};

export type LevelRecord = {
  url: string;
};

export type LevelGeneratedData = {
  floorGroup: THREE.Group;
};
