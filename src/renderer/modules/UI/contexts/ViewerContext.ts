import { createContext, useContext } from 'react';
import { assert, type PlayerInputBinding } from '@tgdf';

import { Player } from '3D/classes/gameObjects/Player/Player';
import { OrtographicCamera } from '3D/classes/cameras/OrtographicCamera/OrtographicCamera';

export type ViewerContextValue = {
  player: Player;
  inputType: PlayerInputBinding['type'];
  camera: OrtographicCamera;
};

export const ViewerContext = createContext<ViewerContextValue | null>(null);

export const ViewerContextMockValue: ViewerContextValue = {
  player: {} as Player,
  inputType: 'keyboard',
  camera: {} as OrtographicCamera,
};

export function useViewerContext(): ViewerContextValue {
  const context = useContext(ViewerContext);
  assert(context !== null, 'useViewerContext must be used within a ViewerContext provider');
  return context;
}
