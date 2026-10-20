import * as THREE from 'three';
import { act, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { BillboardView } from '3D/classes/scenes/GameScene/BillboardRegistry/BillboardView';
import { BillboardRegistry } from '3D/classes/scenes/GameScene/BillboardRegistry/BillboardRegistry';

import { BillboardLayer } from './BillboardLayer';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

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

function createPlacement() {
  return { target: new THREE.Object3D(), offset: new THREE.Vector3() };
}

describe('BillboardLayer', () => {
  let registry: BillboardRegistry;
  let view: BillboardView;

  beforeEach(() => {
    registry = new BillboardRegistry();
    view = new BillboardView(registry);

    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
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

  it('renders an empty layer when the registry is empty', () => {
    const { container } = render(<BillboardLayer view={view} />);

    expect(container.firstElementChild?.children.length).toBe(0);
  });

  it('renders entries that already existed before mounting', () => {
    registry.add('boss-hp', TestBar, { progress: 0.3 }, createPlacement());

    render(<BillboardLayer view={view} />);

    expect(screen.getByTestId('test-bar').textContent).toBe('0.3');
  });

  it('renders a registered entry using its component and props', () => {
    render(<BillboardLayer view={view} />);

    act(() => {
      registry.add('boss-hp', TestBar, { progress: 0.5 }, createPlacement());
    });

    expect(screen.getByTestId('test-bar').textContent).toBe('0.5');
  });

  it('sets the entry node on its own view on mount and unsets it when the entry is removed', () => {
    render(<BillboardLayer view={view} />);

    act(() => {
      registry.add('boss-hp', TestBar, { progress: 1 }, createPlacement());
    });

    expect(view.getNode('boss-hp')).toBeInstanceOf(HTMLDivElement);

    act(() => {
      registry.remove('boss-hp');
    });

    expect(view.getNode('boss-hp')).toBeUndefined();
  });

  it('attaches its view to the registry while mounted', () => {
    const { unmount } = render(<BillboardLayer view={view} />);
    act(() => {
      registry.add('boss-hp', TestBar, { progress: 1 }, createPlacement());
    });

    expect(registry.getElements('boss-hp')).toHaveLength(1);

    unmount();

    expect(registry.getElements('boss-hp')).toHaveLength(0);
  });

  it('keeps separate nodes per layer when several layers render the same registry', () => {
    const otherView = new BillboardView(registry);
    render(
      <>
        <BillboardLayer view={view} />
        <BillboardLayer view={otherView} />
      </>
    );

    act(() => {
      registry.add('boss-hp', TestBar, { progress: 1 }, createPlacement());
    });

    expect(screen.getAllByTestId('test-bar')).toHaveLength(2);
    expect(view.getNode('boss-hp')).not.toBe(otherView.getNode('boss-hp'));
    expect(registry.getElements('boss-hp')).toHaveLength(2);
  });

  it('measures its container into its view on mount', () => {
    const setSizeSpy = vi.spyOn(view, 'setSize');

    render(<BillboardLayer view={view} />);

    expect(setSizeSpy).toHaveBeenCalledWith(800, 600);
  });

  it('updating one entry does not re-render other entries', () => {
    const renderSpyA = vi.fn();
    const renderSpyB = vi.fn();

    render(<BillboardLayer view={view} />);

    act(() => {
      registry.add('a', TestBar, { progress: 0, renderSpy: renderSpyA }, createPlacement());
      registry.add('b', TestBar, { progress: 0, renderSpy: renderSpyB }, createPlacement());
    });

    renderSpyA.mockClear();
    renderSpyB.mockClear();

    act(() => {
      registry.update<TestBarProps>('a', { progress: 0.5 });
    });

    expect(renderSpyA).toHaveBeenCalledTimes(1);
    expect(renderSpyB).not.toHaveBeenCalled();
  });
});
