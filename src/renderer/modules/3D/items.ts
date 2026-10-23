import { EquipmentItemRecord } from 'renderer/types';

import { MODELS } from './constants';

export const ITEMS = {
  Rock: {
    id: 'Rock',
    name: 'Rock',
    description: 'A simple rock.',
    modelOptions: {
      id: MODELS.ROCK.id,
    },
  },
} satisfies Record<string, EquipmentItemRecord>;
