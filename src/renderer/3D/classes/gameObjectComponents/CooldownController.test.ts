import { Mock } from 'moq.ts';
import { Emitter, GameObjectEventMap } from '@tgdf';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { Entity } from '../gameObjects/Entity';
import { CooldownController } from './CooldownController';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

describe('CooldownController', () => {
  let controller: CooldownController;

  beforeEach(() => {
    vi.useFakeTimers();

    const entityMock = new Mock<Entity>()
      .setup((e) => e.events)
      .returns(new Emitter<GameObjectEventMap>());

    controller = new CooldownController(entityMock.object());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is not on cooldown before startCooldown is called', () => {
    expect(controller.isOnCooldown('dash')).toBe(false);
  });

  it('is on cooldown immediately after startCooldown', () => {
    controller.startCooldown('dash', 1000);

    expect(controller.isOnCooldown('dash')).toBe(true);
  });

  it('is no longer on cooldown once the duration has elapsed', () => {
    controller.startCooldown('dash', 1000);

    vi.advanceTimersByTime(999);
    expect(controller.isOnCooldown('dash')).toBe(true);

    vi.advanceTimersByTime(1);
    expect(controller.isOnCooldown('dash')).toBe(false);
  });

  it('tracks cooldowns independently per key', () => {
    controller.startCooldown('dash', 1000);

    expect(controller.isOnCooldown('dash')).toBe(true);
    expect(controller.isOnCooldown('punch')).toBe(false);
  });
});
