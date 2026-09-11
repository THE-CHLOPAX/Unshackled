import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { Crowd, NavMesh } from '@recast-navigation/core';
import { Emitter, GameObject, RigidBody, useAssetStore } from '@tgdf';
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

import { gsap } from 'gsap';

import { ARCANE_CIRCLE_TEXTURE } from '3D/constants';

import { Entity } from './Entity';
import { Spawner, SpawnerOptions } from './Spawner';
import { MockGameScene } from '../scenes/GameScene/MockGameScene';
import { HealthPointsController } from '../gameObjectComponents/HealthPointsController';

type FakeEntityEvents = { death: void };

class FakeSpawnedEntity extends GameObject {
  public healthPointsController = { events: new Emitter<FakeEntityEvents>() };
}

async function createReadyScene(): Promise<MockGameScene> {
  const scene = new MockGameScene();
  await scene.initializePhysicsWorld(new THREE.Vector3(0, 0, 0));
  return scene;
}

function stubNavMesh(scene: MockGameScene): void {
  vi.spyOn(scene, 'navMeshManager', 'get').mockReturnValue({
    navMesh: {} as NavMesh,
    getCrowd: () => ({}) as Crowd,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

function createSpawner(
  scene: MockGameScene,
  overrides: Partial<SpawnerOptions> = {},
  entityFactory: () => Entity = () => new FakeSpawnedEntity({ scene }) as unknown as Entity
): { spawner: Spawner; spawnedEntities: Entity[] } {
  const spawnedEntities: Entity[] = [];

  const spawner = new Spawner(scene, {
    entityFactory: () => {
      const entity = entityFactory();
      spawnedEntities.push(entity);
      return entity;
    },
    telegraphDiameter: 1.5,
    telegraphDurationSeconds: 3,
    spawnIntervalSeconds: 20,
    maxSpawnedEntities: 2,
    maxAliveEntities: 1,
    spawnHitbox: { size: new THREE.Vector3(1, 1, 1), damage: 10 },
    ...overrides,
  });

  scene.add(spawner);
  return { spawner, spawnedEntities };
}

describe('Spawner', () => {
  beforeAll(async () => {
    await RAPIER.init();
  });

  beforeEach(() => {
    useAssetStore.getState().textureCache.set(ARCANE_CIRCLE_TEXTURE, new THREE.Texture());
  });

  afterEach(() => {
    useAssetStore.getState().textureCache.clear();
    vi.restoreAllMocks();
  });

  it('does not spawn while the nav mesh or crowd are unavailable', async () => {
    const scene = await createReadyScene();
    const { spawner, spawnedEntities } = createSpawner(scene);

    spawner.update(0);
    spawner.update(100);

    expect(spawnedEntities).toHaveLength(0);
  });

  it('spawns the first entity once the telegraph duration elapses', async () => {
    const scene = await createReadyScene();
    stubNavMesh(scene);
    vi.spyOn(gsap, 'delayedCall').mockImplementation(
      () => ({}) as unknown as gsap.core.Tween
    );
    const { spawner, spawnedEntities } = createSpawner(scene);

    spawner.update(0);
    expect(spawnedEntities).toHaveLength(0);

    spawner.update(3);
    expect(spawnedEntities).toHaveLength(1);
    expect(scene.children).toContain(spawnedEntities[0]);
  });

  it('never spawns more than maxSpawnedEntities, even once entities die', async () => {
    const scene = await createReadyScene();
    stubNavMesh(scene);
    vi.spyOn(gsap, 'delayedCall').mockImplementation(
      () => ({}) as unknown as gsap.core.Tween
    );
    const { spawner, spawnedEntities } = createSpawner(scene, {
      maxSpawnedEntities: 2,
      maxAliveEntities: 5,
      spawnIntervalSeconds: 1,
    });

    spawner.update(0);
    spawner.update(3);
    expect(spawnedEntities).toHaveLength(1);

    // The interval elapsing only begins a second telegraph; the entity
    // appears once that telegraph itself finishes.
    spawner.update(1);
    expect(spawnedEntities).toHaveLength(1);
    spawner.update(3);
    expect(spawnedEntities).toHaveLength(2);

    // A third interval elapsing must not produce a third entity: the cap is 2.
    spawner.update(1);
    spawner.update(3);
    expect(spawnedEntities).toHaveLength(2);
  });

  it('does not begin a new spawn interval while at maxAliveEntities, and resumes once an entity dies', async () => {
    const scene = await createReadyScene();
    stubNavMesh(scene);
    vi.spyOn(gsap, 'delayedCall').mockImplementation(
      () => ({}) as unknown as gsap.core.Tween
    );
    const { spawner, spawnedEntities } = createSpawner(scene, {
      maxSpawnedEntities: 5,
      maxAliveEntities: 1,
      spawnIntervalSeconds: 1,
    });

    spawner.update(0);
    spawner.update(3);
    expect(spawnedEntities).toHaveLength(1);

    // Still at maxAliveEntities (1), so the interval never starts counting down.
    spawner.update(1);
    spawner.update(1);
    expect(spawnedEntities).toHaveLength(1);

    spawnedEntities[0].healthPointsController.events.trigger('death');

    // Once the entity dies, the interval starts again and a new telegraph
    // begins; the second entity appears once that telegraph finishes.
    spawner.update(1);
    expect(spawnedEntities).toHaveLength(1);
    spawner.update(3);
    expect(spawnedEntities).toHaveLength(2);
  });

  it('drops a DamageHitbox attributed to the spawner at the spawn point, dealing the configured damage', async () => {
    const scene = await createReadyScene();
    stubNavMesh(scene);

    const delayedCallSpy = vi
      .spyOn(gsap, 'delayedCall')
      .mockImplementation(() => ({}) as unknown as gsap.core.Tween);

    const { spawner, spawnedEntities } = createSpawner(scene, {
      spawnHitbox: { size: new THREE.Vector3(1, 1, 1), damage: 42 },
    });

    const target = new GameObject({ scene });
    target.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()));
    scene.add(target);
    const targetRigidBody = target.addComponent(
      'RigidBody',
      new RigidBody(target, { enableCollisionDetection: true })
    );
    const healthPointsController = target.addComponent(
      'HealthPointsController',
      new HealthPointsController(target as unknown as Entity, { initialHealthPoints: 100 })
    );
    target.update(0);

    const physics = scene.physics;
    if (!physics) throw new Error('Physics manager is undefined');

    let physicsCallback: (h1: number, h2: number, started: boolean) => void = () => {};
    vi.spyOn(physics, 'onCollision').mockImplementation((cb) => {
      physicsCallback = cb;
      return () => {};
    });

    spawner.update(0);
    spawner.update(3);
    expect(spawnedEntities).toHaveLength(1);

    const hitbox = scene.children.find(
      (child) => child instanceof GameObject && child.name === 'DamageHitbox'
    ) as GameObject | undefined;
    if (!hitbox) throw new Error('Spawn hitbox not found in scene');

    const hitboxRigidBody = hitbox.getGameObjectComponentByType(RigidBody);
    if (!hitboxRigidBody) throw new Error('Hitbox has no RigidBody');

    const hitboxHandle = hitboxRigidBody.getHandle();
    const targetHandle = targetRigidBody.getHandle();
    if (hitboxHandle === null || targetHandle === null) {
      throw new Error('Missing physics handle');
    }

    const inflictDamageSpy = vi.spyOn(healthPointsController, 'inflictDamage');
    physicsCallback(hitboxHandle, targetHandle, true);

    expect(inflictDamageSpy).toHaveBeenCalledWith(42);
    expect(delayedCallSpy).toHaveBeenCalledWith(expect.any(Number), expect.any(Function));

    const destroySpy = vi.spyOn(hitbox, 'destroy');
    const [, cleanup] = delayedCallSpy.mock.calls[delayedCallSpy.mock.calls.length - 1];
    (cleanup as () => void)();

    expect(destroySpy).toHaveBeenCalled();
  });
});
