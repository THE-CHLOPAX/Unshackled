import * as THREE from 'three';
import { GameObjectComponent, MAIN_SOUND_CHANNEL } from '@tgdf';

import {
  FMOD_EVENTS,
  FMOD3DAttributes,
  FMODAudio,
  FMODEventInstance,
  FMODPlayEventOptions,
} from 'renderer/FMOD';

import { Entity } from '../gameObjects/Entity';

export type FMODSoundControllerPlayOptions = Omit<FMODPlayEventOptions, 'attributes3D'> & {
  channelId?: string;
};

export type FMODFootstepOptions = {
  surface?: number;
  volume?: number;
};

const FOOTSTEP_SURFACE_PARAMETER = 'surface';
const DEFAULT_FOOTSTEP_SURFACE = 1;
const DEFAULT_FOOTSTEP_VOLUME = 0.15;

const WORLD_UP = new THREE.Vector3(0, 1, 0);

export class FMODSoundController extends GameObjectComponent {
  private _activeInstances = new Set<FMODEventInstance>();
  private _worldQuaternion = new THREE.Quaternion();
  private _entityAttributes = createAttributes();
  private _listenerAttributes = createAttributes();

  constructor(gameObject: Entity) {
    super(gameObject);
  }

  public override get gameObject(): Entity {
    return super.gameObject as Entity;
  }

  public playSound(
    eventPath: string,
    { channelId = MAIN_SOUND_CHANNEL, ...options }: FMODSoundControllerPlayOptions = {}
  ): FMODEventInstance | null {
    this._updateListener();

    const instance = FMODAudio.playEventInSoundChannel({
      eventPath,
      channelId,
      options: { ...options, attributes3D: this._getEntityAttributes() },
      onStopped: () => {
        if (instance) this._activeInstances.delete(instance);
      },
    });

    if (instance) this._activeInstances.add(instance);
    return instance;
  }

  public stopSound(instance: FMODEventInstance, allowFadeout = false): void {
    FMODAudio.stopEvent(instance, allowFadeout);
  }

  public playFootstep(
    eventPath: string = FMOD_EVENTS.GENERIC_FOOTSTEP,
    {
      surface = DEFAULT_FOOTSTEP_SURFACE,
      volume = DEFAULT_FOOTSTEP_VOLUME,
    }: FMODFootstepOptions = {}
  ): FMODEventInstance | null {
    return this.playSound(eventPath, {
      volume,
      parameters: { [FOOTSTEP_SURFACE_PARAMETER]: surface },
    });
  }

  protected override onUpdate(_deltaTime: number): void {
    if (this._activeInstances.size === 0) return;

    this._updateListener();

    const attributes = this._getEntityAttributes();
    for (const instance of this._activeInstances) {
      FMODAudio.set3DAttributes(instance, attributes);
    }
  }

  protected override onDestroyed(): void {
    super.onDestroyed();
    this._activeInstances.clear();
  }

  private _getEntityAttributes(): FMOD3DAttributes {
    const entity = this.gameObject;
    const { position, forward, up } = this._entityAttributes;

    entity.getWorldPosition(position);
    entity.getWorldDirection(forward);
    up.copy(WORLD_UP).applyQuaternion(entity.getWorldQuaternion(this._worldQuaternion));

    return this._entityAttributes;
  }

  private _updateListener(): void {
    const camera = this.gameObject.scene?.camera;
    if (!camera) return;

    const { position, forward, up } = this._listenerAttributes;

    position.copy(camera.pivotPoint);
    camera.getWorldDirection(forward);
    up.copy(WORLD_UP).applyQuaternion(camera.getWorldQuaternion(this._worldQuaternion));

    FMODAudio.setListenerAttributes(this._listenerAttributes);
  }
}

function createAttributes() {
  return {
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    forward: new THREE.Vector3(),
    up: new THREE.Vector3(),
  };
}
