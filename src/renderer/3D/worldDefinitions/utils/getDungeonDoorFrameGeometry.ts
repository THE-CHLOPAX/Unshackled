import { assert } from '@tgdf';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';

import { MODEL_TILE_SCALE_SCALAR } from 'renderer/3D/constants';

import {
  DungeonWallParts,
  getSingleMaterial,
  getSourceGeometry,
} from './getDungeonWallGeometry';

export type GetDungeonDoorFrameArgs = {
  doorFrameModelId: string;
  plinthModelId: string;
};

const partsCache = new Map<string, DungeonWallParts>();

export function getDungeonDoorFrameParts({
  doorFrameModelId,
  plinthModelId,
}: GetDungeonDoorFrameArgs): DungeonWallParts {
  const cacheKey = `${doorFrameModelId}|${plinthModelId}`;
  const cached = partsCache.get(cacheKey);
  if (cached) return cached;

  const doorFrameGeometry = getSourceGeometry(doorFrameModelId);
  const plinthGeometry = getSourceGeometry(plinthModelId);

  plinthGeometry.translate(0, 0, MODEL_TILE_SCALE_SCALAR / 2 + 2.5 * MODEL_TILE_SCALE_SCALAR);

  const geometry = mergeGeometries([doorFrameGeometry, plinthGeometry], true);
  assert(geometry !== null, 'Failed to merge dungeon door frame geometries');

  const parts: DungeonWallParts = {
    geometry,
    materials: [getSingleMaterial(doorFrameModelId), getSingleMaterial(plinthModelId)],
  };

  partsCache.set(cacheKey, parts);
  return parts;
}
