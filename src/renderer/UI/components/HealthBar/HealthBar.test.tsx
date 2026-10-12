import { act, render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { Entity } from '3D/classes/gameObjects/Entity';

import { HealthBar } from './HealthBar';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

const entity = {
  name: 'Skeleton',
  healthPointsController: { maxHealthPoints: 100 },
} as unknown as Entity;

function getFloatingNumbers(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('span'))
    .map((element) => element.textContent ?? '')
    .filter((text) => /^\d+$/.test(text));
}

describe('HealthBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the first hit measured from initialProgress', () => {
    const { container } = render(
      <HealthBar entity={entity} progress={0.7} initialProgress={1} />
    );

    expect(getFloatingNumbers(container)).toEqual(['30']);
  });

  it('shows no number when mounted without a change', () => {
    const { container } = render(<HealthBar entity={entity} progress={0.7} />);

    expect(getFloatingNumbers(container)).toEqual([]);
  });

  it('shows a number for every hit, including equal consecutive ones', () => {
    const { container, rerender } = render(
      <HealthBar entity={entity} progress={0.9} initialProgress={1} />
    );

    rerender(<HealthBar entity={entity} progress={0.8} initialProgress={1} />);
    rerender(<HealthBar entity={entity} progress={0.7} initialProgress={1} />);

    expect(getFloatingNumbers(container)).toEqual(['10', '10', '10']);
  });

  it('removes floating numbers after their animation', () => {
    const { container } = render(
      <HealthBar entity={entity} progress={0.7} initialProgress={1} />
    );

    act(() => vi.advanceTimersByTime(1000));

    expect(getFloatingNumbers(container)).toEqual([]);
  });
});
