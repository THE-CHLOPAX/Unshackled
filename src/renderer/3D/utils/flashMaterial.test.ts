import * as THREE from 'three';
import { Mock, IMock } from 'moq.ts';
import { describe, it, expect, vi, assert } from 'vitest';

import { Entity } from '../classes/gameObjects/Entity';
import { flashMaterial, flashEmissive } from './flashMaterial';
import { ModelRenderer } from '../classes/gameObjectComponents/ModelRenderer/ModelRenderer';

function createEntityMock(
  model: THREE.Object3D | null,
  materialsCopy: Map<THREE.Mesh, THREE.Material | THREE.Material[]> = new Map()
): Entity {
  const modelRendererMock: IMock<ModelRenderer> = new Mock<ModelRenderer>()
    .setup((mr) => mr.getModel())
    .returns(model)
    .setup((mr) => mr.getMaterialsCopy())
    .returns(materialsCopy);

  const entityMock: IMock<Entity> = new Mock<Entity>()
    .setup((e) => e.modelRenderer)
    .returns(modelRendererMock.object());

  return entityMock.object();
}

describe('flashMaterial', () => {
  it('returns null and does nothing when the entity has no model', () => {
    const entity = createEntityMock(null);

    const result = flashMaterial({
      entity,
      material: new THREE.MeshBasicMaterial(),
      duration: 1,
    });

    expect(result).toBeNull();
  });

  it('returns null when the model has no meshes', () => {
    const entity = createEntityMock(new THREE.Group());

    const result = flashMaterial({
      entity,
      material: new THREE.MeshBasicMaterial(),
      duration: 1,
    });

    expect(result).toBeNull();
  });

  it('swaps every mesh material to the flash material, then restores each original once the timeline completes', () => {
    const originalMaterialA = new THREE.MeshStandardMaterial();
    const originalMaterialB = new THREE.MeshStandardMaterial();
    const meshA = new THREE.Mesh(new THREE.BoxGeometry(), originalMaterialA);
    const meshB = new THREE.Mesh(new THREE.BoxGeometry(), originalMaterialB);
    const model = new THREE.Group();
    model.add(meshA, meshB);

    const entity = createEntityMock(
      model,
      new Map([
        [meshA, originalMaterialA],
        [meshB, originalMaterialB],
      ])
    );
    const flashMat = new THREE.MeshBasicMaterial();

    const timeline = flashMaterial({ entity, material: flashMat, duration: 1 });

    expect(meshA.material).toBe(flashMat);
    expect(meshB.material).toBe(flashMat);

    timeline?.progress(1);

    expect(meshA.material).toBe(originalMaterialA);
    expect(meshB.material).toBe(originalMaterialB);
  });

  it('restores to the material tracked by ModelRenderer, not whatever is on the mesh at call time', () => {
    const mesh: THREE.Mesh<THREE.BoxGeometry, THREE.Material> = new THREE.Mesh(
      new THREE.BoxGeometry(),
      new THREE.MeshStandardMaterial()
    );
    const model = new THREE.Group();
    model.add(mesh);

    // Simulate an overlapping flash: the mesh is currently showing some other
    // temporary material, but ModelRenderer still knows the true original.
    const trueOriginal = new THREE.MeshStandardMaterial();
    mesh.material = new THREE.MeshBasicMaterial();

    const entity = createEntityMock(model, new Map([[mesh, trueOriginal]]));
    const flashMat = new THREE.MeshBasicMaterial();

    const timeline = flashMaterial({ entity, material: flashMat, duration: 1 });
    timeline?.progress(1);

    expect(mesh.material).toBe(trueOriginal);
  });

  it('falls back to the mesh current material when ModelRenderer has no tracked original for it', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
    const untrackedOriginal = mesh.material;
    const model = new THREE.Group();
    model.add(mesh);

    const entity = createEntityMock(model, new Map());
    const flashMat = new THREE.MeshBasicMaterial();

    const timeline = flashMaterial({ entity, material: flashMat, duration: 1 });
    timeline?.progress(1);

    expect(mesh.material).toBe(untrackedOriginal);
  });

  it('kills the previous flash timeline when called again before it finishes, so they cannot fight over the mesh', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
    const model = new THREE.Group();
    model.add(mesh);
    const trueOriginal = mesh.material;

    const entity = createEntityMock(model, new Map([[mesh, trueOriginal]]));

    const timelineA = flashMaterial({
      entity,
      material: new THREE.MeshBasicMaterial(),
      duration: 1,
      fadeOut: { duration: 0.5 },
    });
    assert(timelineA !== null, 'timelineA is null');
    const killSpy = vi.spyOn(timelineA, 'kill');

    const flashMatB = new THREE.MeshBasicMaterial();
    const timelineB = flashMaterial({ entity, material: flashMatB, duration: 1 });

    expect(killSpy).toHaveBeenCalledOnce();
    expect(mesh.material).toBe(flashMatB);

    timelineB?.progress(1);
    expect(mesh.material).toBe(trueOriginal);
  });

  it('fades in from zero opacity when fadeIn is enabled', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
    const model = new THREE.Group();
    model.add(mesh);

    const entity = createEntityMock(model);
    const flashMat = new THREE.MeshBasicMaterial({ opacity: 1 });

    flashMaterial({
      entity,
      material: flashMat,
      duration: 1,
      fadeIn: { duration: 0.5 },
    });

    expect(flashMat.opacity).toBeCloseTo(0);
    expect(flashMat.transparent).toBe(true);
  });

  it('fades out to zero opacity by the end of the timeline when fadeOut is enabled', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
    const model = new THREE.Group();
    model.add(mesh);

    const entity = createEntityMock(model);
    const flashMat = new THREE.MeshBasicMaterial({ opacity: 1 });

    const timeline = flashMaterial({
      entity,
      material: flashMat,
      duration: 1,
      fadeOut: { duration: 0.5 },
    });

    timeline?.progress(1);

    expect(flashMat.opacity).toBeCloseTo(0);
  });

  it('does not touch opacity or transparency when neither fadeIn nor fadeOut is requested', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
    const model = new THREE.Group();
    model.add(mesh);

    const entity = createEntityMock(model);
    const flashMat = new THREE.MeshBasicMaterial({ opacity: 1 });

    flashMaterial({ entity, material: flashMat, duration: 1 });

    expect(flashMat.opacity).toBe(1);
    expect(flashMat.transparent).toBe(false);
  });
});

