import * as THREE from 'three';
import { isChildOfObject } from '@tgdf/internal-3d/utils/isChildOfObject';
import { GameObject, GameObjectComponent, getModelFromStore, logger, ResourceTracker } from '@tgdf';

import { MODEL_RENDERER_MESSAGES } from './constants';

export type ModelRendererOptions =
  | {
      id: string;
      model?: never;
      scale?: THREE.Vector3;
    }
  | {
      id?: never;
      model: THREE.Object3D;
      scale?: THREE.Vector3;
    };

export type AddAttachmentOptions =
  | { object: THREE.Object3D; parent: THREE.Object3D }
  | { object: THREE.Object3D; parentName: string };

export type MeshMaterial = THREE.Material | THREE.Material[];

function cloneMeshMaterial(material: MeshMaterial): MeshMaterial {
  return Array.isArray(material) ? material.map((mat) => mat.clone()) : material.clone();
}

export class ModelRenderer extends GameObjectComponent {
  private _model: THREE.Object3D | null = null;
  private _modelOriginalMaterials: Map<THREE.Mesh, MeshMaterial> = new Map();

  constructor(gameObject: GameObject, options: ModelRendererOptions) {
    super(gameObject);

    let model: THREE.Object3D | undefined;

    if (options.id) {
      model = getModelFromStore(options.id);
    } else if (options.model) {
      model = options.model;
    }

    if (!model) {
      throw new Error(`Model not found: ${options.id ?? 'provided model'}`);
    }

    if (options.scale) {
      model.scale.copy(options.scale);
    }

    this.setModel(model);
  }

  public getModel(): THREE.Object3D | null {
    return this._model;
  }

  public getModelMaterials(): THREE.Material[] | null {
    if (!this._model) {
      logger({
        message: MODEL_RENDERER_MESSAGES.GET_MATERIALS_NO_MODEL,
        type: 'warn',
      });
      return null;
    }

    const materials: THREE.Material[] = [];
    this._model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          materials.push(...mesh.material);
        } else {
          materials.push(mesh.material);
        }
      }
    });

    if (materials.length === 0) {
      logger({
        message: MODEL_RENDERER_MESSAGES.GET_MATERIALS_NO_MESH,
        type: 'warn',
      });
      return null;
    }

    return materials;
  }

  public setModel(model: THREE.Object3D | null): void {
    if (model === this._model) return;

    if (this._model) {
      this.gameObject.remove(this._model);
    }

    this._model = model;

    // Clone materials to prevent shared material mutations across instances
    if (this._model) {
      this._cloneMaterials(this._model);
    }

    this._modelOriginalMaterials = this._captureOriginalMaterials(this._model);

    this.onModelChange(this._model);

    if (this._model) {
      this.gameObject.add(this._model);
    }
  }

  /**
   * Returns a fresh clone of each mesh's ORIGINAL material, keyed by mesh —
   * the material as captured when the model was set, not whatever a caller
   * finds on the mesh at the time it asks (which may be mid-flash/swap).
   */
  public getMaterialsCopy(): Map<THREE.Mesh, MeshMaterial> {
    const copy = new Map<THREE.Mesh, MeshMaterial>();
    this._modelOriginalMaterials.forEach((material, mesh) => {
      copy.set(mesh, cloneMeshMaterial(material));
    });
    return copy;
  }

  public restoreOriginalMaterials(): void {
    if (!this._model) return;

    this._model.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;

      const original = this._modelOriginalMaterials.get(mesh);
      if (!original) return;

      if (Array.isArray(mesh.material) && Array.isArray(original)) {
        mesh.material.forEach((material, index) => {
          const originalMaterial = original[index];
          if (originalMaterial) material.copy(originalMaterial);
        });
      } else if (!Array.isArray(mesh.material) && !Array.isArray(original)) {
        mesh.material.copy(original);
      }
    });
  }

  private _captureOriginalMaterials(model: THREE.Object3D | null): Map<THREE.Mesh, MeshMaterial> {
    const materials = new Map<THREE.Mesh, MeshMaterial>();
    if (!model) return materials;

    model.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      materials.set(mesh, cloneMeshMaterial(mesh.material));
    });

    return materials;
  }

  private _cloneMaterials(object: THREE.Object3D): void {
    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = cloneMeshMaterial(mesh.material);
      }
    });
  }

  public addAttachment(options: AddAttachmentOptions): void {
    if (!this._model) {
      logger({
        message: MODEL_RENDERER_MESSAGES.ADD_ATTACHMENT_NO_MODEL,
        type: 'warn',
      });
      return;
    }

    let targetParent: THREE.Object3D | null = null;
    if ('parentName' in options) {
      targetParent = this._model?.getObjectByName(options.parentName) || null;
    } else if ('parent' in options) {
      targetParent = options.parent;
    }

    if (!targetParent) {
      logger({
        message: MODEL_RENDERER_MESSAGES.ADD_ATTACHMENT_NO_PARENT,
        type: 'warn',
      });
      return;
    }

    if (!isChildOfObject(targetParent, this._model)) {
      logger({
        message: MODEL_RENDERER_MESSAGES.ADD_ATTACHMENT_INVALID_PARENT,
        type: 'warn',
      });
      return;
    }

    ResourceTracker.trackObject(options.object);

    // Get parent's world scale to compensate for it
    const parentWorldScale = new THREE.Vector3();
    targetParent.getWorldScale(parentWorldScale);
    // Prevent division by zero if any scale component is 0
    if (parentWorldScale.x === 0) parentWorldScale.x = 1;
    if (parentWorldScale.y === 0) parentWorldScale.y = 1;
    if (parentWorldScale.z === 0) parentWorldScale.z = 1;
    // Adjust object's scale to maintain world size when attached to scaled parent
    options.object.scale.divide(parentWorldScale);

    targetParent.add(options.object);
  }

  public removeAttachment(object: THREE.Object3D): void {
    if (!this._model) {
      logger({
        message: MODEL_RENDERER_MESSAGES.REMOVE_ATTACHMENT_NO_MODEL,
        type: 'warn',
      });
      return;
    }

    if (!isChildOfObject(object, this._model)) {
      logger({
        message: MODEL_RENDERER_MESSAGES.REMOVE_ATTACHMENT_NOT_IN_HIERARCHY,
        type: 'warn',
      });
      return;
    }

    const parent = object.parent;

    if (!parent) {
      logger({
        message: MODEL_RENDERER_MESSAGES.REMOVE_ATTACHMENT_NO_PARENT,
        type: 'warn',
      });
      return;
    }

    if (object instanceof GameObject) {
      object.destroy();
    }

    parent.remove(object);
    ResourceTracker.disposeObjectResources(object);
    ResourceTracker.untrackObject(object);
  }

  public onModelChange(_newModel: THREE.Object3D | null): void {}
}
