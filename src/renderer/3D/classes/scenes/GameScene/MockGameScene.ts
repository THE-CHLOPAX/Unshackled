import { AssetRecord, Emitter } from '@tgdf';

import { GameEventsMap } from 'renderer/types';

import { GameScene, GameSceneOptions } from './GameScene';

export class MockGameScene extends GameScene {
  public readonly preloadedAssets: AssetRecord[] = [];

  constructor(options?: Partial<GameSceneOptions>) {
    super({ emitter: new Emitter<GameEventsMap>(), ...options });
  }
}
