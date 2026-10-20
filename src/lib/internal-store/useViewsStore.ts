import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type ViewProps = Record<string, unknown>;

export type ViewsState = {
  currentView: string;
  currentViewProps: ViewProps;
  viewHistory: string[];
  viewPaused: boolean;
  goBack: () => void;
  setView: (view: string, props?: ViewProps) => void;
  setViewPaused: (paused: boolean) => void;
  registerView: (id: string, element: React.JSX.Element) => void;
  clearHistory: () => void;
};

const MAX_HISTORY_SIZE = 5;

export const DEFAULT_VIEW = 'InitialLoadView';

const EMPTY_VIEW_PROPS: ViewProps = {};

export const useViewsStore = create<ViewsState>()(
  devtools(
    (set, get) => ({
      currentView: DEFAULT_VIEW,
      currentViewProps: EMPTY_VIEW_PROPS,
      viewHistory: [DEFAULT_VIEW],
      viewPaused: false,
      views: [],

      setView: (id: string, props: ViewProps = EMPTY_VIEW_PROPS) => {
        const { currentView, viewHistory } = get();
        // Don't change if already on this view
        if (currentView === id) return;
        // Add to history
        let newHistory = [...viewHistory, id];

        // Limit history size to MAX_HISTORY_SIZE
        if (newHistory.length > MAX_HISTORY_SIZE) {
          newHistory = newHistory.slice(newHistory.length - MAX_HISTORY_SIZE);
        }

        set({
          currentView: id,
          currentViewProps: props,
          viewHistory: newHistory,
        });
      },
      setViewPaused: (paused: boolean) => {
        set({
          viewPaused: paused,
        });
      },
      clearHistory: () => {
        const { currentView } = get();
        set({ viewHistory: [currentView] });
      },
      goBack: () => {
        const { viewHistory } = get();

        if (viewHistory.length <= 1) return; // Can't go back

        const previousView = viewHistory[viewHistory.length - 2];
        const newHistory = [...viewHistory, previousView];

        set({
          currentView: previousView,
          currentViewProps: EMPTY_VIEW_PROPS,
          viewHistory: newHistory,
        });
      },
    }),
    {
      name: 'views-store',
    }
  )
);

export const useCurrentView = () => useViewsStore((state) => state.currentView);
export const useCurrentViewProps = () => useViewsStore((state) => state.currentViewProps);
export const useViewHistory = () => useViewsStore((state) => state.viewHistory);
