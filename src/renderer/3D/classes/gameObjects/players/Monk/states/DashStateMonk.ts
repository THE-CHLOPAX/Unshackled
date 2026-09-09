import gsap from 'gsap';
import * as THREE from 'three';
import { isMesh } from '@tgdf';
import { clone as cloneWithSkeleton } from 'three/examples/jsm/utils/SkeletonUtils';

import { COLORS } from 'renderer/constants';
import { MATERIALS } from 'renderer/3D/constants';
import { DashOptions, DashState } from 'renderer/3D/classes/states';

import { Player } from '../../Player';

const DASH_FLASH_COLOR = new THREE.Color(COLORS.GOLDEN);
const DASH_FLASH_EMISSIVE_INTENSITY = 3;
const FLASH_IN_DURATION = 0.1;
const FLASH_OUT_DURATION = 0.35;

const GHOST_SPAWN_INTERVAL_MS = 40;
const GHOST_FADE_DURATION = 0.35;
const GHOST_INITIAL_OPACITY = 0.45;
const GHOST_EMISSIVE_INTENSITY = 2;

type FlashableMaterial = THREE.Material & {
  color: THREE.Color;
  emissive: THREE.Color;
  emissiveIntensity: number;
};

function isFlashableMaterial(material: THREE.Material): material is FlashableMaterial {
  return (
    'color' in material &&
    material.color instanceof THREE.Color &&
    'emissive' in material &&
    material.emissive instanceof THREE.Color &&
    'emissiveIntensity' in material &&
    typeof material.emissiveIntensity === 'number'
  );
}

type OriginalMaterialState = {
  color: THREE.Color;
  emissive: THREE.Color;
  emissiveIntensity: number;
};

export class DashStateMonk extends DashState {
  private _originalMaterialState = new Map<FlashableMaterial, OriginalMaterialState>();
  private _ghostSpawnInterval: NodeJS.Timeout | null = null;

  constructor(
    public entity: Player,
    public options: DashOptions
  ) {
    super(entity, options);
  }

  public override onEnter(): void {
    super.onEnter();

    const materials = this.entity.modelRenderer.getModelMaterials();
    if (materials) {
      materials.filter(isFlashableMaterial).forEach((material) => {
        this._originalMaterialState.set(material, {
          color: material.color.clone(),
          emissive: material.emissive.clone(),
          emissiveIntensity: material.emissiveIntensity,
        });

        gsap.to(material.color, {
          r: DASH_FLASH_COLOR.r,
          g: DASH_FLASH_COLOR.g,
          b: DASH_FLASH_COLOR.b,
          duration: FLASH_IN_DURATION,
        });
        gsap.to(material.emissive, {
          r: DASH_FLASH_COLOR.r,
          g: DASH_FLASH_COLOR.g,
          b: DASH_FLASH_COLOR.b,
          duration: FLASH_IN_DURATION,
        });
        gsap.to(material, {
          emissiveIntensity: DASH_FLASH_EMISSIVE_INTENSITY,
          duration: FLASH_IN_DURATION,
        });
      });
    }

    this._spawnGhost();
    this._ghostSpawnInterval = setInterval(() => this._spawnGhost(), GHOST_SPAWN_INTERVAL_MS);
  }

  public override onExit(): void {
    super.onExit();

    this._originalMaterialState.forEach((original, material) => {
      gsap.to(material.color, {
        r: original.color.r,
        g: original.color.g,
        b: original.color.b,
        duration: FLASH_OUT_DURATION,
      });
      gsap.to(material.emissive, {
        r: original.emissive.r,
        g: original.emissive.g,
        b: original.emissive.b,
        duration: FLASH_OUT_DURATION,
      });
      gsap.to(material, {
        emissiveIntensity: original.emissiveIntensity,
        duration: FLASH_OUT_DURATION,
      });
    });

    this._originalMaterialState.clear();

    if (this._ghostSpawnInterval) {
      clearInterval(this._ghostSpawnInterval);
      this._ghostSpawnInterval = null;
    }
  }

  private _spawnGhost(): void {
    const model = this.entity.modelRenderer.getModel();
    if (!model) return;

    const ghost = cloneWithSkeleton(model);
    const ghostMaterial = MATERIALS.STANDARD_EMISSIVE({
      opacity: GHOST_INITIAL_OPACITY,
      color: DASH_FLASH_COLOR,
      emissive: DASH_FLASH_COLOR,
      emissiveIntensity: GHOST_EMISSIVE_INTENSITY,
      depthWrite: false,
    });

    ghost.traverse((child) => {
      if (!isMesh(child)) return;
      child.material = ghostMaterial;
      child.geometry = child.geometry.clone();
    });

    model.updateWorldMatrix(true, false);
    model.matrixWorld.decompose(ghost.position, ghost.quaternion, ghost.scale);

    this.entity.scene.add(ghost);

    gsap.to(ghostMaterial, {
      opacity: 0,
      duration: GHOST_FADE_DURATION,
      onComplete: () => {
        this.entity.scene.remove(ghost);
      },
    });
  }
}
