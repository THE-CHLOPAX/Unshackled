import { NavMesh, Crowd } from '@recast-navigation/core';

import { EntityAI } from '3D/classes/gameObjects/EntityAI';
import { GameScene } from '3D/classes/scenes/GameScene/GameScene';
import { config } from '3D/classes/gameObjects/mobs/Skeleton/config';

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
