import * as THREE from 'three';
import { RigidBodyOptions } from '@tgdf';

import { ModelRecord, TextureRecord, WorldTileCodes } from './types';

// Default camera position relative to its pivot point, e.g. for an isometric-style view.
export const CAMERA_POSITION_OFFSET = new THREE.Vector3(6, 6, 6);

export const FLOOR_OBJECT_MESH_NAME = 'test-floor-plane-mesh';

export const CHECKERBOARD_TEXTURE = 'checkerboard-texture';

export const EXPLOSION_SPRITESHEET_TEXTURE = 'explosion-spritesheet-texture';
export const ARCANE_CIRCLE_TEXTURE = 'arcane-circle-texture';
export const MAIN_CROWD_ID = 'main-crowd';

// Material parameters that change which shader program three.js compiles
type StructuralMaterialParameter =
  | 'map'
  | 'aoMap'
  | 'envMap'
  | 'bumpMap'
  | 'alphaMap'
  | 'lightMap'
  | 'normalMap'
  | 'blending'
  | 'alphaTest'
  | 'emissiveMap'
  | 'transparent'
  | 'roughnessMap'
  | 'metalnessMap'
  | 'alphaToCoverage'
  | 'displacementMap';

/**
 * Adding a new variant? Warm it in ShadersManager's
 * _createShaderWarmupGroup too, or it'll compile mid-gameplay on first use
 * instead of at load — that switch is exhaustive over keyof MATERIALS, so
 * forgetting is a build error there, not a silent gap.
 */
export const MATERIALS = {
  // Untextured glowing surface
  STANDARD_EMISSIVE: (
    options: Omit<THREE.MeshStandardMaterialParameters, StructuralMaterialParameter> = {}
  ): THREE.MeshStandardMaterial =>
    new THREE.MeshStandardMaterial({
      name: 'MATERIALS.STANDARD_EMISSIVE',
      emissive: 0xffffff,
      transparent: true,
      ...options,
    }),

  // Textured glowing surface — the texture doubles as the emissive map
  STANDARD_EMISSIVE_WITH_MAP: ({
    map,
    ...options
  }: Omit<THREE.MeshStandardMaterialParameters, StructuralMaterialParameter> & {
    map: THREE.Texture;
  }): THREE.MeshStandardMaterial =>
    new THREE.MeshStandardMaterial({
      name: 'MATERIALS.STANDARD_EMISSIVE_WITH_MAP',
      map,
      emissiveMap: map,
      emissive: 0xffffff,
      transparent: true,
      ...options,
    }),

  // Alpha-cutout billboard sprite
  SPRITE_WITH_ALPHA: (
    options: Omit<THREE.SpriteMaterialParameters, StructuralMaterialParameter> & {
      map: THREE.Texture;
    }
  ): THREE.SpriteMaterial =>
    new THREE.SpriteMaterial({
      name: 'MATERIALS.SPRITE_WITH_ALPHA',
      transparent: true,
      alphaTest: 0.5,
      ...options,
    }),
};

// NavMesh configuration
export const NAVMESH_AGENT_RADIUS = 0.6; // Agent radius in world units
export const NAVMESH_AGENT_HEIGHT = 2.0;

export const DEFAULT_RIGID_BODY_OPTIONS: RigidBodyOptions = {
  mass: 0.1,
  friction: 0,
  linearDamping: 0,
  lockRotation: true,
  colliderShape: 'cylinder',
  enableCollisionDetection: true,
};

export const SPAWNER_IDS = {
  PLAYER: 'player-spawner',
};

