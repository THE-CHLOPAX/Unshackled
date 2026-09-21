import * as THREE from 'three';
import { AssetRecord, useAssetStore } from '@tgdf';

import { LevelRecord } from 'renderer/3D/types';
import { GameEventsEmitter } from 'renderer/types';
import { getModelClone } from 'renderer/3D/utils/getModelClone';
import { pixelateTexture } from 'renderer/3D/utils/pixelateTexture';
import {
  CHECKERBOARD_TEXTURE,
  FLOOR_OBJECT_MESH_NAME,
  MODELS,
  TEXTURES,
} from 'renderer/3D/constants';

import { GameScene } from './GameScene/GameScene';
import { Monk } from '../gameObjects/players/Monk/Monk';
import { RigidStaticObject } from '../gameObjects/RigidStaticObject';
import { createSwingTrailWarmupMesh } from '../gameObjects/SwingTrail';
import { WarmupFactory } from './GameScene/ShadersManager/ShadersManager';

const TEST_PLANE_SIZE = 30;
const TEST_PLANE_CHECKERBOARD_REPEAT = 10;

export class TestScene extends GameScene {
  public readonly levelVariants: LevelRecord[] = [];

  public readonly preloadedAssets: AssetRecord[] = [
    MODELS.MONK,
    MODELS.SKELETON,
    TEXTURES.CHECKERBOARD,
    TEXTURES.AIMING_ARROW,
  ];

  protected override additionalWarmupFactories: WarmupFactory[] = [
    () => getModelClone(MODELS.MONK.id),
    () => getModelClone(MODELS.SKELETON.id),
    () => createSwingTrailWarmupMesh(),
  ];

  constructor(public readonly emitter?: GameEventsEmitter) {
    super(emitter);

    this.background = new THREE.Color(0x0a0a0a);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    this.add(directionalLight);
  }

  public override async generateLevel(): Promise<void> {
    const checkerboardTexture = pixelateTexture(
      useAssetStore.getState().textureCache.get(CHECKERBOARD_TEXTURE)
    );
    checkerboardTexture?.repeat.set(TEST_PLANE_CHECKERBOARD_REPEAT, TEST_PLANE_CHECKERBOARD_REPEAT);

    const floorGeometry = new THREE.PlaneGeometry(TEST_PLANE_SIZE, TEST_PLANE_SIZE);
    floorGeometry.rotateX(-Math.PI / 2);

    const floorMaterial = new THREE.MeshPhongMaterial({ map: checkerboardTexture });

    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.name = FLOOR_OBJECT_MESH_NAME;
    this.add(floorMesh);

    const floorRigidBody = new RigidStaticObject(this, { trimeshGeometry: floorGeometry });
    this.add(floorRigidBody);

    await this.initializeNavMeshManager(floorMesh);
  }

  protected override onInit(): void {
    const monk = new Monk(this);
    this.add(monk);
    this.camera.follow(monk);

    //DEBUG
    const interval = setInterval(() => {
      this.emitter?.trigger('player-damage-taken');
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
    }, 3000);
  }
}
