import { PlayerInput } from '@tgdf';

import { config } from './config';
import { Player } from '../Player';
import { GameScene } from '../../../scenes/GameScene/GameScene';

export type MonkOptions = {
  playerProfileId: string;
  inputSource?: PlayerInput;
};

export class Monk extends Player {
  constructor(scene: GameScene, options: MonkOptions) {
    super(scene, {
      ...config,
      playerProfileId: options.playerProfileId,
      inputSource: options.inputSource,
    });
  }
}
