import { describe, it, expect, beforeEach } from 'vitest';

import { DEFAULT_VIEW, useViewsStore } from './useViewsStore';

describe('useViewsStore', () => {
  beforeEach(() => {
    useViewsStore.setState({
      currentView: DEFAULT_VIEW,
      currentViewProps: {},
      viewHistory: [DEFAULT_VIEW],
    });
  });

  it('starts on the InitialLoadView without props', () => {
    expect(DEFAULT_VIEW).toBe('InitialLoadView');
    expect(useViewsStore.getState().currentViewProps).toEqual({});
  });

  describe('setView', () => {
    it('switches to the view with the given props', () => {
      useViewsStore.getState().setView('MenuView', { reloadSaveFiles: true });

      const { currentView, currentViewProps, viewHistory } = useViewsStore.getState();
      expect(currentView).toBe('MenuView');
      expect(currentViewProps).toEqual({ reloadSaveFiles: true });
      expect(viewHistory).toEqual([DEFAULT_VIEW, 'MenuView']);
    });

    it('switches to the view with empty props when none are given', () => {
      useViewsStore.getState().setView('LoadGameView', { foo: 'bar' });

      useViewsStore.getState().setView('MenuView');

      expect(useViewsStore.getState().currentViewProps).toEqual({});
    });

    it('keeps the current props when switching to the view that is already current', () => {
      useViewsStore.getState().setView('MenuView', { reloadSaveFiles: true });

      useViewsStore.getState().setView('MenuView');

      expect(useViewsStore.getState().currentViewProps).toEqual({ reloadSaveFiles: true });
    });
  });

  describe('goBack', () => {
    it('returns to the previous view without props', () => {
      useViewsStore.getState().setView('MenuView');
      useViewsStore.getState().setView('GameView', { foo: 'bar' });

      useViewsStore.getState().goBack();

      const { currentView, currentViewProps } = useViewsStore.getState();
      expect(currentView).toBe('MenuView');
      expect(currentViewProps).toEqual({});
    });
  });
});
