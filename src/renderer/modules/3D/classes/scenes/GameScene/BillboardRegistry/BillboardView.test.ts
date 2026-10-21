import * as THREE from 'three';
import { worldToScreen } from '@tgdf';
import { MockCamera } from '@tgdf/internal-3d/testUtils/MockCamera';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { BillboardView } from '3D/classes/scenes/GameScene/BillboardRegistry/BillboardView';
import { BillboardRegistry } from '3D/classes/scenes/GameScene/BillboardRegistry/BillboardRegistry';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

vi.mock('@tgdf', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tgdf')>();
  return {
    ...actual,
    worldToScreen: vi.fn(actual.worldToScreen),
  };
});

function TestBar(_props: { progress: number }) {
  return null;
}

describe('BillboardView', () => {
  let registry: BillboardRegistry;
  let view: BillboardView;
  let camera: MockCamera;
  let target: THREE.Object3D;
  let node: HTMLDivElement;

  beforeEach(() => {
    registry = new BillboardRegistry();
    view = new BillboardView(registry);
    view.setSize(800, 600);
    camera = new MockCamera();
    target = new THREE.Object3D();
    node = document.createElement('div');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function addEntry(offset = new THREE.Vector3()) {
    registry.add('boss-hp', TestBar, { progress: 1 }, { target, offset });
    view.setNode('boss-hp', node);
  }

  it('writes screen position and visibility directly to the node, without touching the entry props', () => {
    addEntry();
    target.position.set(0, 0, -10);

    view.updatePositions(camera);

    expect(node.style.visibility).toBe('visible');
    expect(node.style.transform).toMatch(/^translate3d\(/);
    expect(registry.get('boss-hp')?.props).toEqual({ progress: 1 });
  });

  it('hides the node when its target is behind the camera', () => {
    addEntry();
    target.position.set(0, 0, 10);

    view.updatePositions(camera);

    expect(node.style.visibility).toBe('hidden');
  });

  it('applies the entry world-space offset and projects with the given camera and own size', () => {
    addEntry(new THREE.Vector3(0, 2, 0));
    target.position.set(0, 0, -10);

    view.updatePositions(camera);

    expect(worldToScreen).toHaveBeenCalledWith(
      expect.objectContaining({ x: 0, y: 2, z: -10 }),
      camera,
      800,
      600
    );
  });

  it('projects independently per view, each with its own size', () => {
    const otherView = new BillboardView(registry);
    const otherNode = document.createElement('div');
    otherView.setSize(400, 300);
    addEntry();
    otherView.setNode('boss-hp', otherNode);
    target.position.set(0, 0, -10);

    view.updatePositions(camera);
    otherView.updatePositions(camera);

    expect(worldToScreen).toHaveBeenNthCalledWith(1, expect.anything(), camera, 800, 600);
    expect(worldToScreen).toHaveBeenNthCalledWith(2, expect.anything(), camera, 400, 300);
    expect(node.style.transform).not.toBe(otherNode.style.transform);
  });

  it('does nothing while the view has not been measured yet', () => {
    view.setSize(0, 0);
    addEntry();
    target.position.set(0, 0, -10);

    view.updatePositions(camera);

    expect(worldToScreen).not.toHaveBeenCalled();
    expect(node.style.transform).toBe('');
  });

  it('skips nodes whose entry is no longer in the registry', () => {
    addEntry();
    registry.remove('boss-hp');

    view.updatePositions(camera);

    expect(worldToScreen).not.toHaveBeenCalled();
  });

  it('forgets a node once it is unset', () => {
    addEntry();

    view.setNode('boss-hp', null);

    expect(view.getNode('boss-hp')).toBeUndefined();
  });
});
