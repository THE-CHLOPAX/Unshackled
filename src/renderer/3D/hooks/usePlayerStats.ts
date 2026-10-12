import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { PlayerStatistics } from 'renderer/types';

import { Player } from '../classes/gameObjects/players/Player';

export type UsePlayerStatsParams = {
  player?: Player;
};

export function usePlayerStats({ player }: UsePlayerStatsParams): PlayerStatistics | null {
  const subscribe = useCallback(
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

  const currentHealthPoints = useSyncExternalStore(
    subscribe,
    () => player?.healthPointsController?.healthPoints ?? null
  );

  return useMemo(
    () =>
      currentHealthPoints === null || !player
        ? null
        : {
            currentHealthPoints,
            maxHealthPoints: player.healthPointsController.maxHealthPoints,
            name: player.name,
          },
    [currentHealthPoints, player]
  );
}
