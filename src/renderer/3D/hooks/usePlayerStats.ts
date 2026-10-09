import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { PlayerStatistics } from 'renderer/types';

import { HealthPointsController } from '../classes/gameObjectComponents/HealthPointsController';

export type UsePlayerStatsParams = {
  healthPointsController: HealthPointsController | null;
};

export function usePlayerStats({
  healthPointsController,
}: UsePlayerStatsParams): PlayerStatistics | null {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!healthPointsController) {
        return () => {};
      }

      const { events } = healthPointsController;
      events.on('damagetaken', onChange);
      events.on('heal', onChange);
      events.on('death', onChange);

      return () => {
        events.off('damagetaken', onChange);
        events.off('heal', onChange);
        events.off('death', onChange);
      };
    },
    [healthPointsController]
  );

  const currentHealthPoints = useSyncExternalStore(
    subscribe,
    () => healthPointsController?.healthPoints ?? null
  );

  return useMemo(
    () => (currentHealthPoints === null ? null : { currentHealthPoints }),
    [currentHealthPoints]
  );
}
