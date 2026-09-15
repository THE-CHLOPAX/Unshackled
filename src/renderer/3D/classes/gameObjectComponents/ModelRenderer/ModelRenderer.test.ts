import * as THREE from 'three';
import { MockCamera } from '@tgdf/internal-3d/testUtils/MockCamera';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameObject, getModelFromStore, ResourceTracker, Scene } from '@tgdf';

import { ModelRenderer } from './ModelRenderer';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

vi.mock('@tgdf', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tgdf')>();
  return {
    ...actual,
    getModelFromStore: vi.fn(),
  };
});

class TestScene extends Scene {
  camera = new MockCamera();
}

function createMeshModel(options?: { parentName?: string; parentScale?: number }): THREE.Group {
  const model = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
  model.add(mesh);

  if (options?.parentName) {
    const parent = new THREE.Group();
    parent.name = options.parentName;
    if (options.parentScale) {
      parent.scale.setScalar(options.parentScale);
    }
    parent.add(mesh);
    model.add(parent);
  }

  return model;
}

function createRenderer(model?: THREE.Object3D) {
  const scene = new TestScene();
  const gameObject = new GameObject({ scene });

  vi.mocked(getModelFromStore).mockReturnValue(model ?? createMeshModel());

  const modelRenderer = new ModelRenderer(gameObject, { id: 'test-model' });

  return { scene, gameObject, modelRenderer };
}

