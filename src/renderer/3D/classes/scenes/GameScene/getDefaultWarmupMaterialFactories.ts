import * as THREE from 'three';
import { assertNever } from '@tgdf';

import { MATERIALS } from '3D/constants';

import { WarmupFactory } from './ShadersManager/ShadersManager';

const PLACEHOLDER_TEXTURE = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
PLACEHOLDER_TEXTURE.needsUpdate = true;

export function getDefaultWarmupMaterialFactories(): WarmupFactory[] {
  return (Object.keys(MATERIALS) as (keyof typeof MATERIALS)[]).map((key) => {
    switch (key) {
      case 'STANDARD_EMISSIVE':
        return () => MATERIALS.STANDARD_EMISSIVE();
      case 'STANDARD_EMISSIVE_WITH_MAP':
        return () => MATERIALS.STANDARD_EMISSIVE_WITH_MAP({ map: PLACEHOLDER_TEXTURE });
      case 'SPRITE_WITH_ALPHA':
        return () => MATERIALS.SPRITE_WITH_ALPHA({ map: PLACEHOLDER_TEXTURE });
      default:
        return assertNever(
          key,
          `[getDefaultWarmupMaterialFactories] No warmup case for MATERIALS.${key}`
        );
    }
  });
}
