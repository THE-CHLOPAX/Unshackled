import * as THREE from 'three';
import { assert } from '@tgdf';

import { vec2toIndex } from './vec2ToIndex';
import { isInstancedCell } from './isInstancedCell';
import { getChunkBoundaries } from './getChunkBoundaries';
import { GameScene } from '../classes/scenes/GameScene/GameScene';
import { WORLD_TILE_DEFINITIONS, WORLD_PROP_DEFINITIONS } from '../worldDefinitions';
import { FLOOR_TILE_CODES, MODEL_NATIVE_TILE_SIZE, WORLD_CELL_SIZE } from '../constants';
import {
  WorldChunkBoundary,
  WorldCell,
  WorldOutputData,
  WorldTileCodes,
  LevelGeneratedData,
} from '../types';

export const GENERATED_LEVEL_GROUP_NAME = 'generated-level';
export const LEVEL_FLOOR_GROUP_NAME = 'level-floor-group';

const MODEL_TILE_SCALE = new THREE.Vector3().setScalar(WORLD_CELL_SIZE / MODEL_NATIVE_TILE_SIZE);
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
  performance.mark('start');
  const { width, height } = worldData;
  const chunkBoundaries = getChunkBoundaries(width, height, chunkSize);
  const chunkedCells = getChunkedCells(worldData, chunkBoundaries);

  const levelGroup = new THREE.Group();
  levelGroup.name = GENERATED_LEVEL_GROUP_NAME;

  const floorGroup = new THREE.Group();
  floorGroup.name = LEVEL_FLOOR_GROUP_NAME;
  levelGroup.add(floorGroup);

  chunkedCells.forEach((chunkCells) => buildChunk(levelGroup, chunkCells, floorGroup));
  scene.add(levelGroup);

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

function buildChunk(
  levelGroup: THREE.Group,
  chunkCells: ChunkCell[],
  floorGroup: THREE.Group
): void {
  const instancedCellsByCode = groupInstancedCellsByCode(chunkCells);

  instancedCellsByCode.forEach((cells, code) => {
    const definition = WORLD_OBJECT_DEFINITIONS.find((def) => def.code === code);
    assert(
      definition !== undefined && definition.type === 'instanced',
      `World object definition is not instanced: ${code}`
    );

    const instancedMesh = new THREE.InstancedMesh(
      definition.getGeometry(),
      definition.getMaterial(),
      cells.length
    );

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
      matrix.compose(position, quaternion, definition.worldSized ? UNIT_SCALE : MODEL_TILE_SCALE);
      instancedMesh.setMatrixAt(index, matrix);
    });

    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.computeBoundingSphere();

    const parent = FLOOR_TILE_CODES.includes(code) ? floorGroup : levelGroup;
    parent.add(instancedMesh);
  });

  // Build entity world objects
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
