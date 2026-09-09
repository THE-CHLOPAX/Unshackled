import * as THREE from 'three';
import { create } from 'zustand';
import { traverseFind, logger } from '@tgdf';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import { ResourceTracker } from '../internal-3d/ResourceTracker/ResourceTracker';

export type AssetState = {
  textureCache: Map<string, THREE.Texture>;
  modelCacheJSON: Map<string, THREE.Object3D>;
  modelCacheGLTF: Map<string, THREE.Object3D>;
  modelCacheFBX: Map<string, THREE.Object3D>;
  loadTexture: (id: string, url: string, colorSpace?: THREE.ColorSpace) => Promise<THREE.Texture>;
  loadModelJSON: (id: string, url: string, nameExtractor?: string) => Promise<THREE.Object3D>;
  loadModelGLTF: (
    id: string,
    url: string,
    options?: LoadModelGLTFOptions
  ) => Promise<THREE.Object3D>;
  loadModelFBX: (id: string, url: string, options?: LoadModelFBXOptions) => Promise<THREE.Object3D>;
};

export type LoadModelOptions = {
  nameExtractor?: string;
  centerOrigin?: boolean;
};

export type LoadModelGLTFOptions = LoadModelOptions;

export type LoadModelFBXOptions = LoadModelOptions & {
  texturePaths?: Record<string, string>; // material name -> texture URL
};

export type ModelRecord = {
  type: 'model';
  id: string;
  path: string;
  nameExtractor?: string;
  centerOrigin?: boolean;
};

export type TextureRecord = {
  type: 'texture';
  id: string;
  path: string;
  colorSpace?: THREE.ColorSpace;
};

export type AssetRecord = ModelRecord | TextureRecord;

const gltfLoader = new GLTFLoader();
const fbxLoader = new FBXLoader();
fbxLoader.setResourcePath('./assets/textures/');
const jsonLoader = new THREE.ObjectLoader();
const textureLoader = new THREE.TextureLoader();

const COPY_ASSETS_NOTE = '\n\n❗️ Make sure to copy new assets using npm run copy-assets.\n';

function extractNamedObject(
  root: THREE.Object3D,
  nameExtractor: string | undefined,
  url: string,
  format: string
): THREE.Object3D {
  if (!nameExtractor) return root;

  const found = traverseFind(
    root,
    (obj) => obj.name === nameExtractor && obj instanceof THREE.Object3D
  );

  if (!found) {
    logger({
      message:
        `AssetStore: Object with name '${nameExtractor}' not found in ${format} model: ` +
        `${url}. Using entire scene as fallback.`,
      type: 'warn',
    });
  }

  return found ?? root;
}

function finalizeLoadedModel(
  object: THREE.Object3D,
  animations: THREE.AnimationClip[],
  options?: Pick<LoadModelOptions, 'centerOrigin'>
): THREE.Object3D {
  animations.forEach((clip) => {
    clip.name = clip.name.toLowerCase();
  });

  if (options?.centerOrigin) {
    if (object instanceof THREE.Mesh) {
      object.geometry.center();
    } else {
      const center = new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3());
      object.position.sub(center);
    }
  }

  object.animations = animations;

  return object;
}

