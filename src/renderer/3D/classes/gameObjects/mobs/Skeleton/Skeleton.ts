import { NavMesh, Crowd } from '@recast-navigation/core';

import { FMOD_EVENTS } from 'renderer/FMOD';

import { config } from './config';
import { EntityAI } from '../../EntityAI';
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

  protected override onAwake(): void {
    super.onAwake();
    this.fmodSoundController.playSound(FMOD_EVENTS.SKELETON_ATTACK, { volume: 0.5 });
  }
}
