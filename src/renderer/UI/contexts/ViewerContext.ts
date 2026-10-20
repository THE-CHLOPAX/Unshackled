import type { PlayerInputBinding } from '@tgdf';

import { createContext, useContext } from 'react';

import { Player } from '3D/classes/gameObjects/players/Player';
import { OrtographicCamera } from '3D/classes/cameras/OrtographicCamera';

export type ViewerContextValue = {
  player: Player;
  inputType: PlayerInputBinding['type'];
  camera: OrtographicCamera;
};

export const ViewerContext = createContext<ViewerContextValue | null>(null);

export function useViewerContext(): ViewerContextValue | null {
  return useContext(ViewerContext);
}
