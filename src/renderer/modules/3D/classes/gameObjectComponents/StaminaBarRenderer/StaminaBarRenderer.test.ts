import type { Entity } from '3D/classes/gameObjects/Entity/Entity';

import gsap from 'gsap';
import { GameObject, Scene } from '@tgdf';
import { MockCamera } from '@tgdf/internal-3d/testUtils/MockCamera';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { BillboardView } from '3D/classes/scenes/GameScene/BillboardRegistry/BillboardView';
import { BillboardRegistry } from '3D/classes/scenes/GameScene/BillboardRegistry/BillboardRegistry';
import { StaminaBarRenderer } from '3D/classes/gameObjectComponents/StaminaBarRenderer/StaminaBarRenderer';
import {
  GENERAL_REPLENISH_RATE_PER_S,
  StaminaPointsController,
} from '3D/classes/gameObjectComponents/StaminaPointsController/StaminaPointsController';
import {
  STAMINA_BAR_HIDE_DELAY_MS,
  STAMINA_BAR_FADE_DURATION_S,
  STAMINA_BAR_IDLE_HIDE_DELAY_MS,
} from '3D/classes/gameObjectComponents/StaminaBarRenderer/constants';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

let registry: BillboardRegistry;
let billboardView: BillboardView;

class TestScene extends Scene {
  camera = new MockCamera();
}

function createStaminaBarRenderer() {
  const scene = new TestScene();
  const gameObject = new GameObject({ scene }) as unknown as Entity;

  const staminaPointsController = new StaminaPointsController(gameObject, {
    maxLongTermStamina: 300,
    maxShortTermStamina: 100,
  });
  const staminaBarRenderer = new StaminaBarRenderer(gameObject, registry, staminaPointsController);

  gameObject.addComponent('StaminaPointsController', staminaPointsController);
  gameObject.addComponent('StaminaBarRenderer', staminaBarRenderer);

  scene.add(gameObject);
  gameObject.update(0);

  const barId = `stamina-bar-${gameObject.uuid}`;

  return { gameObject, staminaPointsController, staminaBarRenderer, barId };
}

const PROGRESS_AFTER_REPLENISH_STEP = (50 + GENERAL_REPLENISH_RATE_PER_S * 0.2) / 100;

function getEntry(barId: string) {
  return registry.get(barId);
}

describe('StaminaBarRenderer', () => {
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

  it('shows nothing while short-term stamina is full', () => {
    const { staminaPointsController, barId } = createStaminaBarRenderer();

    staminaPointsController.drainLongTermStamina(50);

    expect(getEntry(barId)).toBeUndefined();
  });

  it('adds the bar with the short-term progress when short-term stamina is drained', () => {
    const { staminaPointsController, barId } = createStaminaBarRenderer();

    staminaPointsController.drainShortTermStamina(30);

    expect(getEntry(barId)?.props).toEqual({ progress: 0.7 });
  });

  it('updates the existing bar instead of adding another one', () => {
    const { staminaPointsController, staminaBarRenderer, barId } = createStaminaBarRenderer();
    const addSpy = vi.spyOn(staminaBarRenderer, 'addElement');
    const updateSpy = vi.spyOn(staminaBarRenderer, 'updateElement');

    staminaPointsController.drainShortTermStamina(30);
    staminaPointsController.drainShortTermStamina(20);

    expect(addSpy).toHaveBeenCalledOnce();
    expect(updateSpy).toHaveBeenCalledWith(barId, { progress: 0.5 });
  });

  it('skips updates smaller than the progress step', () => {
    const { staminaPointsController, staminaBarRenderer } = createStaminaBarRenderer();
    staminaPointsController.drainShortTermStamina(30);
    const updateSpy = vi.spyOn(staminaBarRenderer, 'updateElement');

    staminaPointsController.drainShortTermStamina(0.2);

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('follows short-term stamina while it replenishes', () => {
    const { gameObject, staminaPointsController, barId } = createStaminaBarRenderer();
    staminaPointsController.drainShortTermStamina(50);

    gameObject.update(1);
    gameObject.update(0.2);

    expect(getEntry(barId)?.props).toMatchObject({
      progress: expect.closeTo(PROGRESS_AFTER_REPLENISH_STEP, 2),
    });
  });

  it('fades out and removes the bar once short-term stamina is full again', () => {
    const { gameObject, staminaPointsController, barId } = createStaminaBarRenderer();
    staminaPointsController.drainShortTermStamina(10);
    billboardView.setNode(barId, document.createElement('div'));

    gameObject.update(1);
    gameObject.update(1);
    expect(getEntry(barId)?.props).toMatchObject({ progress: 1 });

    vi.advanceTimersByTime(STAMINA_BAR_HIDE_DELAY_MS);
    expect(gsap.to).toHaveBeenCalledWith(
      [expect.any(HTMLDivElement)],
      expect.objectContaining({ opacity: 0, duration: STAMINA_BAR_FADE_DURATION_S })
    );

    const [, vars] = vi.mocked(gsap.to).mock.calls[0];
    vars.onComplete?.();

    expect(getEntry(barId)).toBeUndefined();
  });

  it('cancels hiding when stamina is drained again before the bar fades', () => {
    const { gameObject, staminaPointsController, barId } = createStaminaBarRenderer();
    staminaPointsController.drainShortTermStamina(10);
    billboardView.setNode(barId, document.createElement('div'));
    gameObject.update(1);
    gameObject.update(1);

    staminaPointsController.drainShortTermStamina(20);
    vi.advanceTimersByTime(STAMINA_BAR_HIDE_DELAY_MS);

    expect(gsap.to).not.toHaveBeenCalled();
    expect(getEntry(barId)?.props).toMatchObject({ progress: 0.8 });
  });

  it('hides the bar when short-term stamina stops changing before it is full', () => {
    const { gameObject, staminaPointsController, barId } = createStaminaBarRenderer();
    staminaPointsController.drainLongTermStamina(300);
    staminaPointsController.drainShortTermStamina(100);
    billboardView.setNode(barId, document.createElement('div'));

    gameObject.update(5);
    vi.advanceTimersByTime(STAMINA_BAR_IDLE_HIDE_DELAY_MS - 1);
    expect(gsap.to).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(gsap.to).toHaveBeenCalledOnce();

    const [, vars] = vi.mocked(gsap.to).mock.calls[0];
    vars.onComplete?.();
    expect(getEntry(barId)).toBeUndefined();
  });

  it('keeps the bar during the pause before replenishing starts', () => {
    const { gameObject, staminaPointsController, barId } = createStaminaBarRenderer();
    staminaPointsController.drainShortTermStamina(50);
    billboardView.setNode(barId, document.createElement('div'));

    vi.advanceTimersByTime(900);
    gameObject.update(1);
    gameObject.update(0.2);

    expect(gsap.to).not.toHaveBeenCalled();
    expect(getEntry(barId)?.props).toMatchObject({
      progress: expect.closeTo(PROGRESS_AFTER_REPLENISH_STEP, 2),
    });
  });

  it('stops reacting and removes the bar once destroyed', () => {
    const { staminaPointsController, staminaBarRenderer, barId } = createStaminaBarRenderer();
    staminaPointsController.drainShortTermStamina(30);

    staminaBarRenderer.destroy();
    staminaPointsController.drainShortTermStamina(30);

    expect(getEntry(barId)).toBeUndefined();
  });
});
