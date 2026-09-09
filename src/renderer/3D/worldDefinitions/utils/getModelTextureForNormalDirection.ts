import * as THREE from 'three';
import { assert, getModelFromStore, isMesh, ResourceTracker } from '@tgdf';

type Options = {
  angleThresholdDeg?: number;
};

const DEFAULT_ANGLE_THRESHOLD_DEG = 5;

const textureCache = new Map<string, THREE.Texture>();

export function getModelTextureForNormalDirection(
  modelId: string,
  normalDirection: THREE.Vector3,
  options: Options = {}
): THREE.Texture {
  const angleThresholdDeg = options.angleThresholdDeg ?? DEFAULT_ANGLE_THRESHOLD_DEG;
  const target = normalDirection.clone().normalize();
  const cacheKey = `${modelId}:${target.x},${target.y},${target.z}:${angleThresholdDeg}`;

  const cached = textureCache.get(cacheKey);
  if (cached) return cached;

  const model = getModelFromStore(modelId);
  assert(isMesh(model), `Source model with id: ${modelId} is not a mesh`);

  const geometry = model.geometry;
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  assert(position !== undefined, `Model ${modelId} geometry has no position attribute`);
  assert(uv !== undefined, `Model ${modelId} geometry has no uv attribute`);

  const materials = Array.isArray(model.material) ? model.material : [model.material];
  const sourceMap = materials
    .map((material) => (material as THREE.MeshStandardMaterial).map)
    .find((map): map is THREE.Texture => map instanceof THREE.Texture);
  assert(sourceMap !== undefined, `Model ${modelId} has no material map texture`);

  const image = sourceMap.image as HTMLImageElement | ImageBitmap | null | undefined;
  assert(
    image != null && image.width > 0 && image.height > 0,
    `Material map for model ${modelId} has no loaded image`
  );

  const minDot = Math.cos(THREE.MathUtils.degToRad(angleThresholdDeg));
  const index = geometry.index;
  const triangleCount = (index ? index.count : position.count) / 3;

  const cornerA = new THREE.Vector3();
  const cornerB = new THREE.Vector3();
  const cornerC = new THREE.Vector3();
  const triangle = new THREE.Triangle();
  const faceNormal = new THREE.Vector3();
  const uvPoint = new THREE.Vector2();
  const uvBounds = new THREE.Box2();

  let matchedFaces = 0;

  for (let tri = 0; tri < triangleCount; tri++) {
    const i0 = index ? index.getX(tri * 3) : tri * 3;
    const i1 = index ? index.getX(tri * 3 + 1) : tri * 3 + 1;
    const i2 = index ? index.getX(tri * 3 + 2) : tri * 3 + 2;

    cornerA.fromBufferAttribute(position, i0);
    cornerB.fromBufferAttribute(position, i1);
    cornerC.fromBufferAttribute(position, i2);
    triangle.set(cornerA, cornerB, cornerC).getNormal(faceNormal);

    if (faceNormal.dot(target) < minDot) continue;

    uvBounds.expandByPoint(uvPoint.set(uv.getX(i0), uv.getY(i0)));
    uvBounds.expandByPoint(uvPoint.set(uv.getX(i1), uv.getY(i1)));
    uvBounds.expandByPoint(uvPoint.set(uv.getX(i2), uv.getY(i2)));
    matchedFaces++;
  }

  assert(
    matchedFaces > 0,
    `Model ${modelId} has no faces pointing towards (${target.x}, ${target.y}, ${target.z})`
  );

  const imageWidth = image.width;
  const imageHeight = image.height;
  const flipY = sourceMap.flipY !== false;

  const regionX = uvBounds.min.x * imageWidth;
  const regionWidth = (uvBounds.max.x - uvBounds.min.x) * imageWidth;
  const regionHeight = (uvBounds.max.y - uvBounds.min.y) * imageHeight;
  const regionY = (flipY ? 1 - uvBounds.max.y : uvBounds.min.y) * imageHeight;

  assert(
    regionWidth > 0 && regionHeight > 0,
    `Model ${modelId} matched faces span a zero-area UV region`
  );

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(regionWidth));
  canvas.height = Math.max(1, Math.round(regionHeight));

  const context = canvas.getContext('2d');
  assert(context !== null, 'Failed to acquire a 2D canvas context');
  context.imageSmoothingEnabled = false;
  context.drawImage(
    image,
    regionX,
    regionY,
    regionWidth,
    regionHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = sourceMap.colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  ResourceTracker.markPersistent(texture);
  textureCache.set(cacheKey, texture);
  return texture;
}
