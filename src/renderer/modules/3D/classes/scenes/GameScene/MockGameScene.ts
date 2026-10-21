import { AssetRecord, Emitter } from '@tgdf';

import { GameEventsMap } from 'renderer/types';
import { GameScene, GameSceneOptions } from '3D/classes/scenes/GameScene/GameScene';

export class MockGameScene extends GameScene {
  public readonly preloadedAssets: AssetRecord[] = [];

  constructor(options?: Partial<GameSceneOptions>) {
    super({ emitter: new Emitter<GameEventsMap>(), ...options });
  }
}
