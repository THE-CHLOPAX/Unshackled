import * as THREE from 'three';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

import { useAssetStore, unloadAssets, getModelFromStore, ModelRecord, TextureRecord } from '@tgdf';

function createModelObject(): THREE.Object3D {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
  group.add(mesh);
  return group;
}

function textureRecord(id: string): TextureRecord {
  return { type: 'texture', id, path: `./assets/textures/${id}.png` };
}

function modelRecord(id: string): ModelRecord {
  return { type: 'model', id, path: `./assets/models/${id}.glb` };
}

describe('unloadAssets', () => {
  beforeEach(() => {
    useAssetStore.setState({
      textureCache: new Map(),
      modelCacheJSON: new Map(),
      modelCacheGLTF: new Map(),
      modelCacheFBX: new Map(),
    });
  });

  it('disposes and removes a cached texture', () => {
    const texture = new THREE.Texture();
    const disposeSpy = vi.spyOn(texture, 'dispose');
    useAssetStore.setState((state) => ({
      textureCache: new Map(state.textureCache).set('tex-a', texture),
    }));

    unloadAssets([textureRecord('tex-a')]);

    expect(disposeSpy).toHaveBeenCalledOnce();
    expect(useAssetStore.getState().textureCache.has('tex-a')).toBe(false);
  });

  it('does nothing when unloading a texture id that was never cached', () => {
    expect(() => unloadAssets([textureRecord('missing')])).not.toThrow();
    expect(useAssetStore.getState().textureCache.size).toBe(0);
  });

  it('disposes geometry/material and removes a model from the GLTF cache', () => {
    const model = createModelObject();
    const mesh = model.children[0] as THREE.Mesh;
    const geometryDisposeSpy = vi.spyOn(mesh.geometry, 'dispose');
    const materialDisposeSpy = vi.spyOn(mesh.material as THREE.Material, 'dispose');

    useAssetStore.setState((state) => ({
      modelCacheGLTF: new Map(state.modelCacheGLTF).set('model-a', model),
    }));

    unloadAssets([modelRecord('model-a')]);

    expect(geometryDisposeSpy).toHaveBeenCalledOnce();
    expect(materialDisposeSpy).toHaveBeenCalledOnce();
    expect(useAssetStore.getState().modelCacheGLTF.has('model-a')).toBe(false);
  });

  it('disposes embedded textures once, even when shared across the model materials', () => {
    const model = new THREE.Group();
    const sharedTexture = new THREE.Texture();
    const disposeSpy = vi.spyOn(sharedTexture, 'dispose');

    const meshA = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ map: sharedTexture })
    );
    const meshB = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ map: sharedTexture, normalMap: sharedTexture })
    );
    model.add(meshA, meshB);

    useAssetStore.setState((state) => ({
      modelCacheGLTF: new Map(state.modelCacheGLTF).set('model-tex', model),
    }));

    unloadAssets([modelRecord('model-tex')]);

    expect(disposeSpy).toHaveBeenCalledOnce();
  });

  it('removes a model from whichever cache (JSON/GLTF/FBX) it was loaded into', () => {
    const jsonModel = createModelObject();
    const fbxModel = createModelObject();

    useAssetStore.setState((state) => ({
      modelCacheJSON: new Map(state.modelCacheJSON).set('model-json', jsonModel),
      modelCacheFBX: new Map(state.modelCacheFBX).set('model-fbx', fbxModel),
    }));

    unloadAssets([modelRecord('model-json'), modelRecord('model-fbx')]);

    expect(useAssetStore.getState().modelCacheJSON.has('model-json')).toBe(false);
    expect(useAssetStore.getState().modelCacheFBX.has('model-fbx')).toBe(false);
  });

  it('does nothing when unloading a model id that was never cached', () => {
    expect(() => unloadAssets([modelRecord('missing')])).not.toThrow();
  });

  it('only removes the requested assets, leaving other cached entries untouched', () => {
    const keptTexture = new THREE.Texture();
    const removedTexture = new THREE.Texture();
    const keptModel = createModelObject();
    const removedModel = createModelObject();

    useAssetStore.setState((state) => ({
      textureCache: new Map(state.textureCache)
        .set('tex-keep', keptTexture)
        .set('tex-remove', removedTexture),
      modelCacheGLTF: new Map(state.modelCacheGLTF)
        .set('model-keep', keptModel)
        .set('model-remove', removedModel),
    }));

    unloadAssets([textureRecord('tex-remove'), modelRecord('model-remove')]);

    expect(useAssetStore.getState().textureCache.has('tex-keep')).toBe(true);
    expect(useAssetStore.getState().textureCache.has('tex-remove')).toBe(false);
    expect(useAssetStore.getState().modelCacheGLTF.has('model-keep')).toBe(true);
    expect(useAssetStore.getState().modelCacheGLTF.has('model-remove')).toBe(false);
  });

  it('makes an unloaded model unretrievable via getModelFromStore', () => {
    const model = createModelObject();
    useAssetStore.setState((state) => ({
      modelCacheGLTF: new Map(state.modelCacheGLTF).set('model-a', model),
    }));

    expect(getModelFromStore('model-a')).not.toBeUndefined();

    unloadAssets([modelRecord('model-a')]);

    expect(getModelFromStore('model-a')).toBeUndefined();
  });

  it('handles a mixed batch of model and texture records in one call', () => {
    const texture = new THREE.Texture();
    const model = createModelObject();

    useAssetStore.setState((state) => ({
      textureCache: new Map(state.textureCache).set('tex-a', texture),
      modelCacheFBX: new Map(state.modelCacheFBX).set('model-a', model),
    }));

    unloadAssets([textureRecord('tex-a'), modelRecord('model-a')]);

    expect(useAssetStore.getState().textureCache.has('tex-a')).toBe(false);
    expect(useAssetStore.getState().modelCacheFBX.has('model-a')).toBe(false);
  });
});
