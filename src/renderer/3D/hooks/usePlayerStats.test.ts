import { Mock } from 'moq.ts';
import { describe, it, expect, vi } from 'vitest';
import { Emitter, GameObjectEventMap } from '@tgdf';
import { act, renderHook } from '@testing-library/react';

import { usePlayerStats } from './usePlayerStats';
import { Entity } from '../classes/gameObjects/Entity';
import { HealthPointsController } from '../classes/gameObjectComponents/HealthPointsController';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

function createHealthPointsController(initialHealthPoints = 100) {
  const entity = new Mock<Entity>()
    .setup((e) => e.isAwake)
    .returns(false)
    .setup((e) => e.events)
    .returns(new Emitter<GameObjectEventMap>())
    .object();

  return new HealthPointsController(entity, { initialHealthPoints });
}

describe('usePlayerStats', () => {
  it('returns null when there is no health points controller', () => {
    const { result } = renderHook(() => usePlayerStats({ healthPointsController: null }));

    expect(result.current).toBeNull();
  });

  it('returns the current health points', () => {
    const healthPointsController = createHealthPointsController(100);
    healthPointsController.setHealthPoints(40);

    const { result } = renderHook(() => usePlayerStats({ healthPointsController }));

    expect(result.current).toEqual({ currentHealthPoints: 40 });
  });

  it('updates on damage, heal and death', () => {
    const healthPointsController = createHealthPointsController(100);
    const { result } = renderHook(() => usePlayerStats({ healthPointsController }));

    act(() => healthPointsController.inflictDamage(30));
    expect(result.current).toEqual({ currentHealthPoints: 70 });

    act(() => healthPointsController.healDamage(10));
    expect(result.current).toEqual({ currentHealthPoints: 80 });

    act(() => healthPointsController.inflictDamage(200));
    expect(result.current).toEqual({ currentHealthPoints: 0 });
  });

  it('keeps the same object reference when nothing changed', () => {
    const healthPointsController = createHealthPointsController(100);
    const { result, rerender } = renderHook(() => usePlayerStats({ healthPointsController }));
    const firstResult = result.current;

    rerender();

    expect(result.current).toBe(firstResult);
  });

  it('switches to a new controller when it changes', () => {
    const first = createHealthPointsController(100);
    const second = createHealthPointsController(50);
    const { result, rerender } = renderHook(
      ({ controller }) => usePlayerStats({ healthPointsController: controller }),
      { initialProps: { controller: first } }
    );

    rerender({ controller: second });
    act(() => first.inflictDamage(10));
    expect(result.current).toEqual({ currentHealthPoints: 50 });

    act(() => second.inflictDamage(10));
    expect(result.current).toEqual({ currentHealthPoints: 40 });
  });

  it('unsubscribes on unmount', () => {
    const healthPointsController = createHealthPointsController(100);
    const offSpy = vi.spyOn(healthPointsController.events, 'off');
    const { unmount } = renderHook(() => usePlayerStats({ healthPointsController }));

    unmount();

    expect(offSpy).toHaveBeenCalledWith('damagetaken', expect.any(Function));
    expect(offSpy).toHaveBeenCalledWith('heal', expect.any(Function));
    expect(offSpy).toHaveBeenCalledWith('death', expect.any(Function));
  });
});
