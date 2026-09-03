import * as THREE from 'three';
import { logger, assertNever } from '@tgdf';

import { MATERIALS } from '3D/constants';
import { createSkinnedMesh } from '3D/utils/createSkinnedMesh';

/**
 * Precompiles every MATERIALS variant during scene entry, and (dev-only)
 * watches for any shader program compiled afterwards — each one stalled the
 * frame just now, and means a material variant is missing from the warmup
 * group or MATERIALS' Omit-typed structural fields have drifted from what
 * the app actually renders.
 */
export class ShadersManager {
  public readonly warmupGroup: THREE.Group;

  private _warmedUp = false;
  private _warmProgramCount: number | null = null;

  constructor() {
    this.warmupGroup = this._createShaderWarmupGroup();
  }

  public warmup(
    renderer: THREE.WebGLRenderer | null,
    scene: THREE.Object3D,
    camera: THREE.Camera
  ): Promise<void> {
    if (!renderer || this._warmedUp) return Promise.resolve();
    this._warmedUp = true;

    const previousRenderTarget = renderer.getRenderTarget();
    const warmupRenderTarget = new THREE.WebGLRenderTarget(1, 1);
    renderer.setRenderTarget(warmupRenderTarget);

    return renderer
      .compileAsync(scene, camera)
      .then(() => {
        logger({ message: 'Shader warmup finished', type: 'info' });
        this._warmProgramCount = renderer.info.programs?.length ?? null;
      })
      .catch((error) => {
        logger({ message: `Shader warmup failed: ${error}`, type: 'warn' });
      })
      .finally(() => {
        renderer.setRenderTarget(previousRenderTarget);
        warmupRenderTarget.dispose();
      });
  }

  /**
   * Compares the renderer's compiled-program count against the warmed
   * baseline, logs (and returns) the names of any newly compiled programs.
   * Returns null when there's nothing to report — no baseline yet (warmup
   * hasn't resolved), or no growth since the last check.
   */
  public checkForLateCompiles(renderer: THREE.WebGLRenderer | null): string[] | null {
    const programs = renderer?.info.programs;
    if (!programs || this._warmProgramCount === null) return null;

    if (programs.length <= this._warmProgramCount) {
      this._warmProgramCount = programs.length;
      return null;
    }

    const existingPrograms = programs.slice(0, this._warmProgramCount);
    const newPrograms = programs.slice(this._warmProgramCount);
    const names = newPrograms.map((program) => program.name);

    logger({
      type: 'warn',
      message:
        `[ShadersManager] Shader program(s) compiled mid-gameplay: ${names.join(', ')}. Add the ` +
        'material variant to _createShaderWarmupGroup to avoid a stall on first use.',
    });

    newPrograms.forEach((newProgram) => {
      const match = existingPrograms.find((existing) => existing.name === newProgram.name);
      if (!match) {
        logger({
          type: 'warn',
          message: `  "${newProgram.name}": no warmed program with this name exists at all.`,
        });
        return;
      }

      const oldParts = match.cacheKey.split(',');
      const newParts = newProgram.cacheKey.split(',');
      const diffLines: string[] = [];
      for (let i = 0; i < Math.max(oldParts.length, newParts.length); i++) {
        if (oldParts[i] !== newParts[i]) {
          diffLines.push(`    [${i}] warmed="${oldParts[i]}" vs new="${newParts[i]}"`);
        }
      }

      logger({
        type: 'warn',
        message:
          `[ShadersManager] "${newProgram.name}" cacheKey diff vs its warmed program ` +
          `(${diffLines.length} field(s) differ):\n${diffLines.join('\n')}`,
      });
    });

    this._warmProgramCount = programs.length;
    return names;
  }

  private _createShaderWarmupGroup(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'ShaderWarmup';
    group.visible = false;

    const geometry = new THREE.PlaneGeometry(0.01, 0.01);
    const placeholderTexture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
    placeholderTexture.needsUpdate = true;

    const addWithSkinnedVariant = (material: THREE.MeshStandardMaterial): void => {
      // Normal geometry
      group.add(new THREE.Mesh(geometry, material));
      // Skinned geometry - a separate material program which needs to be pre-compiled
      group.add(createSkinnedMesh(material));
    };

    (Object.keys(MATERIALS) as (keyof typeof MATERIALS)[]).forEach((key) => {
      switch (key) {
        case 'STANDARD_EMISSIVE':
          addWithSkinnedVariant(MATERIALS.STANDARD_EMISSIVE());
          break;
        case 'SPRITE_WITH_ALPHA':
          group.add(new THREE.Sprite(MATERIALS.SPRITE_WITH_ALPHA({ map: placeholderTexture })));
          break;
        case 'STANDARD_EMISSIVE_WITH_MAP':
          addWithSkinnedVariant(MATERIALS.STANDARD_EMISSIVE_WITH_MAP({ map: placeholderTexture }));
          break;
        default:
          assertNever(key, `[ShadersManager] No warmup case for MATERIALS.${key}`);
      }
    });

    return group;
  }
}
