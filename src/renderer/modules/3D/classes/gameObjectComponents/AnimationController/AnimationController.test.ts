import * as THREE from 'three';
import { GameObject, getModelFromStore, Scene } from '@tgdf';
import { MockCamera } from '@tgdf/internal-3d/testUtils/MockCamera';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ModelRenderer } from '3D/classes/gameObjectComponents/ModelRenderer/ModelRenderer';
import { AnimationController } from '3D/classes/gameObjectComponents/AnimationController/AnimationController';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

vi.mock('@tgdf', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tgdf')>();
  return {
    ...actual,
    getModelFromStore: vi.fn(),
  };
});

class TestScene extends Scene {
  camera = new MockCamera();
}

function createClip(name: string, duration = 1): THREE.AnimationClip {
  return new THREE.AnimationClip(name, duration, []);
}

function createAnimatedModel(...clipNames: string[]): THREE.Object3D {
  const model = new THREE.Group();
  model.animations = clipNames.map((name) => createClip(name));
  return model;
}

function createController(
  clips: string[] = ['idle', 'run'],
  options?: ConstructorParameters<typeof AnimationController>[2]
) {
  const scene = new TestScene();
  const gameObject = new GameObject({ scene });
  const model = createAnimatedModel(...clips);

  vi.mocked(getModelFromStore).mockReturnValue(model);

  const modelRenderer = new ModelRenderer(gameObject, { id: 'test-model' });
  const controller = new AnimationController(gameObject, modelRenderer, options);

  return { scene, gameObject, modelRenderer, controller, model };
}

function getCachedAction(
  controller: AnimationController,
  animationName: string
): THREE.AnimationAction {
  const action = controller['_actions'].get(animationName);
  if (!action) {
    throw new Error(`Animation "${animationName}" not found`);
  }
  return action;
}

describe('AnimationController', () => {
  beforeEach(() => {
    vi.spyOn(THREE.AnimationAction.prototype, 'play');
    vi.spyOn(THREE.AnimationAction.prototype, 'reset');
    vi.spyOn(THREE.AnimationAction.prototype, 'setDuration');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes animations from the current model', () => {
    const { controller, model } = createController(['idle', 'attack']);

    expect(controller.getAnimations()).toEqual(model.animations);
  });

  it('re-initializes animations when the model changes', () => {
    const { controller, modelRenderer } = createController(['idle']);
    const nextModel = createAnimatedModel('walk', 'jump');

    modelRenderer.setModel(nextModel);

    expect(controller.getAnimations()).toEqual(nextModel.animations);
  });

  it('plays the requested animation', () => {
    const { controller, gameObject } = createController(['idle']);

    controller.playAnimation('idle');
    gameObject.events.trigger('update', { deltaTime: 0.01 });

    expect(THREE.AnimationAction.prototype.play).toHaveBeenCalled();
  });

  it('applies playback rate from options and play options', () => {
    const { controller } = createController(['idle', 'run'], {
      playbackRates: { idle: 2 },
    });

    controller.playAnimation('idle');
    expect(THREE.AnimationAction.prototype.setDuration).toHaveBeenCalledWith(0.5);

    controller.playAnimation('run');
    expect(THREE.AnimationAction.prototype.setDuration).toHaveBeenLastCalledWith(1);

    controller.playAnimation('idle', { playbackRate: 4 });
    expect(THREE.AnimationAction.prototype.setDuration).toHaveBeenLastCalledWith(0.25);
  });

  it('configures loop mode from play options', () => {
    const { controller } = createController(['idle', 'run']);
    const setLoopSpy = vi.spyOn(THREE.AnimationAction.prototype, 'setLoop');

    controller.playAnimation('run', { loop: true });
    expect(setLoopSpy).toHaveBeenCalledWith(THREE.LoopRepeat, Infinity);

    controller.playAnimation('idle');
    expect(setLoopSpy).toHaveBeenLastCalledWith(THREE.LoopOnce, 0);
  });

  it('does not restart an animation that is already running', () => {
    const { controller } = createController(['idle']);

    controller.playAnimation('idle');
    controller.playAnimation('idle', { onComplete: vi.fn() });

    expect(THREE.AnimationAction.prototype.reset).toHaveBeenCalledTimes(1);
  });

  it('updates onComplete when replaying the same running animation', () => {
    const { controller, gameObject } = createController(['idle']);
    const onComplete = vi.fn();

    controller.playAnimation('idle');
    controller.playAnimation('idle', { onComplete, loop: false });
    gameObject.events.trigger('update', { deltaTime: 1.1 });

    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('calls onComplete when a non-looping animation finishes', () => {
    const { controller, gameObject } = createController(['idle']);
    const onComplete = vi.fn();

    controller.playAnimation('idle', { onComplete, loop: false });
    gameObject.events.trigger('update', { deltaTime: 1.1 });

    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('pauses and stops animations', () => {
    const { controller } = createController(['idle', 'run']);

    controller.playAnimation('idle');
    controller.pauseAnimation('idle');
    expect(getCachedAction(controller, 'idle').paused).toBe(true);

    controller.playAnimation('run');
    controller.stopAnimation('run');

    const runAction = getCachedAction(controller, 'run');
    expect(runAction.isRunning()).toBe(false);
    expect(controller['_currentAction']).toBeNull();
  });

  it('updates the animation mixer on game object update events', () => {
    const { controller, gameObject } = createController(['idle']);

    controller.playAnimation('idle');
    gameObject.events.trigger('update', { deltaTime: 0.25 });

    expect(getCachedAction(controller, 'idle').time).toBeCloseTo(0.25);
  });

  it('disposes animation resources when destroyed', () => {
    const { controller, gameObject } = createController(['idle']);

    controller.playAnimation('idle');
    gameObject.events.trigger('destroyed');

    expect(controller.getAnimations()).toEqual([]);
  });
});
