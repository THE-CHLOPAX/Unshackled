import * as THREE from 'three';

import { ColliderGeometryEntry } from './mergeCollidersIntoTrimeshGeometry';

type GridPoint = { x: number; z: number };

type Contour = {
  points: GridPoint[];
  signedArea: number;
};

const DIRECTIONS: GridPoint[] = [
  { x: 1, z: 0 },
  { x: 0, z: 1 },
  { x: -1, z: 0 },
  { x: 0, z: -1 },
];

export function createFloorProjectionGeometry(
  entries: ColliderGeometryEntry[],
  cellSize: number
): THREE.BufferGeometry | null {
  const occupiedCells = rasterizeFootprints(entries, cellSize);
  if (occupiedCells.size === 0) return null;

  const contours = traceContours(occupiedCells).map(simplifyContour);
  const outers = contours.filter((contour) => contour.signedArea > 0);
  const holes = contours.filter((contour) => contour.signedArea < 0);

  const holesByOuter = new Map<Contour, Contour[]>(outers.map((outer) => [outer, []]));
  holes.forEach((hole) => {
    const outer = findEnclosingOuter(hole, outers);
    if (outer) holesByOuter.get(outer)?.push(hole);
  });

  const positions: number[] = [];

  holesByOuter.forEach((outerHoles, outer) => {
    const contour = outer.points.map(toVector2);
    const holePoints = outerHoles.map((hole) => hole.points.map(toVector2));
    const allPoints = [...contour, ...holePoints.flat()];

    THREE.ShapeUtils.triangulateShape(contour, holePoints).forEach(([a, b, c]) => {
      const [pa, pb, pc] = isFacingUp(allPoints[a], allPoints[b], allPoints[c])
        ? [allPoints[a], allPoints[b], allPoints[c]]
        : [allPoints[a], allPoints[c], allPoints[b]];

      [pa, pb, pc].forEach((point) => {
        positions.push((point.x - 0.5) * cellSize, 0, (point.y - 0.5) * cellSize);
      });
    });
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  return geometry;
}

function rasterizeFootprints(entries: ColliderGeometryEntry[], cellSize: number): Set<string> {
  const occupiedCells = new Set<string>();
  const box = new THREE.Box3();

  entries.forEach(({ geometry, matrix }) => {
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    box.copy(geometry.boundingBox ?? new THREE.Box3()).applyMatrix4(matrix);

    const startX = Math.round(box.min.x / cellSize + 0.5);
    const endX = Math.round(box.max.x / cellSize - 0.5);
    const startZ = Math.round(box.min.z / cellSize + 0.5);
    const endZ = Math.round(box.max.z / cellSize - 0.5);

    for (let x = startX; x <= endX; x++) {
      for (let z = startZ; z <= endZ; z++) {
        occupiedCells.add(toKey(x, z));
      }
    }
  });

  return occupiedCells;
}

function traceContours(occupiedCells: Set<string>): Contour[] {
  const outgoingEdges = new Map<string, GridPoint[]>();
  const addEdge = (from: GridPoint, direction: GridPoint): void => {
    const key = toKey(from.x, from.z);
    const edges = outgoingEdges.get(key);
    if (edges) edges.push(direction);
    else outgoingEdges.set(key, [direction]);
  };

  occupiedCells.forEach((key) => {
    const [x, z] = fromKey(key);
    if (!occupiedCells.has(toKey(x, z - 1))) addEdge({ x, z }, DIRECTIONS[0]);
    if (!occupiedCells.has(toKey(x + 1, z))) addEdge({ x: x + 1, z }, DIRECTIONS[1]);
    if (!occupiedCells.has(toKey(x, z + 1))) addEdge({ x: x + 1, z: z + 1 }, DIRECTIONS[2]);
    if (!occupiedCells.has(toKey(x - 1, z))) addEdge({ x, z: z + 1 }, DIRECTIONS[3]);
  });

  const contours: Contour[] = [];

  outgoingEdges.forEach((_, startKey) => {
    while ((outgoingEdges.get(startKey)?.length ?? 0) > 0) {
      const [startX, startZ] = fromKey(startKey);
      const points: GridPoint[] = [];
      let current: GridPoint = { x: startX, z: startZ };
      let incoming: GridPoint | null = null;

      do {
        const edges = outgoingEdges.get(toKey(current.x, current.z)) ?? [];
        const edgeIndex = pickMostLeftTurn(edges, incoming);
        const [direction] = edges.splice(edgeIndex, 1);

        points.push(current);
        current = { x: current.x + direction.x, z: current.z + direction.z };
        incoming = direction;
      } while (toKey(current.x, current.z) !== startKey);

      contours.push({ points, signedArea: getSignedArea(points) });
    }
  });

  return contours;
}

function pickMostLeftTurn(edges: GridPoint[], incoming: GridPoint | null): number {
  if (!incoming || edges.length === 1) return 0;

  let bestIndex = 0;
  let bestTurn = -Infinity;
  edges.forEach((edge, index) => {
    const turn = incoming.x * edge.z - incoming.z * edge.x;
    if (turn > bestTurn) {
      bestTurn = turn;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function simplifyContour(contour: Contour): Contour {
  const { points } = contour;
  const simplified = points.filter((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const cross =
      (point.x - previous.x) * (next.z - point.z) - (point.z - previous.z) * (next.x - point.x);
    return cross !== 0;
  });

  return { points: simplified, signedArea: contour.signedArea };
}

function getSignedArea(points: GridPoint[]): number {
  let area = 0;
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    area += point.x * next.z - next.x * point.z;
  });
  return area / 2;
}

function findEnclosingOuter(hole: Contour, outers: Contour[]): Contour | null {
  const [first, second] = hole.points;
  const direction = { x: Math.sign(second.x - first.x), z: Math.sign(second.z - first.z) };
  const probe = {
    x: first.x + direction.x * 0.5 + direction.z * 0.5,
    z: first.z + direction.z * 0.5 - direction.x * 0.5,
  };

  return outers
    .filter((outer) => isPointInPolygon(probe, outer.points))
    .reduce<Contour | null>(
      (smallest, outer) =>
        smallest === null || outer.signedArea < smallest.signedArea ? outer : smallest,
      null
    );
}

function isPointInPolygon(point: GridPoint, polygon: GridPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (a.z > point.z !== b.z > point.z) {
      const intersectionX = ((b.x - a.x) * (point.z - a.z)) / (b.z - a.z) + a.x;
      if (point.x < intersectionX) inside = !inside;
    }
  }
  return inside;
}

function isFacingUp(a: THREE.Vector2, b: THREE.Vector2, c: THREE.Vector2): boolean {
  return (b.y - a.y) * (c.x - a.x) - (b.x - a.x) * (c.y - a.y) > 0;
}

function toVector2(point: GridPoint): THREE.Vector2 {
  return new THREE.Vector2(point.x, point.z);
}

function toKey(x: number, z: number): string {
  return `${x},${z}`;
}

function fromKey(key: string): [number, number] {
  const [x, z] = key.split(',').map(Number);
  return [x, z];
}
