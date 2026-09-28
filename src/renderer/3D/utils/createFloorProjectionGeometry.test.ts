import * as THREE from 'three';
import { describe, it, expect } from 'vitest';

import { ColliderGeometryEntry } from './mergeCollidersIntoTrimeshGeometry';
import { createFloorProjectionGeometry } from './createFloorProjectionGeometry';

const CELL_SIZE = 3;

function tileAt(x: number, z: number): ColliderGeometryEntry {
  const geometry = new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE);
  const matrix = new THREE.Matrix4().compose(
    new THREE.Vector3(x * CELL_SIZE, 0, z * CELL_SIZE),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)),
    new THREE.Vector3(1, 1, 1)
  );
  return { geometry, matrix };
}

function tilesFromMask(mask: string[]): ColliderGeometryEntry[] {
  return mask.flatMap((row, z) =>
    [...row].flatMap((char, x) => (char === '#' ? [tileAt(x, z)] : []))
  );
}

function getTriangles(geometry: THREE.BufferGeometry): THREE.Triangle[] {
  const position = geometry.getAttribute('position');
  const triangles: THREE.Triangle[] = [];
  for (let i = 0; i < position.count; i += 3) {
    triangles.push(
      new THREE.Triangle(
        new THREE.Vector3().fromBufferAttribute(position, i),
        new THREE.Vector3().fromBufferAttribute(position, i + 1),
        new THREE.Vector3().fromBufferAttribute(position, i + 2)
      )
    );
  }
  return triangles;
}

function getTotalArea(geometry: THREE.BufferGeometry): number {
  return getTriangles(geometry).reduce((sum, triangle) => sum + triangle.getArea(), 0);
}

describe('createFloorProjectionGeometry', () => {
  it('returns null when there are no floor entries', () => {
    expect(createFloorProjectionGeometry([], CELL_SIZE)).toBeNull();
  });

  it('builds a single quad for a single tile, covering the tile footprint', () => {
    const geometry = createFloorProjectionGeometry([tileAt(2, 1)], CELL_SIZE);
    assertGeometry(geometry);

    expect(getTriangles(geometry)).toHaveLength(2);
    geometry.computeBoundingBox();
    expect(geometry.boundingBox?.min.toArray()).toEqual([4.5, 0, 1.5]);
    expect(geometry.boundingBox?.max.toArray()).toEqual([7.5, 0, 4.5]);
  });

  it('merges a filled rectangle of tiles into two triangles', () => {
    const geometry = createFloorProjectionGeometry(
      tilesFromMask(['####', '####', '####']),
      CELL_SIZE
    );
    assertGeometry(geometry);

    expect(getTriangles(geometry)).toHaveLength(2);
    expect(getTotalArea(geometry)).toBeCloseTo(12 * CELL_SIZE * CELL_SIZE);
  });

  it('triangulates an L-shape with the minimal number of triangles', () => {
    const geometry = createFloorProjectionGeometry(tilesFromMask(['#.', '##']), CELL_SIZE);
    assertGeometry(geometry);

    expect(getTriangles(geometry)).toHaveLength(4);
    expect(getTotalArea(geometry)).toBeCloseTo(3 * CELL_SIZE * CELL_SIZE);
  });

  it('cuts out holes where there are no floor tiles', () => {
    const geometry = createFloorProjectionGeometry(tilesFromMask(['###', '#.#', '###']), CELL_SIZE);
    assertGeometry(geometry);

    expect(getTriangles(geometry)).toHaveLength(8);
    expect(getTotalArea(geometry)).toBeCloseTo(8 * CELL_SIZE * CELL_SIZE);
  });

  it('handles separate floor islands, including one nested inside a hole', () => {
    const geometry = createFloorProjectionGeometry(
      tilesFromMask(['#####', '#...#', '#.#.#', '#...#', '#####', '.....', '##...']),
      CELL_SIZE
    );
    assertGeometry(geometry);

    expect(getTotalArea(geometry)).toBeCloseTo(19 * CELL_SIZE * CELL_SIZE);
  });

  it('handles tiles touching only diagonally', () => {
    const geometry = createFloorProjectionGeometry(tilesFromMask(['#.', '.#']), CELL_SIZE);
    assertGeometry(geometry);

    expect(getTriangles(geometry)).toHaveLength(4);
    expect(getTotalArea(geometry)).toBeCloseTo(2 * CELL_SIZE * CELL_SIZE);
  });

  it('produces a completely flat, upward-facing surface at y=0', () => {
    const geometry = createFloorProjectionGeometry(tilesFromMask(['###', '#.#', '##.']), CELL_SIZE);
    assertGeometry(geometry);

    expect(getTotalArea(geometry)).toBeCloseTo(7 * CELL_SIZE * CELL_SIZE);

    getTriangles(geometry).forEach((triangle) => {
      [triangle.a, triangle.b, triangle.c].forEach((vertex) => expect(vertex.y).toBe(0));
      expect(triangle.getNormal(new THREE.Vector3()).y).toBeCloseTo(1);
    });
  });
});

function assertGeometry(
  geometry: THREE.BufferGeometry | null
): asserts geometry is THREE.BufferGeometry {
  expect(geometry).not.toBeNull();
}
