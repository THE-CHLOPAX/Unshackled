import { Mock } from 'moq.ts';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { InteractState } from './InteractState';
import { Player } from '../../gameObjects/players/Player';
import { AnimationClipNamesShared, Interactable } from '../../../types';
import { AnimationPlayOptions } from '../../gameObjectComponents/AnimationController/AnimationController';

const delayedCalls = vi.hoisted(() => [] as { callback: () => void; kill: () => void }[]);

vi.mock('gsap', () => ({
  gsap: {
    delayedCall: vi.fn((_delay: number, callback: () => void) => {
      const call = { callback, kill: vi.fn() };
      delayedCalls.push(call);
      return call;
    }),
  },
}));

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

type PlayAnimation = (name: string, options?: AnimationPlayOptions) => void;

describe('InteractState', () => {
  let player: Player;
  let target: Interactable;
  let playAnimation: ReturnType<typeof vi.fn<PlayAnimation>>;

  beforeEach(() => {
    delayedCalls.length = 0;
    playAnimation = vi.fn();
    target = { interact: vi.fn() };
    player = new Mock<Player>()
      .setup((p) => p.animationController)
      .returns({ playAnimation } as unknown as Player['animationController'])
      .object();
  });

  function completeAnimation(): void {
    playAnimation.mock.calls[0][1]?.onComplete?.();
  }

  it('plays the shared interact animation by default', () => {
    new InteractState(player, target).enter();

    expect(playAnimation).toHaveBeenCalledWith(
      AnimationClipNamesShared.INTERACT,
      expect.objectContaining({ clampWhenFinished: true })
    );
  });

  it('plays a custom animation with the given playback rate', () => {
    new InteractState(player, target, { animationName: 'pull-lever', playbackRate: 2 }).enter();

    expect(playAnimation).toHaveBeenCalledWith(
      'pull-lever',
      expect.objectContaining({ playbackRate: 2 })
    );
  });

  it('interacts with the target and completes when the animation ends without a trigger delay', () => {
    const state = new InteractState(player, target);
    state.enter();

    expect(target.interact).not.toHaveBeenCalled();
    expect(state.isComplete).toBe(false);

    completeAnimation();

    expect(target.interact).toHaveBeenCalledExactlyOnceWith(player);
    expect(state.isComplete).toBe(true);
  });

  it('interacts with the target once the trigger delay elapses, before the animation ends', () => {
    const state = new InteractState(player, target, { triggerDelayS: 0.4 });
    state.enter();

    delayedCalls[0].callback();

    expect(target.interact).toHaveBeenCalledExactlyOnceWith(player);
    expect(state.isComplete).toBe(false);

    completeAnimation();

    expect(target.interact).toHaveBeenCalledOnce();
    expect(state.isComplete).toBe(true);
  });

  it('cancels the pending trigger on exit', () => {
    const state = new InteractState(player, target, { triggerDelayS: 0.4 });
    state.enter();
    state.exit();

    expect(delayedCalls[0].kill).toHaveBeenCalledOnce();
  });
});
