import * as THREE from 'three';
import { InputState, Scene, SceneCamera } from '@tgdf';

import { State } from './classes/states';
import { Entity } from './classes/gameObjects/Entity';

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
  soundPath?: string;
  freezeDurationMs?: number;
};

export type AIAttackAction = ActionWithSound & {
  minRange: number;
  maxRange: number;
};

export type ChainedAction = ActionWithSound & {
  chain?: {
    next: ChainedAction;
    requiredInput: PlayerActionType;
    windowDelayMs: number;
    windowDurationMs: number;
  };
};

export type AIRoamingOptions = {
  radius: number;
  interval: {
    min: number;
    max: number;
  };
};

export type AIAttackOptions = {
  actions: AIAttackAction[];
};

export type GameCamera = SceneCamera & {
  addShake: (intensity: number) => void;
  pivotPoint: THREE.Vector3;
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
  object: new (scene: Scene, args: WorldObjectArgs) => THREE.Object3D;
};

export type WorldObjectDefinition = InstancedWorldObjectDefinition | EntityWorldObjectDefinition;

export type WorldVec2 = { x: number; z: number };

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

type StateNodeFor<E extends Entity, S extends State> = {
  state(entity: E): S;
  onInput?(ctx: { entity: E; input: InputState; currentState: S }): StateNodeFor<E, State> | null;
  onUpdate?(ctx: { entity: E; deltaTime: number; currentState: S }): StateNodeFor<E, State> | null;
};

export type StateNode<S extends State = State> = StateNodeFor<S['entity'], S>;

export type StateMachineContext = {
  entity: Entity;
  currentState: State | null;
};

export type StateMachine = {
  initialNode: StateNode;
  onDamage(
    ctx: StateMachineContext & { currentHealth: number; damageAmount: number }
  ): StateNode | null;
  onDeath(ctx: StateMachineContext): StateNode | null;
};
