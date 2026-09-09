import * as THREE from 'three';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ResourceTracker } from './ResourceTracker';

function getTrackedResources(tracker: ResourceTracker, object: THREE.Object3D) {
  const resources = tracker.resourcesForObjects.get(object.uuid);
  expect(resources).toBeDefined();
  return resources as Set<THREE.BufferGeometry | THREE.Material | THREE.Texture | THREE.Skeleton>;
}

describe('ResourceTracker', () => {
  let tracker: ResourceTracker;

  beforeEach(() => {
    tracker = new ResourceTracker();
  });

  describe('trackObject', () => {
    it('stores all disposable resources for a mesh object', () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial();
      const mesh = new THREE.Mesh(geometry, material);

      tracker.trackObject(mesh);

      const resources = getTrackedResources(tracker, mesh);
      expect(resources.has(geometry)).toBe(true);
      expect(resources.has(material)).toBe(true);
    });

    it('skips resources marked persistent', () => {
      const sharedGeometry = new THREE.BoxGeometry(1, 1, 1);
      const sharedTexture = new THREE.Texture();
      const sharedMaterial = new THREE.MeshBasicMaterial({ map: sharedTexture });
      tracker.markPersistent(sharedGeometry);
      tracker.markPersistent(sharedMaterial);

      const ownMaterial = new THREE.MeshBasicMaterial();
      const mesh = new THREE.Mesh(sharedGeometry, [sharedMaterial, ownMaterial]);

      tracker.trackObject(mesh);
      const resources = getTrackedResources(tracker, mesh);

      expect(resources.has(sharedGeometry)).toBe(false);
      expect(resources.has(sharedMaterial)).toBe(false);
      expect(resources.has(sharedTexture)).toBe(false);
      expect(resources.has(ownMaterial)).toBe(true);
    });

    it('does not dispose persistent resources on disposeObjectResources', () => {
      const sharedGeometry = new THREE.BoxGeometry(1, 1, 1);
      const disposeSpy = vi.spyOn(sharedGeometry, 'dispose');
      tracker.markPersistent(sharedGeometry);
      const mesh = new THREE.Mesh(sharedGeometry, new THREE.MeshBasicMaterial());

      tracker.trackObject(mesh);
      tracker.disposeObjectResources(mesh);

      expect(disposeSpy).not.toHaveBeenCalled();
    });

    it('stores all disposable resources for nested meshes on a parent object', () => {
      const geometryA = new THREE.BoxGeometry(1, 1, 1);
      const materialA = new THREE.MeshBasicMaterial();
      const meshA = new THREE.Mesh(geometryA, materialA);

      const geometryB = new THREE.SphereGeometry(1);
      const materialB = new THREE.MeshStandardMaterial();
      const meshB = new THREE.Mesh(geometryB, materialB);

      const group = new THREE.Group();
      group.add(meshA, meshB);

      tracker.trackObject(group);

      const resources = getTrackedResources(tracker, group);
      expect(resources.has(geometryA)).toBe(true);
      expect(resources.has(materialA)).toBe(true);
      expect(resources.has(geometryB)).toBe(true);
      expect(resources.has(materialB)).toBe(true);
    });

    it('stores textures referenced by materials', () => {
      const texture = new THREE.Texture();
      const material = new THREE.MeshStandardMaterial({ map: texture });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);

      tracker.trackObject(mesh);

      const resources = getTrackedResources(tracker, mesh);
      expect(resources.has(texture)).toBe(true);
      expect(resources.has(material)).toBe(true);
    });

    it('stores textures from shader material uniforms', () => {
      const texture = new THREE.Texture();
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: texture },
        },
      });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);

      tracker.trackObject(mesh);

      const resources = getTrackedResources(tracker, mesh);
      expect(resources.has(texture)).toBe(true);
    });

    it('stores all materials when a mesh uses a material array', () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const materials = [new THREE.MeshBasicMaterial(), new THREE.MeshStandardMaterial()];
      const mesh = new THREE.Mesh(geometry, materials);

      tracker.trackObject(mesh);

      const resources = getTrackedResources(tracker, mesh);
      expect(resources.has(materials[0])).toBe(true);
      expect(resources.has(materials[1])).toBe(true);
      expect(resources.has(geometry)).toBe(true);
    });

    it('stores the skeleton of a SkinnedMesh', () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const bone = new THREE.Bone();
      const skeleton = new THREE.Skeleton([bone]);
      const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshStandardMaterial());
      mesh.add(bone);
      mesh.bind(skeleton);

      tracker.trackObject(mesh);

      const resources = getTrackedResources(tracker, mesh);
      expect(resources.has(mesh.skeleton)).toBe(true);
    });
  });

  describe('disposeObjectResources', () => {
    it('disposes all tracked disposable resources for the object', () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const texture = new THREE.Texture();
      const material = new THREE.MeshStandardMaterial({ map: texture });
      const mesh = new THREE.Mesh(geometry, material);

      const geometryDisposeSpy = vi.spyOn(geometry, 'dispose');
      const materialDisposeSpy = vi.spyOn(material, 'dispose');
      const textureDisposeSpy = vi.spyOn(texture, 'dispose');

      tracker.trackObject(mesh);
      tracker.disposeObjectResources(mesh);

      expect(geometryDisposeSpy).toHaveBeenCalledOnce();
      expect(materialDisposeSpy).toHaveBeenCalledOnce();
      expect(textureDisposeSpy).toHaveBeenCalledOnce();
    });

    it('disposes all nested mesh resources for a parent object', () => {
      const geometryA = new THREE.BoxGeometry(1, 1, 1);
      const materialA = new THREE.MeshBasicMaterial();
      const meshA = new THREE.Mesh(geometryA, materialA);

      const geometryB = new THREE.SphereGeometry(1);
      const materialB = new THREE.MeshStandardMaterial();
      const meshB = new THREE.Mesh(geometryB, materialB);

      const group = new THREE.Group();
      group.add(meshA, meshB);

      const geometryADisposeSpy = vi.spyOn(geometryA, 'dispose');
      const materialADisposeSpy = vi.spyOn(materialA, 'dispose');
      const geometryBDisposeSpy = vi.spyOn(geometryB, 'dispose');
      const materialBDisposeSpy = vi.spyOn(materialB, 'dispose');

      tracker.trackObject(group);
      tracker.disposeObjectResources(group);

      expect(geometryADisposeSpy).toHaveBeenCalledOnce();
      expect(materialADisposeSpy).toHaveBeenCalledOnce();
      expect(geometryBDisposeSpy).toHaveBeenCalledOnce();
      expect(materialBDisposeSpy).toHaveBeenCalledOnce();
    });

    it('removes the object entry from resourcesForObjects after disposal', () => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());

      tracker.trackObject(mesh);
      tracker.disposeObjectResources(mesh);

      expect(tracker.resourcesForObjects.has(mesh.uuid)).toBe(false);
    });

    it('does not throw when disposing an untracked object', () => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());

      expect(() => tracker.disposeObjectResources(mesh)).not.toThrow();
      expect(tracker.resourcesForObjects.has(mesh.uuid)).toBe(false);
    });

    it('disposes the skeleton of a SkinnedMesh, freeing its bone-matrix texture', () => {
      const bone = new THREE.Bone();
      const skeleton = new THREE.Skeleton([bone]);
      const mesh = new THREE.SkinnedMesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial()
      );
      mesh.add(bone);
      mesh.bind(skeleton);

      const skeletonDisposeSpy = vi.spyOn(mesh.skeleton, 'dispose');

      tracker.trackObject(mesh);
      tracker.disposeObjectResources(mesh);

      expect(skeletonDisposeSpy).toHaveBeenCalledOnce();
    });
  });
});
