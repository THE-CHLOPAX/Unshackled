import { AssetRecord } from '@tgdf';

import { GameScene } from './GameScene';

export class MockGameScene extends GameScene {
  public readonly preloadedAssets: AssetRecord[] = [];
}
