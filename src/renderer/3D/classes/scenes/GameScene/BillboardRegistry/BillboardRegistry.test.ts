import * as THREE from 'three';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { BillboardView } from './BillboardView';
import { BillboardRegistry } from './BillboardRegistry';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

type TestBarProps = { progress: number; label?: string };

function TestBar(_props: TestBarProps) {
  return null;
}

function createPlacement() {
  return { target: new THREE.Object3D(), offset: new THREE.Vector3() };
}

describe('BillboardRegistry', () => {
  let registry: BillboardRegistry;

  beforeEach(() => {
    registry = new BillboardRegistry();
  });

  describe('add', () => {
    it('adds a new entry with the given id, component, props and placement', () => {
      const placement = createPlacement();

      registry.add('boss-hp', TestBar, { progress: 0.5 }, placement);

      expect(registry.get('boss-hp')).toEqual({
        id: 'boss-hp',
        Component: TestBar,
        props: { progress: 0.5 },
        ...placement,
      });
    });

    it('does not affect other existing entries', () => {
      registry.add('a', TestBar, { progress: 1 }, createPlacement());
      const entryA = registry.get('a');

      registry.add('b', TestBar, { progress: 0 }, createPlacement());

      expect(registry.get('a')).toBe(entryA);
      expect(registry.getSnapshot()).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('shallow merges the given props into the existing entry', () => {
      registry.add('boss-hp', TestBar, { progress: 0.5, label: 'Boss' }, createPlacement());

      registry.update<TestBarProps>('boss-hp', { progress: 0.25 });

      expect(registry.get('boss-hp')?.props).toEqual({ progress: 0.25, label: 'Boss' });
    });

    it('does not change the reference of unrelated entries', () => {
      registry.add('a', TestBar, { progress: 1 }, createPlacement());
      registry.add('b', TestBar, { progress: 1 }, createPlacement());
      const entryB = registry.get('b');

      registry.update<TestBarProps>('a', { progress: 0.5 });

      expect(registry.get('b')).toBe(entryB);
    });

    it('keeps the entry order when updating', () => {
      registry.add('a', TestBar, { progress: 1 }, createPlacement());
      registry.add('b', TestBar, { progress: 1 }, createPlacement());

      registry.update<TestBarProps>('a', { progress: 0.5 });

      expect(registry.getSnapshot().map(({ id }) => id)).toEqual(['a', 'b']);
    });

    it('is a no-op when the id does not exist', () => {
      const snapshotBefore = registry.getSnapshot();

      registry.update<TestBarProps>('missing', { progress: 1 });

      expect(registry.getSnapshot()).toBe(snapshotBefore);
    });
  });

  describe('remove', () => {
    it('removes the entry without affecting others', () => {
      registry.add('a', TestBar, { progress: 1 }, createPlacement());
      registry.add('b', TestBar, { progress: 1 }, createPlacement());

      registry.remove('a');

      expect(registry.has('a')).toBe(false);
      expect(registry.has('b')).toBe(true);
    });

    it('is a no-op when the id does not exist', () => {
      const snapshotBefore = registry.getSnapshot();

      registry.remove('missing');

      expect(registry.getSnapshot()).toBe(snapshotBefore);
    });
  });

  describe('clear', () => {
    it('removes every entry', () => {
      registry.add('a', TestBar, { progress: 1 }, createPlacement());
      registry.add('b', TestBar, { progress: 1 }, createPlacement());

      registry.clear();

      expect(registry.getSnapshot()).toHaveLength(0);
    });
  });

  describe('subscribe', () => {
    it('notifies listeners on every change and produces a new snapshot', () => {
      const listener = vi.fn();
      registry.subscribe(listener);

      const initialSnapshot = registry.getSnapshot();
      registry.add('a', TestBar, { progress: 1 }, createPlacement());
      registry.update<TestBarProps>('a', { progress: 0.5 });
      registry.remove('a');

      expect(listener).toHaveBeenCalledTimes(3);
      expect(registry.getSnapshot()).not.toBe(initialSnapshot);
    });

    it('stops notifying once unsubscribed', () => {
      const listener = vi.fn();
      const unsubscribe = registry.subscribe(listener);

      unsubscribe();
      registry.add('a', TestBar, { progress: 1 }, createPlacement());

      expect(listener).not.toHaveBeenCalled();
    });

    it('does not notify when nothing changed', () => {
      const listener = vi.fn();
      registry.subscribe(listener);

      registry.update<TestBarProps>('missing', { progress: 1 });
      registry.remove('missing');
      registry.clear();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('getElements', () => {
    it('collects the node for the id from every attached view', () => {
      const viewA = new BillboardView(registry);
      const viewB = new BillboardView(registry);
      viewA.attach();
      viewB.attach();
      const nodeA = document.createElement('div');
      const nodeB = document.createElement('div');
      viewA.setNode('boss-hp', nodeA);
      viewB.setNode('boss-hp', nodeB);

      expect(registry.getElements('boss-hp')).toEqual([nodeA, nodeB]);
    });

    it('skips views that have not mounted the node and views that were detached', () => {
      const mountedView = new BillboardView(registry);
      const unmountedView = new BillboardView(registry);
      const detachedView = new BillboardView(registry);
      [mountedView, unmountedView, detachedView].forEach((view) => view.attach());
      const node = document.createElement('div');
      mountedView.setNode('boss-hp', node);
      detachedView.setNode('boss-hp', document.createElement('div'));

      detachedView.detach();

      expect(registry.getElements('boss-hp')).toEqual([node]);
    });
  });
});
