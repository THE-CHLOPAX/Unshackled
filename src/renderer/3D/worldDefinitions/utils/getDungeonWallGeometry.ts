import * as THREE from 'three';
import { assert, getModelFromStore, isMesh, ResourceTracker } from '@tgdf';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';

import { MODEL_NATIVE_TILE_SIZE } from 'renderer/3D/constants';

import { FLOOR_FULL_DEPTH } from '../dungeon';
import { getModelMaterial } from '../../utils/getModelMaterial';

export type GetDungeonWallArgs = {
  pillarModelId: string;
  wallModelId: string;
  plinthModelId: string;
};

export type DungeonWallParts = {
  geometry: THREE.BufferGeometry;
  materials: THREE.Material[];
};

const partsCache = new Map<string, DungeonWallParts>();

export function markPartsPersistent(parts: DungeonWallParts): DungeonWallParts {
  ResourceTracker.markPersistent(parts.geometry);
  ResourceTracker.markPersistent(parts.materials);
  return parts;
}

export function getSourceGeometry(modelId: string): THREE.BufferGeometry {
  const model = getModelFromStore(modelId);
  assert(isMesh(model), `Source model with id: ${modelId} is not a mesh`);
  return model.geometry.clone();
}

export function getSingleMaterial(modelId: string): THREE.Material {
  const material = getModelMaterial(modelId);
  assert(!Array.isArray(material), `Source model with id: ${modelId} must have a single material`);
  return material;
}

export function getDungeonWallParts({
  pillarModelId,
  wallModelId,
  plinthModelId,
}: GetDungeonWallArgs): DungeonWallParts {
  const cacheKey = `${wallModelId}|${plinthModelId}|${pillarModelId}`;
  const cached = partsCache.get(cacheKey);
  if (cached) return cached;

  const wallGeometry = getSourceGeometry(wallModelId);
  const plinthGeometry = getSourceGeometry(plinthModelId);
  const pillarGeometry = getSourceGeometry(pillarModelId);

  plinthGeometry.translate(0, 0, MODEL_NATIVE_TILE_SIZE / 2);
  pillarGeometry.translate(
    -MODEL_NATIVE_TILE_SIZE / 2,
    0,
    -MODEL_NATIVE_TILE_SIZE / 2 - FLOOR_FULL_DEPTH
  );

  const geometry = mergeGeometries([wallGeometry, plinthGeometry, pillarGeometry], true);
  assert(geometry !== null, 'Failed to merge dungeon wall geometries');

  const parts: DungeonWallParts = {
    geometry,
    materials: [
      getSingleMaterial(wallModelId),
      getSingleMaterial(plinthModelId),
      getSingleMaterial(pillarModelId),
    ],
  };

  markPartsPersistent(parts);
  partsCache.set(cacheKey, parts);
  return parts;
}
