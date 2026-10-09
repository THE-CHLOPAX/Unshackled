import { PlayerClassId } from 'renderer/types';

import { EntityOptions } from '../Entity';
import { config as monkConfig } from './Monk/config';

export const PLAYER_CLASS_CONFIGS: Record<PlayerClassId, EntityOptions> = {
  monk: monkConfig,
};
