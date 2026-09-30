import { describe, it, expect, beforeEach } from 'vitest';

import {
  useOverlayStore,
  addOverlayEntry,
  updateOverlayEntry,
  removeOverlayEntry,
} from './useOverlayStore';

type TestBarProps = { progress: number; label?: string };

function TestBar(_props: TestBarProps) {
  return null;
}

describe('useOverlayStore', () => {
  beforeEach(() => {
    useOverlayStore.setState({ entries: new Map() });
  });

  describe('addOverlayEntry', () => {
    it('adds a new entry with the given id, component and props', () => {
      addOverlayEntry('boss-hp', TestBar, { progress: 0.5 });

      expect(useOverlayStore.getState().entries.get('boss-hp')).toEqual({
        id: 'boss-hp',
        Component: TestBar,
        props: { progress: 0.5 },
      });
    });

    it('does not affect other existing entries', () => {
      addOverlayEntry('a', TestBar, { progress: 1 });
      const entryA = useOverlayStore.getState().entries.get('a');

      addOverlayEntry('b', TestBar, { progress: 0 });

      expect(useOverlayStore.getState().entries.get('a')).toBe(entryA);
      expect(useOverlayStore.getState().entries.size).toBe(2);
    });
  });

  describe('updateOverlayEntry', () => {
    it('shallow merges the given props into the existing entry', () => {
      addOverlayEntry('boss-hp', TestBar, { progress: 0.5, label: 'Boss' });

      updateOverlayEntry('boss-hp', { progress: 0.25 });

      expect(useOverlayStore.getState().entries.get('boss-hp')?.props).toEqual({
        progress: 0.25,
        label: 'Boss',
      });
    });

    it('does not change the reference of unrelated entries', () => {
      addOverlayEntry('a', TestBar, { progress: 1 });
      addOverlayEntry('b', TestBar, { progress: 1 });
      const entryB = useOverlayStore.getState().entries.get('b');

      updateOverlayEntry('a', { progress: 0.5 });

      expect(useOverlayStore.getState().entries.get('b')).toBe(entryB);
    });

    it('is a no-op when the id does not exist', () => {
      const entriesBefore = useOverlayStore.getState().entries;

      updateOverlayEntry('missing', { progress: 1 });

      expect(useOverlayStore.getState().entries).toBe(entriesBefore);
    });
  });

  describe('removeOverlayEntry', () => {
    it('removes the entry', () => {
      addOverlayEntry('boss-hp', TestBar, { progress: 1 });

      removeOverlayEntry('boss-hp');

      expect(useOverlayStore.getState().entries.has('boss-hp')).toBe(false);
    });

    it('does not affect other entries', () => {
      addOverlayEntry('a', TestBar, { progress: 1 });
      addOverlayEntry('b', TestBar, { progress: 1 });

      removeOverlayEntry('a');

      expect(useOverlayStore.getState().entries.has('b')).toBe(true);
    });

    it('is a no-op when the id does not exist', () => {
      const entriesBefore = useOverlayStore.getState().entries;

      removeOverlayEntry('missing');

      expect(useOverlayStore.getState().entries).toBe(entriesBefore);
    });
  });
});
