import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { MockCamera } from '@tgdf/internal-3d/testUtils/MockCamera';
import { assert, describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import {
  GameObject,
  PhysicsCollisionCallback,
  PhysicsManager,
  RigidBody,
  Scene,
  useAssetStore,
} from '@tgdf';

import { ARCANE_CIRCLE_TEXTURE } from '3D/constants';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

import { HealingAura, HealingAuraOptions } from './HealingAura';

class MockScene extends Scene {
  camera = new MockCamera();
}

class FakePlayer extends GameObject {
  public isPlayer = true;
  public healthPointsController = { healDamage: vi.fn() };
}

async function createHealingAuraScene(overrides: Partial<HealingAuraOptions> = {}): Promise<{
  scene: MockScene;
  healingAura: HealingAura;
  physics: PhysicsManager;
  physicsCallback: PhysicsCollisionCallback;
}> {
  const scene = new MockScene();
  await scene.initializePhysicsWorld(new THREE.Vector3(0, 0, 0));

  const parent = new GameObject({ scene });
  parent.add(new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshBasicMaterial()));
  scene.add(parent);

  const physics = scene.physics;
  assert(physics !== undefined, 'Physics manager is undefined');

  let physicsCallback: PhysicsCollisionCallback = () => {};
  vi.spyOn(physics, 'onCollision').mockImplementation((cb) => {
    physicsCallback = cb;
    return () => {};
  });

  const healingAura = new HealingAura(scene, {
    diameter: 4,
    healAmount: 10,
    healIntervalMs: 1000,
    durationMs: 5000,
    ...overrides,
  });
  parent.add(healingAura);
  healingAura.update(0);

  return { scene, healingAura, physics, physicsCallback };
}

function createFakePlayer(scene: MockScene): FakePlayer {
  const player = new FakePlayer({ scene });
  player.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()));
  scene.add(player);
  player.addComponent('RigidBody', new RigidBody(player, { enableCollisionDetection: true }));
  player.update(0);
  return player;
}

function getHandle(gameObject: GameObject): number {
  const rigidBody = gameObject.getGameObjectComponentByType(RigidBody);
  assert(rigidBody !== undefined, 'GameObject has no RigidBody component');
  const handle = rigidBody.getHandle();
  assert(handle !== null, 'RigidBody handle is null');
  return handle;
}

describe('HealingAura', () => {
  beforeAll(async () => {
    await RAPIER.init();
  });

  beforeEach(() => {
    useAssetStore.getState().textureCache.set(ARCANE_CIRCLE_TEXTURE, new THREE.Texture());
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    useAssetStore.getState().textureCache.clear();
  });

  it('starts healing a player on an interval once they enter the aura', async () => {
    const { scene, healingAura, physicsCallback } = await createHealingAuraScene({
      healAmount: 10,
      healIntervalMs: 1000,
    });
    const player = createFakePlayer(scene);

    physicsCallback(getHandle(healingAura), getHandle(player), true);

    expect(player.healthPointsController.healDamage).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(player.healthPointsController.healDamage).toHaveBeenCalledTimes(1);
    expect(player.healthPointsController.healDamage).toHaveBeenCalledWith(10);

    vi.advanceTimersByTime(2000);
    expect(player.healthPointsController.healDamage).toHaveBeenCalledTimes(3);
  });

  it('ignores collisions with non-player game objects', async () => {
    const { scene, healingAura, physicsCallback } = await createHealingAuraScene();

    const nonPlayer = new GameObject({ scene });
    nonPlayer.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()));
    scene.add(nonPlayer);
    nonPlayer.addComponent(
      'RigidBody',
      new RigidBody(nonPlayer, { enableCollisionDetection: true })
    );
    nonPlayer.update(0);

    physicsCallback(getHandle(healingAura), getHandle(nonPlayer), true);
    vi.advanceTimersByTime(5000);

    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    healingAura.destroy();
    expect(clearIntervalSpy).not.toHaveBeenCalled();
  });

  it('removes only the departing player heal interval, leaving other active players healing', async () => {
    const { scene, healingAura, physicsCallback } = await createHealingAuraScene({
      healAmount: 5,
      healIntervalMs: 1000,
    });
    const playerA = createFakePlayer(scene);
    const playerB = createFakePlayer(scene);

    physicsCallback(getHandle(healingAura), getHandle(playerA), true);
    physicsCallback(getHandle(healingAura), getHandle(playerB), true);

    vi.advanceTimersByTime(1000);
    expect(playerA.healthPointsController.healDamage).toHaveBeenCalledTimes(1);
    expect(playerB.healthPointsController.healDamage).toHaveBeenCalledTimes(1);

    physicsCallback(getHandle(healingAura), getHandle(playerA), false);

    vi.advanceTimersByTime(2000);
    expect(playerA.healthPointsController.healDamage).toHaveBeenCalledTimes(1);
    expect(playerB.healthPointsController.healDamage).toHaveBeenCalledTimes(3);
  });

  it('clears all remaining heal intervals when destroyed, leaving no leaked timers', async () => {
    const { scene, healingAura, physicsCallback } = await createHealingAuraScene({
      healAmount: 5,
      healIntervalMs: 1000,
    });
    const playerA = createFakePlayer(scene);
    const playerB = createFakePlayer(scene);

    physicsCallback(getHandle(healingAura), getHandle(playerA), true);
    physicsCallback(getHandle(healingAura), getHandle(playerB), true);

    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    healingAura.destroy();

    expect(clearIntervalSpy).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(5000);
    expect(playerA.healthPointsController.healDamage).not.toHaveBeenCalled();
    expect(playerB.healthPointsController.healDamage).not.toHaveBeenCalled();
  });
});
