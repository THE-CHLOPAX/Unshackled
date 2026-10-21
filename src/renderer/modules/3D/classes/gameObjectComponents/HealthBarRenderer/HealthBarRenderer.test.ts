import type { Entity } from '3D/classes/gameObjects/Entity';

import gsap from 'gsap';
import { GameObject, Scene } from '@tgdf';
import { MockCamera } from '@tgdf/internal-3d/testUtils/MockCamera';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { BillboardView } from '3D/classes/scenes/GameScene/BillboardRegistry/BillboardView';
import { HealthPointsController } from '3D/classes/gameObjectComponents/HealthPointsController';
import { BillboardRegistry } from '3D/classes/scenes/GameScene/BillboardRegistry/BillboardRegistry';
import { HealthBarRenderer } from '3D/classes/gameObjectComponents/HealthBarRenderer/HealthBarRenderer';
import {
  HEALTH_BAR_VISIBLE_DURATION_MS,
  HEALTH_BAR_FADE_DURATION_S,
} from '3D/classes/gameObjectComponents/HealthBarRenderer/constants';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

let registry: BillboardRegistry;
let billboardView: BillboardView;

class TestScene extends Scene {
  camera = new MockCamera();
}

function createHealthBarRenderer(maxHealthPoints = 100, startingHealthPoints?: number) {
  const scene = new TestScene();

  const gameObject = new GameObject({ scene }) as unknown as Entity;

  const healthPointsController = new HealthPointsController(gameObject, { maxHealthPoints });
  const healthBarRenderer = new HealthBarRenderer(gameObject, registry, healthPointsController);

  gameObject.addComponent('HealthPointsController', healthPointsController);
  gameObject.addComponent('HealthBarRenderer', healthBarRenderer);

  if (startingHealthPoints !== undefined) {
    healthPointsController.setHealthPoints(startingHealthPoints);
  }

  scene.add(gameObject);
  gameObject.update(0);

  const barId = `health-bar-${gameObject.uuid}`;

  return { scene, gameObject, healthPointsController, healthBarRenderer, barId };
}

