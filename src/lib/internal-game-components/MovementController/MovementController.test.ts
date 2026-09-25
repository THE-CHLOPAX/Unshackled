import { Mock } from 'moq.ts';
import * as THREE from 'three';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

import { RigidBody } from '../RigidBody';
import { Scene } from '../../internal-3d/Scene/Scene';
import { MockCamera } from '../../internal-3d/testUtils/MockCamera';
import { GameObject } from '../../internal-3d/GameObject/GameObject';
import { MOVE_TO_ARRIVAL_THRESHOLD, MOVEMENT_CONTROLLER_MESSAGES } from './constants';
import {
  DEFAULT_SPRINT_SPEED_MULTIPLIER,
  DEFAULT_WALK_SPEED_MULTIPLIER,
  MovementController,
  ROTATION_LERP_FACTOR,
} from './MovementController';

class TestScene extends Scene {
  camera = new MockCamera();
}

function createMovementController(position = new THREE.Vector3(0, 0, 0)) {
  const scene = new TestScene();
  const gameObject = new GameObject({ scene });
  gameObject.position.copy(position);
  scene.add(gameObject);

  const velocity = new THREE.Vector3();
  const setLinearVelocity = vi.fn((nextVelocity: THREE.Vector3) => {
    velocity.copy(nextVelocity);
  });

  const rigidBody = new Mock<RigidBody>()
    .setup((body) => body.getLinearVelocity)
    .returns(() => velocity.clone())
    .setup((body) => body.setLinearVelocity)
    .returns(setLinearVelocity)
    .setup((body) => body.setEulerRotation)
    .returns(vi.fn())
    .object();

  const controller = new MovementController(gameObject, rigidBody, {
    defaultSpeed: 5,
    sprintSpeed: 10,
  });

  gameObject.addComponent('MovementController', controller);

  const triggerUpdate = (deltaTime = 0.16) => {
    gameObject.events.trigger('update', { deltaTime });
  };

  return { controller, gameObject, rigidBody, velocity, setLinearVelocity, triggerUpdate };
}

