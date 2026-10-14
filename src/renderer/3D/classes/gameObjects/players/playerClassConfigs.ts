import { PlayerClassId } from 'renderer/types';

import { PlayerConfig } from './Player';
import { config as monkConfig } from './Monk/config';

export const PLAYER_CLASS_CONFIGS: Record<PlayerClassId, PlayerConfig> = {
  monk: monkConfig,
};