describe('HealthBarRenderer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    registry = new BillboardRegistry();
    billboardView = new BillboardView(registry);
    billboardView.attach();
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

    const entry = registry.get(barId);
    expect(entry?.props).toEqual({
      entity: gameObject,
      progress: 0.7,
      initialProgress: 1,
    });
  });

  it('measures the first damage from health set before awake, not from full health', () => {
    const { healthPointsController, barId } = createHealthBarRenderer(100, 40);

    healthPointsController.inflictDamage(10);

    const entry = registry.get(barId);
    expect(entry?.props).toMatchObject({
      progress: expect.closeTo(0.3),
      initialProgress: expect.closeTo(0.4),
    });
  });

  it('adds a health bar element when the entity heals', () => {
    const { healthPointsController, gameObject, barId } = createHealthBarRenderer(100);

    healthPointsController.inflictDamage(50);
    healthPointsController.healDamage(20);

    const entry = registry.get(barId);
    expect(entry?.props).toEqual({
      entity: gameObject,
      progress: 0.7,
      initialProgress: 1,
    });
  });

  it('creates a new element when none is present yet, and updates it instead of re-adding once mounted', () => {
    const { healthPointsController, healthBarRenderer, barId } = createHealthBarRenderer(100);
    const addSpy = vi.spyOn(healthBarRenderer, 'addElement');
    const updateSpy = vi.spyOn(healthBarRenderer, 'updateElement');

    // Not mounted yet (no view has a node) -> add path.
    healthPointsController.inflictDamage(10);
    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).not.toHaveBeenCalled();

    // Simulate BillboardLayer having mounted the element by now.
    billboardView.setNode(barId, document.createElement('div'));

    // Mounted -> update path, not another add.
    healthPointsController.inflictDamage(10);
    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledWith(barId, { progress: 0.8 });
  });

  it('clears the previous fade timeout and reschedules it on every damage/heal event', () => {
    const { healthPointsController, barId } = createHealthBarRenderer(100);
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    healthPointsController.inflictDamage(10);
    expect(clearTimeoutSpy).not.toHaveBeenCalled();

    billboardView.setNode(barId, document.createElement('div'));

    vi.advanceTimersByTime(HEALTH_BAR_VISIBLE_DURATION_MS - 500);
    healthPointsController.inflictDamage(10);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);

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
    expect(registry.has(barId)).toBe(true);

    // Simulate mount so _fadeHealthBar has an element to animate.
    billboardView.setNode(barId, document.createElement('div'));

    vi.advanceTimersByTime(HEALTH_BAR_VISIBLE_DURATION_MS);

    expect(gsap.to).toHaveBeenCalledWith(
      [expect.any(HTMLDivElement)],
      expect.objectContaining({ opacity: 0, duration: HEALTH_BAR_FADE_DURATION_S })
    );

    // Simulate the tween completing.
    const [, vars] = vi.mocked(gsap.to).mock.calls[0];
    vars.onComplete?.();

    expect(registry.has(barId)).toBe(false);
  });

  it('removes the bar without fading when no view has mounted it', () => {
    const { healthPointsController, barId } = createHealthBarRenderer(100);

    healthPointsController.inflictDamage(10);
    vi.advanceTimersByTime(HEALTH_BAR_VISIBLE_DURATION_MS);

    expect(gsap.to).not.toHaveBeenCalled();
    expect(registry.has(barId)).toBe(false);
  });

  it('stops reacting to damage/heal events and removes the bar once destroyed', () => {
    const { healthPointsController, healthBarRenderer, barId } = createHealthBarRenderer(100);
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    healthPointsController.inflictDamage(10);
    billboardView.setNode(barId, document.createElement('div'));
    expect(registry.has(barId)).toBe(true);

    healthBarRenderer.destroy();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(registry.has(barId)).toBe(false);

    // No longer subscribed: further damage doesn't resurrect the bar.
    healthPointsController.inflictDamage(10);
    expect(registry.has(barId)).toBe(false);
  });

  it('destroying without ever having taken damage does not throw', () => {
    const { healthBarRenderer } = createHealthBarRenderer(100);

    expect(() => healthBarRenderer.destroy()).not.toThrow();
  });

  it('kills and reverts the progressing fade tween when there is an incoming update', () => {
    const { healthPointsController, barId, healthBarRenderer } = createHealthBarRenderer(100);

    healthPointsController.inflictDamage(10);

    billboardView.setNode(barId, document.createElement('div'));

    // Fade tween still in progress
    vi.advanceTimersByTime(HEALTH_BAR_VISIBLE_DURATION_MS);
    vi.advanceTimersByTime((HEALTH_BAR_FADE_DURATION_S * 1000) / 2);

    const activeTween = healthBarRenderer['_healthBarTween'];

    // An update should kill the tween so that it doesn't fade
    healthPointsController.inflictDamage(10);
    expect(activeTween?.revert).toHaveBeenCalledOnce();
    expect(activeTween?.kill).toHaveBeenCalledOnce();

    vi.advanceTimersByTime((HEALTH_BAR_FADE_DURATION_S * 1000) / 2);
    expect(registry.has(barId)).toBe(true);
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

    const entry = registry.get(barId);
    expect(entry?.props).toEqual({
      entity: gameObject,
      progress: 0.8,
      initialProgress: 1,
    });
  });

  it('starts a re-added bar from the progress it had when the previous bar was removed', () => {
    const { healthPointsController, barId } = createHealthBarRenderer(100);

    healthPointsController.inflictDamage(30);
    billboardView.setNode(barId, document.createElement('div'));
    vi.advanceTimersByTime(HEALTH_BAR_VISIBLE_DURATION_MS);
    const [, vars] = vi.mocked(gsap.to).mock.calls[0];
    vars.onComplete?.();
    expect(registry.has(barId)).toBe(false);

    healthPointsController.inflictDamage(20);

    const entry = registry.get(barId);
    expect(entry?.props).toMatchObject({
      progress: expect.closeTo(0.5),
      initialProgress: expect.closeTo(0.7),
    });
  });
});
