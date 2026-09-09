import * as THREE from 'three';
import { logger } from '@tgdf';
import RAPIER from '@dimforge/rapier3d-compat';

export function getMeshFromCollider(collider: RAPIER.Collider): THREE.Mesh {
  let geometry: THREE.BoxGeometry | THREE.CylinderGeometry | THREE.SphereGeometry;

  switch (collider.shape.type) {
    case RAPIER.ShapeType.Cuboid: {
      const halfExtents = collider.halfExtents();
      geometry = new THREE.BoxGeometry(halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2);
      break;
    }
    case RAPIER.ShapeType.Cylinder: {
      const halfHeight = collider.halfHeight();
      const radius = collider.radius();
      geometry = new THREE.CylinderGeometry(radius, radius, halfHeight * 2, 16);
      break;
    }
    case RAPIER.ShapeType.Ball: {
      geometry = new THREE.SphereGeometry(collider.radius(), 8, 8);
      break;
    }
    default: {
      logger({
        message: `RigidBody: Unsupported collider shape type: ${collider.shape.type}.
            Using default box for debug mesh.`,
        type: 'warn',
      });
      geometry = new THREE.BoxGeometry(1, 1, 1);
      break;
    }
  }

  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: true,
  });

  return new THREE.Mesh(geometry, material);
}
