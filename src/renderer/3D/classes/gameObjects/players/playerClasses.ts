import { PlayerInput } from '@tgdf';

import { PlayerClassId } from 'renderer/types';

import { Player } from './Player';
import { Monk } from './Monk/Monk';
import { GameScene } from '../../scenes/GameScene/GameScene';

export type PlayerClassConstructor = new (
  scene: GameScene,
  options: { playerProfileId: string; inputSource?: PlayerInput }
) => Player;

export const PLAYER_CLASS_CONSTRUCTORS: Record<PlayerClassId, PlayerClassConstructor> = {
  monk: Monk,
};
