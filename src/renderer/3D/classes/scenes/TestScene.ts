import * as THREE from 'three';
import { assert, AssetRecord } from '@tgdf';

import { LevelRecord } from 'renderer/3D/types';
import { MODELS, SPAWN_MARKER_NAME, TEXTURES } from 'renderer/3D/constants';
import { GENERATED_LEVEL_GROUP_NAME } from 'renderer/3D/utils/generateChunkedLevel';

import { GameScene } from './GameScene/GameScene';
//import { Monk } from '../gameObjects/players/Monk/Monk';
import { OrtographicCameraOptions } from '../cameras/OrtographicCamera';
import { FreeOrtographicCamera } from '../cameras/FreeOrtographicCamera';

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

  protected override createCamera(options: OrtographicCameraOptions): FreeOrtographicCamera {
    return new FreeOrtographicCamera(options);
  }

  constructor() {
    super();

    this.background = new THREE.Color(0x080808);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    this.add(directionalLight);
  }

  protected override onInit(): void {
    const levelGroup = this.getObjectByName(GENERATED_LEVEL_GROUP_NAME);
    assert(levelGroup !== undefined, 'Generated level group not found in scene');

    this.camera.setZoom(0.75);

    const marker = levelGroup.getObjectByName(SPAWN_MARKER_NAME);

    if (marker !== undefined) {
      /* const monk = new Monk(this);
      const { x, z } = marker.position;
      monk.position.set(x, 1, z);
      this.add(monk);
      this.camera.follow(monk); */
      this.camera.moveTo(marker.position);
    }
  }
}
