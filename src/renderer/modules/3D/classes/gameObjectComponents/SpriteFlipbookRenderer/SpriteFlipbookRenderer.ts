import * as THREE from 'three';
import { GameObject, GameObjectComponent } from '@tgdf';

import { MATERIALS } from '3D/constants';
import { pixelateTexture } from '3D/utils/pixelateTexture';

export type SpriteFlipbookRendererOptions = {
  texture: THREE.Texture;
  columns: number;
  rows: number;
  frameCount: number; // <= columns * rows, for a partially-filled last row
  frameDuration: number; // seconds per frame
  loop?: boolean;
  size?: THREE.Vector2; // world-space sprite size
  onComplete?: () => void;
};

const DEFAULT_SPRITE_SIZE = new THREE.Vector2(2, 2);

export class SpriteFlipbookRenderer extends GameObjectComponent {
  private _sourceTexture: THREE.Texture;
  private _columns: number;
  private _rows: number;
  private _frameCount: number;
  private _frameDuration: number;
  private _loop: boolean;
  private _size: THREE.Vector2;
  private _onComplete?: () => void;

  private _sprite: THREE.Sprite | null = null;
  private _elapsed: number = 0;
  private _finished: boolean = false;
  private _uInset: number = 0;
  private _vInset: number = 0;

  constructor(gameObject: GameObject, options: SpriteFlipbookRendererOptions) {
    super(gameObject);

    this._sourceTexture = options.texture;
    this._columns = options.columns;
    this._rows = options.rows;
    this._frameCount = options.frameCount;
    this._frameDuration = options.frameDuration;
    this._loop = options.loop ?? false;
    this._size = options.size ?? DEFAULT_SPRITE_SIZE;
    this._onComplete = options.onComplete;
  }

  public getSprite(): THREE.Sprite | null {
    return this._sprite;
  }

  protected override onAwake(): void {
    super.onAwake();

    const texture = this._sourceTexture.clone();
    pixelateTexture(texture);

    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const image = texture.image as { width?: number; height?: number } | undefined;
    this._uInset = image?.width ? 0.5 / image.width : 0;
    this._vInset = image?.height ? 0.5 / image.height : 0;
    texture.repeat.set(1 / this._columns - 2 * this._uInset, 1 / this._rows - 2 * this._vInset);

    const material = MATERIALS.SPRITE_WITH_ALPHA({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(this._size.x, this._size.y, 1);

    this._sprite = sprite;
    this.gameObject.add(sprite);

    this._setFrame(0);
  }

  protected override onUpdate(deltaTime: number): void {
    super.onUpdate(deltaTime);
    if (this._finished || !this._sprite) return;

    this._elapsed += deltaTime;
    let frameIndex = Math.floor(this._elapsed / this._frameDuration);

    if (frameIndex >= this._frameCount) {
      if (this._loop) {
        frameIndex %= this._frameCount;
      } else {
        frameIndex = this._frameCount - 1;
        this._finished = true;
      }
    }

    this._setFrame(frameIndex);

    if (this._finished) {
      this._onComplete?.();
    }
  }

  protected override onDestroyed(): void {
    if (this._sprite) {
      this.gameObject.remove(this._sprite);

      const material = this._sprite.material as THREE.SpriteMaterial;
      material.map?.dispose();
      material.dispose();

      this._sprite = null;
    }

    super.onDestroyed();
  }

  private _setFrame(frameIndex: number): void {
    const texture = (this._sprite?.material as THREE.SpriteMaterial | undefined)?.map;
    if (!texture) return;

    const col = frameIndex % this._columns;
    const rowFromTop = Math.floor(frameIndex / this._columns);
    const row = this._rows - 1 - rowFromTop; // three.js texture V=0 is the bottom

    texture.offset.set(col / this._columns + this._uInset, row / this._rows + this._vInset);
  }
}
