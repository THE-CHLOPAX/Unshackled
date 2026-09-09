import { Mock } from 'moq.ts';
import * as THREE from 'three';
import { PhysicsManager, ResourceTracker } from '@tgdf';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { Scene } from './Scene';
import { NavMeshManager } from '../NavMeshManager';
import { MockCamera } from '../testUtils/MockCamera';
import { GameObject } from '../GameObject/GameObject';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

class TestScene extends Scene {
  public camera = new MockCamera();
  public onUpdateSpy = vi.fn();

  protected override onUpdate(deltaTime: number): void {
    this.onUpdateSpy(deltaTime);
  }
}

class TestGameObject extends GameObject {
  public onUpdateSpy = vi.fn();

  protected override onUpdate(deltaTime: number): void {
    this.onUpdateSpy(deltaTime);
  }
}

describe('Scene', () => {
  let scene: TestScene;

  beforeEach(() => {
    scene = new TestScene();
    ResourceTracker.resourcesForObjects.clear();
    vi.spyOn(ResourceTracker, 'trackObject');
    vi.spyOn(ResourceTracker, 'disposeObjectResources');
    vi.spyOn(ResourceTracker, 'untrackObject');
  });

  afterEach(() => {
    ResourceTracker.resourcesForObjects.clear();
    vi.restoreAllMocks();
  });

  describe('update', () => {
    it('updates the camera when it exposes an update method', () => {
      scene.update(0.16, null);

      expect(scene.camera.update).toHaveBeenCalledOnce();
    });

    it('updates all GameObject children in the scene hierarchy', () => {
      const gameObjectA = new TestGameObject({ scene });
      const gameObjectB = new TestGameObject({ scene });
      scene.add(gameObjectA, gameObjectB);

      scene.update(0.16, null);

      expect(gameObjectA.onUpdateSpy).toHaveBeenCalledWith(0.16);
      expect(gameObjectB.onUpdateSpy).toHaveBeenCalledWith(0.16);
    });

    it('skips GameObjects constructed with skipUpdate', () => {
      const updated = new TestGameObject({ scene });
      const skipped = new TestGameObject({ scene, skipUpdate: true });
      scene.add(updated, skipped);

      scene.update(0.16, null);

      expect(updated.onUpdateSpy).toHaveBeenCalledWith(0.16);
      expect(skipped.onUpdateSpy).not.toHaveBeenCalled();
    });

    it('updates and syncs the physics manager', () => {
      const mockPhysicsManager = new Mock<PhysicsManager>()
        .setup((m) => m.update)
        .returns(vi.fn())
        .setup((m) => m.syncDynamicBodies)
        .returns(vi.fn())
        .object();

      scene['_physicsManager'] = mockPhysicsManager;

      scene.update(0.16, null);

      expect(mockPhysicsManager.update).toHaveBeenCalledWith(0.16);
      expect(mockPhysicsManager.syncDynamicBodies).toHaveBeenCalledOnce();
    });

    it('updates the nav mesh manager when it is initialized', () => {
      const mockNavMeshManager = new Mock<NavMeshManager>()
        .setup((m) => m.update)
        .returns(vi.fn())
        .object();

      scene['_navMeshManager'] = mockNavMeshManager;

      scene.update(0.16, null);

      expect(mockNavMeshManager.update).toHaveBeenCalledWith(0.16);
    });

    it('triggers the update event and calls onUpdate', () => {
      const updateHandler = vi.fn();
      scene.events.on('update', updateHandler);

      scene.update(0.25, null);

      expect(updateHandler).toHaveBeenCalledWith({ deltaTime: 0.25 });
      expect(scene.onUpdateSpy).toHaveBeenCalledWith(0.25);
    });
  });

  describe('add', () => {
    it('tracks resources for added 3D objects', () => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());

      scene.add(mesh);

      expect(ResourceTracker.trackObject).toHaveBeenCalledWith(mesh);
      expect(ResourceTracker.resourcesForObjects.has(mesh.uuid)).toBe(true);
    });
  });

  describe('remove', () => {
    it('disposes and untracks resources for removed 3D objects', () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial();
      const mesh = new THREE.Mesh(geometry, material);
      const geometryDisposeSpy = vi.spyOn(geometry, 'dispose');
      const materialDisposeSpy = vi.spyOn(material, 'dispose');

      scene.add(mesh);
      scene.remove(mesh);

      expect(ResourceTracker.disposeObjectResources).toHaveBeenCalledWith(mesh);
      expect(ResourceTracker.untrackObject).toHaveBeenCalledWith(mesh);
      expect(geometryDisposeSpy).toHaveBeenCalledOnce();
      expect(materialDisposeSpy).toHaveBeenCalledOnce();
      expect(ResourceTracker.resourcesForObjects.has(mesh.uuid)).toBe(false);
    });

    it('destroys GameObject instances when they are removed from the scene', () => {
      const gameObject = new TestGameObject({ scene });
      const destroySpy = vi.spyOn(gameObject, 'destroy');

      scene.add(gameObject);

      expect(scene.children).toEqual([scene.lightPool.root, gameObject]);

      scene.remove(gameObject);

      expect(destroySpy).toHaveBeenCalledOnce();
      expect(scene.children).toEqual([scene.lightPool.root]);
    });

    it('destroys nested GameObject instances when they are removed from the scene', () => {
      const gameObject = new TestGameObject({ scene });
      const childObject3D = new THREE.Object3D();
      const nestedGameObject = new TestGameObject({ scene });
      const destroySpy = vi.spyOn(nestedGameObject, 'destroy');

      childObject3D.add(nestedGameObject);
      gameObject.add(childObject3D);

      scene.add(gameObject);
      scene.remove(gameObject);

      expect(destroySpy).toHaveBeenCalledOnce();
      expect(scene.children).toEqual([scene.lightPool.root]);
    });
  });

  describe('dispose', () => {
    it('removes all event listeners', () => {
      const updateHandler = vi.fn();
      scene.events.on('update', updateHandler);

      scene.dispose();
      scene.events.trigger('update', { deltaTime: 0.16 });

      expect(updateHandler).not.toHaveBeenCalled();
      expect(scene.events.listeners).toHaveLength(0);
    });

    it('removes all children from the scene', () => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
      const gameObject = new TestGameObject({ scene });

      scene.add(mesh, gameObject);

      expect(scene.children).toEqual([scene.lightPool.root, mesh, gameObject]);

      scene.dispose();

      expect(scene.children).toHaveLength(0);
    });

    it('disposes the physics manager when it is initialized', () => {
      const mockPhysicsManager = new Mock<PhysicsManager>()
        .setup((m) => m.dispose)
        .returns(vi.fn())
        .object();

      scene['_physicsManager'] = mockPhysicsManager;

      scene.dispose();

      expect(mockPhysicsManager.dispose).toHaveBeenCalledOnce();
    });

    it('disposes the nav mesh manager when it is initialized', () => {
      const mockNavMeshManager = new Mock<NavMeshManager>()
        .setup((m) => m.dispose)
        .returns(vi.fn())
        .object();

      scene['_navMeshManager'] = mockNavMeshManager;

      scene.dispose();

      expect(mockNavMeshManager.dispose).toHaveBeenCalledOnce();
    });

    it('disposes and untracks tracked resources in ResourceTracker', () => {
      const meshA = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
      const meshB = new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshStandardMaterial());

      scene.add(meshA, meshB);
      expect(ResourceTracker.resourcesForObjects.size).toBe(2);

      scene.dispose();

      expect(ResourceTracker.disposeObjectResources).toHaveBeenCalledWith(meshA);
      expect(ResourceTracker.disposeObjectResources).toHaveBeenCalledWith(meshB);
      expect(ResourceTracker.untrackObject).toHaveBeenCalledWith(meshA);
      expect(ResourceTracker.untrackObject).toHaveBeenCalledWith(meshB);

      expect(ResourceTracker.resourcesForObjects.size).toBe(0);
    });
  });
});
