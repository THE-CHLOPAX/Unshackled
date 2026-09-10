import * as THREE from 'three';
import { describe, it, expect } from 'vitest';

import { mergeCollidersIntoTrimeshGeometry } from './mergeCollidersIntoTrimeshGeometry';

describe('mergeCollidersIntoTrimeshGeometry', () => {
  it('returns null for an empty list of entries', () => {
    expect(mergeCollidersIntoTrimeshGeometry([])).toBeNull();
  });

  it('transforms and concatenates vertices from every entry into world space', () => {
    const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
    const matrixA = new THREE.Matrix4().makeTranslation(5, 0, 0);
    const matrixB = new THREE.Matrix4().makeTranslation(-5, 0, 0);

    const merged = mergeCollidersIntoTrimeshGeometry([
      { geometry: boxGeometry, matrix: matrixA },
      { geometry: boxGeometry, matrix: matrixB },
    ]);

    expect(merged).not.toBeNull();
    const positionAttribute = merged?.getAttribute('position');
    expect(positionAttribute?.count).toBe(boxGeometry.toNonIndexed().getAttribute('position').count * 2);

    merged?.computeBoundingBox();
    const bbox = merged?.boundingBox;
    expect(bbox?.min.x).toBeCloseTo(-6);
    expect(bbox?.max.x).toBeCloseTo(6);
  });

  it('produces a non-indexed geometry, regardless of whether the source was indexed', () => {
    const indexedGeometry = new THREE.BoxGeometry(1, 1, 1);
    expect(indexedGeometry.index).not.toBeNull();

    const merged = mergeCollidersIntoTrimeshGeometry([
      { geometry: indexedGeometry, matrix: new THREE.Matrix4() },
    ]);

    expect(merged?.index).toBeNull();
  });
});
