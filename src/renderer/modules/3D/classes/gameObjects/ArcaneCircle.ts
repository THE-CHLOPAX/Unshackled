import { gsap } from 'gsap';
import * as THREE from 'three';
import { useAssetStore, GameObject, ResourceTracker, Scene } from '@tgdf';

import { pixelateTexture } from '3D/utils/pixelateTexture';
import { MATERIALS, ARCANE_CIRCLE_TEXTURE } from '3D/constants';

export type ArcaneCircleFadeOptions = {
  duration: number;
};

export type ArcaneCircleOptions = {
  diameter: number;
  color: THREE.ColorRepresentation;
  rotationDuration?: number;
  fadeIn?: ArcaneCircleFadeOptions;
  fadeOut?: ArcaneCircleFadeOptions;
};

const GROUND_OFFSET = 0.05;

const DEFAULT_FADE_DURATION = 1;
const DEFAULT_ROTATION_DURATION = 10;
const DEFAULT_FADE_IN: ArcaneCircleFadeOptions = {
  duration: DEFAULT_FADE_DURATION,
};
const DEFAULT_FADE_OUT: ArcaneCircleFadeOptions = {
  duration: DEFAULT_FADE_DURATION,
};

export class ArcaneCircle extends GameObject {
  private _texture: THREE.Texture;
  private _material: THREE.MeshStandardMaterial | null = null;
  private _rotationTween: gsap.core.Tween | null = null;
  private _fadeTween: gsap.core.Tween | null = null;
  private _fadeIn: ArcaneCircleFadeOptions | null = null;
  private _fadeOut: ArcaneCircleFadeOptions | null = null;

  constructor(
    scene: Scene,
    public options: ArcaneCircleOptions
  ) {
    super({ scene });

    const texture = useAssetStore.getState().textureCache.get(ARCANE_CIRCLE_TEXTURE);

    if (!texture) {
      throw new Error('Arcane circle texture not found in asset store');
    }

    this._texture = texture;
    pixelateTexture(this._texture);
    ResourceTracker.markPersistent(this._texture);

    this.position.y = GROUND_OFFSET;

    this._fadeIn = options.fadeIn ?? DEFAULT_FADE_IN;
    this._fadeOut = options.fadeOut ?? DEFAULT_FADE_OUT;
  }

  protected override onAwake(): void {
    super.onAwake();

    this._rotationTween = gsap.to(this.rotation, {
      y: `+=${Math.PI * 2}`,
      duration: this.options.rotationDuration ?? DEFAULT_ROTATION_DURATION,
      repeat: -1,
      ease: 'none',
    });

    const material = MATERIALS.STANDARD_EMISSIVE_WITH_MAP({
      map: this._texture,
      opacity: this._fadeIn ? 0 : 1,
      emissive: this.options.color,
      emissiveIntensity: 1,
      roughness: 1,
      metalness: 0,
      depthWrite: false,
    });
    this._material = material;

    const geometry = new THREE.PlaneGeometry(this.options.diameter, this.options.diameter);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = GROUND_OFFSET;

    this.add(mesh);

    if (this._fadeIn !== null) {
      this._fadeTween = gsap.to(material, {
        opacity: 1,
        duration: this._fadeIn.duration,
        onComplete: () => {
          this._fadeTween = null;
        },
      });
    }
  }

  protected override onDestroyed(): void {
    super.onDestroyed();

    this._rotationTween?.kill();
    this._rotationTween = null;

    this._fadeTween?.kill();
    this._fadeTween = null;

    if (!this._material || this._fadeOut === null) {
      this.parent?.remove(this);
      return;
    }

    this._fadeTween = gsap.to(this._material, {
      opacity: 0,
      duration: this._fadeOut.duration,
      onComplete: () => {
        this._fadeTween = null;
        this.parent?.remove(this);
      },
    });
  }
}
