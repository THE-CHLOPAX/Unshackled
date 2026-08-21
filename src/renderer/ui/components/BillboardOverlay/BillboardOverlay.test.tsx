import { act, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { BILLBOARD_OVERLAY_ELEMENT_ID } from 'renderer/constants';
import {
  useOverlayStore,
  addOverlayEntry,
  updateOverlayEntry,
  removeOverlayEntry,
  overlayElementRefs,
  overlayContainerSize,
} from 'renderer/store/useOverlayStore';

import { BillboardOverlay } from './BillboardOverlay';

type TestBarProps = { progress: number; renderSpy?: () => void };

function TestBar({ progress, renderSpy }: TestBarProps) {
  renderSpy?.();
  return <div data-testid="test-bar">{progress}</div>;
}

class ResizeObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

describe('BillboardOverlay', () => {
  beforeEach(() => {
    useOverlayStore.setState({ entries: new Map() });
    overlayElementRefs.clear();
    overlayContainerSize.width = 0;
    overlayContainerSize.height = 0;

    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    // jsdom always reports 0 for layout properties; stub them so the container-size
    // measurement (read from the real container node) is actually testable.
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      value: 600,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
    Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
  });

  it('renders the overlay container with no children when the store is empty', () => {
    const { container } = render(<BillboardOverlay />);

    const overlayEl = container.querySelector(`#${BILLBOARD_OVERLAY_ELEMENT_ID}`);
    expect(overlayEl).not.toBeNull();
    expect(overlayEl?.children.length).toBe(0);
  });

  it('renders a registered entry using its component and props', () => {
    render(<BillboardOverlay />);

    act(() => {
      addOverlayEntry('boss-hp', TestBar, { progress: 0.5 });
    });

    expect(screen.getByTestId('test-bar').textContent).toBe('0.5');
  });

  it('registers the entry element into overlayElementRefs on mount and removes it when the entry is removed', () => {
    render(<BillboardOverlay />);

    act(() => {
      addOverlayEntry('boss-hp', TestBar, { progress: 1 });
    });

    expect(overlayElementRefs.get('boss-hp')).toBeInstanceOf(HTMLDivElement);

    act(() => {
      removeOverlayEntry('boss-hp');
    });

    expect(overlayElementRefs.has('boss-hp')).toBe(false);
  });

  it('measures the container into overlayContainerSize on mount', () => {
    render(<BillboardOverlay />);

    expect(overlayContainerSize).toEqual({ width: 800, height: 600 });
  });

  it('updating one entry does not re-render other entries', () => {
    const renderSpyA = vi.fn();
    const renderSpyB = vi.fn();

    render(<BillboardOverlay />);

    act(() => {
      addOverlayEntry('a', TestBar, { progress: 0, renderSpy: renderSpyA });
      addOverlayEntry('b', TestBar, { progress: 0, renderSpy: renderSpyB });
    });

    renderSpyA.mockClear();
    renderSpyB.mockClear();

    act(() => {
      updateOverlayEntry('a', { progress: 0.5 });
    });

    expect(renderSpyA).toHaveBeenCalledTimes(1);
    expect(renderSpyB).not.toHaveBeenCalled();
  });
});
