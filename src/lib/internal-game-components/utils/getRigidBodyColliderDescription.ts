import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

import { RigidBodyOptions, RigidBodyShape } from '../RigidBody';

export function getRigidBodyColliderDescription(
  type: RigidBodyShape,
  object: THREE.Object3D,
  options?: RigidBodyOptions
): RAPIER.ColliderDesc {
  const bbox = new THREE.Box3().setFromObject(object);

  let size = options?.colliderSize;
  if (!size) {
    size = bbox.getSize(new THREE.Vector3());
  }

  const colliderOffset = new THREE.Vector3();
  if (!bbox.isEmpty()) {
    const worldCenter = bbox.getCenter(new THREE.Vector3());
    const objectWorldPosition = object.getWorldPosition(new THREE.Vector3());
    colliderOffset.copy(worldCenter).sub(objectWorldPosition);
  }

  let colliderDesc: RAPIER.ColliderDesc;

  switch (type) {
    case 'box':
      colliderDesc = RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2);
      break;
    case 'cylinder': {
      const radius = Math.max(size.x, size.z) / 2;
      const height = size.y;
      colliderDesc = RAPIER.ColliderDesc.cylinder(height / 2, radius);
      break;
    }
    case 'sphere': {
      const radius = Math.max(size.x, size.y, size.z) / 2;
      colliderDesc = RAPIER.ColliderDesc.ball(radius);
      break;
    }
    default:
      throw new Error(`Unsupported collider shape: ${type}`);
  }

  colliderDesc.setTranslation(colliderOffset.x, colliderOffset.y, colliderOffset.z);

  // Set material properties
  if (options?.friction) colliderDesc.setFriction(options.friction);
  if (options?.restitution) colliderDesc.setRestitution(options.restitution);
  if (options?.mass) colliderDesc.setMass(options.mass);

  // Set as sensor if requested (detects collisions but doesn't cause physical response)
  if (options?.sensor) {
    colliderDesc.setSensor(true);
  }

  // Enable collision events if requested. Rapier's default active collision types
  // only cover pairs involving a dynamic body (e.g. kinematic-vs-kinematic is excluded),
  // so widen this too or kinematic sensors (projectiles, hitboxes) never see each other.
  if (options?.enableCollisionDetection) {
    colliderDesc.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
    colliderDesc.setActiveCollisionTypes(RAPIER.ActiveCollisionTypes.ALL);
  }

  return colliderDesc;
}
