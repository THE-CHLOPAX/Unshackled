import { useEffect } from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useDebounceWithQueueing } from './useDebounceWithQueueing';

describe('useDebounceWithQueueing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounceWithQueueing('initial', 500));

    expect(result.current).toBe('initial');
  });

  it('does not update the value before the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounceWithQueueing(value, 500), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    act(() => {
      vi.advanceTimersByTime(499);
    });

    expect(result.current).toBe('a');
  });

  it('updates to the latest value after the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounceWithQueueing(value, 500), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('b');
  });

  it('fires an update for every value in a fast sequence instead of only the last one', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounceWithQueueing(value, 500), {
      initialProps: { value: 0 },
    });

    // Simulate rapid updates arriving faster than the delay, each scheduling its own timeout.
    rerender({ value: 1 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: 2 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: 3 });

    // None of the queued timeouts have elapsed yet.
    expect(result.current).toBe(0);

    // First queued update (for value 1) fires 500ms after it was scheduled.
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe(1);

    // Second queued update (for value 2) fires next.
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe(2);

    // Third queued update (for value 3) fires last.
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe(3);
  });

  it('captures every intermediate value even when several timeouts become due within the same tick', () => {
    // Reproduces the scenario from the live app: several timeouts scheduled close together
    // end up firing back-to-back within the same synchronous flush (e.g. throttled timers
    // draining several expired callbacks at once). React batches raw setState calls made
    // in the same tick, so without forcing a synchronous commit per update, only the last
    // value in the batch survives and earlier ones (e.g. 0.2, 0.4) are silently dropped.
    const history: number[] = [];

    const { rerender } = renderHook(
      ({ value }) => {
        const debounced = useDebounceWithQueueing(value, 500);
        useEffect(() => {
          history.push(debounced);
        }, [debounced]);
        return debounced;
      },
      { initialProps: { value: 0 } },
    );

    rerender({ value: 1 });
    act(() => {
      vi.advanceTimersByTime(10);
    });
    rerender({ value: 2 });
    act(() => {
      vi.advanceTimersByTime(10);
    });
    rerender({ value: 3 });

    // All three queued timeouts (for 1, 2 and 3) become due within this single advance,
    // so their callbacks run back-to-back in one synchronous flush.
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(history).toEqual([0, 1, 2, 3]);
  });

  it('clears all pending timeouts on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { rerender, unmount } = renderHook(({ value }) => useDebounceWithQueueing(value, 500), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    rerender({ value: 'c' });

    expect(clearTimeoutSpy).not.toHaveBeenCalled();

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(3);
  });

  it('does not clear timeouts on every rerender, only on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { rerender } = renderHook(({ value }) => useDebounceWithQueueing(value, 500), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    rerender({ value: 'c' });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(clearTimeoutSpy).not.toHaveBeenCalled();
  });
});
