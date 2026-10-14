import { useEffect, useRef, useState } from 'react';

const DEFAULT_VISIBLE_DURATION_MS = 500;

export type ProgressChange = {
  delta: number;
};

export type RecentProgressChange = {
  recentChange: number;
  recentChangeFading: boolean;
  lastChange: ProgressChange | null;
};

export type UseRecentProgressChangeOptions = {
  initialProgress?: number;
  visibleDurationMs?: number;
};

export function useRecentProgressChange(
  progress: number,
  {
    initialProgress = progress,
    visibleDurationMs = DEFAULT_VISIBLE_DURATION_MS,
  }: UseRecentProgressChangeOptions = {}
): RecentProgressChange {
  const lastProgress = useRef(initialProgress);
  const [recentProgressChange, setRecentProgressChange] = useState<RecentProgressChange>({
    recentChange: 0,
    recentChangeFading: false,
    lastChange: null,
  });

  useEffect(() => {
    const delta = lastProgress.current - progress;
    lastProgress.current = progress;

    if (delta !== 0) {
      setRecentProgressChange((current) => ({
        recentChange: current.recentChange + delta,
        recentChangeFading: false,
        lastChange: { delta },
      }));
    }
  }, [progress]);

  const { recentChange, recentChangeFading } = recentProgressChange;

  useEffect(() => {
    if (recentChange === 0 || recentChangeFading) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setRecentProgressChange((current) => ({
        ...current,
        recentChange: 0,
        recentChangeFading: true,
      }));
    }, visibleDurationMs);

    return () => clearTimeout(timeoutId);
  }, [recentChange, recentChangeFading, visibleDurationMs]);

  return recentProgressChange;
}
