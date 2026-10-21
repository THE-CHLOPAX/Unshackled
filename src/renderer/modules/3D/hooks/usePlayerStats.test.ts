import { Mock } from 'moq.ts';
import { describe, it, expect, vi } from 'vitest';
import { Emitter, GameObjectEventMap } from '@tgdf';
import { act, renderHook } from '@testing-library/react';

import { Entity } from '3D/classes/gameObjects/Entity';
import { usePlayerStats } from '3D/hooks/usePlayerStats';
import { Player } from '3D/classes/gameObjects/players/Player';
import { HealthPointsController } from '3D/classes/gameObjectComponents/HealthPointsController';
import { StaminaPointsController } from '3D/classes/gameObjectComponents/StaminaPointsController';

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
  const staminaPointsController = new StaminaPointsController(entity, {
    maxLongTermStamina: 300,
    maxShortTermStamina: 100,
  });
  const player = { healthPointsController, staminaPointsController, name } as unknown as Player;

  return { player, healthPointsController, staminaPointsController };
}

describe('usePlayerStats', () => {
  it('returns null when there is no player', () => {
    const { result } = renderHook(() => usePlayerStats({}));

    expect(result.current).toBeNull();
  });

  it('returns the name, health and both stamina pools', () => {
    const { player, healthPointsController } = createPlayer(100);
    healthPointsController.setHealthPoints(40);

    const { result } = renderHook(() => usePlayerStats({ player }));

    expect(result.current).toEqual({
      name: 'Monk',
      currentHealthPoints: 40,
      maxHealthPoints: 100,
      currentShortTermStamina: 100,
      currentLongTermStamina: 300,
      maxShortTermStamina: 100,
      maxLongTermStamina: 300,
    });
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

  it('tracks short-term and long-term stamina separately', () => {
    const { player, staminaPointsController } = createPlayer();
    const { result } = renderHook(() => usePlayerStats({ player }));

    act(() => {
      staminaPointsController.drainShortTermStamina(40);
    });
    expect(result.current?.currentShortTermStamina).toBe(60);
    expect(result.current?.currentLongTermStamina).toBe(300);

    act(() => {
      staminaPointsController.drainLongTermStamina(50);
    });
    expect(result.current?.currentShortTermStamina).toBe(60);
    expect(result.current?.currentLongTermStamina).toBe(250);
  });

  it('rounds both stamina pools to whole points', () => {
    const { player, staminaPointsController } = createPlayer();
    const { result } = renderHook(() => usePlayerStats({ player }));

    act(() => {
      staminaPointsController.drainShortTermStamina(0.4);
      staminaPointsController.drainLongTermStamina(0.4);
    });
    expect(result.current?.currentShortTermStamina).toBe(100);
    expect(result.current?.currentLongTermStamina).toBe(300);

    act(() => {
      staminaPointsController.drainShortTermStamina(0.2);
      staminaPointsController.drainLongTermStamina(0.2);
    });
    expect(result.current?.currentShortTermStamina).toBe(99);
    expect(result.current?.currentLongTermStamina).toBe(299);
  });

  it('updates when the stamina maximums change', () => {
    const { player, staminaPointsController } = createPlayer();
    const { result } = renderHook(() => usePlayerStats({ player }));

    act(() => {
      staminaPointsController.setMaxShortTermStamina(120);
      staminaPointsController.setMaxLongTermStamina(400);
    });

    expect(result.current?.maxShortTermStamina).toBe(120);
    expect(result.current?.maxLongTermStamina).toBe(400);
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
