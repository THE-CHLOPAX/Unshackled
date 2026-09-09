import * as THREE from 'three';
import { describe, it, expect, vi } from 'vitest';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

import { OrtographicCamera } from './OrtographicCamera';
import { CAMERA_POSITION_OFFSET } from '../../constants';

// Camera direction from `position` toward `pivotPoint`, for asserting it's always facing
// its pivot regardless of where that pivot currently is.
function forwardDirection(camera: OrtographicCamera): THREE.Vector3 {
  return new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
}

describe('OrtographicCamera', () => {
  describe('construction', () => {
    it('defaults to pivot (0,0,0) and the default CAMERA_POSITION_OFFSET, already applied', () => {
      const camera = new OrtographicCamera();

      expect(camera.pivotPoint).toEqual(new THREE.Vector3(0, 0, 0));
      expect(camera.offset).toEqual(CAMERA_POSITION_OFFSET);
      expect(camera.position).toEqual(CAMERA_POSITION_OFFSET);
    });

    it('accepts a custom offset, applied immediately without needing update()', () => {
      const camera = new OrtographicCamera({ offset: new THREE.Vector3(0, 10, 0) });

      expect(camera.offset).toEqual(new THREE.Vector3(0, 10, 0));
      expect(camera.position).toEqual(new THREE.Vector3(0, 10, 0));
    });

    it('always looks at its pivot point from construction', () => {
      const camera = new OrtographicCamera();
      const toOrigin = camera.pivotPoint.clone().sub(camera.position).normalize();

      expect(forwardDirection(camera).distanceTo(toOrigin)).toBeLessThan(1e-6);
    });
  });

  describe('offset', () => {
    it('can be changed at runtime, taking effect on the next update()', () => {
      const camera = new OrtographicCamera();
      camera.offset = new THREE.Vector3(1, 2, 3);

      // Setter alone shouldn't move the camera until update() runs.
      expect(camera.position).toEqual(CAMERA_POSITION_OFFSET);

      camera.update(0.016);
      expect(camera.position).toEqual(new THREE.Vector3(1, 2, 3));
    });
  });

  describe('moveTo', () => {
    it('snaps the pivot point instantly with no lerp option', () => {
      const camera = new OrtographicCamera();
      camera.moveTo(new THREE.Vector3(10, 0, 10));

      expect(camera.pivotPoint).toEqual(new THREE.Vector3(10, 0, 10));
    });

    it('does not move the camera position until update() is called', () => {
      const camera = new OrtographicCamera();
      camera.moveTo(new THREE.Vector3(10, 0, 10));

      expect(camera.position).toEqual(CAMERA_POSITION_OFFSET);
    });

    it('positions the camera at pivot + offset after update()', () => {
      const camera = new OrtographicCamera();
      camera.moveTo(new THREE.Vector3(10, 0, 10));
      camera.update(0.016);

      expect(camera.position).toEqual(new THREE.Vector3(16, 6, 16));
    });

    it('lerps toward the target instead of snapping when a lerp factor is given', () => {
      const camera = new OrtographicCamera();
      camera.moveTo(new THREE.Vector3(100, 0, 0), { lerp: 0.5 });

      expect(camera.pivotPoint.x).toBeCloseTo(50);
      expect(camera.pivotPoint.x).not.toBe(100);
    });
  });

  describe('follow', () => {
    it('snaps the pivot to the target immediately, before any update()', () => {
      const camera = new OrtographicCamera();
      const target = new THREE.Object3D();
      target.position.set(5, 0, 5);

      camera.follow(target);

      expect(camera.pivotPoint).toEqual(new THREE.Vector3(5, 0, 5));
    });

    it('keeps the camera at pivot + offset on every frame while tracking a moving target', () => {
      const camera = new OrtographicCamera();
      const target = new THREE.Object3D();
      target.position.set(5, 0, 5);
      camera.follow(target);

      target.position.set(50, 0, 50);

      for (let i = 0; i < 50; i++) {
        camera.update(0.016);
        // position - pivotPoint must equal offset on every single frame, not just once
        // converged.
        const delta = camera.position.clone().sub(camera.pivotPoint);
        expect(delta.x).toBeCloseTo(camera.offset.x);
        expect(delta.y).toBeCloseTo(camera.offset.y);
        expect(delta.z).toBeCloseTo(camera.offset.z);
      }
    });

    it('eventually converges the pivot onto the target position', () => {
      const camera = new OrtographicCamera();
      const target = new THREE.Object3D();
      target.position.set(5, 0, 5);
      camera.follow(target);

      target.position.set(50, 0, 50);
      for (let i = 0; i < 1000; i++) camera.update(0.016);

      expect(camera.pivotPoint.distanceTo(target.position)).toBeLessThan(0.01);
    });

    it('always looks at the pivot point while following, even as it moves', () => {
      const camera = new OrtographicCamera();
      const target = new THREE.Object3D();
      target.position.set(5, 0, 5);
      camera.follow(target);
      camera.update(0.016);

      const toPivot = camera.pivotPoint.clone().sub(camera.position).normalize();
      expect(forwardDirection(camera).distanceTo(toPivot)).toBeLessThan(1e-6);
    });

    it('stopFollowing halts tracking and leaves the pivot where it was, not reset to origin', () => {
      const camera = new OrtographicCamera();
      const target = new THREE.Object3D();
      target.position.set(5, 0, 5);
      camera.follow(target);
      camera.update(0.016);

      const pivotBeforeStop = camera.pivotPoint.clone();
      camera.stopFollowing();

      expect(camera.pivotPoint).toEqual(pivotBeforeStop);

      // Further target movement should no longer affect the camera.
      target.position.set(999, 0, 999);
      camera.update(0.016);
      expect(camera.pivotPoint).toEqual(pivotBeforeStop);
    });
  });

  describe('zoom', () => {
    it('clamps setZoom within the default [0.1, 1] range', () => {
      const camera = new OrtographicCamera();

      camera.setZoom(5);
      expect(camera.zoom).toBe(1);

      camera.setZoom(-5);
      expect(camera.zoom).toBe(0.1);
    });

    it('respects custom zoom bounds passed to the constructor', () => {
      const camera = new OrtographicCamera({ zoom: { min: 2, max: 4 } });

      camera.setZoom(10);
      expect(camera.zoom).toBe(4);
    });

    it('setZoomMin/setZoomMax adjust the clamp range', () => {
      const camera = new OrtographicCamera();
      camera.setZoomMax(2);
      camera.setZoom(2);

      expect(camera.zoom).toBe(2);
    });
  });

  describe('shake', () => {
    it('ignores non-positive shake intensity and warns', () => {
      const camera = new OrtographicCamera();
      camera.addShake(0);
      camera.update(0.016);

      expect(camera.position).toEqual(CAMERA_POSITION_OFFSET);
    });

    it('perturbs the camera position away from pivot + offset while shake is active', () => {
      const camera = new OrtographicCamera();
      camera.addShake(5);
      camera.update(0.016);

      const settledPosition = camera.pivotPoint.clone().add(camera.offset);
      expect(camera.position.distanceTo(settledPosition)).toBeGreaterThan(0);
    });

    it('decays shake back to zero over time', () => {
      const camera = new OrtographicCamera();
      camera.addShake(5);

      for (let i = 0; i < 1000; i++) camera.update(0.016);

      const settledPosition = camera.pivotPoint.clone().add(camera.offset);
      expect(camera.position.distanceTo(settledPosition)).toBeCloseTo(0, 2);
    });
  });
});
