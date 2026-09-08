import * as THREE from 'three';
import { assert, AssetRecord } from '@tgdf';

import { LevelRecord } from 'renderer/3D/types';
import { MODELS, TEXTURES } from 'renderer/3D/constants';
import { GENERATED_LEVEL_GROUP_NAME } from 'renderer/3D/utils/generateChunkedLevel';

import { GameScene } from './GameScene/GameScene';
import { OrtographicCameraOptions } from '../cameras/OrtographicCamera';
import { FreeOrtographicCamera } from '../cameras/FreeOrtographicCamera';
//import { Monk } from '../gameObjects/players/Monk/Monk';

export class TestScene extends GameScene {
  public readonly levelVariants: LevelRecord[] = [{ url: 'test.json' }];

  public readonly preloadedAssets: AssetRecord[] = [
    MODELS.MONK,
    MODELS.SKELETON,
    TEXTURES.EXPLOSION,
    TEXTURES.ARCANE_CIRCLE,
    MODELS.DUNGEON_FLOOR,
    MODELS.DUNGEON_PILLAR,
    MODELS.DUNGEON_WALL_BRICK_TALL,
    MODELS.DUNGEON_WALL_TORCH,
  ];

  protected override createCamera(options: OrtographicCameraOptions): FreeOrtographicCamera {
    return new FreeOrtographicCamera(options);
  }

  constructor() {
    super();

    this.background = new THREE.Color(0x151729);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(2048, 2048);
    this.add(directionalLight);
  }

  protected override onInit(): void {
    const levelGroup = this.getObjectByName(GENERATED_LEVEL_GROUP_NAME);
    assert(levelGroup !== undefined, 'Generated level group not found in scene');

    const bbox = new THREE.Box3().setFromObject(levelGroup);
    const levelCenter = new THREE.Vector3();
    bbox.getCenter(levelCenter);

    this.camera.setZoom(0.5);

    this.camera.moveTo(levelCenter);
  }
}
