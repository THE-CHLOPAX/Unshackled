import { GameObject, logger, Scene } from '@tgdf';
import { MockCamera } from '@tgdf/internal-3d/testUtils/MockCamera';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { BillboardView } from '3D/classes/scenes/GameScene/BillboardRegistry/BillboardView';
import { BillboardRegistry } from '3D/classes/scenes/GameScene/BillboardRegistry/BillboardRegistry';

import { BillboardRenderer } from './BillboardRenderer';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

vi.mock('@tgdf', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tgdf')>();
  return {
    ...actual,
    logger: vi.fn(),
  };
});

class TestScene extends Scene {
  camera = new MockCamera();
}

type TestBarProps = { progress: number };

function TestBar(_props: TestBarProps) {
  return null;
}

function createBillboardRenderer(registry: BillboardRegistry) {
  const scene = new TestScene();
  const gameObject = new GameObject({ scene });
  scene.add(gameObject);

  const billboardRenderer = new BillboardRenderer(gameObject, registry);
  gameObject.addComponent('BillboardRenderer', billboardRenderer);

  return { scene, gameObject, billboardRenderer };
}

describe('BillboardRenderer', () => {
  let registry: BillboardRegistry;

  beforeEach(() => {
    registry = new BillboardRegistry();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('addElement', () => {
    it('registers the element in its billboard registry, targeting its GameObject', () => {
      const { billboardRenderer, gameObject } = createBillboardRenderer(registry);

      billboardRenderer.addElement('boss-hp', TestBar, { progress: 1 });

      const entry = registry.get('boss-hp');
      expect(entry?.Component).toBe(TestBar);
      expect(entry?.props).toEqual({ progress: 1 });
      expect(entry?.target).toBe(gameObject);
    });

    it('warns and does not overwrite when the id is already tracked', () => {
      const { billboardRenderer } = createBillboardRenderer(registry);

      billboardRenderer.addElement('boss-hp', TestBar, { progress: 1 });
      billboardRenderer.addElement('boss-hp', TestBar, { progress: 0.2 });

      expect(registry.get('boss-hp')?.props).toEqual({ progress: 1 });
      expect(logger).toHaveBeenCalledWith(expect.objectContaining({ type: 'warn' }));
    });
  });

  describe('updateElement', () => {
    it('merges props into the tracked element in the registry', () => {
      const { billboardRenderer } = createBillboardRenderer(registry);
      billboardRenderer.addElement('boss-hp', TestBar, { progress: 1 });

      billboardRenderer.updateElement('boss-hp', { progress: 0.4 });

      expect(registry.get('boss-hp')?.props).toEqual({ progress: 0.4 });
    });

    it('warns and does nothing when the id is not tracked', () => {
      const { billboardRenderer } = createBillboardRenderer(registry);

      billboardRenderer.updateElement('missing', { progress: 1 });

      expect(registry.has('missing')).toBe(false);
      expect(logger).toHaveBeenCalledWith(expect.objectContaining({ type: 'warn' }));
    });
  });

  describe('removeElement', () => {
    it('removes the element from the registry', () => {
      const { billboardRenderer } = createBillboardRenderer(registry);
      billboardRenderer.addElement('boss-hp', TestBar, { progress: 1 });

      billboardRenderer.removeElement('boss-hp');

      expect(registry.has('boss-hp')).toBe(false);
    });

    it('warns and does nothing when the id is not tracked', () => {
      const { billboardRenderer } = createBillboardRenderer(registry);

      billboardRenderer.removeElement('missing');

      expect(logger).toHaveBeenCalledWith(expect.objectContaining({ type: 'warn' }));
    });
  });

  describe('getElements', () => {
    it('returns the nodes mounted for the id across every attached view', () => {
      const { billboardRenderer } = createBillboardRenderer(registry);
      const viewA = new BillboardView(registry);
      const viewB = new BillboardView(registry);
      viewA.attach();
      viewB.attach();
      const nodeA = document.createElement('div');
      const nodeB = document.createElement('div');

      billboardRenderer.addElement('boss-hp', TestBar, { progress: 1 });
      viewA.setNode('boss-hp', nodeA);
      viewB.setNode('boss-hp', nodeB);

      expect(billboardRenderer.getElements('boss-hp')).toEqual([nodeA, nodeB]);
    });

    it('returns an empty list before the element has mounted or when it is not tracked', () => {
      const { billboardRenderer } = createBillboardRenderer(registry);
      new BillboardView(registry).attach();

      billboardRenderer.addElement('boss-hp', TestBar, { progress: 1 });

      expect(billboardRenderer.getElements('boss-hp')).toEqual([]);
      expect(billboardRenderer.getElements('missing')).toEqual([]);
    });
  });

  describe('onDestroyed', () => {
    it('removes every element it registered from the registry', () => {
      const { billboardRenderer } = createBillboardRenderer(registry);
      billboardRenderer.addElement('a', TestBar, { progress: 1 });
      billboardRenderer.addElement('b', TestBar, { progress: 1 });

      billboardRenderer.destroy();

      expect(registry.getSnapshot()).toHaveLength(0);
    });

    it('does not affect elements registered by other BillboardRenderer instances', () => {
      const { billboardRenderer: rendererA } = createBillboardRenderer(registry);
      const { billboardRenderer: rendererB } = createBillboardRenderer(registry);

      rendererA.addElement('a', TestBar, { progress: 1 });
      rendererB.addElement('b', TestBar, { progress: 1 });

      rendererA.destroy();

      expect(registry.has('a')).toBe(false);
      expect(registry.has('b')).toBe(true);
    });
  });
});
