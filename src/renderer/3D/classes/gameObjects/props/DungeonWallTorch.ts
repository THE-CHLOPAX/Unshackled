import * as THREE from 'three';
import { assert, GameObject, getModelFromStore, Scene } from '@tgdf';

import { WorldObjectArgs } from '3D/types';
import { MODELS, WORLD_CELL_SIZE } from '3D/constants';
import { FMOD_EVENTS, FMODEventInstance } from 'renderer/FMOD';
import { FMODSoundController } from '3D/classes/gameObjectComponents/FMODSoundController';

import { Flame } from './Flame';

export class DungeonWallTorch extends GameObject {
  private _soundController: FMODSoundController;
  private _torchSound: FMODEventInstance | null = null;

  constructor(scene: Scene, { cell }: WorldObjectArgs) {
    super({ scene });

    const torchModel = getModelFromStore(MODELS.DUNGEON_WALL_TORCH.id);
    assert(torchModel, 'Torch model not found');

    this.scale.multiplyScalar(0.1 * WORLD_CELL_SIZE);
    if (cell !== undefined) {
      this.rotateY(THREE.MathUtils.degToRad(-cell.rotation));
    }

    const torchFlame = new Flame(scene, { scale: 0.35 * WORLD_CELL_SIZE });
    torchFlame.position.set(0, 0.125 * WORLD_CELL_SIZE, 0.125 * WORLD_CELL_SIZE);

    this.add(torchModel, torchFlame);

    this._soundController = this.addComponent('FMODSoundController', new FMODSoundController(this));
  }

  protected override onAwake(): void {
    this._torchSound = this._soundController.playSound(FMOD_EVENTS.AMBIENT_TORCH_LOOP);
  }

  protected override onDestroyed(): void {
    if (this._torchSound) {
      this._soundController.stopSound(this._torchSound, true);
      this._torchSound = null;
    }
  }
}