describe('ModelRenderer', () => {
  beforeEach(() => {
    vi.mocked(getModelFromStore).mockClear();
    vi.spyOn(ResourceTracker, 'trackObject');
    vi.spyOn(ResourceTracker, 'disposeObjectResources');
    vi.spyOn(ResourceTracker, 'untrackObject');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets the model from constructor options and adds it to the game object', () => {
    const model = createMeshModel();
    const { gameObject, modelRenderer } = createRenderer(model);

    expect(modelRenderer.getModel()).toBe(model);
    expect(gameObject.children).toContain(model);
  });

  describe('constructor options', () => {
    it('resolves the model from the asset store when given an id', () => {
      const scene = new TestScene();
      const gameObject = new GameObject({ scene });
      const model = createMeshModel();
      vi.mocked(getModelFromStore).mockReturnValue(model);

      const modelRenderer = new ModelRenderer(gameObject, { id: 'test-model' });

      expect(getModelFromStore).toHaveBeenCalledWith('test-model');
      expect(modelRenderer.getModel()).toBe(model);
    });

    it('uses the provided model directly without touching the asset store', () => {
      const scene = new TestScene();
      const gameObject = new GameObject({ scene });
      const model = createMeshModel();

      const modelRenderer = new ModelRenderer(gameObject, { model });

      expect(getModelFromStore).not.toHaveBeenCalled();
      expect(modelRenderer.getModel()).toBe(model);
      expect(gameObject.children).toContain(model);
    });

    it('throws when the id cannot be resolved in the asset store', () => {
      const scene = new TestScene();
      const gameObject = new GameObject({ scene });
      vi.mocked(getModelFromStore).mockReturnValue(undefined);

      expect(() => new ModelRenderer(gameObject, { id: 'missing-model' })).toThrow();
    });

    it('applies the scale option when given a store id', () => {
      const scene = new TestScene();
      const gameObject = new GameObject({ scene });
      const model = createMeshModel();
      vi.mocked(getModelFromStore).mockReturnValue(model);

      const modelRenderer = new ModelRenderer(gameObject, {
        id: 'test-model',
        scale: new THREE.Vector3(2, 2, 2),
      });

      expect(modelRenderer.getModel()?.scale).toEqual(new THREE.Vector3(2, 2, 2));
    });

    it('applies the scale option when given a ready model', () => {
      const scene = new TestScene();
      const gameObject = new GameObject({ scene });
      const model = createMeshModel();

      const modelRenderer = new ModelRenderer(gameObject, {
        model,
        scale: new THREE.Vector3(3, 3, 3),
      });

      expect(modelRenderer.getModel()?.scale).toEqual(new THREE.Vector3(3, 3, 3));
    });
  });

  it('clones materials when setting a model', () => {
    const originalMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), originalMaterial);
    const model = new THREE.Group();
    model.add(mesh);

    const { modelRenderer } = createRenderer(model);
    const materials = modelRenderer.getModelMaterials();

    expect(materials?.[0]).not.toBe(originalMaterial);
  });

  it('returns null from getModelMaterials when no mesh exists in the model', () => {
    const { modelRenderer } = createRenderer(new THREE.Group());

    expect(modelRenderer.getModelMaterials()).toBeNull();
  });

  it('returns cloned materials keyed by mesh from getMaterialsCopy', () => {
    const model = createMeshModel();
    const mesh = model.children[0] as THREE.Mesh;
    const { modelRenderer } = createRenderer(model);

    const copies = modelRenderer.getMaterialsCopy();

    const meshMaterial = mesh.material as THREE.MeshBasicMaterial;
    expect(copies.size).toBe(1);
    const copiedMaterial = copies.get(mesh) as THREE.MeshBasicMaterial;
    expect(copiedMaterial).not.toBe(meshMaterial);
    expect(copiedMaterial.color.getHex()).toBe(meshMaterial.color.getHex());
  });

  it('getMaterialsCopy keeps returning the original material even once the mesh is showing something else', () => {
    const model = createMeshModel();
    const mesh = model.children[0] as THREE.Mesh;
    const { modelRenderer } = createRenderer(model);

    const originalMaterial = mesh.material as THREE.MeshBasicMaterial;
    const originalColor = originalMaterial.color.getHex();

    // Simulate an overlapping flash swapping the mesh's live material.
    mesh.material = new THREE.MeshBasicMaterial({ color: 0x0000ff });

    const copies = modelRenderer.getMaterialsCopy();
    const copiedMaterial = copies.get(mesh) as THREE.MeshBasicMaterial;

    expect(copiedMaterial.color.getHex()).toBe(originalColor);
    expect(copiedMaterial).not.toBe(mesh.material);
  });

  it('re-captures original materials when the model is swapped', () => {
    const { modelRenderer } = createRenderer();

    const nextModel = createMeshModel();
    const nextMesh = nextModel.children[0] as THREE.Mesh;
    modelRenderer.setModel(nextModel);

    const copies = modelRenderer.getMaterialsCopy();
    expect(copies.has(nextMesh)).toBe(true);
  });

  it('restores original materials after mutation', () => {
    const { modelRenderer } = createRenderer();
    const materials = modelRenderer.getModelMaterials();
    expect(materials?.[0]).toBeInstanceOf(THREE.MeshBasicMaterial);

    const meshMaterial = materials?.[0] as THREE.MeshBasicMaterial;
    const originalColor = meshMaterial.color.getHex();

    meshMaterial.color.setHex(0x00ff00);
    modelRenderer.restoreOriginalMaterials();

    expect(meshMaterial.color.getHex()).toBe(originalColor);
  });

  it('swaps models and invokes onModelChange', () => {
    const { modelRenderer } = createRenderer();
    const onModelChange = vi.fn();
    modelRenderer.onModelChange = onModelChange;

    const nextModel = createMeshModel();
    modelRenderer.setModel(nextModel);

    expect(modelRenderer.getModel()).toBe(nextModel);
    expect(onModelChange).toHaveBeenCalledWith(nextModel);
  });

  it('does not swap models when the same model reference is provided', () => {
    const model = createMeshModel();
    const { gameObject, modelRenderer } = createRenderer(model);
    const removeSpy = vi.spyOn(gameObject, 'remove');

    modelRenderer.setModel(model);

    expect(removeSpy).not.toHaveBeenCalled();
    expect(modelRenderer.getModel()).toBe(model);
  });

  it('adds attachments by parent name and tracks their resources', () => {
    const model = createMeshModel({ parentName: 'hand' });
    const { modelRenderer } = createRenderer(model);
    const attachment = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.2),
      new THREE.MeshBasicMaterial()
    );

    modelRenderer.addAttachment({ object: attachment, parentName: 'hand' });

    expect(model.getObjectByName('hand')?.children).toContain(attachment);
    expect(ResourceTracker.trackObject).toHaveBeenCalledWith(attachment);
  });

  it('compensates attachment scale for parent world scale', () => {
    const model = createMeshModel({ parentName: 'hand', parentScale: 2 });
    const { modelRenderer } = createRenderer(model);
    const attachment = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.2),
      new THREE.MeshBasicMaterial()
    );
    attachment.scale.set(1, 1, 1);

    modelRenderer.addAttachment({ object: attachment, parentName: 'hand' });

    expect(attachment.scale.x).toBeCloseTo(0.5);
    expect(attachment.scale.y).toBeCloseTo(0.5);
    expect(attachment.scale.z).toBeCloseTo(0.5);
  });

  it('does not add attachments when no model is set', () => {
    const { modelRenderer } = createRenderer();
    modelRenderer.setModel(null);
    vi.mocked(ResourceTracker.trackObject).mockClear();

    const attachment = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.2),
      new THREE.MeshBasicMaterial()
    );
    modelRenderer.addAttachment({ object: attachment, parentName: 'hand' });

    expect(ResourceTracker.trackObject).not.toHaveBeenCalled();
    expect(attachment.parent).toBeNull();
  });

  it('removes attachments and disposes tracked resources', () => {
    const model = createMeshModel({ parentName: 'hand' });
    const { modelRenderer } = createRenderer(model);
    const attachment = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.2),
      new THREE.MeshBasicMaterial()
    );

    modelRenderer.addAttachment({ object: attachment, parentName: 'hand' });
    modelRenderer.removeAttachment(attachment);

    expect(attachment.parent).toBeNull();
    expect(ResourceTracker.disposeObjectResources).toHaveBeenCalledWith(attachment);
    expect(ResourceTracker.untrackObject).toHaveBeenCalledWith(attachment);
  });

  it('destroys game object attachments when removing them', () => {
    const model = createMeshModel({ parentName: 'hand' });
    const { scene, modelRenderer } = createRenderer(model);
    const attachment = new GameObject({ scene });
    const destroySpy = vi.spyOn(attachment, 'destroy');

    modelRenderer.addAttachment({ object: attachment, parentName: 'hand' });
    modelRenderer.removeAttachment(attachment);

    expect(destroySpy).toHaveBeenCalledOnce();
  });
});
