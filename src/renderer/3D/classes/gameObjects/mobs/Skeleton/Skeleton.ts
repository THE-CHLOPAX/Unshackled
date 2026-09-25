import { MAIN_SOUND_CHANNEL } from '@tgdf';
import { NavMesh, Crowd } from '@recast-navigation/core';

import { FMOD_EVENTS, FMODAudio } from 'renderer/FMOD';

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
    FMODAudio.playEventInSoundChannel({
      eventPath: FMOD_EVENTS.SKELETON_ATTACK,
      channelId: MAIN_SOUND_CHANNEL,
      options: {
        volume: 0.5,
      },
    });
  }

  protected override onDeath(): void {
    FMODAudio.playEventInSoundChannel({
      eventPath: FMOD_EVENTS.SKELETON_ATTACK,
      channelId: MAIN_SOUND_CHANNEL,
      options: {
        volume: 0.5,
      },
    });
  }
}
