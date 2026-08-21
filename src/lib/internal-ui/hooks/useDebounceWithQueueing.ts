import { flushSync } from 'react-dom';
import { useEffect, useRef, useState } from 'react';

/**
 * Hook that debounces a value by delaying updates until after a specified delay, but
 * it doesn't reset the timeout after each update, so the value gets updated N times, where
 * N is the total amount of updates including ones which happenned within the delay period.
 *
 * Useful for debouncing values which update frequently in short intervals, when we want to
 * exactly track each individual updated value in the update sequence.
 *
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 500ms)
 * @returns The debounced value
 */
export function useDebounceWithQueueing<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Set up the timeout to update debounced value after delay
    const timeoutId = setTimeout(() => {
      // flushSync forces a synchronous commit per timeout so that timeouts firing within
      // the same tick (e.g. throttled background timers draining several at once) each
      // still produce their own render, instead of React batching them into one update
      // and silently dropping every value but the last.
      flushSync(() => {
        setDebouncedValue(value);
      });
    }, delay);

    // Push it to ids ref array
    timeoutIdsRef.current.push(timeoutId);
  }, [value, delay]);

  useEffect(() => {
    // Clear timeouts only on unmount
    return () => {
      timeoutIdsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, []);

  return debouncedValue;
}
