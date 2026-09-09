import * as THREE from 'three';
import { describe, it, expect, vi } from 'vitest';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

import { GameObject, Scene } from '@tgdf';
import { MockCamera } from '@tgdf/internal-3d/testUtils/MockCamera';

import { createFlameParticlesGeometry, FLAME_BOUNDING_RADIUS } from './flameGeometry';
import { Flame, createFlameInstancedMesh, DEFAULT_FLAME_PARTICLE_COUNT } from './Flame';
import { FlameMaterial, createFlameMaterial, updateFlameMaterialTime } from './flameMaterial';

const CONSTANT_RANDOM = () => 0.5;
const VERTICES_PER_PARTICLE = 6;

class MockScene extends Scene {
  camera = new MockCamera();
}

function flameMesh(flame: Flame): THREE.Mesh<THREE.BufferGeometry, FlameMaterial> {
  const mesh = flame.children.find(
    (child): child is THREE.Mesh<THREE.BufferGeometry, FlameMaterial> =>
      (child as THREE.Mesh).isMesh === true
  );
  if (!mesh) throw new Error('Flame has no mesh child');
  return mesh;
}

function flamePointLight(flame: Flame): THREE.PointLight | undefined {
  return flame.children.find(
    (child): child is THREE.PointLight => (child as THREE.PointLight).isPointLight === true
  );
}

describe('createFlameParticlesGeometry', () => {
  it('builds one square (6 vertices) per particle', () => {
    const geometry = createFlameParticlesGeometry(20, CONSTANT_RANDOM);

    expect(geometry.getAttribute('position').count).toBe(20 * VERTICES_PER_PARTICLE);
    expect(geometry.getAttribute('position').itemSize).toBe(3);
    expect(geometry.getAttribute('normal')).toBeUndefined();
  });

  it('assigns one shared seed to every vertex of a square', () => {
    let calls = 0;
    const geometry = createFlameParticlesGeometry(4, () => {
      calls += 1;
      return calls / 10;
    });
    const seed = geometry.getAttribute('aSeed');

    expect(calls).toBe(4);
    expect(seed.getX(0)).toBeCloseTo(0.1);
    expect(seed.getX(VERTICES_PER_PARTICLE - 1)).toBeCloseTo(0.1);
    expect(seed.getX(VERTICES_PER_PARTICLE)).toBeCloseTo(0.2);
  });

  it('clamps a non-positive particle count to a single square', () => {
    const geometry = createFlameParticlesGeometry(0, CONSTANT_RANDOM);

    expect(geometry.getAttribute('position').count).toBe(VERTICES_PER_PARTICLE);
  });

  it('sets a generous bounding volume so risen squares are not culled', () => {
    const geometry = createFlameParticlesGeometry(8, CONSTANT_RANDOM);

    expect(geometry.boundingSphere?.radius).toBe(FLAME_BOUNDING_RADIUS);
    expect(geometry.boundingBox?.max.y).toBe(FLAME_BOUNDING_RADIUS);
  });
});

describe('createFlameMaterial', () => {
  it('is an additive, emissive, non-writing transparent material', () => {
    const material = createFlameMaterial('#ffaa33');

    expect(material.transparent).toBe(true);
    expect(material.depthWrite).toBe(false);
    expect(material.blending).toBe(THREE.AdditiveBlending);
    expect(material.toneMapped).toBe(false);
  });

  it('exposes time, color and scale uniforms', () => {
    const material = createFlameMaterial('#ffaa33');

    expect(material.uniforms.uTime.value).toBe(0);
    expect(material.uniforms.uScale.value).toBe(1);
    expect(material.uniforms.uColor.value).toBeInstanceOf(THREE.Color);
    expect(material.uniforms.uColor.value.getHexString()).toBe('ffaa33');
  });

  it('drives animation purely from the uTime uniform', () => {
    const material = createFlameMaterial('#ffaa33');

    updateFlameMaterialTime(material, 12.5);

    expect(material.uniforms.uTime.value).toBe(12.5);
  });

  it('is an instancing-aware camera-facing square shader', () => {
    const material = createFlameMaterial('#ffaa33');

    expect(material.vertexShader).toContain('USE_INSTANCING');
    expect(material.vertexShader).toContain('instanceMatrix');
    expect(material.vertexShader).toContain('camRight');
    expect(material.vertexShader).not.toContain('rotationMatrix');
  });
});

describe('Flame', () => {
  it('is a GameObject carrying a private flame mesh child', () => {
    const flame = new Flame(new MockScene());

    expect(flame).toBeInstanceOf(GameObject);
    expect(flameMesh(flame)).toBeInstanceOf(THREE.Mesh);
  });

  it('reuses one shared geometry and material across default instances', () => {
    const scene = new MockScene();
    const a = flameMesh(new Flame(scene));
    const b = flameMesh(new Flame(scene));

    expect(a.geometry).toBe(b.geometry);
    expect(a.material).toBe(b.material);
  });

  it('creates a private material when given a custom color', () => {
    const scene = new MockScene();
    const shared = flameMesh(new Flame(scene));
    const custom = flameMesh(new Flame(scene, { color: '#00ff00' }));

    expect(custom.material).not.toBe(shared.material);
    expect(custom.material.uniforms.uColor.value.getHexString()).toBe('00ff00');
  });

  it('applies scale through the object transform', () => {
    const flame = new Flame(new MockScene(), { color: '#ffaa33', scale: 3 });

    expect(flame.scale.x).toBe(3);
  });

  it('advances uTime from its update loop', () => {
    const flame = new Flame(new MockScene(), { color: '#ffaa33' });

    flame.update(0.016);

    expect(flameMesh(flame).material.uniforms.uTime.value).toBeGreaterThan(0);
  });

  it('adds its own point light once awake by default', () => {
    const scene = new MockScene();
    const flame = new Flame(scene, { light: { intensity: 3, distance: 7 } });
    scene.add(flame);

    const light = flamePointLight(flame);
    expect(light).toBeDefined();
    expect(light?.intensity).toBe(3);
    expect(light?.distance).toBe(7);
  });

  it('borrows from the scene light pool when asked and releases it on destroy', () => {
    const scene = new MockScene();
    const flame = new Flame(scene, { light: { useLightPool: true, intensity: 4 } });
    scene.add(flame);

    expect(flamePointLight(flame)?.intensity).toBe(4);

    scene.remove(flame);

    expect(flamePointLight(flame)).toBeUndefined();
  });

  it('defaults to a full square count', () => {
    const flame = new Flame(new MockScene(), { color: '#ffaa33' });

    expect(flameMesh(flame).geometry.getAttribute('position').count).toBe(
      DEFAULT_FLAME_PARTICLE_COUNT * VERTICES_PER_PARTICLE
    );
  });
});

describe('createFlameInstancedMesh', () => {
  it('returns an InstancedMesh with the requested instance count', () => {
    const mesh = createFlameInstancedMesh(500);

    expect(mesh).toBeInstanceOf(THREE.InstancedMesh);
    expect(mesh.count).toBe(500);
  });

  it('disables frustum culling since squares animate outside local bounds', () => {
    const mesh = createFlameInstancedMesh(10);

    expect(mesh.frustumCulled).toBe(false);
  });

  it('shares one geometry and material across all instances', () => {
    const mesh = createFlameInstancedMesh(64, { particleCount: 40 });

    expect(mesh.geometry.getAttribute('position').count).toBe(40 * VERTICES_PER_PARTICLE);
    expect(mesh.material.uniforms.uColor.value.getHexString()).toBe('ffaa33');
  });
});
