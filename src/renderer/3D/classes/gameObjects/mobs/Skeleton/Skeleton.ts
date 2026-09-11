import { NavMesh, Crowd } from '@recast-navigation/core';

import { config } from './config';
import { EntityAI } from '../../EntityAI';
import { AIIdleState } from '../../../states';
import { GameScene } from '../../../scenes/GameScene/GameScene';

export class Skeleton extends EntityAI {
  constructor(
    scene: GameScene,
    public navMesh: NavMesh,
    public crowd: Crowd
  ) {
    super(scene, navMesh, crowd, config);

    this.name = 'Skeleton';
  }

  protected override onInit(): void {
    this.stateController.currentState = new AIIdleState(this);
  }
}
