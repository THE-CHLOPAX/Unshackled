import * as THREE from 'three';

export function pixelateTexture(texture?: THREE.Texture): THREE.Texture | undefined {
  if (!texture) return undefined;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
