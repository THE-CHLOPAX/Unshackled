import * as THREE from 'three';
import { GameObject, Scene } from '@tgdf';
import { MockCamera } from '@tgdf/internal-3d/testUtils/MockCamera';
import { assert, describe, it, expect, vi, afterEach } from 'vitest';

import {
  SpriteFlipbookRenderer,
  SpriteFlipbookRendererOptions,
} from '3D/classes/gameObjectComponents/SpriteFlipbookRenderer/SpriteFlipbookRenderer';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

class TestScene extends Scene {
  camera = new MockCamera();
}

function createTexture(image?: { width: number; height: number }): THREE.Texture {
  const texture = new THREE.Texture();
  if (image) {
    texture.image = image;
  }
  return texture;
}

function createFlipbook(overrides: Partial<SpriteFlipbookRendererOptions> = {}): {
  scene: TestScene;
  gameObject: GameObject;
  flipbook: SpriteFlipbookRenderer;
} {
  const scene = new TestScene();
  const gameObject = new GameObject({ scene });
  scene.add(gameObject);

  const flipbook = new SpriteFlipbookRenderer(gameObject, {
    texture: createTexture({ width: 100, height: 50 }),
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameDuration: 0.1,
    ...overrides,
  });
  gameObject.addComponent('SpriteFlipbookRenderer', flipbook);
  // Triggers onAwake, which creates the sprite.
  gameObject.update(0);

  return { scene, gameObject, flipbook };
}

function getMap(flipbook: SpriteFlipbookRenderer): THREE.Texture {
  const sprite = flipbook.getSprite();
  assert(sprite !== null, 'Flipbook has no sprite');
  const map = (sprite.material as THREE.SpriteMaterial).map;
  assert(map !== null, 'Sprite material has no map');
  return map;
}