describe('MovementController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('speeds', () => {
    it('exposes the configured speeds', () => {
      const { controller } = createMovementController();

      expect(controller.defaultSpeed).toBe(5);
      expect(controller.sprintSpeed).toBe(10);
      expect(controller.walkSpeed).toBe(2.5);
    });

    it('derives sprint and walk speeds from the default speed when omitted', () => {
      const { gameObject, rigidBody } = createMovementController();

      const controller = new MovementController(gameObject, rigidBody, { defaultSpeed: 4 });

      expect(controller.sprintSpeed).toBe(4 * DEFAULT_SPRINT_SPEED_MULTIPLIER);
      expect(controller.walkSpeed).toBe(4 * DEFAULT_WALK_SPEED_MULTIPLIER);
    });

    it('uses explicitly provided sprint and walk speeds', () => {
      const { gameObject, rigidBody } = createMovementController();

      const controller = new MovementController(gameObject, rigidBody, {
        defaultSpeed: 4,
        sprintSpeed: 7,
        walkSpeed: 1,
      });

      expect(controller.sprintSpeed).toBe(7);
      expect(controller.walkSpeed).toBe(1);
    });
  });

  describe('moveTo', () => {
    it('moves toward the target on update', () => {
      const { controller, triggerUpdate, setLinearVelocity } = createMovementController();
      const target = new THREE.Vector3(10, 0, 0);

      void controller.moveTo(target, 7);
      triggerUpdate();

      expect(setLinearVelocity).toHaveBeenCalledWith(expect.objectContaining({ x: 7, y: 0, z: 0 }));
    });

    it('resolves when the target is reached', async () => {
      const { controller, gameObject, triggerUpdate } = createMovementController();
      const target = new THREE.Vector3(MOVE_TO_ARRIVAL_THRESHOLD / 2, 0, 0);

      const moveToPromise = controller.moveTo(target);
      gameObject.position.set(MOVE_TO_ARRIVAL_THRESHOLD / 4, 0, 0);
      triggerUpdate();

      await expect(moveToPromise).resolves.toBeUndefined();
    });

    it('rejects when resetMoveTo is called', async () => {
      const { controller, triggerUpdate } = createMovementController();
      const target = new THREE.Vector3(10, 0, 0);

      const moveToPromise = controller.moveTo(target);
      triggerUpdate();
      controller.resetMoveTo();

      await expect(moveToPromise).rejects.toThrow(MOVEMENT_CONTROLLER_MESSAGES.MOVE_TO_CANCELLED);
    });

    it('rejects when movement is disabled before reaching the target', async () => {
      const { controller, triggerUpdate } = createMovementController();
      const target = new THREE.Vector3(10, 0, 0);

      const moveToPromise = controller.moveTo(target);
      triggerUpdate();
      controller.toggleMovementDisabled(true);
      triggerUpdate();

      await expect(moveToPromise).rejects.toThrow(MOVEMENT_CONTROLLER_MESSAGES.MOVE_TO_CANCELLED);
    });

    it('cancels the previous moveTo when a new target is set', async () => {
      const { controller, gameObject, triggerUpdate } = createMovementController();
      const firstTarget = new THREE.Vector3(10, 0, 0);
      const secondTarget = new THREE.Vector3(0, 0, MOVE_TO_ARRIVAL_THRESHOLD / 2);

      const firstMoveToPromise = controller.moveTo(firstTarget);
      const secondMoveToPromise = controller.moveTo(secondTarget);

      await expect(firstMoveToPromise).rejects.toThrow(
        MOVEMENT_CONTROLLER_MESSAGES.MOVE_TO_CANCELLED
      );

      gameObject.position.set(0, 0, 0);
      triggerUpdate();

      await expect(secondMoveToPromise).resolves.toBeUndefined();
    });
  });

  describe('moveAlongPath', () => {
    it('moves toward each waypoint in order and resolves after the last one is reached', async () => {
      const { controller, gameObject, triggerUpdate } = createMovementController();
      const path = [
        new THREE.Vector3(MOVE_TO_ARRIVAL_THRESHOLD / 2, 0, 0),
        new THREE.Vector3(MOVE_TO_ARRIVAL_THRESHOLD / 2, 0, MOVE_TO_ARRIVAL_THRESHOLD / 2),
      ];

      const moveAlongPathPromise = controller.moveAlongPath(path);

      gameObject.position.copy(path[0]);
      triggerUpdate();

      gameObject.position.copy(path[1]);
      triggerUpdate();

      await expect(moveAlongPathPromise).resolves.toBeUndefined();
    });

    it('resolves without moving when the path is empty', async () => {
      const { controller, setLinearVelocity } = createMovementController();

      await expect(controller.moveAlongPath([])).resolves.toBeUndefined();
      expect(setLinearVelocity).not.toHaveBeenCalled();
    });

    it('resolves without moving when movement is disabled', async () => {
      const { controller, setLinearVelocity } = createMovementController();
      controller.toggleMovementDisabled(true);

      const path = [new THREE.Vector3(10, 0, 0)];
      await expect(controller.moveAlongPath(path)).resolves.toBeUndefined();
      expect(setLinearVelocity).not.toHaveBeenCalled();
    });
  });

  describe('rotation', () => {
    it('rotates towards a given position', () => {
      const { controller, gameObject } = createMovementController();
      const targetPosition = new THREE.Vector3(10, 0, 10);
      const rotateSpy = vi.spyOn(controller, 'rotate');

      controller.rotateTowardsPosition(targetPosition);

      const expectedDirection = targetPosition.clone().sub(gameObject.position);
      expectedDirection.y = 0;
      expectedDirection.normalize();

      expect(rotateSpy).toHaveBeenCalledWith(expectedDirection);
    });

    it('rotates to a specific angle in radians', () => {
      const { controller, rigidBody } = createMovementController();
      const angle = Math.PI / 4;

      controller.rotate(angle);

      expect(rigidBody.setEulerRotation).toHaveBeenCalledWith(
        expect.objectContaining({ x: 0, y: angle, z: 0 })
      );
      expect(controller['_currentRotation']).toBeCloseTo(angle);
    });

    it('rotates towards a given direction vector', () => {
      const { controller, rigidBody } = createMovementController();
      const direction = new THREE.Vector3(1, 0, 1);

      const targetRotation = Math.atan2(direction.x, direction.z);
      const delta = targetRotation - controller['_currentRotation'];
      const shortestAngle = Math.atan2(Math.sin(delta), Math.cos(delta));

      const expectedRotation =
        controller['_currentRotation'] + shortestAngle * ROTATION_LERP_FACTOR;

      controller.rotate(direction);

      expect(controller['_currentRotation']).toBeCloseTo(expectedRotation);
      expect(rigidBody.setEulerRotation).toHaveBeenCalledWith(
        expect.objectContaining({ x: 0, y: expectedRotation, z: 0 })
      );
    });
  });
});
