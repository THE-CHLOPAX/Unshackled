import * as THREE from 'three';
import { logger } from '@tgdf/internal-ui/utils/logger';

import { isMesh } from '../utils/isMesh';
import { RESOURCE_TRACKER_MESSAGES } from './constants';

export type ResourceType =
  | THREE.Object3D
  | THREE.BufferGeometry
  | THREE.Material
  | THREE.Texture
  | THREE.Skeleton
  | (THREE.Object3D | THREE.Material | THREE.Texture)[]
  | null
  | undefined;

/**
 * Utility class to track and dispose of THREE.js resources like geometries, materials, and textures.
 * This helps prevent memory leaks by ensuring that all resources are properly disposed of when no longer needed.
 */
export class ResourceTracker {
  public static getInstance(): ResourceTracker {
    if (!ResourceTracker._instance) {
      ResourceTracker._instance = new ResourceTracker();
    }
    return ResourceTracker._instance;
  }

  private static _instance: ResourceTracker | null = null;

  public resourcesForObjects: Map<string, Set<ResourceType>>;

  private _persistent = new WeakSet<object>();

  constructor() {
    this.resourcesForObjects = new Map();
  }

  public markPersistent(resource: ResourceType): void {
    if (!resource) return;
    if (Array.isArray(resource)) {
      resource.forEach((entry) => this.markPersistent(entry));
      return;
    }
    this._persistent.add(resource);
  }

  public isPersistent(resource: object): boolean {
    return this._persistent.has(resource);
  }

  public trackObject(object: THREE.Object3D): THREE.Object3D {
    const objectResources: Set<ResourceType> = new Set();

    object.traverse((child) => {
      if (!isMesh(child)) return;

      if (!this.isPersistent(child.geometry)) objectResources.add(child.geometry);
      this._trackMaterial(objectResources, child.material);

      const skinnedMesh = child as THREE.SkinnedMesh;
      if (skinnedMesh.isSkinnedMesh) objectResources.add(skinnedMesh.skeleton);
    });

    this.resourcesForObjects.set(object.uuid, objectResources);
    return object;
  }

  private _trackMaterial(
    objectResources: Set<ResourceType>,
    material: THREE.Material | THREE.Material[]
  ): void {
    if (Array.isArray(material)) {
      material.forEach((entry) => this._trackMaterial(objectResources, entry));
      return;
    }

    if (this.isPersistent(material)) return;

    objectResources.add(material);

    for (const value of Object.values(material)) {
      if (value instanceof THREE.Texture && !this.isPersistent(value)) {
        objectResources.add(value);
      }
    }

    if (material instanceof THREE.ShaderMaterial || material instanceof THREE.RawShaderMaterial) {
      for (const uniform of Object.values(material.uniforms)) {
        if (!uniform) continue;

        const uniformValue = uniform.value;
        if (uniformValue instanceof THREE.Texture && !this.isPersistent(uniformValue)) {
          objectResources.add(uniformValue);
        } else if (Array.isArray(uniformValue)) {
          uniformValue.forEach((entry) => {
            if (entry instanceof THREE.Texture && !this.isPersistent(entry)) {
              objectResources.add(entry);
            }
          });
        }
      }
    }
  }

  public untrackObject(object: THREE.Object3D): void {
    this.resourcesForObjects.delete(object.uuid);
  }

  public disposeObjectResources(object: THREE.Object3D): void {
    const objectResources = this.resourcesForObjects.get(object.uuid);

    if (!objectResources) {
      logger({
        type: 'warn',
        message: RESOURCE_TRACKER_MESSAGES.NO_RESOURCES_FOUND_FOR_OBJECT(
          object.name ?? object.type
        ),
      });
      return;
    }

    logger({
      type: 'info',
      group: {
        label: RESOURCE_TRACKER_MESSAGES.DISPOSING_RESOURCES_FOR_OBJECT(object.name || object.type),
        body: Array.from(objectResources.values())
          .map((resource) => resource?.constructor.name)
          .join('\n'),
      },
    });

    for (const resource of objectResources) {
      if (resource && 'dispose' in resource && typeof resource.dispose === 'function') {
        resource.dispose();
      }
    }

    this.resourcesForObjects.delete(object.uuid);
  }
}