// Model records
export const MODELS: Record<string, ModelRecord> = {
  SKELETON: {
    type: 'model',
    id: 'model-skeleton',
    path: './assets/models/skeleton.glb',
    nameExtractor: 'Armature',
  },
  MONK: {
    type: 'model',
    id: 'model-monk',
    path: './assets/models/monk.glb',
    nameExtractor: 'Armature',
  },
  KNIGHT: {
    type: 'model',
    id: 'model-knight',
    path: './assets/models/knight.glb',
    nameExtractor: 'Knight',
  },
  DUNGEON_DOOR: {
    type: 'model',
    id: 'model_dungeon_door',
    path: './assets/models/model_dungeon_door.fbx',
    nameExtractor: 'Door_03_001',
  },
  DUNGEON_DOOR_FRAME: {
    type: 'model',
    id: 'model_dungeon_door_frame',
    path: './assets/models/model_dungeon_door_frame.fbx',
    nameExtractor: 'DoorFrame_02_001',
  },
  DUNGEON_PILLAR: {
    type: 'model',
    id: 'model_dungeon_pillar',
    path: './assets/models/model_dungeon_pillar.fbx',
    nameExtractor: 'Pillar_03_001',
    centerOrigin: false,
  },
  DUNGEON_WALL_BRICK_TALL: {
    type: 'model',
    id: 'model_dungeon_wall_brick_tall',
    path: './assets/models/model_dungeon_wall_brick_tall.fbx',
    nameExtractor: 'WallBrick_Tall_01_001',
  },
  DUNGEON_FLOOR: {
    type: 'model',
    id: 'model_dungeon_floor',
    path: './assets/models/model_dungeon_floor.fbx',
    nameExtractor: 'Floor_Corner_01_001',
  },
  DUNGEON_PLINTH: {
    type: 'model',
    id: 'model_dungeon_plinth',
    path: './assets/models/model_dungeon_plinth.fbx',
    nameExtractor: 'Plinth_Big_01_001',
  },
  DUNGEON_WALL_TORCH: {
    type: 'model',
    id: 'model_dungeon_torch_wall',
    path: './assets/models/model_dungeon_wall_torch.glb',
    centerOrigin: false,
    nameExtractor: 'dungeon_wall_torch_body',
  },
};

export const TEXTURES: Record<string, TextureRecord> = {
  EXPLOSION: {
    type: 'texture',
    id: EXPLOSION_SPRITESHEET_TEXTURE,
    path: './assets/textures/explosion.png',
    colorSpace: THREE.SRGBColorSpace,
  },
  ARCANE_CIRCLE: {
    type: 'texture',
    id: ARCANE_CIRCLE_TEXTURE,
    path: './assets/textures/arcane-circle.png',
  },
  DUNGEON_BLOCKS: {
    type: 'texture',
    id: 'texture-dungeon-blocks',
    path: './assets/textures/BAKE_Blocks_DiffuseMap-%204K.png',
  },
  DUNGEON_PROPS_1: {
    type: 'texture',
    id: 'texture-dungeon-props-1',
    path: './assets/textures/BAKE_Props_grp1_DiffuseMap-%204K.png',
  },
  DUNGEON_PROPS_2: {
    type: 'texture',
    id: 'texture-dungeon-props-2',
    path: './assets/textures/BAKE_Props_grp2_DiffuseMap-%204K.png',
  },
  DUNGEON_WALLS: {
    type: 'texture',
    id: 'texture-dungeon-walls',
    path: './assets/textures/BAKE_Walls_DiffuseMap-%204K.png',
  },
};

export const WORLD_LAYER_COUNT = 4;

export const WORLD_CELL_SIZE = 4;

export const MODEL_NATIVE_TILE_SIZE = 5;

export const MODEL_TILE_SCALE_SCALAR = WORLD_CELL_SIZE / MODEL_NATIVE_TILE_SIZE;

export const MODEL_TILE_SCALE = new THREE.Vector3().setScalar(
  WORLD_CELL_SIZE / MODEL_NATIVE_TILE_SIZE
);

export const FLOOR_TILE_CODES = [WorldTileCodes.DungeonFloorFull, WorldTileCodes.DungeonFloorFlat];

export const SPAWN_MARKER_NAME = 'spawn-marker';
