import type { ComponentType } from 'react';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type OverlayEntry = {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: ComponentType<any>;
  props: Record<string, unknown>;
};

export type OverlayState = {
  entries: Map<string, OverlayEntry>;
};

export const useOverlayStore = create<OverlayState>()(
  devtools(
    () => ({
      entries: new Map(),
    }),
    { name: 'overlay-store' }
  )
);

// DOM nodes for each rendered overlay entry, keyed by id. Kept outside zustand's reactive
// state on purpose: entity positions are written into these nodes' styles directly, every
// throttled render-loop tick, and must never go through React state/re-renders.
export const overlayElementRefs = new Map<string, HTMLDivElement>();

// Cached size of the overlay container, kept updated by a ResizeObserver in BillboardOverlay.
// Every tracked BillboardRenderer instance reads this each throttled tick to convert NDC to
// pixel coordinates; caching it here means N billboards share one measurement per resize
// instead of each forcing its own synchronous layout read every tick.
export const overlayContainerSize = { width: 0, height: 0 };

export function addOverlayEntry<P extends object>(
  id: string,
  Component: ComponentType<P>,
  props: P
): void {
  const { entries } = useOverlayStore.getState();
  useOverlayStore.setState({
    entries: new Map(entries).set(id, {
      id,
      Component: Component as ComponentType<Record<string, unknown>>,
      props: props as Record<string, unknown>,
    }),
  });
}

export function updateOverlayEntry<P extends object>(id: string, props: Partial<P>): void {
  const { entries } = useOverlayStore.getState();
  const existing = entries.get(id);
  if (!existing) return;

  useOverlayStore.setState({
    entries: new Map(entries).set(id, {
      ...existing,
      props: { ...existing.props, ...props },
    }),
  });
}

export function removeOverlayEntry(id: string): void {
  const { entries } = useOverlayStore.getState();
  if (!entries.has(id)) return;

  const updatedEntries = new Map(entries);
  updatedEntries.delete(id);
  useOverlayStore.setState({ entries: updatedEntries });
}
