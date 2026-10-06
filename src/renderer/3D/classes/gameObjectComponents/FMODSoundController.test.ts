import * as THREE from 'three';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Emitter, GameObjectEventMap, MAIN_SOUND_CHANNEL } from '@tgdf';

import { FMODAudio, FMODEventInstance } from 'renderer/FMOD';

import { Entity } from '../gameObjects/Entity';
import { FMODSoundController } from './FMODSoundController';
import { OrtographicCamera } from '../cameras/OrtographicCamera';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

vi.mock('renderer/FMOD', () => ({
  FMODAudio: {
    playEventInSoundChannel: vi.fn(),
    stopEvent: vi.fn(),
    set3DAttributes: vi.fn(),
    setListenerAttributes: vi.fn(),
  },
}));

type PlayArgs = Parameters<typeof FMODAudio.playEventInSoundChannel>[0];

const HIT_EVENT = { path: 'event:/Hit', volume: 1, parameters: {} } as const;
const LOOP_EVENT = { path: 'event:/Loop', volume: 1, parameters: {} } as const;
const FOOTSTEP_EVENT = {
  path: 'event:/Footstep',
  volume: 0.1,
  parameters: {
    Surface: { min: 0, max: 10, defaultValue: 1 },
    Distance: { min: 0, max: 20, defaultValue: 0, automatic: true },
  },
} as const;
const PITCHED_EVENT = {
  path: 'event:/Pitched',
  volume: 1,
  parameters: { Pitch: { min: -1, max: 1, defaultValue: 0 } },
} as const;

function makeEntity(camera?: OrtographicCamera) {
  const events = new Emitter<GameObjectEventMap>();
  const entity = Object.assign(new THREE.Object3D(), {
    events,
    scene: camera ? { camera } : undefined,
  });
  return { entity: entity as unknown as Entity, events };
}

function lastPlayArgs(): PlayArgs {
  const calls = vi.mocked(FMODAudio.playEventInSoundChannel).mock.calls;
  return calls[calls.length - 1][0];
}