describe('SpriteFlipbookRenderer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('before onAwake', () => {
    it('has no sprite until the game object wakes up', () => {
      const scene = new TestScene();
      const gameObject = new GameObject({ scene });
      // Not added to the scene, so isChildOfObject() is false and awake never fires.

      const flipbook = new SpriteFlipbookRenderer(gameObject, {
        texture: createTexture(),
        columns: 4,
        rows: 2,
        frameCount: 8,
        frameDuration: 0.1,
      });

      expect(flipbook.getSprite()).toBeNull();
    });
  });

  describe('onAwake', () => {
    it('creates a sprite, scales it, and adds it to the game object', () => {
      const size = new THREE.Vector2(3, 4);
      const { gameObject, flipbook } = createFlipbook({ size });

      const sprite = flipbook.getSprite();
      assert(sprite !== null, 'Flipbook has no sprite');
      expect(gameObject.children).toContain(sprite);
      expect(sprite.scale.x).toBe(3);
      expect(sprite.scale.y).toBe(4);
    });

    it('defaults to a 2x2 world-space size when none is given', () => {
      const { flipbook } = createFlipbook();
      const sprite = flipbook.getSprite();
      assert(sprite !== null, 'Flipbook has no sprite');

      expect(sprite.scale.x).toBe(2);
      expect(sprite.scale.y).toBe(2);
    });

    it('clones the source texture, leaving it untouched', () => {
      const sourceTexture = createTexture({ width: 100, height: 50 });
      const scene = new TestScene();
      const gameObject = new GameObject({ scene });
      scene.add(gameObject);

      const flipbook = new SpriteFlipbookRenderer(gameObject, {
        texture: sourceTexture,
        columns: 4,
        rows: 2,
        frameCount: 8,
        frameDuration: 0.1,
      });
      gameObject.addComponent('SpriteFlipbookRenderer', flipbook);
      gameObject.update(0);

      const map = getMap(flipbook);
      expect(map).not.toBe(sourceTexture);
      expect(sourceTexture.repeat.x).toBe(1);
      expect(sourceTexture.offset.x).toBe(0);
    });

    it('configures pixel-art filtering and clamps wrapping on the cloned texture', () => {
      const { flipbook } = createFlipbook();
      const map = getMap(flipbook);

      expect(map.minFilter).toBe(THREE.NearestFilter);
      expect(map.magFilter).toBe(THREE.NearestFilter);
      expect(map.generateMipmaps).toBe(false);
      expect(map.wrapS).toBe(THREE.ClampToEdgeWrapping);
      expect(map.wrapT).toBe(THREE.ClampToEdgeWrapping);
    });

    it('sets transparent + alphaTest so depth (and postprocessing edge outlines) follow the visible pixels', () => {
      const { flipbook } = createFlipbook();
      const sprite = flipbook.getSprite();
      assert(sprite !== null, 'Flipbook has no sprite');
      const material = sprite.material as THREE.SpriteMaterial;

      expect(material.transparent).toBe(true);
      expect(material.alphaTest).toBe(0.5);
    });
  });

  describe('atlas UV math', () => {
    it('insets each frame by half a texel to avoid sampling into the neighboring cell', () => {
      // 100x50 image, 4 cols x 2 rows -> uInset = 0.5/100 = 0.005, vInset = 0.5/50 = 0.01
      const { flipbook } = createFlipbook({ columns: 4, rows: 2 });
      const map = getMap(flipbook);

      expect(map.repeat.x).toBeCloseTo(0.25 - 2 * 0.005);
      expect(map.repeat.y).toBeCloseTo(0.5 - 2 * 0.01);
      // frame 0 -> col 0, row (rows - 1) since V=0 is the bottom in three.js
      expect(map.offset.x).toBeCloseTo(0 / 4 + 0.005);
      expect(map.offset.y).toBeCloseTo(1 / 2 + 0.01);
    });

    it('falls back to zero inset when the texture has no known image dimensions', () => {
      const { flipbook } = createFlipbook({ texture: createTexture() });
      const map = getMap(flipbook);

      expect(map.repeat.x).toBeCloseTo(0.25);
      expect(map.repeat.y).toBeCloseTo(0.5);
      expect(map.offset.x).toBeCloseTo(0);
      expect(map.offset.y).toBeCloseTo(0.5);
    });

    it('maps a frame index in a partially-filled last row to the correct column/row', () => {
      // frame 6 of an 8-frame, 4-col grid -> col 2, rowFromTop 1 -> row (2 - 1 - 1) = 0
      const { flipbook, gameObject } = createFlipbook({
        columns: 4,
        rows: 2,
        frameCount: 8,
        frameDuration: 0.25,
        loop: false,
      });

      // 0.25 divides cleanly in binary floating point, unlike 0.1, so
      // elapsed / frameDuration lands exactly on 6 instead of 5.999999999999999.
      gameObject.update(1.5); // elapsed 1.5s / 0.25s per frame -> frameIndex 6
      const map = getMap(flipbook);

      expect(map.offset.x).toBeCloseTo(2 / 4 + 0.005);
      expect(map.offset.y).toBeCloseTo(0 / 2 + 0.01);
    });
  });

  describe('playback', () => {
    it('advances frames based on accumulated elapsed time', () => {
      const { flipbook, gameObject } = createFlipbook({ frameDuration: 0.1, frameCount: 3 });
      const map = getMap(flipbook);

      gameObject.update(0.05); // elapsed 0.05 -> frame 0
      expect(map.offset.x).toBeCloseTo(0 / 4 + 0.005);

      gameObject.update(0.06); // elapsed 0.11 -> frame 1
      expect(map.offset.x).toBeCloseTo(1 / 4 + 0.005);
    });

    it('holds on the last frame and fires onComplete exactly once when not looping', () => {
      const onComplete = vi.fn();
      const { flipbook, gameObject } = createFlipbook({
        frameDuration: 0.1,
        frameCount: 3,
        loop: false,
        onComplete,
      });
      const map = getMap(flipbook);

      gameObject.update(0.31); // elapsed exceeds 3 * 0.1 -> finishes on last frame (index 2)
      expect(map.offset.x).toBeCloseTo(2 / 4 + 0.005);
      expect(onComplete).toHaveBeenCalledOnce();

      gameObject.update(0.1);
      gameObject.update(0.1);
      expect(onComplete).toHaveBeenCalledOnce();
      expect(map.offset.x).toBeCloseTo(2 / 4 + 0.005);
    });

    it('wraps back to frame 0 when looping instead of finishing', () => {
      const onComplete = vi.fn();
      const { flipbook, gameObject } = createFlipbook({
        frameDuration: 0.1,
        frameCount: 3,
        loop: true,
        onComplete,
      });
      const map = getMap(flipbook);

      gameObject.update(0.35); // elapsed 0.35 -> frameIndex 3 -> wraps to 0
      expect(map.offset.x).toBeCloseTo(0 / 4 + 0.005);
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('onDestroyed', () => {
    it('removes the sprite from the game object and disposes its material and texture', () => {
      const { gameObject, flipbook } = createFlipbook();
      const sprite = flipbook.getSprite();
      assert(sprite !== null, 'Flipbook has no sprite');
      const material = sprite.material as THREE.SpriteMaterial;
      const map = material.map;
      assert(map !== null, 'Sprite material has no map');

      const removeSpy = vi.spyOn(gameObject, 'remove');
      const materialDisposeSpy = vi.spyOn(material, 'dispose');
      const mapDisposeSpy = vi.spyOn(map, 'dispose');

      flipbook.destroy();

      expect(removeSpy).toHaveBeenCalledWith(sprite);
      expect(materialDisposeSpy).toHaveBeenCalledOnce();
      expect(mapDisposeSpy).toHaveBeenCalledOnce();
      expect(flipbook.getSprite()).toBeNull();
    });

    it('stops reacting to further updates once destroyed', () => {
      const onComplete = vi.fn();
      const { gameObject, flipbook } = createFlipbook({
        frameDuration: 0.1,
        frameCount: 3,
        loop: false,
        onComplete,
      });

      flipbook.destroy();

      expect(() => gameObject.update(1)).not.toThrow();
      expect(onComplete).not.toHaveBeenCalled();
      expect(flipbook.getSprite()).toBeNull();
    });
  });
});
