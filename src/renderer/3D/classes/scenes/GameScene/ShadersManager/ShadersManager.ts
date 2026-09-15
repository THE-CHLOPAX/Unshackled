import * as THREE from 'three';
import { logger } from '@tgdf';

import { createSkinnedMesh } from '3D/utils/createSkinnedMesh';

export type WarmupFactory = () => THREE.Material | THREE.Material[] | THREE.Object3D;

export class ShadersManager {
  public readonly warmupGroup: THREE.Group;

  private _warmedUp = false;
  private _warmProgramCount: number | null = null;

  constructor() {
    this.warmupGroup = new THREE.Group();
    this.warmupGroup.name = 'ShaderWarmup';
    this.warmupGroup.visible = false;
  }

  public warmup(
    renderer: THREE.WebGLRenderer | null,
    scene: THREE.Object3D,
    camera: THREE.Camera,
    warmupFactories: WarmupFactory[]
  ): Promise<void> {
    if (!renderer || this._warmedUp) return Promise.resolve();
    this._warmedUp = true;

    this._populateWarmupGroup(warmupFactories);

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
        'material variant to the warmup factories passed into warmup() to avoid a stall on first use.',
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

  private _populateWarmupGroup(warmupFactories: WarmupFactory[]): void {
    const geometry = new THREE.PlaneGeometry(0.01, 0.01);

    warmupFactories.forEach((createWarmupEntry) => {
      const result = createWarmupEntry();

      if (result instanceof THREE.Object3D) {
        this.warmupGroup.add(result);
        return;
      }

      const materials = Array.isArray(result) ? result : [result];

      materials.forEach((material) => {
        if (material instanceof THREE.SpriteMaterial) {
          this.warmupGroup.add(new THREE.Sprite(material));
          return;
        }

        this.warmupGroup.add(new THREE.Mesh(geometry, material));
        this.warmupGroup.add(createSkinnedMesh(material));
      });
    });
  }
}
