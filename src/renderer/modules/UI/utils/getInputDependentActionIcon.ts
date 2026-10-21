import { ReactNode } from 'react';
import { PlayerInputBinding } from '@tgdf';

import { PlayerActionType } from 'renderer/types';
import { PLAYER_ACTION_TO_ICON_MAPPING } from 'UI/constants';

export const getInputDependentActionIcon = (
  action: PlayerActionType,
  inputType: PlayerInputBinding['type']
): ReactNode => {
  return PLAYER_ACTION_TO_ICON_MAPPING[inputType][action];
};
