import * as THREE from 'three';
import { GameObject, Scene } from '@tgdf';
import { MockCamera } from '@tgdf/internal-3d/testUtils/MockCamera';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { HintBillboard, HintBillboardProps } from 'UI';
import { useOverlayStore, overlayElementRefs } from 'renderer/store/useOverlayStore';

import { HINT_BILLBOARD_OFFSET } from './constants';
import { HintBillboardRenderer } from './HintBillboardRenderer';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

class TestScene extends Scene {
  camera = new MockCamera();
}

const HINT: HintBillboardProps = { icon: 'A', label: 'Open' };

function createHintBillboardRenderer(offset?: THREE.Vector3) {
  const scene = new TestScene();
  const gameObject = new GameObject({ scene });
  scene.add(gameObject);

  const renderer = new HintBillboardRenderer(gameObject, { hint: HINT, offset });
  gameObject.addComponent('HintBillboardRenderer', renderer);

  return { gameObject, renderer, hintId: `hint-billboard-${gameObject.uuid}` };
}

function getEntry(id: string) {
  return useOverlayStore.getState().entries.get(id);
}

describe('HintBillboardRenderer', () => {
  beforeEach(() => {
    useOverlayStore.setState({ entries: new Map() });
    overlayElementRefs.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('is hidden by default', () => {
    const { renderer, hintId } = createHintBillboardRenderer();

    expect(renderer.isVisible).toBe(false);
    expect(getEntry(hintId)).toBeUndefined();
  });

  it('adds the HintBillboard overlay entry when shown', () => {
    const { renderer, hintId } = createHintBillboardRenderer();

    renderer.show();

    expect(renderer.isVisible).toBe(true);
    expect(getEntry(hintId)?.Component).toBe(HintBillboard);
  });

  it('passes the hint props to the overlay entry', () => {
    const { renderer, hintId } = createHintBillboardRenderer();

    renderer.show();

    expect(getEntry(hintId)?.props).toEqual(HINT);
  });

  it('merges updated hint props', () => {
    const { renderer } = createHintBillboardRenderer();

    renderer.updateHint({ label: 'Close' });

    expect(renderer.hint).toEqual({ icon: 'A', label: 'Close' });
  });

  it('updates the visible overlay entry when the hint changes', () => {
    const { renderer, hintId } = createHintBillboardRenderer();

    renderer.show();
    renderer.updateHint({ label: 'Close' });

    expect(getEntry(hintId)?.props).toEqual({ icon: 'A', label: 'Close' });
  });

  it('does not touch the overlay when updating a hidden hint, but shows the latest props later', () => {
    const { renderer, hintId } = createHintBillboardRenderer();
    const updateElementSpy = vi.spyOn(renderer, 'updateElement');

    renderer.updateHint({ label: 'Close' });

    expect(updateElementSpy).not.toHaveBeenCalled();
    expect(getEntry(hintId)).toBeUndefined();

    renderer.show();

    expect(getEntry(hintId)?.props).toEqual({ icon: 'A', label: 'Close' });
  });

  it('does not add a second entry when shown twice', () => {
    const { renderer } = createHintBillboardRenderer();
    const addElementSpy = vi.spyOn(renderer, 'addElement');

    renderer.show();
    renderer.show();

    expect(addElementSpy).toHaveBeenCalledOnce();
    expect(useOverlayStore.getState().entries.size).toBe(1);
  });

  it('uses the default offset when none is provided', () => {
    const { renderer } = createHintBillboardRenderer();
    const addElementSpy = vi.spyOn(renderer, 'addElement');

    renderer.show();

    expect(addElementSpy).toHaveBeenCalledWith(expect.any(String), HintBillboard, HINT, {
      offset: HINT_BILLBOARD_OFFSET,
    });
  });

  it('uses the provided offset', () => {
    const offset = new THREE.Vector3(0, 3, 0);
    const { renderer } = createHintBillboardRenderer(offset);
    const addElementSpy = vi.spyOn(renderer, 'addElement');

    renderer.show();

    expect(addElementSpy).toHaveBeenCalledWith(expect.any(String), HintBillboard, HINT, { offset });
  });

  it('removes the overlay entry when hidden', () => {
    const { renderer, hintId } = createHintBillboardRenderer();

    renderer.show();
    renderer.hide();

    expect(renderer.isVisible).toBe(false);
    expect(getEntry(hintId)).toBeUndefined();
  });

  it('does nothing when hidden while not visible', () => {
    const { renderer } = createHintBillboardRenderer();
    const removeElementSpy = vi.spyOn(renderer, 'removeElement');

    renderer.hide();

    expect(removeElementSpy).not.toHaveBeenCalled();
  });

  it('can be shown again after being hidden', () => {
    const { renderer, hintId } = createHintBillboardRenderer();

    renderer.show();
    renderer.hide();
    renderer.show();

    expect(renderer.isVisible).toBe(true);
    expect(getEntry(hintId)).toBeDefined();
  });

  it('removes the overlay entry when the game object is destroyed', () => {
    const { gameObject, renderer, hintId } = createHintBillboardRenderer();

    renderer.show();
    gameObject.destroy();

    expect(renderer.isVisible).toBe(false);
    expect(getEntry(hintId)).toBeUndefined();
  });
});
