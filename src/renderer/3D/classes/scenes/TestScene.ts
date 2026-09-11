import * as THREE from 'three';
import { AssetRecord } from '@tgdf';

import { LevelRecord } from 'renderer/3D/types';
import { getModelClone } from 'renderer/3D/utils/getModelClone';
import { MODELS, SPAWN_MARKER_NAME, TEXTURES } from 'renderer/3D/constants';

import { GameScene } from './GameScene/GameScene';
import { Monk } from '../gameObjects/players/Monk/Monk';
import { OrtographicCameraOptions } from '../cameras/OrtographicCamera';
import { FreeOrtographicCamera } from '../cameras/FreeOrtographicCamera';
import { WarmupFactory } from './GameScene/ShadersManager/ShadersManager';

export class TestScene extends GameScene {
  public readonly levelVariants: LevelRecord[] = [{ url: 'test.json' }];

  public readonly preloadedAssets: AssetRecord[] = [
    MODELS.MONK,
    MODELS.SKELETON,
    TEXTURES.EXPLOSION,
    TEXTURES.ARCANE_CIRCLE,
    MODELS.DUNGEON_FLOOR,
    MODELS.DUNGEON_PILLAR,
    MODELS.DUNGEON_PLINTH,
    MODELS.DUNGEON_WALL_BRICK_TALL,
    MODELS.DUNGEON_WALL_TORCH,
    MODELS.DUNGEON_DOOR_FRAME,
    MODELS.DUNGEON_DOOR,
  ];

  protected override additionalWarmupFactories: WarmupFactory[] = [
    () => getModelClone(MODELS.MONK.id),
    () => getModelClone(MODELS.SKELETON.id),
  ];

  /* protected override createCamera(options: OrtographicCameraOptions): FreeOrtographicCamera {
    return new FreeOrtographicCamera(options);
  } */

  constructor() {
    super();

    this.background = new THREE.Color(0x0a0a0a);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    this.add(directionalLight);
  }

  protected override onInit(): void {
    const marker = this.getObjectByName(SPAWN_MARKER_NAME);

    if (marker !== undefined) {
      const { x, z } = marker.position;
      const monk = new Monk(this);
      monk.position.set(x, 1, z);
      this.add(monk);
      this.camera.follow(monk);
      //this.camera.moveTo(marker.position);
    }
  }
}