export const useAssetStore = create<AssetState>((set, get) => ({
  textureCache: new Map<string, THREE.Texture>(),
  modelCacheJSON: new Map<string, THREE.Object3D>(),
  modelCacheGLTF: new Map<string, THREE.Object3D>(),
  modelCacheFBX: new Map<string, THREE.Object3D>(),

  loadTexture: (id: string, url: string, colorSpace?: THREE.ColorSpace): Promise<THREE.Texture> => {
    // Check cache first
    const cached = get().textureCache.get(id);
    if (cached) {
      return Promise.resolve(cached);
    }

    return new Promise((resolve, reject) => {
      textureLoader.load(
        url,
        (texture) => {
          if (colorSpace) {
            texture.colorSpace = colorSpace;
          }

          set((state) => ({
            textureCache: new Map(state.textureCache).set(id, texture),
          }));
          resolve(texture);
        },
        undefined,
        (error) => {
          reject(new Error(`Failed to load texture: ${url}, ${error}\n\n${COPY_ASSETS_NOTE}`));
        }
      );
    });
  },

  loadModelJSON: (id: string, url: string, nameExtractor?: string): Promise<THREE.Object3D> => {
    // Check cache first
    const cached = get().modelCacheJSON.get(id);
    if (cached) {
      return Promise.resolve(cached);
    }

    return new Promise((resolve, reject) => {
      fetch(url)
        .then((response) => response.json())
        .then((data) => {
          const scene = jsonLoader.parse(data.scene);
          const object = extractNamedObject(scene, nameExtractor, url, 'JSON');

          set((state) => ({
            modelCacheJSON: new Map(state.modelCacheJSON).set(id, object),
          }));
          resolve(object);
        })
        .catch((error) => {
          reject(new Error(`Failed to load model JSON: ${url}, ${error}.\n\n${COPY_ASSETS_NOTE}`));
        });
    });
  },

  loadModelGLTF: (
    id: string,
    url: string,
    options?: LoadModelGLTFOptions
  ): Promise<THREE.Object3D> => {
    // Check cache first
    const cached = get().modelCacheGLTF.get(id);
    if (cached) {
      return Promise.resolve(cached);
    }

    return new Promise((resolve, reject) => {
      gltfLoader.load(
        url,
        (gltf) => {
          const object = extractNamedObject(gltf.scene, options?.nameExtractor, url, 'GLTF');
          const model = finalizeLoadedModel(object, gltf.animations, options);

          set((state) => ({
            modelCacheGLTF: new Map(state.modelCacheGLTF).set(id, model),
          }));
          resolve(model);
        },
        undefined,
        (error) => {
          reject(new Error(`Failed to load GLTF model: ${url}, ${error}.\n\n${COPY_ASSETS_NOTE}`));
        }
      );
    });
  },

  loadModelFBX: (
    id: string,
    url: string,
    options?: LoadModelFBXOptions
  ): Promise<THREE.Object3D> => {
    // Check cache first
    const cached = get().modelCacheFBX.get(id);
    if (cached) {
      return Promise.resolve(cached);
    }

    return new Promise((resolve, reject) => {
      fbxLoader.load(
        url,
        (fbx) => {
          const object = extractNamedObject(fbx, options?.nameExtractor, url, 'FBX');
          const model = finalizeLoadedModel(object, fbx.animations, options);

          // Load and assign each named material's texture (FBX doesn't embed textures like
          // GLTF does, so they're fetched separately and matched onto materials by name).
          const texturePaths = options?.texturePaths;
          const textureAssignments: Promise<void>[] = [];

          if (texturePaths) {
            model.traverse((child) => {
              if (!(child instanceof THREE.Mesh)) return;

              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach((material) => {
                const texturePath = texturePaths[material.name];
                if (!texturePath) return;

                textureAssignments.push(
                  get()
                    .loadTexture(texturePath, texturePath, THREE.SRGBColorSpace)
                    .then((texture) => {
                      (material as THREE.MeshStandardMaterial).map = texture;
                      material.needsUpdate = true;
                    })
                );
              });
            });
          }

          Promise.all(textureAssignments).then(() => {
            set((state) => ({
              modelCacheFBX: new Map(state.modelCacheFBX).set(id, model),
            }));
            resolve(model);
          });
        },
        undefined,
        (error) => {
          reject(new Error(`Failed to load FBX model: ${url}, ${error}.\n\n${COPY_ASSETS_NOTE}`));
        }
      );
    });
  },
}));

function markModelResourcesPersistent(model: THREE.Object3D): void {
  const tracker = ResourceTracker.getInstance();
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    tracker.markPersistent(child.geometry);
    tracker.markPersistent(child.material);
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) tracker.markPersistent(value);
      }
    });
  });
}

export const getModelFromStore = (id: string): THREE.Object3D | undefined => {
  const modelObject =
    useAssetStore.getState().modelCacheJSON.get(id) ||
    useAssetStore.getState().modelCacheGLTF.get(id) ||
    useAssetStore.getState().modelCacheFBX.get(id);
  if (!modelObject) return undefined;

  markModelResourcesPersistent(modelObject);
  // Model has to be copied using skeleton utils
  return clone(modelObject);
};

const MODEL_CACHE_KEYS = ['modelCacheJSON', 'modelCacheGLTF', 'modelCacheFBX'] as const;

function disposeModel(model: THREE.Object3D): void {
  const disposedTextures = new Set<THREE.Texture>();

  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    child.geometry.dispose();

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture && !disposedTextures.has(value)) {
          disposedTextures.add(value);
          value.dispose();
        }
      }
      material.dispose();
    });
  });
}

function unloadTexture(id: string): void {
  const texture = useAssetStore.getState().textureCache.get(id);
  if (!texture) return;

  texture.dispose();

  useAssetStore.setState((state) => {
    const next = new Map(state.textureCache);
    next.delete(id);
    return { textureCache: next };
  });
}

function unloadModel(id: string): void {
  MODEL_CACHE_KEYS.forEach((cacheKey) => {
    const model = useAssetStore.getState()[cacheKey].get(id);
    if (!model) return;

    disposeModel(model);

    useAssetStore.setState((state) => {
      const next = new Map(state[cacheKey]);
      next.delete(id);
      return { [cacheKey]: next };
    });
  });
}

export const unloadAssets = (assets: AssetRecord[]): void => {
  assets.forEach((asset) => {
    if (asset.type === 'texture') {
      unloadTexture(asset.id);
    } else {
      unloadModel(asset.id);
    }
  });
};
