import { GameObject, GameObjectConstructorOptions } from '@tgdf';

import { GameScene } from '../scenes/GameScene/GameScene';

export type GameSceneObjectConstructorOptions = GameObjectConstructorOptions & {
  scene: GameScene;
};

export class GameSceneObject extends GameObject {
  constructor({ scene }: GameSceneObjectConstructorOptions) {
    super({ scene });
  }

  public get scene(): GameScene {
    return super.scene as GameScene;
  }
}
