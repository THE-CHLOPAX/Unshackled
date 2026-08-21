import * as THREE from 'three';
import { GameObject, logger, Scene, worldToScreen } from '@tgdf';
import { MockCamera } from '@tgdf/internal-3d/testUtils/MockCamera';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  useOverlayStore,
  overlayElementRefs,
  overlayContainerSize,
} from 'renderer/store/useOverlayStore';

import { BillboardRenderer } from './BillboardRenderer';
import { BILLBOARD_POSITION_UPDATE_INTERVAL_MS } from './constants';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

vi.mock('@tgdf', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tgdf')>();
  return {
    ...actual,
    logger: vi.fn(),
    worldToScreen: vi.fn(actual.worldToScreen),
  };
});

class TestScene extends Scene {
  camera = new MockCamera();
}

type TestBarProps = { progress: number };

function TestBar(_props: TestBarProps) {
  return null;
}

function createBillboardRenderer() {
  const scene = new TestScene();
  const gameObject = new GameObject({ scene });
  scene.add(gameObject);

  const billboardRenderer = new BillboardRenderer(gameObject);
  gameObject.addComponent('BillboardRenderer', billboardRenderer);

  return { scene, gameObject, billboardRenderer };
}

describe('BillboardRenderer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useOverlayStore.setState({ entries: new Map() });
    overlayElementRefs.clear();
    overlayContainerSize.width = 800;
    overlayContainerSize.height = 600;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('addElement', () => {
    it('registers the element in the overlay store', () => {
      const { billboardRenderer } = createBillboardRenderer();

      billboardRenderer.addElement('boss-hp', TestBar, { progress: 1 });

      const entry = useOverlayStore.getState().entries.get('boss-hp');
      expect(entry?.Component).toBe(TestBar);
      expect(entry?.props).toEqual({ progress: 1 });
    });

    it('warns and does not overwrite when the id is already tracked', () => {
      const { billboardRenderer } = createBillboardRenderer();

      billboardRenderer.addElement('boss-hp', TestBar, { progress: 1 });
      billboardRenderer.addElement('boss-hp', TestBar, { progress: 0.2 });

      expect(useOverlayStore.getState().entries.get('boss-hp')?.props).toEqual({ progress: 1 });
      expect(logger).toHaveBeenCalledWith(expect.objectContaining({ type: 'warn' }));
    });
  });

  describe('updateElement', () => {
    it('merges props into the tracked element in the overlay store', () => {
      const { billboardRenderer } = createBillboardRenderer();
      billboardRenderer.addElement('boss-hp', TestBar, { progress: 1 });

      billboardRenderer.updateElement('boss-hp', { progress: 0.4 });

      expect(useOverlayStore.getState().entries.get('boss-hp')?.props).toEqual({ progress: 0.4 });
    });

    it('warns and does nothing when the id is not tracked', () => {
      const { billboardRenderer } = createBillboardRenderer();

      billboardRenderer.updateElement('missing', { progress: 1 });

      expect(useOverlayStore.getState().entries.has('missing')).toBe(false);
      expect(logger).toHaveBeenCalledWith(expect.objectContaining({ type: 'warn' }));
    });
  });

  describe('removeElement', () => {
    it('removes the element from the overlay store', () => {
      const { billboardRenderer } = createBillboardRenderer();
      billboardRenderer.addElement('boss-hp', TestBar, { progress: 1 });

      billboardRenderer.removeElement('boss-hp');

      expect(useOverlayStore.getState().entries.has('boss-hp')).toBe(false);
    });

    it('warns and does nothing when the id is not tracked', () => {
      const { billboardRenderer } = createBillboardRenderer();

      billboardRenderer.removeElement('missing');

      expect(logger).toHaveBeenCalledWith(expect.objectContaining({ type: 'warn' }));
    });
  });

  describe('getElement', () => {
    it('returns the DOM node registered for the id', () => {
      const { billboardRenderer } = createBillboardRenderer();
      const node = document.createElement('div');
      overlayElementRefs.set('boss-hp', node);

      billboardRenderer.addElement('boss-hp', TestBar, { progress: 1 });

      expect(billboardRenderer.getElement('boss-hp')).toBe(node);
    });

    it('returns undefined before the element has mounted or after it has been removed', () => {
      const { billboardRenderer } = createBillboardRenderer();

      billboardRenderer.addElement('boss-hp', TestBar, { progress: 1 });
      expect(billboardRenderer.getElement('boss-hp')).toBeUndefined();

      const node = document.createElement('div');
      overlayElementRefs.set('boss-hp', node);
      overlayElementRefs.delete('boss-hp');

      expect(billboardRenderer.getElement('boss-hp')).toBeUndefined();
    });
  });

  describe('position updates', () => {
    it('writes screen position and visibility directly to the DOM node, without touching the entry props in the store', () => {
      const { gameObject, billboardRenderer } = createBillboardRenderer();
      const node = document.createElement('div');
      overlayElementRefs.set('boss-hp', node);

      billboardRenderer.addElement('boss-hp', TestBar, { progress: 1 });
      gameObject.position.set(0, 0, -10);

      gameObject.update(0.016);

      expect(node.style.visibility).toBe('visible');
      expect(node.style.transform).toMatch(/^translate3d\(/);
      expect(useOverlayStore.getState().entries.get('boss-hp')?.props).toEqual({ progress: 1 });
    });

    it('hides the element when its GameObject is behind the camera', () => {
      const { gameObject, billboardRenderer } = createBillboardRenderer();
      const node = document.createElement('div');
      overlayElementRefs.set('boss-hp', node);

      billboardRenderer.addElement('boss-hp', TestBar, { progress: 1 });
      // Positive Z is behind the default camera, which looks down -Z from the origin.
      gameObject.position.set(0, 0, 10);

      gameObject.update(0.016);

      expect(node.style.visibility).toBe('hidden');
    });

    it('applies the configured world-space offset before projecting', () => {
      const { gameObject, billboardRenderer } = createBillboardRenderer();
      const node = document.createElement('div');
      overlayElementRefs.set('boss-hp', node);

      billboardRenderer.addElement(
        'boss-hp',
        TestBar,
        { progress: 1 },
        { offset: new THREE.Vector3(0, 2, 0) }
      );
      gameObject.position.set(0, 0, -10);

      gameObject.update(0.016);

      expect(worldToScreen).toHaveBeenCalledWith(
        expect.objectContaining({ x: 0, y: 2, z: -10 }),
        expect.anything(),
        800,
        600
      );
    });

    it('does nothing while the overlay container has not been measured yet', () => {
      overlayContainerSize.width = 0;
      overlayContainerSize.height = 0;
      const { gameObject, billboardRenderer } = createBillboardRenderer();
      const node = document.createElement('div');
      overlayElementRefs.set('boss-hp', node);

      billboardRenderer.addElement('boss-hp', TestBar, { progress: 1 });
      gameObject.position.set(0, 0, -10);

      gameObject.update(0.016);

      expect(worldToScreen).not.toHaveBeenCalled();
      expect(node.style.transform).toBe('');
    });

    it('throttles recomputation so rapid updates only recompute once per interval', () => {
      const { gameObject, billboardRenderer } = createBillboardRenderer();
      const node = document.createElement('div');
      overlayElementRefs.set('boss-hp', node);
      billboardRenderer.addElement('boss-hp', TestBar, { progress: 1 });
      gameObject.position.set(0, 0, -10);

      gameObject.update(0.001);
      gameObject.update(0.001);
      gameObject.update(0.001);

      expect(worldToScreen).toHaveBeenCalledTimes(1);

      // Date.now() truncates to integer ms, so advancing by the exact (fractional)
      // interval can round back down to "not quite elapsed yet" -- round up to guarantee
      // the throttle's real-time threshold is actually crossed.
      vi.advanceTimersByTime(Math.ceil(BILLBOARD_POSITION_UPDATE_INTERVAL_MS));
      gameObject.update(0.001);

      expect(worldToScreen).toHaveBeenCalledTimes(2);
    });
  });

  describe('onDestroyed', () => {
    it('removes every element it registered from the overlay store', () => {
      const { billboardRenderer } = createBillboardRenderer();
      billboardRenderer.addElement('a', TestBar, { progress: 1 });
      billboardRenderer.addElement('b', TestBar, { progress: 1 });

      billboardRenderer.destroy();

      expect(useOverlayStore.getState().entries.size).toBe(0);
    });

    it('does not affect elements registered by other BillboardRenderer instances', () => {
      const { billboardRenderer: rendererA } = createBillboardRenderer();
      const { billboardRenderer: rendererB } = createBillboardRenderer();

      rendererA.addElement('a', TestBar, { progress: 1 });
      rendererB.addElement('b', TestBar, { progress: 1 });

      rendererA.destroy();

      expect(useOverlayStore.getState().entries.has('a')).toBe(false);
      expect(useOverlayStore.getState().entries.has('b')).toBe(true);
    });
  });
});
