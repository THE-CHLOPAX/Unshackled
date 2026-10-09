import * as THREE from 'three';
import { AssetRecord } from '@tgdf';

import { getModelClone } from 'renderer/3D/utils/getModelClone';
import { GameEventsEmitter, LevelIdentifier } from 'renderer/types';
import { MODELS, SPAWN_MARKER_NAME, TEXTURES } from 'renderer/3D/constants';
import { ActivePlayerWithProfile } from 'renderer/utils/assignPlayerProfiles';

import { GameScene } from './GameScene/GameScene';
import { Skeleton } from '../gameObjects/mobs/Skeleton/Skeleton';
import { createSwingTrailWarmupMesh } from '../gameObjects/SwingTrail';
import { WarmupFactory } from './GameScene/ShadersManager/ShadersManager';
import { OBJECTIVE_ENTITIES_KILLED } from './GameScene/ProgressTracker/ProgressTracker';

export class DungeonLevelScene extends GameScene {
  public readonly preloadedAssets: AssetRecord[] = [
    MODELS.MONK,
    MODELS.SKELETON,
    TEXTURES.EXPLOSION,
    TEXTURES.ARCANE_CIRCLE,
    TEXTURES.AIMING_ARROW,
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
    () => createSwingTrailWarmupMesh(),
  ];

  /* protected override createCamera(options: OrtographicCameraOptions): FreeOrtographicCamera {
    return new FreeOrtographicCamera(options);
  } */

  constructor(
    public readonly emitter: GameEventsEmitter,
    level: LevelIdentifier,
    players: ActivePlayerWithProfile[]
  ) {
    super({
      emitter,
      level,
      players,
      objective: {
        type: OBJECTIVE_ENTITIES_KILLED,
        objectiveClasses: [Skeleton],
        killedGoalAmount: 1,
      },
    });

    this.background = new THREE.Color(0x0a0a0a);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    this.add(directionalLight);
  }

  protected override onInit(): void {
    const marker = this.getObjectByName(SPAWN_MARKER_NAME);

    if (marker !== undefined) {
      const [firstPlayer] = this.spawnPlayers(marker.position);

      if (firstPlayer) {
        this.camera.follow(firstPlayer);
      }
      //this.camera.moveTo(marker.position);
    }
  }
}
