import * as THREE from 'three';
import { describe, it, expect } from 'vitest';

import { getObjectSize } from './getObjectSize';

function createBox(width: number, height: number, depth: number): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(width, height, depth));
}

function expectSize(size: THREE.Vector3, x: number, y: number, z: number): void {
  expect(size.x).toBeCloseTo(x);
  expect(size.y).toBeCloseTo(y);
  expect(size.z).toBeCloseTo(z);
}

describe('getObjectSize', () => {
  it('returns the dimensions of a mesh', () => {
    expectSize(getObjectSize(createBox(1, 2, 3)), 1, 2, 3);
  });

  it('is not affected by the object position', () => {
    const box = createBox(1, 2, 3);
    box.position.set(10, -5, 7);

    expectSize(getObjectSize(box), 1, 2, 3);
  });

  it('applies the object scale', () => {
    const box = createBox(1, 2, 3);
    box.scale.set(2, 3, 0.5);

    expectSize(getObjectSize(box), 2, 6, 1.5);
  });

  it('returns the axis-aligned size of a rotated object', () => {
    const box = createBox(1, 2, 3);
    box.rotation.y = Math.PI / 2;

    expectSize(getObjectSize(box), 3, 2, 1);
  });

  it('grows the axis-aligned size of an object rotated by 45 degrees', () => {
    const box = createBox(2, 2, 2);
    box.rotation.y = Math.PI / 4;

    expectSize(getObjectSize(box), 2 * Math.SQRT2, 2, 2 * Math.SQRT2);
  });

  it('includes all descendants of the object', () => {
    const group = new THREE.Group();
    const left = createBox(1, 1, 1);
    const right = createBox(1, 1, 1);
    const nested = createBox(1, 1, 1);
    left.position.set(-2, 0, 0);
    right.position.set(2, 0, 0);
    nested.position.set(0, 3, 0);
    right.add(nested);
    group.add(left, right);

    expectSize(getObjectSize(group), 5, 4, 1);
  });

  it('applies child transforms relative to the object', () => {
    const group = new THREE.Group();
    const child = createBox(1, 1, 1);
    child.scale.set(4, 1, 1);
    group.add(child);

    expectSize(getObjectSize(group), 4, 1, 1);
  });

  it('returns a zero vector for an object without geometry', () => {
    expectSize(getObjectSize(new THREE.Object3D()), 0, 0, 0);
  });

  it('returns a zero vector for an empty group', () => {
    const group = new THREE.Group();
    group.add(new THREE.Object3D());

    expectSize(getObjectSize(group), 0, 0, 0);
  });

  it('returns a new vector on every call', () => {
    const box = createBox(1, 1, 1);
    const first = getObjectSize(box);
    const second = getObjectSize(box);

    first.set(100, 100, 100);

    expect(second).not.toBe(first);
    expectSize(second, 1, 1, 1);
  });
});
