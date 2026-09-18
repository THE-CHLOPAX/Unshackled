import type { Entity } from '../../gameObjects/Entity';

import gsap from 'gsap';
import { GameObject, Scene } from '@tgdf';
import { MockCamera } from '@tgdf/internal-3d/testUtils/MockCamera';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useOverlayStore, overlayElementRefs } from 'renderer/store/useOverlayStore';

import { HealthBarRenderer } from './HealthBarRenderer';
import { HealthPointsController } from '../HealthPointsController';
import { HEALTH_BAR_VISIBLE_DURATION_MS, HEALTH_BAR_FADE_DURATION_S } from './constants';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

class TestScene extends Scene {
  camera = new MockCamera();
}

function createHealthBarRenderer(initialHealthPoints = 100) {
  const scene = new TestScene();

  const gameObject = new GameObject({ scene }) as unknown as Entity;
  scene.add(gameObject);

  const healthPointsController = new HealthPointsController(gameObject, { initialHealthPoints });
  const healthBarRenderer = new HealthBarRenderer(gameObject, healthPointsController);

  gameObject.addComponent('HealthPointsController', healthPointsController);
  gameObject.addComponent('HealthBarRenderer', healthBarRenderer);

  gameObject.update(0);

  const barId = `health-bar-${gameObject.uuid}`;

  return { scene, gameObject, healthPointsController, healthBarRenderer, barId };
}

