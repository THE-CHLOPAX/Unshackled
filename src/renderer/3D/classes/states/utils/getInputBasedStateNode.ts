import { PlayerActionType, StateNode } from 'renderer/3D/types';
import { PlayerActionEvent } from 'renderer/3D/classes/gameObjects/players/PlayerRegisterableInputSource';

export type StateTransition =
  | [PlayerActionType, () => StateNode]
  | [PlayerActionType, () => StateNode, boolean];

export function getInputBasedStateNode(
  controlsStates: PlayerActionEvent[],
  transitions: StateTransition[]
): StateNode | null {
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
