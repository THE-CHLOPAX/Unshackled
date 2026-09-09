import * as THREE from 'three';
import { assert, Scene } from '@tgdf';

import { vec2toIndex } from './vec2ToIndex';
import { isInstancedCell } from './isInstancedCell';
import { getChunkBoundaries } from './getChunkBoundaries';
import { GameScene } from '../classes/scenes/GameScene/GameScene';
import { RigidStaticObject } from '../classes/gameObjects/RigidStaticObject';
import { FLOOR_TILE_CODES, MODEL_TILE_SCALE, WORLD_CELL_SIZE } from '../constants';
import { WORLD_TILE_DEFINITIONS, WORLD_PROP_DEFINITIONS } from '../worldDefinitions';
import {
  WorldChunkBoundary,
  WorldCell,
  WorldOutputData,
  WorldTileCodes,
  LevelGeneratedData,
  EntityWorldObjectDefinition,
} from '../types';

export const GENERATED_LEVEL_GROUP_NAME = 'generated-level';
export const LEVEL_FLOOR_GROUP_NAME = 'level-floor-group';

const UNIT_SCALE = new THREE.Vector3(1, 1, 1);
const MODEL_BASE_TILT = -Math.PI / 2;
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const NO_OFFSET = new THREE.Vector3();

const WORLD_OBJECT_DEFINITIONS = [...WORLD_TILE_DEFINITIONS, ...WORLD_PROP_DEFINITIONS];

type ChunkCell = WorldCell & { x: number; z: number };

export function generateChunkedLevel(
  scene: GameScene,
  worldData: WorldOutputData,
  chunkSize: number
): Promise<LevelGeneratedData> {
  const { width, height } = worldData;
  const chunkBoundaries = getChunkBoundaries(width, height, chunkSize);
  const chunkedCells = getChunkedCells(worldData, chunkBoundaries);

  const floorGroup = new THREE.Group();
  floorGroup.name = LEVEL_FLOOR_GROUP_NAME;
  scene.add(floorGroup);

  chunkedCells.forEach((chunkCells) => buildChunk(scene, chunkCells, floorGroup));

  return Promise.resolve({ floorGroup });
}

function getChunkedCells(
  worldData: WorldOutputData,
  chunkBoundaries: WorldChunkBoundary[]
): ChunkCell[][] {
  const { layers, width } = worldData;
  return chunkBoundaries.map(({ start, end }) => {
    const chunkCells: ChunkCell[] = [];
    for (let x = start.x; x < end.x; x++) {
      for (let z = start.z; z < end.z; z++) {
        const index = vec2toIndex(x, z, width);
        for (const layer of layers) {
          const cell = layer.get(index);
          if (cell === undefined) continue;
          chunkCells.push({ ...cell, x, z });
        }
      }
    }
    return chunkCells;
  });
}

function buildChunk(scene: Scene, chunkCells: ChunkCell[], floorGroup: THREE.Group): void {
  const instancedCellsByCode = groupInstancedCellsByCode(chunkCells);

  // Build instanced objects
  instancedCellsByCode.forEach((cells, code) => {
    const definition = WORLD_OBJECT_DEFINITIONS.find((def) => def.code === code);
    assert(
      definition !== undefined && definition.type === 'instanced',
      `World object definition is not instanced: ${code}`
    );

    const geometry = definition.getGeometry();
    const material = definition.getMaterial();

    const instancedMesh = new THREE.InstancedMesh(geometry, material, cells.length);

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const offset = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const euler = new THREE.Euler();

    cells.forEach((cell, index) => {
      const yaw = THREE.MathUtils.degToRad(-cell.rotation);

      offset.copy(definition.offset ?? NO_OFFSET).applyAxisAngle(Y_AXIS, yaw);
      position.set(
        cell.x * WORLD_CELL_SIZE + offset.x,
        offset.y,
        cell.z * WORLD_CELL_SIZE + offset.z
      );

      euler.set(MODEL_BASE_TILT, 0, yaw);
      quaternion.setFromEuler(euler);
      matrix.compose(
        position,
        quaternion,
        definition.disableModelScaling ? UNIT_SCALE : MODEL_TILE_SCALE
      );
      instancedMesh.setMatrixAt(index, matrix);

      if (definition.collider) {
        const rigidStaticObject = new RigidStaticObject(scene, {
          geometry,
          matrix: matrix.clone(),
        });
        scene.add(rigidStaticObject);
      }
    });

    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.computeBoundingSphere();

    const parent = FLOOR_TILE_CODES.includes(code) ? floorGroup : scene;
    parent.add(instancedMesh);
  });

  // Build entity objects
  const entityCells = chunkCells.filter((cell) => !isInstancedCell(cell.code));
  entityCells.forEach((cell) => {
    const definition = WORLD_OBJECT_DEFINITIONS.find(
      (definition): definition is EntityWorldObjectDefinition => definition.code === cell.code
    );
    assert(definition !== undefined, `Definition not found for cell code: ${cell.code}`);

    const offset = new THREE.Vector3();
    const yaw = THREE.MathUtils.degToRad(-cell.rotation);

    offset.copy(definition.offset ?? NO_OFFSET).applyAxisAngle(Y_AXIS, yaw);

    const object = new definition.object(scene, { cell });
    const position = new THREE.Vector3(
      cell.x * WORLD_CELL_SIZE + offset.x,
      offset.y,
      cell.z * WORLD_CELL_SIZE + offset.z
    );

    if (!definition.disableModelScaling) {
      object.scale.copy(MODEL_TILE_SCALE);
    }

    object.position.copy(position);

    const parent = FLOOR_TILE_CODES.includes(cell.code) ? floorGroup : scene;
    parent.add(object);

    if (definition.collider) {
      const rigidStaticObject = new RigidStaticObject(scene, { position, source: object });
      scene.add(rigidStaticObject);
    }
  });
}

function groupInstancedCellsByCode(chunkCells: ChunkCell[]): Map<WorldTileCodes, ChunkCell[]> {
  const grouped = new Map<WorldTileCodes, ChunkCell[]>();

  chunkCells.forEach((cell) => {
    if (!isInstancedCell(cell.code)) return;

    const bucket = grouped.get(cell.code);
    if (bucket) bucket.push(cell);
    else grouped.set(cell.code, [cell]);
  });

  return grouped;
}
