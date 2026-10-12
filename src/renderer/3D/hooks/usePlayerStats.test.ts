import { Mock } from 'moq.ts';
import { describe, it, expect, vi } from 'vitest';
import { Emitter, GameObjectEventMap } from '@tgdf';
import { act, renderHook } from '@testing-library/react';

import { usePlayerStats } from './usePlayerStats';
import { Entity } from '../classes/gameObjects/Entity';
import { Player } from '../classes/gameObjects/players/Player';
import { HealthPointsController } from '../classes/gameObjectComponents/HealthPointsController';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

function createPlayer(maxHealthPoints = 100, name = 'Monk') {
  const entity = new Mock<Entity>()
    .setup((e) => e.isAwake)
    .returns(false)
    .setup((e) => e.events)
    .returns(new Emitter<GameObjectEventMap>())
    .object();

  const healthPointsController = new HealthPointsController(entity, { maxHealthPoints });
  const player = { healthPointsController, name } as unknown as Player;

  return { player, healthPointsController };
}

describe('usePlayerStats', () => {
  it('returns null when there is no player', () => {
    const { result } = renderHook(() => usePlayerStats({}));

    expect(result.current).toBeNull();
  });

  it('returns the name, current and max health points', () => {
    const { player, healthPointsController } = createPlayer(100);
    healthPointsController.setHealthPoints(40);

    const { result } = renderHook(() => usePlayerStats({ player }));

    expect(result.current).toEqual({ name: 'Monk', currentHealthPoints: 40, maxHealthPoints: 100 });
  });

  it('updates on damage, heal and death', () => {
    const { player, healthPointsController } = createPlayer(100);
    const { result } = renderHook(() => usePlayerStats({ player }));

    act(() => healthPointsController.inflictDamage(30));
    expect(result.current?.currentHealthPoints).toBe(70);

    act(() => healthPointsController.healDamage(10));
    expect(result.current?.currentHealthPoints).toBe(80);

    act(() => healthPointsController.inflictDamage(200));
    expect(result.current?.currentHealthPoints).toBe(0);
  });

  it('keeps the same object reference when nothing changed', () => {
    const { player } = createPlayer(100);
    const { result, rerender } = renderHook(() => usePlayerStats({ player }));
    const firstResult = result.current;

    rerender();

    expect(result.current).toBe(firstResult);
  });

  it('switches to a new player when it changes', () => {
    const first = createPlayer(100);
    const second = createPlayer(50);
    const { result, rerender } = renderHook(({ player }) => usePlayerStats({ player }), {
      initialProps: { player: first.player },
    });

    rerender({ player: second.player });
    act(() => first.healthPointsController.inflictDamage(10));
    expect(result.current?.currentHealthPoints).toBe(50);

    act(() => second.healthPointsController.inflictDamage(10));
    expect(result.current?.currentHealthPoints).toBe(40);
  });

  it('unsubscribes on unmount', () => {
    const { player, healthPointsController } = createPlayer(100);
    const offSpy = vi.spyOn(healthPointsController.events, 'off');
    const { unmount } = renderHook(() => usePlayerStats({ player }));

    unmount();

    expect(offSpy).toHaveBeenCalledWith('damagetaken', expect.any(Function));
    expect(offSpy).toHaveBeenCalledWith('heal', expect.any(Function));
    expect(offSpy).toHaveBeenCalledWith('death', expect.any(Function));
  });
});
