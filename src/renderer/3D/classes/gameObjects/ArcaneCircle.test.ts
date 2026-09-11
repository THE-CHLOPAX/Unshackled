import * as THREE from 'three';
import { GameObject, Scene, useAssetStore } from '@tgdf';
import { MockCamera } from '@tgdf/internal-3d/testUtils/MockCamera';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ARCANE_CIRCLE_TEXTURE } from '3D/constants';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

import { ArcaneCircle } from './ArcaneCircle';

class MockScene extends Scene {
  camera = new MockCamera();
}

function getMeshMaterial(circle: ArcaneCircle): THREE.MeshStandardMaterial {
  const mesh = circle.children.find((child) => child instanceof THREE.Mesh) as
    | THREE.Mesh
    | undefined;
  if (!mesh) throw new Error('ArcaneCircle mesh not found');
  return mesh.material as THREE.MeshStandardMaterial;
}

describe('ArcaneCircle', () => {
  beforeEach(() => {
    useAssetStore.getState().textureCache.set(ARCANE_CIRCLE_TEXTURE, new THREE.Texture());
  });

  afterEach(() => {
    useAssetStore.getState().textureCache.clear();
  });

  it('throws when the arcane circle texture is missing from the asset store', () => {
    useAssetStore.getState().textureCache.clear();
    const scene = new MockScene();

    expect(() => new ArcaneCircle(scene, { diameter: 2, color: 0xff0000 })).toThrow(
      /texture not found/
    );
  });

  it('starts transparent and fades in on awake', () => {
    const scene = new MockScene();
    const parent = new GameObject({ scene });
    scene.add(parent);

    const circle = new ArcaneCircle(scene, {
      diameter: 2,
      color: 0xff0000,
      fadeIn: { duration: 1 },
    });
    parent.add(circle);
    circle.update(0);

    const material = getMeshMaterial(circle);
    expect(material.opacity).toBeCloseTo(0);
  });

  it('does not dispose the shared cached texture when removed, so later circles can still use it', () => {
    const scene = new MockScene();
    const parent = new GameObject({ scene });
    scene.add(parent);

    const texture = useAssetStore.getState().textureCache.get(ARCANE_CIRCLE_TEXTURE);
    if (!texture) throw new Error('texture not seeded');
    const disposeSpy = vi.spyOn(texture, 'dispose');

    const circle = new ArcaneCircle(scene, { diameter: 2, color: 0xff0000 });
    parent.add(circle);
    circle.update(0);

    parent.remove(circle);

    expect(disposeSpy).not.toHaveBeenCalled();
  });

  it('stays attached while fading out, then removes itself once the fade completes', () => {
    const scene = new MockScene();
    const parent = new GameObject({ scene });
    scene.add(parent);

    const circle = new ArcaneCircle(scene, {
      diameter: 2,
      color: 0xff0000,
      fadeOut: { duration: 1 },
    });
    parent.add(circle);
    circle.update(0);

    circle.destroy();
    expect(parent.children).toContain(circle);
  });
});
