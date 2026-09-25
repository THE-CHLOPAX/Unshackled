import { StateNode } from '3D/types';

import { DeadState } from '../DeadState';

export const deadStateNode: StateNode<DeadState> = {
  state: (entity) => new DeadState(entity),
};
