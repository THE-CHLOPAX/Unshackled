import { InputState } from '@tgdf';

import { PlayerActionType, StateNode } from 'renderer/3D/types';
import { mapInputToControls } from 'renderer/3D/utils/mapInputToControls';

export type StateTransition =
  | [PlayerActionType, () => StateNode]
  | [PlayerActionType, () => StateNode, boolean];

export function getInputBasedStateNode(
  input: InputState,
  transitions: StateTransition[]
): StateNode | null {
  const controlsStates = mapInputToControls(input);
  for (const [actionType, newStateNodeFactory, additionalCondition] of transitions) {
    const additionalConditionResolved =
      additionalCondition === undefined || additionalCondition === true;
    if (
      controlsStates.some(
        (controlState) => controlState.type === actionType && additionalConditionResolved
      )
    ) {
      return newStateNodeFactory();
    }
  }
  return null;
}
