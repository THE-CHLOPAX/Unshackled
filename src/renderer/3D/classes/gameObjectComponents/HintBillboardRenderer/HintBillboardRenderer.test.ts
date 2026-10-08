import * as THREE from 'three';
import { GameObject, Scene } from '@tgdf';
import { MockCamera } from '@tgdf/internal-3d/testUtils/MockCamera';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { HintBillboard, HintBillboardHint } from 'UI';
import { useOverlayStore, overlayElementRefs } from 'Store/useOverlayStore';

import { HINT_BILLBOARD_OFFSET } from './constants';
import { HintBillboardRenderer, HintBillboardRendererOptions } from './HintBillboardRenderer';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

class TestScene extends Scene {
  camera = new MockCamera();
}

const OPEN_HINT: HintBillboardHint = { icon: 'A', label: 'Open' };
const LOCK_HINT: HintBillboardHint = { icon: 'X', label: 'Lock' };
const TITLE = 'Dungeon door';

function createHintBillboardRenderer(
  options: HintBillboardRendererOptions = { title: TITLE, hints: [OPEN_HINT, LOCK_HINT] }
) {
  const scene = new TestScene();
  const gameObject = new GameObject({ scene });
  scene.add(gameObject);

  const renderer = new HintBillboardRenderer(gameObject, options);
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

  it('renders the title and all hints in order when shown', () => {
    const { renderer, hintId } = createHintBillboardRenderer();

    renderer.show();

    expect(renderer.isVisible).toBe(true);
    expect(getEntry(hintId)?.Component).toBe(HintBillboard);
    expect(getEntry(hintId)?.props).toEqual({ title: TITLE, hints: [OPEN_HINT, LOCK_HINT] });
  });

  it('renders only the title when hints are hidden', () => {
    const { renderer, hintId } = createHintBillboardRenderer();

    renderer.setTitleVisible(true);

    expect(getEntry(hintId)?.props).toEqual({ title: TITLE, hints: [] });
  });

  it('renders only the hints when the title is hidden', () => {
    const { renderer, hintId } = createHintBillboardRenderer();

    renderer.setHintsVisible(true);

    expect(getEntry(hintId)?.props).toEqual({ title: undefined, hints: [OPEN_HINT, LOCK_HINT] });
  });

  it('does not render when the only visible part is empty', () => {
    const { renderer, hintId } = createHintBillboardRenderer({ hints: [OPEN_HINT] });

    renderer.setTitleVisible(true);

    expect(renderer.isVisible).toBe(false);
    expect(getEntry(hintId)).toBeUndefined();
  });

  it('removes the overlay entry once nothing visible is left', () => {
    const { renderer, hintId } = createHintBillboardRenderer();

    renderer.show();
    renderer.setHints([]);
    renderer.setTitle(undefined);

    expect(renderer.isVisible).toBe(false);
    expect(getEntry(hintId)).toBeUndefined();
  });

  it('updates the visible overlay entry when hints change', () => {
    const { renderer, hintId } = createHintBillboardRenderer();

    renderer.show();
    renderer.setHints([{ icon: 'A', label: 'Close' }]);

    expect(getEntry(hintId)?.props).toEqual({
      title: TITLE,
      hints: [{ icon: 'A', label: 'Close' }],
    });
  });

  it('keeps hint changes while hidden and shows the latest ones later', () => {
    const { renderer, hintId } = createHintBillboardRenderer();
    const updateElementSpy = vi.spyOn(renderer, 'updateElement');

    renderer.setHints([LOCK_HINT]);

    expect(updateElementSpy).not.toHaveBeenCalled();
    expect(getEntry(hintId)).toBeUndefined();

    renderer.show();

    expect(getEntry(hintId)?.props).toEqual({ title: TITLE, hints: [LOCK_HINT] });
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

    expect(addElementSpy).toHaveBeenCalledWith(
      expect.any(String),
      HintBillboard,
      expect.any(Object),
      { offset: HINT_BILLBOARD_OFFSET }
    );
  });

  it('uses the provided offset', () => {
    const offset = new THREE.Vector3(0, 3, 0);
    const { renderer } = createHintBillboardRenderer({ hints: [OPEN_HINT], offset });
    const addElementSpy = vi.spyOn(renderer, 'addElement');

    renderer.show();

    expect(addElementSpy).toHaveBeenCalledWith(
      expect.any(String),
      HintBillboard,
      expect.any(Object),
      { offset }
    );
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
