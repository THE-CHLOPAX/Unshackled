import * as THREE from 'three';
import { assert } from '@tgdf';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';

import { MODEL_NATIVE_TILE_SIZE } from 'renderer/3D/constants';

import {
  DungeonWallParts,
  GetDungeonWallArgs,
  getDungeonWallParts,
  markPartsPersistent,
} from './getDungeonWallGeometry';

const cornerCache = new Map<string, DungeonWallParts>();

function mergeKeepingGroups(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = mergeGeometries(geometries);
  assert(merged !== null, 'Failed to merge dungeon wall corner geometries');

  merged.clearGroups();

  let elementOffset = 0;
  for (const geometry of geometries) {
    const elementCount = geometry.index?.count ?? geometry.attributes.position.count;
    for (const group of geometry.groups) {
      merged.addGroup(group.start + elementOffset, group.count, group.materialIndex);
    }
    elementOffset += elementCount;
  }

  return merged;
}

export function getDungeonWallCornerParts(args: GetDungeonWallArgs): DungeonWallParts {
  const cacheKey = `${args.wallModelId}|${args.plinthModelId}|${args.pillarModelId}`;
  const cached = cornerCache.get(cacheKey);
  if (cached) return cached;

  const segment = getDungeonWallParts(args);
  const half = MODEL_NATIVE_TILE_SIZE / 2;

  const armA = segment.geometry.clone();

  const armB = segment.geometry.clone();
  armB.rotateZ(-Math.PI / 2);
  armB.translate(half, -half, 0);

  const parts: DungeonWallParts = {
    geometry: mergeKeepingGroups([armA, armB]),
    materials: segment.materials,
  };

  markPartsPersistent(parts);
  cornerCache.set(cacheKey, parts);
  return parts;
}
