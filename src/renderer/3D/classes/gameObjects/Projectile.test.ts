import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { assert, describe, it, expect, vi, beforeAll } from 'vitest';
import { GameObject, PhysicsManager, RigidBody, RigidBodyCollisionParams } from '@tgdf';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

import { Mock } from 'moq.ts';

import { Entity } from './Entity';
import { Projectile, ProjectileOptions } from './Projectile';
import { MockGameScene } from '../scenes/GameScene/MockGameScene';
import { ModelRenderer } from '../gameObjectComponents/ModelRenderer/ModelRenderer';

class MockScene extends MockGameScene {}

/**
 * Exposes Projectile's overridable onCollision/onMaxRangeReached hooks as spies,
 * mirroring how a real subclass (e.g. SacredOrb) would implement them.
 */
class TestProjectile extends Projectile {
  public onCollisionSpy = vi.fn<(gameObject: GameObject) => void>();
  public onMaxRangeReachedSpy = vi.fn<() => void>();

  protected override onCollision({ otherBody }: RigidBodyCollisionParams): boolean {
    this.onCollisionSpy(otherBody.gameObject);
    return true;
  }

  protected override onMaxRangeReached(): void {
    this.onMaxRangeReachedSpy();
  }
}

function createModel(): THREE.Object3D {
  const model = new THREE.Group();
  model.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()));
  return model;
}

async function createProjectile(
  scene: MockScene,
  overrides: Partial<Omit<ProjectileOptions, 'model'>> = {},
  model: THREE.Object3D = createModel()
): Promise<TestProjectile> {
  const mockEntity = new Mock<Entity>().object();

  const projectile = new TestProjectile(scene, {
    sender: mockEntity,
    model,
    speed: 10,
    maxRange: 5,
    rigidBodyOptions: { enableCollisionDetection: true },
    ...overrides,
  });

  scene.add(projectile);
  // Triggers onAwake -> RigidBody physics body creation
  projectile.update(0);

  return projectile;
}

function getRigidBody(projectile: Projectile): RigidBody {
  const rigidBody = projectile.getGameObjectComponentByType(RigidBody);
  assert(rigidBody !== undefined, 'Projectile has no RigidBody component');
  return rigidBody;
}

async function setupCollisionScene(
  options: {
    maxRange?: number;
    senderIsOther?: boolean;
  } = {}
): Promise<{
  projectile: TestProjectile;
  otherRigidBody: RigidBody;
  physics: PhysicsManager;
}> {
  const scene = new MockScene();
  await scene.initializePhysicsWorld(new THREE.Vector3(0, 0, 0));

  const otherGameObject = new GameObject({ scene });
  otherGameObject.add(
    new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial())
  );
  scene.add(otherGameObject);
  const otherRigidBody = otherGameObject.addComponent(
    'RigidBody',
    new RigidBody(otherGameObject, { enableCollisionDetection: true })
  );
  otherGameObject.update(0);

  const projectile = await createProjectile(scene, {
    ...(options.maxRange !== undefined && { maxRange: options.maxRange }),
    ...(options.senderIsOther && { sender: otherGameObject as unknown as Entity }),
  });

  const physics = scene.physics;
  assert(physics !== undefined, 'Physics manager is undefined');

  return {
    projectile,
    otherRigidBody,
    physics,
  };
}

