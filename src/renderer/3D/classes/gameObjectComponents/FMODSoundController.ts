import type { GameCamera } from '3D/types';

import * as THREE from 'three';
import { GameObject, GameObjectComponent, MAIN_SOUND_CHANNEL, SceneCamera } from '@tgdf';

import { clampEventParameters } from 'renderer/FMOD/utils/clampEventParameters';
import {
  FMOD_EVENTS,
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

export type FMODFootstepOptions = {
  surface?: number;
  volume?: number;
};

export type FMODFootstepLoopOptions = FMODFootstepOptions & {
  intervalMs: number;
  event?: FMODEventDefinition;
};

const FOOTSTEP_SURFACE_PARAMETER = 'Surface';
const DEFAULT_FOOTSTEP_SURFACE = 1;
const DEFAULT_FOOTSTEP_VOLUME = 0.15;

const WORLD_UP = new THREE.Vector3(0, 1, 0);

export class FMODSoundController extends GameObjectComponent {
  private _activeInstances = new Set<FMODEventInstance>();
  private _worldQuaternion = new THREE.Quaternion();
  private _entityAttributes = createAttributes();
  private _listenerAttributes = createAttributes();
  private _footstepLoop: FMODFootstepLoopOptions | null = null;
  private _footstepElapsedMs = 0;

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
        parameters: parameters && clampEventParameters(event, parameters),
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

  public playFootstep(
    event: FMODEventDefinition = FMOD_EVENTS.GENERIC_FOOTSTEP,
    {
      surface = DEFAULT_FOOTSTEP_SURFACE,
      volume = DEFAULT_FOOTSTEP_VOLUME,
    }: FMODFootstepOptions = {}
  ): FMODEventInstance | null {
    const hasSurfaceParameter = FOOTSTEP_SURFACE_PARAMETER in event.parameters;

    return this.playSound(event, {
      volume,
      parameters: hasSurfaceParameter ? { [FOOTSTEP_SURFACE_PARAMETER]: surface } : undefined,
    });
  }

  public startFootsteps(options: FMODFootstepLoopOptions): void {
    this._footstepLoop = options;
    this._footstepElapsedMs = 0;
    this._playLoopedFootstep(options);
  }

  public stopFootsteps(): void {
    this._footstepLoop = null;
    this._footstepElapsedMs = 0;
  }

  protected override onUpdate(deltaTime: number): void {
    this._updateFootsteps(deltaTime);
    this._updateActiveInstances();
  }

  protected override onDestroyed(): void {
    super.onDestroyed();
    this.stopFootsteps();
    for (const instance of this._activeInstances) {
      this.stopSound(instance, true);
    }
    this._activeInstances.clear();
  }

  private _updateFootsteps(deltaTime: number): void {
    const footstepLoop = this._footstepLoop;
    if (!footstepLoop) return;

    this._footstepElapsedMs += deltaTime * 1000;
    if (this._footstepElapsedMs < footstepLoop.intervalMs) return;

    this._footstepElapsedMs %= footstepLoop.intervalMs;
    this._playLoopedFootstep(footstepLoop);
  }

  private _playLoopedFootstep({ event, surface, volume }: FMODFootstepLoopOptions): void {
    this.playFootstep(event, { surface, volume });
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

    if (isGameCamera(camera)) {
      position.copy(camera.pivotPoint);
    } else {
      camera.getWorldPosition(position);
    }
    camera.getWorldDirection(forward);
    up.copy(WORLD_UP).applyQuaternion(camera.getWorldQuaternion(this._worldQuaternion));

    FMODAudio.setListenerAttributes(this._listenerAttributes);
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
