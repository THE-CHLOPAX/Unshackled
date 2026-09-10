import * as THREE from 'three';
import { Mock, It, Times } from 'moq.ts';
import RAPIER from '@dimforge/rapier3d-compat';
import { assert, describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

import { Scene } from '../internal-3d/Scene/Scene';
import { RigidBody, RigidBodyOptions } from './RigidBody';
import { MockCamera } from '../internal-3d/testUtils/MockCamera';
import { GameObject } from '../internal-3d/GameObject/GameObject';

class MockScene extends Scene {
  camera = new MockCamera();
}

interface CollisionObserver {
  onCollision(thisBody: RigidBody, otherBody: RigidBody, started: boolean): void;
}

async function createRigidBody(
  options: RigidBodyOptions,
  size = new THREE.Vector3(2, 4, 6)
): Promise<{ scene: MockScene; gameObject: GameObject; rigidBody: RigidBody }> {
  const scene = new MockScene();
  await scene.initializePhysicsWorld(new THREE.Vector3(0, -9.81, 0));

  const gameObject = new GameObject({ scene });
  gameObject.add(
    new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), new THREE.MeshBasicMaterial())
  );
  scene.add(gameObject);

  const rigidBody = new RigidBody(gameObject, options);
  gameObject.addComponent('RigidBody', rigidBody);
  gameObject.update(0);

  return { scene, gameObject, rigidBody };
}

function getBoxColliderSize(collider: RAPIER.Collider): THREE.Vector3 {
  const half = collider.halfExtents();
  return new THREE.Vector3(half.x * 2, half.y * 2, half.z * 2);
}

