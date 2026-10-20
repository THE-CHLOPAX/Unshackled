import { BillboardRegistry } from '3D/classes/scenes/GameScene/BillboardRegistry/BillboardRegistry';

export type BillboardRegistryHost = {
  billboards: BillboardRegistry;
};

export function hasBillboardRegistry(scene: unknown): scene is BillboardRegistryHost {
  return (
    typeof scene === 'object' &&
    scene !== null &&
    'billboards' in scene &&
    scene.billboards instanceof BillboardRegistry
  );
}
