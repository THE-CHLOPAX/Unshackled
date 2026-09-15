import { gsap } from 'gsap';
import * as THREE from 'three';

import { Entity } from '../classes/gameObjects/Entity';
import { MeshMaterial } from '../classes/gameObjectComponents/ModelRenderer/ModelRenderer';

export type FlashMaterialFadeOptions = {
  duration: number;
};

export type FlashMaterialOptions = {
  entity: Entity;
  material: THREE.Material;
  duration: number;
  fadeIn?: FlashMaterialFadeOptions;
  fadeOut?: FlashMaterialFadeOptions;
};

const activeFlashTimelines = new WeakMap<Entity, gsap.core.Timeline>();

export function flashMaterial(options: FlashMaterialOptions): gsap.core.Timeline | null {
  const { entity, material: material, duration, fadeIn, fadeOut } = options;

  const model = entity.modelRenderer.getModel();
  if (!model) return null;

  const meshes: THREE.Mesh[] = [];
  model.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) meshes.push(child as THREE.Mesh);
  });

  if (meshes.length === 0) return null;

  activeFlashTimelines.get(entity)?.kill();

  const modelOriginalMaterials = entity.modelRenderer.getMaterialsCopy();
  const originalMaterials = new Map<THREE.Mesh, MeshMaterial>();
  meshes.forEach((mesh) => {
    originalMaterials.set(mesh, modelOriginalMaterials.get(mesh) ?? mesh.material);
  });

  if (fadeIn !== undefined || fadeOut !== undefined) {
    material.transparent = true;
  }

  const targetOpacity = material.opacity;

  const timeline = gsap.timeline();
  activeFlashTimelines.set(entity, timeline);

  meshes.forEach((mesh) => {
    mesh.material = material;
  });

  if (fadeIn !== undefined) {
    material.opacity = 0;
    timeline.to(material, { opacity: targetOpacity, duration: fadeIn.duration });
  } else {
    material.opacity = targetOpacity;
  }

  timeline.to({}, { duration });

  if (fadeOut !== undefined) {
    timeline.to(material, { opacity: 0, duration: fadeOut.duration });
  }

  timeline.call(() => {
    originalMaterials.forEach((originalMaterial, mesh) => {
      mesh.material = originalMaterial;
    });
    if (activeFlashTimelines.get(entity) === timeline) {
      activeFlashTimelines.delete(entity);
    }
  });

  return timeline;
}

type EmissiveMaterial = THREE.Material & { emissive: THREE.Color; emissiveIntensity: number };

function isEmissiveMaterial(material: THREE.Material): material is EmissiveMaterial {
  return 'emissive' in material && 'emissiveIntensity' in material;
}

export type FlashEmissiveOptions = {
  entity: Entity;
  color: THREE.ColorRepresentation;
  intensity?: number;
  duration: number;
  fadeIn?: FlashMaterialFadeOptions;
  fadeOut?: FlashMaterialFadeOptions;
};

export function flashEmissive(options: FlashEmissiveOptions): gsap.core.Timeline | null {
  const { entity, color, intensity = 1, duration, fadeIn, fadeOut } = options;

  const model = entity.modelRenderer.getModel();
  if (!model) return null;

  const materials: EmissiveMaterial[] = [];
  model.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const meshMaterial = (child as THREE.Mesh).material;
    const meshMaterials = Array.isArray(meshMaterial) ? meshMaterial : [meshMaterial];
    meshMaterials.forEach((material) => {
      if (isEmissiveMaterial(material)) materials.push(material);
    });
  });

  if (materials.length === 0) return null;

  const originalStates = materials.map((material) => ({
    material,
    color: material.emissive.clone(),
    intensity: material.emissiveIntensity,
  }));

  const timeline = gsap.timeline();

  materials.forEach((material) => material.emissive.set(color));

  if (fadeIn !== undefined) {
    materials.forEach((material) => {
      material.emissiveIntensity = 0;
    });
    timeline.to(materials, { emissiveIntensity: intensity, duration: fadeIn.duration });
  } else {
    materials.forEach((material) => {
      material.emissiveIntensity = intensity;
    });
  }

  timeline.to({}, { duration });

  if (fadeOut !== undefined) {
    timeline.to(materials, { emissiveIntensity: 0, duration: fadeOut.duration });
  }

  timeline.call(() => {
    originalStates.forEach(({ material, color: originalColor, intensity: originalIntensity }) => {
      material.emissive.copy(originalColor);
      material.emissiveIntensity = originalIntensity;
    });
  });

  return timeline;
}
