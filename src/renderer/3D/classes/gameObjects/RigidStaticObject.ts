import * as THREE from 'three';
import { GameObject, RigidBody, RigidBodyOptions, Scene } from '@tgdf';

export type RigidStaticObjectOptions =
  | { geometry: THREE.BufferGeometry; matrix: THREE.Matrix4 }
  | { source: THREE.Object3D; position: THREE.Vector3 }
  | { trimeshGeometry: THREE.BufferGeometry };

type ColliderTransform = {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  colliderSize: THREE.Vector3;
};

function orientedBoxFromGeometry(
  geometry: THREE.BufferGeometry,
  matrix: THREE.Matrix4
): ColliderTransform {
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  const localBox = geometry.boundingBox ?? new THREE.Box3();

  const localSize = localBox.getSize(new THREE.Vector3());
  const position = localBox.getCenter(new THREE.Vector3()).applyMatrix4(matrix);

  const translation = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  matrix.decompose(translation, quaternion, scale);

  const colliderSize = new THREE.Vector3(
    Math.abs(localSize.x * scale.x),
    Math.abs(localSize.y * scale.y),
    Math.abs(localSize.z * scale.z)
  );

  return { position, quaternion, colliderSize };
}

function axisAlignedBoxFromObject(
  source: THREE.Object3D,
  position: THREE.Vector3
): ColliderTransform {
  source.updateWorldMatrix(true, true);
  const colliderSize = new THREE.Box3().setFromObject(source).getSize(new THREE.Vector3());
  return { position: position.clone(), quaternion: new THREE.Quaternion(), colliderSize };
}

export class RigidStaticObject extends GameObject {
  constructor(scene: Scene, options: RigidStaticObjectOptions) {
    super({ scene, skipUpdate: true });

    let rigidBodyOptions: RigidBodyOptions;

    if ('trimeshGeometry' in options) {
      rigidBodyOptions = {
        type: 'static',
        colliderShape: 'trimesh',
        enableCollisionDetection: true,
        colliderGeometry: options.trimeshGeometry,
      };
    } else {
      const { position, quaternion, colliderSize } =
        'geometry' in options
          ? orientedBoxFromGeometry(options.geometry, options.matrix)
          : axisAlignedBoxFromObject(options.source, options.position);

      this.position.copy(position);
      this.quaternion.copy(quaternion);

      rigidBodyOptions = {
        type: 'static',
        colliderShape: 'box',
        enableCollisionDetection: true,
        colliderSize,
      };
    }

    this.addComponent('RigidBodyComponent', new RigidBody(this, rigidBodyOptions));

    //rigidBody.toggleDebug(true);
  }
}