describe('Projectile', () => {
  beforeAll(async () => {
    await RAPIER.init();
  });

  it('spawns in the scene without problems', async () => {
    const scene = new MockScene();
    await scene.initializePhysicsWorld(new THREE.Vector3(0, 0, 0));
    const model = createModel();

    const projectile = await createProjectile(scene, {}, model);

    expect(scene.children).toContain(projectile);
    expect(getRigidBody(projectile).getRigidBody()).not.toBeNull();

    const modelRenderer = projectile.getGameObjectComponentByType(ModelRenderer);
    assert(modelRenderer !== undefined, 'Projectile has no ModelRenderer component');
    expect(modelRenderer.getModel()).toBe(model);
    expect(projectile.children).toContain(model);
  });

  it('can be launched in a given direction', async () => {
    const scene = new MockScene();
    await scene.initializePhysicsWorld(new THREE.Vector3(0, 0, 0));
    const projectile = await createProjectile(scene, { speed: 10 });

    projectile.sendTowards(new THREE.Vector3(3, 0, 4));
    projectile.update(1);

    // normalize(3, 0, 4) === (0.6, 0, 0.8); scaled by speed(10) and deltaTime(1) === (6, 0, 8)
    expect(projectile.position.x).toBeCloseTo(6);
    expect(projectile.position.y).toBeCloseTo(0);
    expect(projectile.position.z).toBeCloseTo(8);
  });

  it('can be moved around before launching', async () => {
    const scene = new MockScene();
    await scene.initializePhysicsWorld(new THREE.Vector3(0, 0, 0));
    const projectile = await createProjectile(scene, { maxRange: 5 });

    projectile.position.set(10, 0, 0);
    projectile.sendTowards(new THREE.Vector3(1, 0, 0));

    // still within maxRange of the repositioned launch origin (10, 0, 0)
    projectile.position.set(12, 0, 0);
    projectile.update(0);
    expect(projectile.onMaxRangeReachedSpy).not.toHaveBeenCalled();

    // now exceeds maxRange measured from the repositioned launch origin
    projectile.position.set(16, 0, 0);
    projectile.update(0);
    expect(projectile.onMaxRangeReachedSpy).toHaveBeenCalledOnce();
  });

  it('calls onCollision when it collides with another rigidbody', async () => {
    const { projectile, otherRigidBody, physics } = await setupCollisionScene();

    let physicsCallback: (h1: number, h2: number, started: boolean) => void = () => {};
    vi.spyOn(physics, 'onCollision').mockImplementation((cb) => {
      physicsCallback = cb;
      return () => {};
    });

    projectile.sendTowards(new THREE.Vector3(1, 0, 0));

    const projectileHandle = getRigidBody(projectile).getHandle();
    const otherHandle = otherRigidBody.getHandle();
    const otherGameObject = otherRigidBody.gameObject;
    assert(projectileHandle !== null, 'Projectile handle is null');
    assert(otherHandle !== null, 'Other handle is null');

    physicsCallback(projectileHandle, otherHandle, true);

    expect(projectile.onCollisionSpy).toHaveBeenCalledWith(otherGameObject);
  });

  it('calls onMaxRangeReached when its distance from the launch position exceeds maxRange', async () => {
    const scene = new MockScene();
    await scene.initializePhysicsWorld(new THREE.Vector3(0, 0, 0));
    const projectile = await createProjectile(scene, { maxRange: 5 });

    projectile.sendTowards(new THREE.Vector3(1, 0, 0));

    projectile.position.set(3, 0, 0);
    projectile.update(0);
    expect(projectile.onMaxRangeReachedSpy).not.toHaveBeenCalled();

    projectile.position.set(6, 0, 0);
    projectile.update(0);
    expect(projectile.onMaxRangeReachedSpy).toHaveBeenCalledOnce();
  });

  it('calls onMaxRangeReached after calling onCollision', async () => {
    const maxRange = 5;
    const { projectile, otherRigidBody, physics } = await setupCollisionScene({ maxRange });

    let physicsCallback: (h1: number, h2: number, started: boolean) => void = () => {};
    vi.spyOn(physics, 'onCollision').mockImplementation((cb) => {
      physicsCallback = cb;
      return () => {};
    });

    projectile.sendTowards(new THREE.Vector3(1, 0, 0));

    const projectileHandle = getRigidBody(projectile).getHandle();
    const otherHandle = otherRigidBody.getHandle();
    const otherGameObject = otherRigidBody.gameObject;
    assert(projectileHandle !== null, 'Projectile handle is null');
    assert(otherHandle !== null, 'Other handle is null');

    physicsCallback(projectileHandle, otherHandle, true);

    expect(projectile.onCollisionSpy).toHaveBeenCalledWith(otherGameObject);

    projectile.position.set(6, 0, 0);
    projectile.update(0);

    expect(projectile.onMaxRangeReachedSpy).toHaveBeenCalledOnce();
  });
});