describe('HealthBarRenderer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useOverlayStore.setState({ entries: new Map() });
    overlayElementRefs.clear();
    vi.spyOn(gsap, 'to').mockReturnValue({
      kill: vi.fn(),
      revert: vi.fn(),
    } as unknown as gsap.core.Tween);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('adds a health bar element when the entity takes damage', () => {
    const { healthPointsController, gameObject, barId } = createHealthBarRenderer(100);

    healthPointsController.inflictDamage(30);

    const entry = useOverlayStore.getState().entries.get(barId);
    expect(entry?.props).toEqual({
      entity: gameObject,
      progress: 0.7,
      fadeOutEnabled: false,
      progressDelta: expect.closeTo(0.3),
      progressDeltaAccumulated: expect.closeTo(0.3),
    });
  });

  it('adds a health bar element when the entity heals', () => {
    const { healthPointsController, gameObject, barId } = createHealthBarRenderer(100);

    healthPointsController.inflictDamage(50);
    healthPointsController.healDamage(20);

    const entry = useOverlayStore.getState().entries.get(barId);
    expect(entry?.props).toEqual({
      entity: gameObject,
      progress: 0.7,
      fadeOutEnabled: false,
      progressDelta: expect.closeTo(-0.2),
      progressDeltaAccumulated: expect.closeTo(0.3),
    });
  });

  it('creates a new element when none is present yet, and updates it instead of re-adding once mounted', () => {
    const { healthPointsController, healthBarRenderer, gameObject, barId } =
      createHealthBarRenderer(100);
    const addSpy = vi.spyOn(healthBarRenderer, 'addElement');
    const updateSpy = vi.spyOn(healthBarRenderer, 'updateElement');

    // Not mounted yet (overlayElementRefs empty) -> add path.
    healthPointsController.inflictDamage(10);
    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).not.toHaveBeenCalled();

    // Simulate BillboardOverlay having mounted the element by now.
    overlayElementRefs.set(barId, document.createElement('div'));

    // Mounted -> update path, not another add.
    healthPointsController.inflictDamage(10);
    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledWith(barId, {
      entity: gameObject,
      progress: 0.8,
      fadeOutEnabled: false,
      progressDelta: expect.closeTo(0.1),
      progressDeltaAccumulated: expect.closeTo(0.2),
    });
  });

  it('clears the previous fade timeout and reschedules it on every damage/heal event', () => {
    const { healthPointsController, barId } = createHealthBarRenderer(100);
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    healthPointsController.inflictDamage(10);
    expect(clearTimeoutSpy).not.toHaveBeenCalled();

    overlayElementRefs.set(barId, document.createElement('div'));

    vi.advanceTimersByTime(HEALTH_BAR_VISIBLE_DURATION_MS - 500);
    healthPointsController.inflictDamage(10);
    // Both the fade timeout and the recent-damage sync timeout get cleared and rescheduled.
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);

    // The first hit's original deadline has now passed, but the second hit reset the
    // timer, so the bar should not have started fading yet.
    vi.advanceTimersByTime(500);
    expect(gsap.to).not.toHaveBeenCalled();

    // Fires HEALTH_BAR_VISIBLE_DURATION_MS after the SECOND hit.
    vi.advanceTimersByTime(HEALTH_BAR_VISIBLE_DURATION_MS - 500);
    expect(gsap.to).toHaveBeenCalledTimes(1);
  });

  it('fades out and removes the bar after the visible duration elapses', () => {
    const { healthPointsController, barId } = createHealthBarRenderer(100);

    healthPointsController.inflictDamage(10);
    expect(useOverlayStore.getState().entries.has(barId)).toBe(true);

    // Simulate mount so _fadeHealthBar has an element to animate.
    overlayElementRefs.set(barId, document.createElement('div'));

    vi.advanceTimersByTime(HEALTH_BAR_VISIBLE_DURATION_MS);

    expect(gsap.to).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      expect.objectContaining({ opacity: 0, duration: HEALTH_BAR_FADE_DURATION_S })
    );

    // Simulate the tween completing.
    const [, vars] = vi.mocked(gsap.to).mock.calls[0];
    vars.onComplete?.();

    expect(useOverlayStore.getState().entries.has(barId)).toBe(false);
  });

  it('stops reacting to damage/heal events and removes the bar once destroyed', () => {
    const { healthPointsController, healthBarRenderer, barId } = createHealthBarRenderer(100);
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    healthPointsController.inflictDamage(10);
    overlayElementRefs.set(barId, document.createElement('div'));
    expect(useOverlayStore.getState().entries.has(barId)).toBe(true);

    healthBarRenderer.destroy();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(useOverlayStore.getState().entries.has(barId)).toBe(false);

    // No longer subscribed: further damage doesn't resurrect the bar.
    healthPointsController.inflictDamage(10);
    expect(useOverlayStore.getState().entries.has(barId)).toBe(false);
  });

  it('destroying without ever having taken damage does not throw', () => {
    const { healthBarRenderer } = createHealthBarRenderer(100);

    expect(() => healthBarRenderer.destroy()).not.toThrow();
  });

  it('kills and reverts the progressing fade tween when there is an incoming update', () => {
    const { healthPointsController, barId, healthBarRenderer } = createHealthBarRenderer(100);

    healthPointsController.inflictDamage(10);

    overlayElementRefs.set(barId, document.createElement('div'));

    // Fade tween still in progress
    vi.advanceTimersByTime(HEALTH_BAR_VISIBLE_DURATION_MS);
    vi.advanceTimersByTime((HEALTH_BAR_FADE_DURATION_S * 1000) / 2);

    const activeTween = healthBarRenderer['_healthBarTween'];

    // An update should kill the tween so that it doesn't fade
    healthPointsController.inflictDamage(10);
    expect(activeTween?.revert).toHaveBeenCalledOnce();
    expect(activeTween?.kill).toHaveBeenCalledOnce();

    vi.advanceTimersByTime((HEALTH_BAR_FADE_DURATION_S * 1000) / 2);
    expect(useOverlayStore.getState().entries.has(barId)).toBe(true);
  });

  it('doesnt discard subsequent rapid update - calls update with new value correctly', () => {
    const { healthPointsController, healthBarRenderer, gameObject, barId } =
      createHealthBarRenderer(100);
    const addSpy = vi.spyOn(healthBarRenderer, 'addElement');
    const updateSpy = vi.spyOn(healthBarRenderer, 'updateElement');

    healthPointsController.inflictDamage(10);
    expect(addSpy).toHaveBeenCalledTimes(1);

    healthPointsController.inflictDamage(10);
    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledTimes(1);

    const entry = useOverlayStore.getState().entries.get(barId);
    expect(entry?.props).toEqual({
      entity: gameObject,
      progress: 0.8,
      fadeOutEnabled: false,
      progressDelta: expect.closeTo(0.1),
      progressDeltaAccumulated: expect.closeTo(0.2),
    });
  });
});