describe('flashEmissive', () => {
  it('returns null and does nothing when the entity has no model', () => {
    const entity = createEntityMock(null);

    const result = flashEmissive({ entity, color: '#ff0000', duration: 1 });

    expect(result).toBeNull();
  });

  it('returns null when no mesh material supports emissive', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    const model = new THREE.Group();
    model.add(mesh);
    const entity = createEntityMock(model);

    const result = flashEmissive({ entity, color: '#ff0000', duration: 1 });

    expect(result).toBeNull();
  });

  it('sets the emissive color and intensity without swapping the material, then restores it', () => {
    const material = new THREE.MeshStandardMaterial({ emissive: new THREE.Color(0x000000) });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), material);
    const model = new THREE.Group();
    model.add(mesh);
    const entity = createEntityMock(model);

    const timeline = flashEmissive({ entity, color: '#ff0000', intensity: 2, duration: 1 });

    expect(mesh.material).toBe(material);
    expect(material.emissive.getHexString()).toBe('ff0000');
    expect(material.emissiveIntensity).toBe(2);

    timeline?.progress(1);

    expect(mesh.material).toBe(material);
    expect(material.emissive.getHex()).toBe(0x000000);
    expect(material.emissiveIntensity).toBe(1);
  });

  it('fades emissive intensity in and out when requested', () => {
    const material = new THREE.MeshStandardMaterial();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), material);
    const model = new THREE.Group();
    model.add(mesh);
    const entity = createEntityMock(model);

    const timeline = flashEmissive({
      entity,
      color: '#ff0000',
      intensity: 2,
      duration: 1,
      fadeIn: { duration: 0.5 },
      fadeOut: { duration: 0.5 },
    });

    expect(material.emissiveIntensity).toBe(0);

    timeline?.progress(1);

    expect(material.emissiveIntensity).toBeCloseTo(1);
  });
});
