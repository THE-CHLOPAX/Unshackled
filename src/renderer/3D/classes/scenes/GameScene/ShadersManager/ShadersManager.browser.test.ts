import * as THREE from 'three';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { createSkinnedMesh } from 'renderer/3D/utils/createSkinnedMesh';

import { MATERIALS } from '../../../../constants';
import { ShadersManager } from './ShadersManager';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

const renderersToDispose: THREE.WebGLRenderer[] = [];

function createRenderer(): THREE.WebGLRenderer {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderersToDispose.push(renderer);
  return renderer;
}

function createCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 5);
  return camera;
}

function programCount(renderer: THREE.WebGLRenderer): number {
  return renderer.info.programs?.length ?? 0;
}

function renderIntoIntermediateTarget(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Object3D,
  camera: THREE.Camera
): void {
  const target = new THREE.WebGLRenderTarget(4, 4);
  renderer.setRenderTarget(target);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  target.dispose();
}

afterEach(() => {
  renderersToDispose.forEach((renderer) => {
    renderer.dispose();
    renderer.forceContextLoss();
  });
  renderersToDispose.length = 0;
});

describe('ShadersManager', () => {
  it('adds an invisible warmup group covering every MATERIALS variant, plain and skinned', () => {
    const shadersManager = new ShadersManager();

    expect(shadersManager.warmupGroup.visible).toBe(false);

    // `skinning` is a per-OBJECT cache-key input (object.isSkinnedMesh), not
    // a material property, so a MeshStandardMaterial variant needs both a
    // plain and a skinned warmup instance to cover both usages. Sprites are
    // the one exception — THREE.Sprite has no skinning code path at all.
    const meshVariantCount = Object.keys(MATERIALS).length - 1; // all but SPRITE_WITH_ALPHA
    expect(shadersManager.warmupGroup.children).toHaveLength(meshVariantCount * 2 + 1);

    const skinnedMeshes = shadersManager.warmupGroup.children.filter(
      (child) => (child as THREE.SkinnedMesh).isSkinnedMesh
    );
    expect(skinnedMeshes).toHaveLength(meshVariantCount);
  });

  it('shares compiled programs with real objects that reuse MATERIALS, even through an intermediate render target', async () => {
    const renderer = createRenderer();
    const scene = new THREE.Scene();
    const camera = createCamera();

    const shadersManager = new ShadersManager();
    scene.add(shadersManager.warmupGroup);

    await shadersManager.warmup(renderer, scene, camera);
    const baselineProgramCount = programCount(renderer);
    expect(baselineProgramCount).toBeGreaterThan(0);

    // Mirrors how gameplay objects (SacredOrb, ArcaneCircle, ...) build their
    // materials: calling the same MATERIALS factory ShadersManager warmed.
    const orbMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      MATERIALS.STANDARD_EMISSIVE({
        color: 0xf5c518,
        emissive: 0xf5c518,
        emissiveIntensity: 4,
        metalness: 0.4,
        roughness: 0.2,
      })
    );
    scene.add(orbMesh);

    renderIntoIntermediateTarget(renderer, scene, camera);

    expect(programCount(renderer)).toBe(baselineProgramCount);
    expect(shadersManager.checkForLateCompiles(renderer)).toBeNull();
  });

  it('shares compiled programs with a SkinnedMesh that reuses MATERIALS (e.g. dash ghosts)', async () => {
    const renderer = createRenderer();
    const scene = new THREE.Scene();
    const camera = createCamera();

    const shadersManager = new ShadersManager();
    scene.add(shadersManager.warmupGroup);

    await shadersManager.warmup(renderer, scene, camera);
    const baselineProgramCount = programCount(renderer);

    const ghostMesh = createSkinnedMesh(
      MATERIALS.STANDARD_EMISSIVE({ color: 0xf5c518, opacity: 0.45 })
    );
    scene.add(ghostMesh);

    renderIntoIntermediateTarget(renderer, scene, camera);

    expect(programCount(renderer)).toBe(baselineProgramCount);
    expect(shadersManager.checkForLateCompiles(renderer)).toBeNull();
  });

  it('would recompile a SkinnedMesh without a skinned warmup instance — proving that fix is load-bearing too', () => {
    const renderer = createRenderer();
    const scene = new THREE.Scene();
    const camera = createCamera();

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(0.01, 0.01), MATERIALS.STANDARD_EMISSIVE()));
    renderer.compile(scene, camera);
    const baselineProgramCount = programCount(renderer);

    const ghostMesh = createSkinnedMesh(MATERIALS.STANDARD_EMISSIVE({ color: 0xf5c518 }));
    scene.add(ghostMesh);
    renderIntoIntermediateTarget(renderer, scene, camera);

    expect(programCount(renderer)).toBeGreaterThan(baselineProgramCount);
  });

  it('reports a material variant that genuinely was not warmed up', async () => {
    const renderer = createRenderer();
    const scene = new THREE.Scene();
    const camera = createCamera();

    const shadersManager = new ShadersManager();
    scene.add(shadersManager.warmupGroup);

    await shadersManager.warmup(renderer, scene, camera);

    const normalMap = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1);
    normalMap.needsUpdate = true;
    const unwarmedMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ normalMap })
    );
    scene.add(unwarmedMesh);

    renderIntoIntermediateTarget(renderer, scene, camera);

    expect(shadersManager.checkForLateCompiles(renderer)).not.toBeNull();
  });

  it('would recompile without the render-target fix — proving the fix is load-bearing, not coincidental', () => {
    const renderer = createRenderer();
    const scene = new THREE.Scene();
    const camera = createCamera();

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(0.01, 0.01), MATERIALS.STANDARD_EMISSIVE()));
    renderer.compile(scene, camera);
    const baselineProgramCount = programCount(renderer);

    const orbMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      MATERIALS.STANDARD_EMISSIVE({ color: 0xf5c518 })
    );
    scene.add(orbMesh);
    renderIntoIntermediateTarget(renderer, scene, camera);

    expect(programCount(renderer)).toBeGreaterThan(baselineProgramCount);
  });
});
