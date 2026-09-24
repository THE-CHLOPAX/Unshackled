import { PlayerInput } from '@tgdf';

import { config } from './config';
import { Player } from '../Player';
import { GameScene } from '../../../scenes/GameScene/GameScene';

export type MonkOptions = {
  inputSource?: PlayerInput;
};

export class Monk extends Player {
  constructor(scene: GameScene, options: MonkOptions = {}) {
    super(scene, { ...config, inputSource: options.inputSource });
  }
}
