import * as THREE from 'three';
import { AssetRecord } from '@tgdf';

import { MODELS, TEXTURES } from 'renderer/3D/constants';

import { GameScene } from './GameScene/GameScene';
import { Monk } from '../gameObjects/players/Monk/Monk';

export class TestScene extends GameScene {
  public readonly preloadedAssets: AssetRecord[] = [
    MODELS.MONK,
    MODELS.SKELETON,
    TEXTURES.EXPLOSION,
    TEXTURES.ARCANE_CIRCLE,
    MODELS.DUNGEON_WALL_TORCH,
  ];

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
    const monk = new Monk(this);
    this.add(monk);

    this.camera.follow(monk);
  }
}
