import * as THREE from 'three';
import { AssetRecord } from '@tgdf';

import { getModelClone } from '3D/utils/getModelClone';
import { GameScene } from '3D/classes/scenes/GameScene/GameScene';
import { MODELS, SPAWN_MARKER_NAME, TEXTURES } from '3D/constants';
import { GameEventsEmitter, LevelIdentifier } from 'renderer/types';
import { Skeleton } from '3D/classes/gameObjects/Skeleton/Skeleton';
import { ActivePlayerWithProfile } from 'renderer/utils/assignPlayerProfiles';
import { createSwingTrailWarmupMesh } from '3D/classes/gameObjects/SwingTrail/SwingTrail';
import { WarmupFactory } from '3D/classes/scenes/GameScene/ShadersManager/ShadersManager';
import { OBJECTIVE_ENTITIES_KILLED } from '3D/classes/scenes/GameScene/ProgressTracker/constants';

export class DungeonLevelScene extends GameScene {
  public readonly preloadedAssets: AssetRecord[] = [
    MODELS.PLAYER,
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
    () => getModelClone(MODELS.PLAYER.id),
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
