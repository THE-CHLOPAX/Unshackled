import { AssetRecord } from '@tgdf';

import { LevelRecord } from '../../types';
import { GameScene } from './GameScene/GameScene';
import { Monk } from '../gameObjects/players/Monk/Monk';
import { MODELS, SPAWNER_IDS, TEXTURES } from '../../constants';

export class DungeonLevelScene extends GameScene {
  public readonly levelVariants: LevelRecord[] = [];

  public readonly preloadedAssets: AssetRecord[] = [
    MODELS.MONK,
    MODELS.DUNGEON_DOOR,
    MODELS.DUNGEON_DOOR_FRAME,
    MODELS.DUNGEON_PILLAR,
    MODELS.DUNGEON_WALL_TORCH,
    MODELS.DUNGEON_WALL_BRICK_TALL,
    MODELS.DUNGEON_FLOOR,
    MODELS.DUNGEON_PLINTH,
    TEXTURES.ARCANE_CIRCLE,
    TEXTURES.EXPLOSION,
  ];

  protected override onInit(): void {
    const spawner = this.getObjectByName(SPAWNER_IDS.PLAYER);

    if (spawner) {
      const { x, z } = spawner.position;
      const monk = new Monk(this);
      monk.position.set(x, 1, z);
      this.add(monk);
      this.camera.follow(monk);
    }
  }
}
