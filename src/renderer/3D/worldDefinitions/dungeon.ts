import * as THREE from 'three';

import { DungeonDoor } from '3D/classes/gameObjects/props/DungeonDoor';
import { DungeonWallTorch } from '3D/classes/gameObjects/props/DungeonWallTorch';

import { MODELS, WORLD_CELL_SIZE } from '../constants';
import { getModelGeometry } from './utils/getModelGeometry';
import { getModelMaterial } from '../utils/getModelMaterial';
import { WorldObjectDefinition, WorldTileCodes } from '../types';
import { getDungeonWallParts } from './utils/getDungeonWallGeometry';
import { getDungeonDoorFrameParts } from './utils/getDungeonDoorFrameGeometry';
import { getDungeonWallCornerParts } from './utils/getDungeonWallCornerGeometry';
import { getModelTextureForNormalDirection } from './utils/getModelTextureForNormalDirection';

export const FLOOR_FULL_DEPTH = 0.1 * WORLD_CELL_SIZE;

const BRICK_WALL_PARTS_ARGS = {
  pillarModelId: MODELS.DUNGEON_PILLAR.id,
  wallModelId: MODELS.DUNGEON_WALL_BRICK_TALL.id,
  plinthModelId: MODELS.DUNGEON_PLINTH.id,
};

const DOOR_FRAME_PARTS_ARGS = {
  doorFrameModelId: MODELS.DUNGEON_DOOR_FRAME.id,
  plinthModelId: MODELS.DUNGEON_PLINTH.id,
};

export const WORLD_TILE_DEFINITIONS_DUNGEON: WorldObjectDefinition[] = [
  {
    type: 'instanced',
    code: WorldTileCodes.DungeonFloorFull,
    label: 'Dungeon Floor full',
    collider: true,
    offset: new THREE.Vector3(0, -FLOOR_FULL_DEPTH, 0),
    getGeometry: () => getModelGeometry(MODELS.DUNGEON_FLOOR.id),
    getMaterial: () => getModelMaterial(MODELS.DUNGEON_FLOOR.id),
  },
  {
    type: 'instanced',
    code: WorldTileCodes.DungeonFloorFullElevated,
    label: 'Dungeon Floor full elevated',
    offset: new THREE.Vector3(0, -FLOOR_FULL_DEPTH + WORLD_CELL_SIZE, 0),
    getGeometry: () => getModelGeometry(MODELS.DUNGEON_FLOOR.id),
    getMaterial: () => getModelMaterial(MODELS.DUNGEON_FLOOR.id),
  },
  {
    type: 'instanced',
    code: WorldTileCodes.DungeonFloorFlat,
    label: 'Dungeon Floor flat',
    collider: true,
    disableModelScaling: true,
    getGeometry: () => new THREE.PlaneGeometry(WORLD_CELL_SIZE, WORLD_CELL_SIZE),
    getMaterial: () => {
      const source = getModelMaterial(MODELS.DUNGEON_FLOOR.id);
      const base = Array.isArray(source) ? source[0] : source;
      const material = base.clone() as THREE.MeshStandardMaterial;
      material.map = getModelTextureForNormalDirection(
        MODELS.DUNGEON_FLOOR.id,
        new THREE.Vector3(0, 0, 1)
      );
      material.needsUpdate = true;
      return material;
    },
  },
  {
    type: 'instanced',
    code: WorldTileCodes.DungeonWallBrickTall,
    label: 'Dungeon Brick Wall',
    collider: true,
    offset: new THREE.Vector3(0, WORLD_CELL_SIZE / 2, -WORLD_CELL_SIZE / 2),
    getGeometry: () => getDungeonWallParts(BRICK_WALL_PARTS_ARGS).geometry,
    getMaterial: () => getDungeonWallParts(BRICK_WALL_PARTS_ARGS).materials,
  },
  {
    type: 'instanced',
    code: WorldTileCodes.DungeonWallBrickTallCorner,
    label: 'Dungeon Brick Wall Corner',
    collider: true,
    offset: new THREE.Vector3(0, WORLD_CELL_SIZE / 2, -WORLD_CELL_SIZE / 2),
    getGeometry: () => getDungeonWallCornerParts(BRICK_WALL_PARTS_ARGS).geometry,
    getMaterial: () => getDungeonWallCornerParts(BRICK_WALL_PARTS_ARGS).materials,
  },
  {
    type: 'instanced',
    code: WorldTileCodes.DungeonWallBrickDoorFrame,
    label: 'Dungeon Brick Wall Door Frame',
    collider: true,
    offset: new THREE.Vector3(0, WORLD_CELL_SIZE / 2, -WORLD_CELL_SIZE / 2),
    getGeometry: () => getDungeonDoorFrameParts(DOOR_FRAME_PARTS_ARGS).geometry,
    getMaterial: () => getDungeonDoorFrameParts(DOOR_FRAME_PARTS_ARGS).materials,
  },
];

export const WORLD_PROP_DEFINITIONS_DUNGEON: WorldObjectDefinition[] = [
  {
    type: 'entity',
    code: WorldTileCodes.DungeonWallTorch,
    label: 'Wall torch',
    disableModelScaling: true,
    offset: new THREE.Vector3(WORLD_CELL_SIZE / 2, WORLD_CELL_SIZE / 2, -WORLD_CELL_SIZE / 2 + 0.6),
    object: DungeonWallTorch,
  },
  {
    type: 'entity',
    code: WorldTileCodes.DungeonDoor,
    offset: new THREE.Vector3(0, WORLD_CELL_SIZE / 2 - FLOOR_FULL_DEPTH, -WORLD_CELL_SIZE / 2),
    label: 'Dungeon Door',
    object: DungeonDoor,
  },
  {
    type: 'instanced',
    code: WorldTileCodes.DungeonPillar,
    label: 'Pillar',
    getGeometry: () => getModelGeometry(MODELS.DUNGEON_PILLAR.id),
    getMaterial: () => getModelMaterial(MODELS.DUNGEON_PILLAR.id),
  },
  {
    type: 'instanced',
    code: WorldTileCodes.DungeonPillarCorner,
    label: 'Pillar corner',
    offset: new THREE.Vector3(WORLD_CELL_SIZE / 2, 0, -WORLD_CELL_SIZE / 2),
    getGeometry: () => getModelGeometry(MODELS.DUNGEON_PILLAR.id),
    getMaterial: () => getModelMaterial(MODELS.DUNGEON_PILLAR.id),
  },
];
