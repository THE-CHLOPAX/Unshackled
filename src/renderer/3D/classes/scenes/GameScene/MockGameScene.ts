import { AssetRecord } from '@tgdf';

import { LevelRecord } from '3D/types';

import { GameScene } from './GameScene';

export class MockGameScene extends GameScene {
  public readonly levelVariants: LevelRecord[] = [];
  public readonly preloadedAssets: AssetRecord[] = [];
}
