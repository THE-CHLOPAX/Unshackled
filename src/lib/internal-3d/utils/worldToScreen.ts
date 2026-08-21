import * as THREE from 'three';

export type ScreenPosition = {
  x: number;
  y: number;
  visible: boolean;
};

// Module scoped, allocated once to avoid allocating new vectors every frame,
// which could cause GC overhead. Safe to reuse since each call fully consumes
// them synchronously before returning plain numbers.
const _viewSpacePosition = new THREE.Vector3();
const _ndcPosition = new THREE.Vector3();

/**
 * Projects a world-space position to 2D pixel coordinates within a container of the
 * given size. `visible` is false when the point is behind the camera or falls outside
 * the camera's frustum (NDC outside [-1, 1] on either axis).
 */
export function worldToScreen(
  worldPosition: THREE.Vector3,
  camera: THREE.Camera,
  containerWidth: number,
  containerHeight: number
): ScreenPosition {
  _viewSpacePosition.copy(worldPosition).applyMatrix4(camera.matrixWorldInverse);

  if (_viewSpacePosition.z > 0) {
    return { x: 0, y: 0, visible: false };
  }

  _ndcPosition.copy(worldPosition).project(camera);

  const visible =
    _ndcPosition.x >= -1 && _ndcPosition.x <= 1 && _ndcPosition.y >= -1 && _ndcPosition.y <= 1;

  return {
    x: ((_ndcPosition.x + 1) / 2) * containerWidth,
    y: ((1 - _ndcPosition.y) / 2) * containerHeight,
    visible,
  };
}
