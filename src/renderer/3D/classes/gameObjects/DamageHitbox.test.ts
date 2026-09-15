import * as THREE from 'three';
import { GameObject, RigidBody } from '@tgdf';
import RAPIER from '@dimforge/rapier3d-compat';
import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

import { Entity } from './Entity';
import { DamageHitbox } from './DamageHitbox';
import { MockGameScene } from '../scenes/GameScene/MockGameScene';
import { HealthPointsController } from '../gameObjectComponents/HealthPointsController';

class TestScene extends MockGameScene {}

async function createReadyScene(): Promise<TestScene> {
  const scene = new TestScene();
  await scene.initializePhysicsWorld(new THREE.Vector3(0, 0, 0));
  return scene;
}

function addTarget(scene: TestScene): {
  target: GameObject;
  rigidBody: RigidBody;
  healthPointsController: HealthPointsController;
} {
  const target = new GameObject({ scene });
  target.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()));
  scene.add(target);

  const rigidBody = target.addComponent(
    'RigidBody',
    new RigidBody(target, { enableCollisionDetection: true })
  );
  const healthPointsController = target.addComponent(
    'HealthPointsController',
    new HealthPointsController(target as unknown as Entity, { initialHealthPoints: 100 })
  );
  target.update(0);

  return { target, rigidBody, healthPointsController };
}

async function setupCollision(scene: TestScene) {
  const physics = scene.physics;
  if (!physics) throw new Error('Physics manager is undefined');

  let physicsCallback: (h1: number, h2: number, started: boolean) => void = () => {};
  vi.spyOn(physics, 'onCollision').mockImplementation((cb) => {
    physicsCallback = cb;
    return () => {};
  });

  return { physicsCallback: () => physicsCallback, physics };
}

describe('DamageHitbox', () => {
  beforeAll(async () => {
    await RAPIER.init();
  });

  it('inflicts damage on a target it collides with', async () => {
    const scene = await createReadyScene();
    const { target, rigidBody: targetRigidBody, healthPointsController } = addTarget(scene);
    const { physicsCallback } = await setupCollision(scene);

    const hitbox = new DamageHitbox(scene, new THREE.Vector3(1, 1, 1), 10, () => false);
    scene.add(hitbox);
    hitbox.update(0);

    const hitboxHandle = hitbox.getGameObjectComponentByType(RigidBody)?.getHandle();
    const targetHandle = targetRigidBody.getHandle();
    if (hitboxHandle == null || targetHandle == null) throw new Error('Missing handle');

    const inflictDamageSpy = vi.spyOn(healthPointsController, 'inflictDamage');
    physicsCallback()(hitboxHandle, targetHandle, true);

    expect(inflictDamageSpy).toHaveBeenCalledWith(10);
    expect(target).toBeDefined();
  });

  it('does not inflict damage on a target matched by ignoreCondition', async () => {
    const scene = await createReadyScene();
    const { rigidBody: targetRigidBody, healthPointsController, target } = addTarget(scene);
    const { physicsCallback } = await setupCollision(scene);

    const hitbox = new DamageHitbox(
      scene,
      new THREE.Vector3(1, 1, 1),
      10,
      (other) => other === target
    );
    scene.add(hitbox);
    hitbox.update(0);

    const hitboxHandle = hitbox.getGameObjectComponentByType(RigidBody)?.getHandle();
    const targetHandle = targetRigidBody.getHandle();
    if (hitboxHandle == null || targetHandle == null) throw new Error('Missing handle');

    const inflictDamageSpy = vi.spyOn(healthPointsController, 'inflictDamage');
    physicsCallback()(hitboxHandle, targetHandle, true);

    expect(inflictDamageSpy).not.toHaveBeenCalled();
  });

  it('does not inflict damage on collision end', async () => {
    const scene = await createReadyScene();
    const { rigidBody: targetRigidBody, healthPointsController } = addTarget(scene);
    const { physicsCallback } = await setupCollision(scene);

    const hitbox = new DamageHitbox(scene, new THREE.Vector3(1, 1, 1), 10, () => false);
    scene.add(hitbox);
    hitbox.update(0);

    const hitboxHandle = hitbox.getGameObjectComponentByType(RigidBody)?.getHandle();
    const targetHandle = targetRigidBody.getHandle();
    if (hitboxHandle == null || targetHandle == null) throw new Error('Missing handle');

    const inflictDamageSpy = vi.spyOn(healthPointsController, 'inflictDamage');
    physicsCallback()(hitboxHandle, targetHandle, false);

    expect(inflictDamageSpy).not.toHaveBeenCalled();
  });
});
