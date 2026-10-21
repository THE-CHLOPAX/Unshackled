import { NavMesh, Crowd } from '@recast-navigation/core';

import { config } from '3D/classes/gameObjects/Skeleton/config';
import { GameScene } from '3D/classes/scenes/GameScene/GameScene';
import { EntityAI } from '3D/classes/gameObjects/EntityAI/EntityAI';

export class Skeleton extends EntityAI {
  constructor(
    scene: GameScene,
    public navMesh: NavMesh,
    public crowd: Crowd
  ) {
    super(scene, navMesh, crowd, config);

    this.name = 'Skeleton';
  }
}
