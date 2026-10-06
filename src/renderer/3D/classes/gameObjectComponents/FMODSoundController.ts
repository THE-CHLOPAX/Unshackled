import type { GameCamera } from '3D/types';

import * as THREE from 'three';
import { GameObject, GameObjectComponent, MAIN_SOUND_CHANNEL, SceneCamera } from '@tgdf';

import { resolveEventParameters } from 'renderer/FMOD/utils/resolveEventParameters';
import {
  FMOD3DAttributes,
  FMODAudio,
  FMODEventDefinition,
  FMODEventInstance,
  FMODEventParameters,
  FMODPlayEventOptions,
} from 'renderer/FMOD';

export type FMODSoundControllerPlayOptions<E extends FMODEventDefinition> = Omit<
  FMODPlayEventOptions,
  'attributes3D' | 'parameters'
> & {
  channelId?: string;
  parameters?: FMODEventParameters<E>;
};

export type FMODLoopedSoundOptions<E extends FMODEventDefinition> =
  FMODSoundControllerPlayOptions<E> & {
    intervalMs: number;
  };

export type FMODLoopedSound = {
  readonly event: FMODEventDefinition;
  readonly intervalMs: number;
};

type LoopedSoundState = {
  play: () => void;
  elapsedMs: number;
};

const WORLD_UP = new THREE.Vector3(0, 1, 0);

export class FMODSoundController extends GameObjectComponent {
  private _activeInstances = new Set<FMODEventInstance>();
  private _loopedSounds = new Map<FMODLoopedSound, LoopedSoundState>();
  private _worldQuaternion = new THREE.Quaternion();
  private _entityAttributes = createAttributes();
  private _listenerAttributes = createAttributes();

  constructor(gameObject: GameObject) {
    super(gameObject);
  }

  public override get gameObject(): GameObject {
    return super.gameObject as GameObject;
  }

  public playSound<E extends FMODEventDefinition>(
    event: E,
    {
      channelId = MAIN_SOUND_CHANNEL,
      volume = event.volume,
      parameters,
      ...options
    }: FMODSoundControllerPlayOptions<E> = {}
  ): FMODEventInstance | null {
    this._updateListener();

    const instance = FMODAudio.playEventInSoundChannel({
      eventPath: event.path,
      channelId,
      options: {
        ...options,
        volume,
        parameters: resolveEventParameters(event, parameters),
        attributes3D: this._getEntityAttributes(),
      },
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

  public playLoopedSound<E extends FMODEventDefinition>(
    event: E,
    { intervalMs, ...options }: FMODLoopedSoundOptions<E>
  ): FMODLoopedSound {
    const loopedSound: FMODLoopedSound = { event, intervalMs };
    const play = () => {
      this.playSound(event, options);
    };

    this._loopedSounds.set(loopedSound, { play, elapsedMs: 0 });
    play();

    return loopedSound;
  }

  public stopLoopedSound(loopedSound: FMODLoopedSound): void {
    this._loopedSounds.delete(loopedSound);
  }

  protected override onUpdate(deltaTime: number): void {
    this._updateLoopedSounds(deltaTime);
    this._updateActiveInstances();
  }

  protected override onDestroyed(): void {
    super.onDestroyed();
    this._loopedSounds.clear();
    for (const instance of this._activeInstances) {
      this.stopSound(instance, true);
    }
    this._activeInstances.clear();
  }

  private _updateLoopedSounds(deltaTime: number): void {
    for (const [{ intervalMs }, state] of this._loopedSounds) {
      state.elapsedMs += deltaTime * 1000;
      if (state.elapsedMs < intervalMs) continue;

      state.elapsedMs %= intervalMs;
      state.play();
    }
  }

  private _updateActiveInstances(): void {
    if (this._activeInstances.size === 0) return;

    this._updateListener();

    const attributes = this._getEntityAttributes();
    for (const instance of this._activeInstances) {
      FMODAudio.set3DAttributes(instance, attributes);
    }
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

    camera.getWorldPosition(position);
    camera.getWorldDirection(forward);
    up.copy(WORLD_UP).applyQuaternion(camera.getWorldQuaternion(this._worldQuaternion));

    const attenuationPosition = isGameCamera(camera) ? camera.pivotPoint : null;
    FMODAudio.setListenerAttributes(this._listenerAttributes, attenuationPosition);
  }
}

function isGameCamera(camera: SceneCamera): camera is GameCamera {
  return 'pivotPoint' in camera;
}

function createAttributes() {
  return {
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    forward: new THREE.Vector3(),
    up: new THREE.Vector3(),
  };
}
