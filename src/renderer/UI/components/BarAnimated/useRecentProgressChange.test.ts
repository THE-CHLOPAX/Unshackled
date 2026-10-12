import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useRecentProgressChange } from './useRecentProgressChange';

describe('useRecentProgressChange', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderWithProgress(progress: number) {
    return renderHook(({ value }) => useRecentProgressChange(value, { visibleDurationMs: 500 }), {
      initialProps: { value: progress },
    });
  }

  it('starts with no recent change', () => {
    const { result } = renderWithProgress(1);

    expect(result.current).toEqual({ recentChange: 0, recentChangeFading: false });
  });

  it('accumulates consecutive decreases', () => {
    const { result, rerender } = renderWithProgress(1);

    rerender({ value: 0.7 });
    rerender({ value: 0.6 });

    expect(result.current.recentChange).toBeCloseTo(0.4);
    expect(result.current.recentChangeFading).toBe(false);
  });

  it('reports increases as a negative change', () => {
    const { result, rerender } = renderWithProgress(0.5);

    rerender({ value: 0.8 });

    expect(result.current.recentChange).toBeCloseTo(-0.3);
  });

  it('resets and starts fading after the visible duration', () => {
    const { result, rerender } = renderWithProgress(1);

    rerender({ value: 0.7 });
    act(() => vi.advanceTimersByTime(500));

    expect(result.current).toEqual({ recentChange: 0, recentChangeFading: true });
  });

  it('restarts the visible duration on every change', () => {
    const { result, rerender } = renderWithProgress(1);

    rerender({ value: 0.7 });
    act(() => vi.advanceTimersByTime(400));
    rerender({ value: 0.6 });
    act(() => vi.advanceTimersByTime(400));

    expect(result.current.recentChange).toBeCloseTo(0.4);

    act(() => vi.advanceTimersByTime(100));

    expect(result.current).toEqual({ recentChange: 0, recentChangeFading: true });
  });

  it('stops fading when a new change arrives', () => {
    const { result, rerender } = renderWithProgress(1);

    rerender({ value: 0.7 });
    act(() => vi.advanceTimersByTime(500));
    rerender({ value: 0.5 });

    expect(result.current.recentChange).toBeCloseTo(0.2);
    expect(result.current.recentChangeFading).toBe(false);
  });
});