describe('FMODSoundController', () => {
  const instance = {} as FMODEventInstance;
  let camera: OrtographicCamera;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(FMODAudio.playEventInSoundChannel).mockReturnValue(instance);
    camera = new OrtographicCamera();
    camera.moveTo(new THREE.Vector3(4, 0, 2));
    camera.update(0);
  });

  it('plays the event in the main channel at the entity position', () => {
    const { entity } = makeEntity(camera);
    entity.position.set(1, 2, 3);
    const controller = new FMODSoundController(entity);

    const result = controller.playSound(HIT_EVENT, { volume: 0.5 });

    const args = lastPlayArgs();
    expect(result).toBe(instance);
    expect(args.eventPath).toBe('event:/Hit');
    expect(args.channelId).toBe(MAIN_SOUND_CHANNEL);
    expect(args.options?.volume).toBe(0.5);
    expect(args.options?.attributes3D?.position).toMatchObject({ x: 1, y: 2, z: 3 });
  });

  it('uses the event default volume when no volume is provided', () => {
    const { entity } = makeEntity(camera);
    const controller = new FMODSoundController(entity);

    controller.playSound({ ...HIT_EVENT, volume: 0.3 });

    expect(lastPlayArgs().options?.volume).toBe(0.3);
  });

  it('pans from the camera world position and attenuates from the camera pivot', () => {
    const { entity } = makeEntity(camera);
    const controller = new FMODSoundController(entity);

    controller.playSound(HIT_EVENT);

    const [attributes, attenuationPosition] = vi.mocked(FMODAudio.setListenerAttributes).mock
      .calls[0];
    const position = camera.getWorldPosition(new THREE.Vector3());
    const forward = camera.getWorldDirection(new THREE.Vector3());
    expect(position).not.toMatchObject({ x: 4, y: 0, z: 2 });
    expect(attributes.position).toMatchObject({ x: position.x, y: position.y, z: position.z });
    expect(attributes.forward).toMatchObject({ x: forward.x, y: forward.y, z: forward.z });
    expect(attenuationPosition).toMatchObject({ x: 4, y: 0, z: 2 });
    expect(
      new THREE.Vector3().copy(attributes.forward).dot(attributes.up as THREE.Vector3)
    ).toBeCloseTo(0);
  });

  it('attenuates from the listener position when the camera has no pivot point', () => {
    const plainCamera = Object.assign(new THREE.PerspectiveCamera(), { update: vi.fn() });
    plainCamera.position.set(1, 2, 3);
    plainCamera.updateMatrixWorld();
    const { entity } = makeEntity(plainCamera as unknown as OrtographicCamera);
    const controller = new FMODSoundController(entity);

    controller.playSound(HIT_EVENT);

    const [attributes, attenuationPosition] = vi.mocked(FMODAudio.setListenerAttributes).mock
      .calls[0];
    expect(attributes.position).toMatchObject({ x: 1, y: 2, z: 3 });
    expect(attenuationPosition).toBeNull();
  });

  it('skips the listener update when the scene has no camera', () => {
    const { entity } = makeEntity();
    const controller = new FMODSoundController(entity);

    controller.playSound(HIT_EVENT);

    expect(FMODAudio.setListenerAttributes).not.toHaveBeenCalled();
    expect(FMODAudio.playEventInSoundChannel).toHaveBeenCalledTimes(1);
  });

  it('passes default values of settable parameters', () => {
    const { entity } = makeEntity(camera);
    const controller = new FMODSoundController(entity);

    controller.playSound(FOOTSTEP_EVENT);

    expect(lastPlayArgs().options?.parameters).toEqual({ Surface: 1 });
  });

  it('overrides default parameter values with provided ones', () => {
    const { entity } = makeEntity(camera);
    const controller = new FMODSoundController(entity);

    controller.playSound(FOOTSTEP_EVENT, { parameters: { Surface: 4 } });

    expect(lastPlayArgs().options?.parameters).toEqual({ Surface: 4 });
  });

  it('clamps parameters to the event parameter range', () => {
    const { entity } = makeEntity(camera);
    const controller = new FMODSoundController(entity);

    controller.playSound(PITCHED_EVENT, { parameters: { Pitch: 5 } });

    expect(lastPlayArgs().options?.parameters).toEqual({ Pitch: 1 });
  });

  it('tracks multiple simultaneous sounds independently', () => {
    const first = { id: 1 } as unknown as FMODEventInstance;
    const second = { id: 2 } as unknown as FMODEventInstance;
    vi.mocked(FMODAudio.playEventInSoundChannel)
      .mockReturnValueOnce(first)
      .mockReturnValueOnce(second);
    const { entity, events } = makeEntity(camera);
    const controller = new FMODSoundController(entity);

    controller.playSound(HIT_EVENT);
    controller.playSound(LOOP_EVENT);
    const [firstCall] = vi.mocked(FMODAudio.playEventInSoundChannel).mock.calls;
    firstCall[0].onStopped?.();
    events.trigger('update', { deltaTime: 0.016 });

    const updatedInstances = vi.mocked(FMODAudio.set3DAttributes).mock.calls.map(([inst]) => inst);
    expect(updatedInstances).toEqual([second]);
  });

  it('follows the entity while the sound plays and stops once it has stopped', () => {
    const { entity, events } = makeEntity(camera);
    const controller = new FMODSoundController(entity);

    controller.playSound(HIT_EVENT);
    entity.position.set(5, 0, 0);
    events.trigger('update', { deltaTime: 0.016 });

    expect(FMODAudio.set3DAttributes).toHaveBeenCalledTimes(1);
    const [updatedInstance, attributes] = vi.mocked(FMODAudio.set3DAttributes).mock.calls[0];
    expect(updatedInstance).toBe(instance);
    expect(attributes.position).toMatchObject({ x: 5, y: 0, z: 0 });

    lastPlayArgs().onStopped?.();
    events.trigger('update', { deltaTime: 0.016 });

    expect(FMODAudio.set3DAttributes).toHaveBeenCalledTimes(1);
  });

  it('does not track instances that failed to play', () => {
    vi.mocked(FMODAudio.playEventInSoundChannel).mockReturnValue(null);
    const { entity, events } = makeEntity(camera);
    const controller = new FMODSoundController(entity);

    controller.playSound(HIT_EVENT);
    events.trigger('update', { deltaTime: 0.016 });

    expect(FMODAudio.set3DAttributes).not.toHaveBeenCalled();
  });

  describe('looped sounds', () => {
    function playCount(): number {
      return vi.mocked(FMODAudio.playEventInSoundChannel).mock.calls.length;
    }

    function playedPaths(): string[] {
      return vi
        .mocked(FMODAudio.playEventInSoundChannel)
        .mock.calls.map(([args]) => args.eventPath);
    }

    it('plays the sound immediately when started', () => {
      const { entity } = makeEntity(camera);
      const controller = new FMODSoundController(entity);

      controller.playLoopedSound(FOOTSTEP_EVENT, { intervalMs: 400 });

      expect(playCount()).toBe(1);
      expect(lastPlayArgs().eventPath).toBe('event:/Footstep');
    });

    it('plays the sound again once the accumulated delta time reaches the interval', () => {
      const { entity, events } = makeEntity(camera);
      const controller = new FMODSoundController(entity);

      controller.playLoopedSound(FOOTSTEP_EVENT, { intervalMs: 400 });
      events.trigger('update', { deltaTime: 0.2 });
      events.trigger('update', { deltaTime: 0.19 });

      expect(playCount()).toBe(1);

      events.trigger('update', { deltaTime: 0.02 });

      expect(playCount()).toBe(2);
    });

    it('plays a single repetition per frame even after a long frame', () => {
      const { entity, events } = makeEntity(camera);
      const controller = new FMODSoundController(entity);

      controller.playLoopedSound(FOOTSTEP_EVENT, { intervalMs: 400 });
      events.trigger('update', { deltaTime: 2 });

      expect(playCount()).toBe(2);
    });

    it('uses the event defaults unless volume and parameters are overridden', () => {
      const { entity, events } = makeEntity(camera);
      const controller = new FMODSoundController(entity);

      controller.playLoopedSound(FOOTSTEP_EVENT, { intervalMs: 400 });
      expect(lastPlayArgs().options?.volume).toBe(0.1);
      expect(lastPlayArgs().options?.parameters).toEqual({ Surface: 1 });

      controller.playLoopedSound(FOOTSTEP_EVENT, {
        intervalMs: 400,
        volume: 0.5,
        parameters: { Surface: 2 },
      });
      events.trigger('update', { deltaTime: 0.4 });

      expect(lastPlayArgs().options?.volume).toBe(0.5);
      expect(lastPlayArgs().options?.parameters).toEqual({ Surface: 2 });
    });

    it('stops repeating after stopLoopedSound', () => {
      const { entity, events } = makeEntity(camera);
      const controller = new FMODSoundController(entity);

      const loopedSound = controller.playLoopedSound(FOOTSTEP_EVENT, { intervalMs: 400 });
      controller.stopLoopedSound(loopedSound);
      events.trigger('update', { deltaTime: 1 });

      expect(playCount()).toBe(1);
    });

    it('runs multiple looped sounds simultaneously with independent intervals', () => {
      const { entity, events } = makeEntity(camera);
      const controller = new FMODSoundController(entity);

      controller.playLoopedSound(FOOTSTEP_EVENT, { intervalMs: 400 });
      controller.playLoopedSound(HIT_EVENT, { intervalMs: 300 });
      events.trigger('update', { deltaTime: 0.3 });
      events.trigger('update', { deltaTime: 0.1 });

      expect(playedPaths()).toEqual([
        'event:/Footstep',
        'event:/Hit',
        'event:/Hit',
        'event:/Footstep',
      ]);
    });

    it('stops only the given looped sound', () => {
      const { entity, events } = makeEntity(camera);
      const controller = new FMODSoundController(entity);

      const footsteps = controller.playLoopedSound(FOOTSTEP_EVENT, { intervalMs: 400 });
      controller.playLoopedSound(HIT_EVENT, { intervalMs: 400 });
      controller.stopLoopedSound(footsteps);
      events.trigger('update', { deltaTime: 0.4 });

      expect(playedPaths()).toEqual(['event:/Footstep', 'event:/Hit', 'event:/Hit']);
    });

    it('stops all looped sounds when destroyed', () => {
      const { entity, events } = makeEntity(camera);
      const controller = new FMODSoundController(entity);

      controller.playLoopedSound(FOOTSTEP_EVENT, { intervalMs: 400 });
      controller.playLoopedSound(HIT_EVENT, { intervalMs: 300 });
      controller.destroy();
      events.trigger('update', { deltaTime: 1 });

      expect(playCount()).toBe(2);
    });
  });

  it('stops active instances with fadeout when destroyed', () => {
    const { entity, events } = makeEntity(camera);
    const controller = new FMODSoundController(entity);

    controller.playSound(LOOP_EVENT);
    controller.destroy();
    events.trigger('update', { deltaTime: 0.016 });

    expect(FMODAudio.stopEvent).toHaveBeenCalledWith(instance, true);
    expect(FMODAudio.set3DAttributes).not.toHaveBeenCalled();
  });

  it('does not stop already finished instances when destroyed', () => {
    const { entity } = makeEntity(camera);
    const controller = new FMODSoundController(entity);

    controller.playSound(HIT_EVENT);
    lastPlayArgs().onStopped?.();
    controller.destroy();

    expect(FMODAudio.stopEvent).not.toHaveBeenCalled();
  });

  it('stops the instance through FMODAudio', () => {
    const { entity } = makeEntity(camera);
    const controller = new FMODSoundController(entity);

    controller.stopSound(instance, true);

    expect(FMODAudio.stopEvent).toHaveBeenCalledWith(instance, true);
  });
});
