import * as THREE from 'three';
import { getObjectSize } from '@tgdf';

export function getPickableObjectInitialY(object: THREE.Object3D): number {
  const size = getObjectSize(object);
  return size.y / 2;
}
