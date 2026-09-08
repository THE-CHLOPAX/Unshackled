import * as THREE from 'three';

import { DungeonDoor } from '3D/classes/gameObjects/props/DungeonDoor';
import { SpawnMarker } from '3D/classes/gameObjects/props/SpawnMarker';
import { LevelEndMarker } from '3D/classes/gameObjects/props/LevelEndMarker';
import { DungeonWallTorch } from '3D/classes/gameObjects/props/DungeonWallTorch';

import { MODELS, WORLD_CELL_SIZE } from '../constants';
import { getModelGeometry } from '../utils/getModelGeometry';
import { getModelMaterial } from '../utils/getModelMaterial';
import { WorldObjectDefinition, WorldTileCodes } from '../types';
import { getWallCornerGeometry } from '../utils/getWallCornerGeometry';
import { getModelTextureForNormalDirection } from '../utils/getModelTextureForNormalDirection';

export const WORLD_TILE_DEFINITIONS_DUNGEON: WorldObjectDefinition[] = [
  {
    type: 'instanced',
    code: WorldTileCodes.DungeonFloorFull,
    label: 'Dungeon Floor full',
    offset: new THREE.Vector3(0, -0.4, 0),
    getGeometry: () => getModelGeometry(MODELS.DUNGEON_FLOOR.id),
    getMaterial: () => getModelMaterial(MODELS.DUNGEON_FLOOR.id),
  },
  {
    type: 'instanced',
    code: WorldTileCodes.DungeonFloorFlat,
    label: 'Dungeon Floor flat',
    worldSized: true,
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
    offset: new THREE.Vector3(0, WORLD_CELL_SIZE / 2, -WORLD_CELL_SIZE / 2),
    getGeometry: () => getModelGeometry(MODELS.DUNGEON_WALL_BRICK_TALL.id),
    getMaterial: () => {
      const mat = getModelMaterial(MODELS.DUNGEON_WALL_BRICK_TALL.id);
      if (Array.isArray(mat)) mat.forEach((subMat) => (subMat.side = THREE.DoubleSide));
      else {
        mat.side = THREE.DoubleSide;
      }
      return mat;
    },
  },
  {
    type: 'instanced',
    code: WorldTileCodes.DungeonWallBrickTallCorner,
    label: 'Dungeon Brick Wall Corner',
    offset: new THREE.Vector3(0, WORLD_CELL_SIZE / 2, -WORLD_CELL_SIZE / 2),
    getGeometry: () => getWallCornerGeometry(MODELS.DUNGEON_WALL_BRICK_TALL.id),
    getMaterial: () => {
      const mat = getModelMaterial(MODELS.DUNGEON_WALL_BRICK_TALL.id);
      if (Array.isArray(mat)) mat.forEach((subMat) => (subMat.side = THREE.DoubleSide));
      else {
        mat.side = THREE.DoubleSide;
      }
      return mat;
    },
  },
];

export const WORLD_PROP_DEFINITIONS_DUNGEON: WorldObjectDefinition[] = [
  {
    type: 'entity',
    code: WorldTileCodes.DungeonWallTorch,
    label: 'Wall torch',
    object: DungeonWallTorch,
  },
  { type: 'entity', code: WorldTileCodes.DungeonDoor, label: 'Door', object: DungeonDoor },
  {
    type: 'instanced',
    code: WorldTileCodes.DungeonPillar,
    label: 'Pillar',
    getGeometry: () => getModelGeometry(MODELS.DUNGEON_PILLAR.id),
    getMaterial: () => getModelMaterial(MODELS.DUNGEON_PILLAR.id),
  },
  { type: 'entity', code: WorldTileCodes.SpawnMarker, label: 'Spawn', object: SpawnMarker },
  {
    type: 'entity',
    code: WorldTileCodes.LevelEndMarker,
    label: 'Level end',
    object: LevelEndMarker,
  },
];
