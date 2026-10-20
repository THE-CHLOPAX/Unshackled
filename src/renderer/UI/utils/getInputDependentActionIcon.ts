import { ReactNode } from 'react';
import { PlayerInputBinding } from '@tgdf';

import { PlayerActionType } from 'renderer/types';

import { PLAYER_ACTION_TO_ICON_MAPPING } from '../constants';

export const getInputDependentActionIcon = (
  action: PlayerActionType,
  inputType: PlayerInputBinding['type']
): ReactNode => {
  return PLAYER_ACTION_TO_ICON_MAPPING[inputType][action];
};
