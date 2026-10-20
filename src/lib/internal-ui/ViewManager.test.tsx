import { act, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ViewManager } from './ViewManager';
import { DEFAULT_VIEW, useViewsStore } from '../internal-store/useViewsStore';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

function GreetingView({ name = 'nobody' }: { name?: string }) {
  return <p>Hello {name}</p>;
}

const views = {
  [DEFAULT_VIEW]: () => <p>Initial</p>,
  GreetingView,
};

describe('ViewManager', () => {
  beforeEach(() => {
    useViewsStore.setState({
      currentView: DEFAULT_VIEW,
      currentViewProps: {},
      viewHistory: [DEFAULT_VIEW],
    });
  });

  it('renders the current view', () => {
    render(<ViewManager views={views} />);

    expect(screen.getByText('Initial')).toBeTruthy();
  });

  it('passes the props given to setView to the rendered view', () => {
    render(<ViewManager views={views} />);

    act(() => {
      useViewsStore.getState().setView('GreetingView', { name: 'Player 1' });
    });

    expect(screen.getByText('Hello Player 1')).toBeTruthy();
  });

  it('renders the view with its default props when setView is called without props', () => {
    render(<ViewManager views={views} />);

    act(() => {
      useViewsStore.getState().setView('GreetingView');
    });

    expect(screen.getByText('Hello nobody')).toBeTruthy();
  });

  it('renders a fallback when the current view is not registered', () => {
    useViewsStore.setState({ currentView: 'MissingView' });

    render(<ViewManager views={views} />);

    expect(screen.getByText('View not found: MissingView')).toBeTruthy();
  });
});
