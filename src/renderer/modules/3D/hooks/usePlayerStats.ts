import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { PlayerStatistics } from 'renderer/types';
import { Player } from '3D/classes/gameObjects/Player/Player';

export type UsePlayerStatsParams = {
  player?: Player;
};

export function usePlayerStats({ player }: UsePlayerStatsParams): PlayerStatistics | null {
  const subscribeToHealth = useCallback(
    (onChange: () => void) => {
      if (!player) {
        return () => {};
      }

      const { events } = player.healthPointsController;
      events.on('damagetaken', onChange);
      events.on('heal', onChange);
      events.on('death', onChange);

      return () => {
        events.off('damagetaken', onChange);
        events.off('heal', onChange);
        events.off('death', onChange);
      };
    },
    [player]
  );

  const subscribeToShortTermStamina = useCallback(
    (onChange: () => void) => {
      if (!player) {
        return () => {};
      }

      const { events } = player.staminaPointsController;
      events.on('short-term-stamina-change', onChange);

      return () => {
        events.off('short-term-stamina-change', onChange);
      };
    },
    [player]
  );

  const subscribeToLongTermStamina = useCallback(
    (onChange: () => void) => {
      if (!player) {
        return () => {};
      }

      const { events } = player.staminaPointsController;
      events.on('long-term-stamina-change', onChange);

      return () => {
        events.off('long-term-stamina-change', onChange);
      };
    },
    [player]
  );

  const subscribeToMaxShortTermStamina = useCallback(
    (onChange: () => void) => {
      if (!player) {
        return () => {};
      }

      const { events } = player.staminaPointsController;
      events.on('max-short-term-stamina-change', onChange);

      return () => {
        events.off('max-short-term-stamina-change', onChange);
      };
    },
    [player]
  );

  const subscribeToMaxLongTermStamina = useCallback(
    (onChange: () => void) => {
      if (!player) {
        return () => {};
      }

      const { events } = player.staminaPointsController;
      events.on('max-long-term-stamina-change', onChange);

      return () => {
        events.off('max-long-term-stamina-change', onChange);
      };
    },
    [player]
  );

  const currentHealthPoints = useSyncExternalStore(
    subscribeToHealth,
    () => player?.healthPointsController?.healthPoints ?? null
  );

  const currentShortTermStamina = useSyncExternalStore(subscribeToShortTermStamina, () =>
    player ? Math.round(player.staminaPointsController.shortTermStamina) : null
  );

  const currentLongTermStamina = useSyncExternalStore(subscribeToLongTermStamina, () =>
    player ? Math.round(player.staminaPointsController.longTermStamina) : null
  );

  const maxShortTermStamina = useSyncExternalStore(subscribeToMaxShortTermStamina, () =>
    player ? Math.round(player.staminaPointsController.maxShortTermStamina) : null
  );

  const maxLongTermStamina = useSyncExternalStore(subscribeToMaxLongTermStamina, () =>
    player ? Math.round(player.staminaPointsController.maxLongTermStamina) : null
  );

  return useMemo(
    () =>
      currentHealthPoints === null ||
      currentShortTermStamina === null ||
      currentLongTermStamina === null ||
      maxShortTermStamina === null ||
      maxLongTermStamina === null ||
      !player
        ? null
        : {
            name: player.name,
            currentHealthPoints,
            maxHealthPoints: player.healthPointsController.maxHealthPoints,
            currentShortTermStamina,
            currentLongTermStamina,
            maxShortTermStamina,
            maxLongTermStamina,
          },
    [
      currentHealthPoints,
      currentShortTermStamina,
      currentLongTermStamina,
      maxShortTermStamina,
      maxLongTermStamina,
      player,
    ]
  );
}
