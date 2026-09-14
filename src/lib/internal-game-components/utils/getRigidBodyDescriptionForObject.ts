import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

import { RigidBodyOptions } from '../RigidBody';

export function getRigidBodyDescriptionForObject(
  object: THREE.Object3D,
  options: RigidBodyOptions
): RAPIER.RigidBodyDesc {
  let bodyDesc: RAPIER.RigidBodyDesc;

  switch (options.type) {
    case 'static':
      bodyDesc = RAPIER.RigidBodyDesc.fixed();
      break;
    case 'kinematic':
      bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
      break;
    case 'dynamic':
    default:
      bodyDesc = RAPIER.RigidBodyDesc.dynamic();
      break;
  }

  const worldPosition = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion();
  object.getWorldPosition(worldPosition);
  object.getWorldQuaternion(worldQuaternion);

  bodyDesc.setTranslation(worldPosition.x, worldPosition.y, worldPosition.z);
  bodyDesc.setRotation({
    x: worldQuaternion.x,
    y: worldQuaternion.y,
    z: worldQuaternion.z,
    w: worldQuaternion.w,
  });

  // Set damping
  if (options.linearDamping) {
    bodyDesc.setLinearDamping(options.linearDamping);
  }

  if (options.angularDamping) {
    bodyDesc.setAngularDamping(options.angularDamping);
  }

  return bodyDesc;
}