describe('RigidBody', () => {
  beforeAll(async () => {
    await RAPIER.init();
  });

  it('syncs kinematic visual transform to physics on update', async () => {
    const { gameObject, rigidBody } = await createRigidBody({ type: 'kinematic' });
    gameObject.position.set(3, 5, 7);
    gameObject.update(0);

    const translation = rigidBody.getTranslation();
    expect(translation.x).toBeCloseTo(3);
    expect(translation.y).toBeCloseTo(5);
    expect(translation.z).toBeCloseTo(7);
  });

  it('syncs dynamic physics transform to visual via syncFromPhysics', async () => {
    const { gameObject, rigidBody } = await createRigidBody({ type: 'dynamic' });
    rigidBody.setTranslation(new THREE.Vector3(1, 2, 3));
    rigidBody.syncFromPhysics();

    expect(gameObject.position.x).toBeCloseTo(1);
    expect(gameObject.position.y).toBeCloseTo(2);
    expect(gameObject.position.z).toBeCloseTo(3);
  });

  it('creates box collider matching model bounds', async () => {
    const size = new THREE.Vector3(2, 4, 6);
    const { rigidBody } = await createRigidBody({ colliderShape: 'box' }, size);
    const collider = rigidBody.getPhysicsCollider();

    assert(collider !== null, 'Collider is null');
    expect(getBoxColliderSize(collider)).toEqual(size);

    const debugMesh = rigidBody.getDebugMesh();
    assert(debugMesh !== null, 'Debug mesh is null');
    const debugGeo = (debugMesh.geometry as THREE.BoxGeometry).parameters;

    expect(collider.shapeType()).toBe(RAPIER.ShapeType.Cuboid);
    expect(debugGeo.width).toBeCloseTo(size.x);
    expect(debugGeo.height).toBeCloseTo(size.y);
    expect(debugGeo.depth).toBeCloseTo(size.z);

    expect(debugMesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
  });

  it('creates cylinder collider from model bounds', async () => {
    const size = new THREE.Vector3(2, 4, 2);
    const { rigidBody } = await createRigidBody({ colliderShape: 'cylinder' }, size);
    const collider = rigidBody.getPhysicsCollider();

    assert(collider !== null, 'Collider is null');

    expect(collider.shapeType()).toBe(RAPIER.ShapeType.Cylinder);
    expect(collider.radius()).toBeCloseTo(1);
    expect(collider.halfHeight() * 2).toBeCloseTo(4);

    const debugMesh = rigidBody.getDebugMesh();
    assert(debugMesh !== null, 'Debug mesh is null');
    expect(debugMesh.geometry).toBeInstanceOf(THREE.CylinderGeometry);
  });

  it('creates sphere collider from model bounds', async () => {
    const size = new THREE.Vector3(2, 4, 2);
    const { rigidBody } = await createRigidBody({ colliderShape: 'sphere' }, size);
    const collider = rigidBody.getPhysicsCollider();

    assert(collider !== null, 'Collider is null');

    expect(collider.shapeType()).toBe(RAPIER.ShapeType.Ball);
    expect(collider.radius()).toBeCloseTo(2);

    const debugMesh = rigidBody.getDebugMesh();
    assert(debugMesh !== null, 'Debug mesh is null');
    expect(debugMesh.geometry).toBeInstanceOf(THREE.SphereGeometry);
  });

  it('creates trimesh collider from provided geometry', async () => {
    const geometry = new THREE.PlaneGeometry(4, 6);
    geometry.rotateX(-Math.PI / 2);

    const { rigidBody } = await createRigidBody({
      type: 'static',
      colliderShape: 'trimesh',
      colliderGeometry: geometry,
    });
    const collider = rigidBody.getPhysicsCollider();

    assert(collider !== null, 'Collider is null');
    expect(collider.shapeType()).toBe(RAPIER.ShapeType.TriMesh);
    expect(collider.vertices().length).toBe(geometry.getAttribute('position').array.length);

    const debugMesh = rigidBody.getDebugMesh();
    assert(debugMesh !== null, 'Debug mesh is null');
    expect(debugMesh.geometry).toBeInstanceOf(THREE.BufferGeometry);
    expect(debugMesh.geometry).not.toBeInstanceOf(THREE.BoxGeometry);
  });

  it('throws when creating a trimesh collider without colliderGeometry', async () => {
    await expect(createRigidBody({ colliderShape: 'trimesh' })).rejects.toThrow(
      /colliderGeometry is required/
    );
  });

  it('removes and recreates collider when updatePhysicsCollider is called', async () => {
    const { gameObject, rigidBody, scene } = await createRigidBody({ colliderShape: 'box' });
    assert(scene.physics !== undefined, 'Physics manager is undefined');
    const { world } = scene.physics;
    assert(world !== undefined, 'World is undefined');
    const removeSpy = vi.spyOn(world, 'removeCollider');
    const createSpy = vi.spyOn(world, 'createCollider');

    const debugMesh = rigidBody.getDebugMesh();
    if (debugMesh) gameObject.remove(debugMesh);

    const mesh = gameObject.children[0] as THREE.Mesh;
    mesh.geometry.dispose();
    mesh.geometry = new THREE.BoxGeometry(4, 2, 2);

    rigidBody.updatePhysicsCollider();

    const collider = rigidBody.getPhysicsCollider();
    assert(collider !== null, 'Collider is null');

    expect(removeSpy).toHaveBeenCalledOnce();
    expect(createSpy).toHaveBeenCalledOnce();
    expect(getBoxColliderSize(collider)).toEqual(new THREE.Vector3(4, 2, 2));
  });

  it('registers and removes collision listeners on physics manager', async () => {
    const { scene, rigidBody } = await createRigidBody({ enableCollisionDetection: true });
    const physics = scene.physics;
    assert(physics !== undefined, 'Physics manager is undefined');
    const onCollisionSpy = vi.spyOn(physics, 'onCollision');
    const offCollisionSpy = vi.spyOn(physics, 'offCollision');

    const observer = new Mock<CollisionObserver>()
      .setup((o) => o.onCollision(It.IsAny(), It.IsAny(), It.IsAny()))
      .returns()
      .object();

    rigidBody.addCollisionListener('hit', ({ thisBody, otherBody, started }) =>
      observer.onCollision(thisBody, otherBody, started)
    );
    expect(onCollisionSpy).toHaveBeenCalledOnce();

    rigidBody.removeCollisionListener('hit');
    expect(offCollisionSpy).toHaveBeenCalledOnce();
  });

  it('fires collision callback with both rigid bodies when physics reports a collision', async () => {
    const scene = new MockScene();
    await scene.initializePhysicsWorld(new THREE.Vector3(0, 0, 0));

    const createBody = (name: string) => {
      const gameObject = new GameObject({ scene });
      gameObject.name = name;
      gameObject.add(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial()));
      scene.add(gameObject);
      const rigidBody = new RigidBody(gameObject, { enableCollisionDetection: true });
      gameObject.addComponent('RigidBody', rigidBody);
      gameObject.update(0);
      return rigidBody;
    };

    const bodyA = createBody('a');
    const bodyB = createBody('b');
    const physics = scene.physics;
    assert(physics !== undefined, 'Physics manager is undefined');

    let physicsCallback: (h1: number, h2: number, started: boolean) => void = () => {};
    vi.spyOn(physics, 'onCollision').mockImplementation((cb) => {
      physicsCallback = cb;
      return () => {};
    });

    const observerMock = new Mock<CollisionObserver>()
      .setup((o) => o.onCollision(It.IsAny(), It.IsAny(), true))
      .returns();

    bodyA.addCollisionListener('overlap', ({ thisBody, otherBody, started }) => {
      observerMock.object().onCollision(thisBody, otherBody, started);
    });

    const handleA = bodyA?.getHandle();
    const handleB = bodyB?.getHandle();
    assert(handleA !== null, 'Body A handle is null');
    assert(handleB !== null, 'Body B handle is null');

    physicsCallback(handleA, handleB, true);

    observerMock.verify((o) => o.onCollision(It.IsAny(), It.IsAny(), true), Times.Once());
  });
});
