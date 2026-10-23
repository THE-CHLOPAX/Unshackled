import * as THREE from 'three';
import { GameObject, RigidBody } from '@tgdf';
import RAPIER from '@dimforge/rapier3d-compat';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

import { MockGameScene } from '3D/classes/scenes/GameScene/MockGameScene';
import { DetectionZone } from '3D/classes/gameObjects/DetectionZone/DetectionZone';

class TestScene extends MockGameScene {}

const INSIDE = new THREE.Vector3(0, 0, 0);
const OUTSIDE = new THREE.Vector3(20, 0, 0);

async function createReadyScene(): Promise<TestScene> {
  const scene = new TestScene();
  await scene.initializePhysicsWorld(new THREE.Vector3(0, 0, 0));
  return scene;
}

function step(scene: TestScene): void {
  const physics = scene.physics;
  if (!physics) throw new Error('Physics manager is undefined');
  physics.update(1 / 60);
}

function addBody(scene: TestScene, position: THREE.Vector3): GameObject {
  const object = new GameObject({ scene });
  object.position.copy(position);
  scene.add(object);
  object.addComponent(
    'RigidBody',
    new RigidBody(object, {
      type: 'kinematic',
      enableCollisionDetection: true,
      colliderSize: new THREE.Vector3(1, 1, 1),
    })
  );
  object.update(0);
  return object;
}

function moveBody(object: GameObject, position: THREE.Vector3): void {
  object.position.copy(position);
  object.update(0);
}

function addZone(scene: TestScene, target: GameObject): DetectionZone {
  const zone = new DetectionZone(scene, {
    size: new THREE.Vector3(2, 2, 2),
    filter: (object) => object === target,
  });
  scene.add(zone);
  zone.update(0);
  return zone;
}

describe('DetectionZone toggleDetection', () => {
  beforeAll(async () => {
    await RAPIER.init();
  });

  let scene: TestScene;

  beforeEach(async () => {
    scene = await createReadyScene();
  });

  it('does not detect objects while detection is disabled', () => {
    const body = addBody(scene, OUTSIDE);
    const zone = addZone(scene, body);
    const onEntered = vi.fn();
    const onLeft = vi.fn();
    zone.zoneEvents.on('object-entered', onEntered);
    zone.zoneEvents.on('object-left', onLeft);

    zone.toggleDetection(false);
    step(scene);

    moveBody(body, INSIDE);
    step(scene);

    expect(onEntered).not.toHaveBeenCalled();
    expect(zone.has(body)).toBe(false);

    moveBody(body, OUTSIDE);
    step(scene);

    expect(onLeft).not.toHaveBeenCalled();
  });

  it('detects objects entering and leaving when detection is re-enabled', () => {
    const body = addBody(scene, OUTSIDE);
    const zone = addZone(scene, body);
    const onEntered = vi.fn();
    const onLeft = vi.fn();
    zone.zoneEvents.on('object-entered', onEntered);
    zone.zoneEvents.on('object-left', onLeft);

    zone.toggleDetection(false);
    step(scene);
    zone.toggleDetection(true);
    step(scene);

    moveBody(body, INSIDE);
    step(scene);

    expect(onEntered).toHaveBeenCalledExactlyOnceWith({ object: body });
    expect(zone.has(body)).toBe(true);

    moveBody(body, OUTSIDE);
    step(scene);

    expect(onLeft).toHaveBeenCalledExactlyOnceWith({ object: body });
    expect(zone.has(body)).toBe(false);
  });

  it('emits object-left for objects inside the zone when detection is disabled', () => {
    const body = addBody(scene, INSIDE);
    const zone = addZone(scene, body);
    const onLeft = vi.fn();
    zone.zoneEvents.on('object-left', onLeft);

    step(scene);
    expect(zone.has(body)).toBe(true);

    zone.toggleDetection(false);
    step(scene);

    expect(onLeft).toHaveBeenCalledExactlyOnceWith({ object: body });
    expect(zone.objects).toEqual([]);
  });

  it('emits object-entered for objects already inside the zone when detection is re-enabled', () => {
    const body = addBody(scene, OUTSIDE);
    const zone = addZone(scene, body);
    const onEntered = vi.fn();
    zone.zoneEvents.on('object-entered', onEntered);

    zone.toggleDetection(false);
    step(scene);

    moveBody(body, INSIDE);
    step(scene);
    expect(onEntered).not.toHaveBeenCalled();

    zone.toggleDetection(true);
    step(scene);

    expect(onEntered).toHaveBeenCalledExactlyOnceWith({ object: body });
    expect(zone.has(body)).toBe(true);
  });

  it('emits object-entered again for an object that stayed inside while detection was toggled off and on', () => {
    const body = addBody(scene, INSIDE);
    const zone = addZone(scene, body);
    const onEntered = vi.fn();
    zone.zoneEvents.on('object-entered', onEntered);

    step(scene);
    expect(onEntered).toHaveBeenCalledOnce();

    zone.toggleDetection(false);
    step(scene);
    zone.toggleDetection(true);
    step(scene);

    expect(onEntered).toHaveBeenCalledTimes(2);
    expect(onEntered).toHaveBeenLastCalledWith({ object: body });
    expect(zone.has(body)).toBe(true);
  });
});
