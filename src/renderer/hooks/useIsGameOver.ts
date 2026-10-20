import { useEffect, useState } from 'react';

import { GameEventsEmitter } from 'renderer/types';

export function useIsGameOver(emitter: GameEventsEmitter): boolean {
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    const handleGameOver = () => {
      setIsGameOver(true);
    };
    emitter.once('game-over', handleGameOver);

    return () => {
      emitter.off('game-over', handleGameOver);
    };
  }, [emitter]);

  return isGameOver;
}
