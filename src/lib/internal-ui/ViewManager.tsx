import React from 'react';
import { useCurrentView, useCurrentViewProps } from '@tgdf';

type ViewManagerProps = {
  views: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: React.ComponentType<any>;
  };
};

export function ViewManager({ views }: ViewManagerProps) {
  const currentView = useCurrentView();
  const currentViewProps = useCurrentViewProps();

  // Get the component for the current view
  const ViewComponent = views[currentView];

  if (!ViewComponent) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <p>View not found: {currentView}</p>
      </div>
    );
  }

  return (
    <>
      <ViewComponent {...currentViewProps} />
    </>
  );
}
