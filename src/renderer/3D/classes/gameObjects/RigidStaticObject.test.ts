import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { assert, describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

import { Scene, GameObject, RigidBody } from '@tgdf';
import { MockCamera } from '@tgdf/internal-3d/testUtils/MockCamera';

import { RigidStaticObject } from './RigidStaticObject';

class MockScene extends Scene {
  camera = new MockCamera();
}

async function dropBoxAt(scene: MockScene, x: number, z: number, startY = 3): Promise<number> {
  const dynamicObject = new GameObject({ scene });
  dynamicObject.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()));
  dynamicObject.position.set(x, startY, z);
  scene.add(dynamicObject);

  const dynamicBody = new RigidBody(dynamicObject, { type: 'dynamic', colliderShape: 'box' });
  dynamicObject.addComponent('RigidBody', dynamicBody);
  dynamicObject.update(0);

  for (let i = 0; i < 300; i++) {
    scene.physics?.update(1 / 60);
    scene.physics?.syncDynamicBodies();
  }

  return dynamicObject.position.y;
}

async function createScene(): Promise<MockScene> {
  const scene = new MockScene();
  await scene.initializePhysicsWorld(new THREE.Vector3(0, -9.81, 0));
  return scene;
}

function createRigidStaticObject(
  scene: MockScene,
  position: THREE.Vector3,
  size: THREE.Vector3
): RigidStaticObject {
  const source = new THREE.Mesh(
    new THREE.BoxGeometry(size.x, size.y, size.z),
    new THREE.MeshBasicMaterial()
  );
  const rigidStaticObject = new RigidStaticObject(scene, { position, source });
  scene.add(rigidStaticObject);
  rigidStaticObject.update(0);
  return rigidStaticObject;
}

describe('RigidStaticObject', () => {
  beforeAll(async () => {
    await RAPIER.init();
  });

  it('builds a static collider at the given position and size, away from local origin', async () => {
    const scene = await createScene();
    const RigidStaticObject = createRigidStaticObject(
      scene,
      new THREE.Vector3(100, 0, 100),
      new THREE.Vector3(20, 0.1, 20)
    );

    const collider =
      RigidStaticObject.getGameObjectComponentByType(RigidBody)?.getPhysicsCollider();
    assert(collider !== null && collider !== undefined, 'Collider was not created');

    const translation = collider.translation();
    expect(translation.x).toBeCloseTo(100);
    expect(translation.y).toBeCloseTo(0);
    expect(translation.z).toBeCloseTo(100);

    const halfExtents = collider.halfExtents();
    expect(halfExtents.x * 2).toBeCloseTo(20);
    expect(halfExtents.z * 2).toBeCloseTo(20);

    const debugMesh = RigidStaticObject.getGameObjectComponentByType(RigidBody)?.getDebugMesh();
    assert(debugMesh !== null && debugMesh !== undefined, 'Debug mesh was not created');
    const debugMeshWorldPosition = debugMesh.getWorldPosition(new THREE.Vector3());
    expect(debugMeshWorldPosition.x).toBeCloseTo(100);
    expect(debugMeshWorldPosition.z).toBeCloseTo(100);
  });

  it('derives an oriented box collider from a geometry and its instance matrix', async () => {
    const scene = await createScene();

    const geometry = new THREE.BoxGeometry(2, 4, 6);
    const rotation = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      Math.PI / 2
    );
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(10, 5, -3),
      rotation,
      new THREE.Vector3(1, 1, 3)
    );

    const object = new RigidStaticObject(scene, { geometry, matrix });
    scene.add(object);
    object.update(0);

    const collider = object.getGameObjectComponentByType(RigidBody)?.getPhysicsCollider();
    assert(collider !== null && collider !== undefined, 'Collider was not created');

    const halfExtents = collider.halfExtents();
    expect(halfExtents.x * 2).toBeCloseTo(2);
    expect(halfExtents.y * 2).toBeCloseTo(4);
    expect(halfExtents.z * 2).toBeCloseTo(18);

    const translation = collider.translation();
    expect(translation.x).toBeCloseTo(10);
    expect(translation.y).toBeCloseTo(5);
    expect(translation.z).toBeCloseTo(-3);

    const colliderRotation = collider.rotation();
    expect(colliderRotation.y).toBeCloseTo(rotation.y);
    expect(colliderRotation.w).toBeCloseTo(rotation.w);
  });

  it('stops a dynamic body dropped above the floor from falling through it', async () => {
    const scene = await createScene();
    createRigidStaticObject(scene, new THREE.Vector3(0, 0, 0), new THREE.Vector3(20, 0.1, 20));

    const finalY = await dropBoxAt(scene, 0, 0);

    expect(finalY).toBeGreaterThan(0);
    expect(finalY).toBeLessThan(2);
  });

  it('stops a dynamic body from falling through a floor positioned far from local origin', async () => {
    const scene = await createScene();
    createRigidStaticObject(scene, new THREE.Vector3(100, 0, 100), new THREE.Vector3(20, 0.1, 20));

    const finalY = await dropBoxAt(scene, 100, 100);

    expect(finalY).toBeGreaterThan(0);
    expect(finalY).toBeLessThan(2);
  });

  it('does not create a collider that catches bodies dropped well outside the floor footprint', async () => {
    const scene = await createScene();
    createRigidStaticObject(scene, new THREE.Vector3(100, 0, 100), new THREE.Vector3(20, 0.1, 20));

    const finalY = await dropBoxAt(scene, -500, -500);

    expect(finalY).toBeLessThan(-50);
  });
});
