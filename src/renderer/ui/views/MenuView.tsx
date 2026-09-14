import { useViewsStore, InternalButton, InternalFlex, ipc } from '@tgdf';

import * as views from '../views';
import { GRADIENTS } from '../../constants';

const VIEW_LABELS: Partial<Record<keyof typeof views, string>> = {
  GameView: 'Play',
};

const PRIORITY_VIEWS: (keyof typeof views)[] = ['GameView'];

const ORDERED_VIEW_NAMES = [
  ...PRIORITY_VIEWS,
  ...Object.keys(views).filter(
    (viewName) => !PRIORITY_VIEWS.includes(viewName as keyof typeof views)
  ),
];

export function MenuView() {
  const { setView } = useViewsStore();

  return (
    <InternalFlex
      direction="column"
      align="center"
      justify="center"
      style={{ height: '100vh', gap: '20px', background: GRADIENTS.BACKGROUND }}
    >
      <InternalFlex direction="column" align="center" gap={10}>
        {ORDERED_VIEW_NAMES.map((viewName) => {
          if (viewName === 'MenuView' || viewName === 'LoadingView') return null; // Skip non-navigable views

          const label = VIEW_LABELS[viewName as keyof typeof views] ?? viewName;

          return (
            <InternalButton key={viewName} label={label} onClick={() => setView(viewName)} />
          );
        })}

        <InternalButton
          label="Quit"
          onClick={() => {
            ipc.send('app-quit-request', undefined);
          }}
        />
      </InternalFlex>
    </InternalFlex>
  );
}
