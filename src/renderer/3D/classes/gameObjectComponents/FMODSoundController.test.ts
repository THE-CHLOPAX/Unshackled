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
  FMOD_EVENTS: {
    GENERIC_FOOTSTEP: { path: 'event:/Footstep', parameters: { Surface: { min: 0, max: 10 } } },
  },
  FMODAudio: {
    playEventInSoundChannel: vi.fn(),
    stopEvent: vi.fn(),
    set3DAttributes: vi.fn(),
    setListenerAttributes: vi.fn(),
  },
}));

type PlayArgs = Parameters<typeof FMODAudio.playEventInSoundChannel>[0];

const HIT_EVENT = { path: 'event:/Hit', parameters: {} } as const;
const LOOP_EVENT = { path: 'event:/Loop', parameters: {} } as const;
const SKELETON_FOOTSTEP_EVENT = {
  path: 'event:/Skeleton/Footstep',
  parameters: { Surface: { min: 0, max: 10 } },
} as const;
const NO_SURFACE_FOOTSTEP_EVENT = {
  path: 'event:/Ghost/Footstep',
  parameters: { Distance: { min: 0, max: 20, automatic: true } },
} as const;
const PITCHED_EVENT = {
  path: 'event:/Pitched',
  parameters: { Pitch: { min: -1, max: 1 } },
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

  it('places the listener at the camera pivot with the camera orientation', () => {
    const { entity } = makeEntity(camera);
    const controller = new FMODSoundController(entity);

    controller.playSound(HIT_EVENT);

    const [attributes] = vi.mocked(FMODAudio.setListenerAttributes).mock.calls[0];
    const forward = camera.getWorldDirection(new THREE.Vector3());
    expect(attributes.position).toMatchObject({ x: 4, y: 0, z: 2 });
    expect(attributes.forward).toMatchObject({ x: forward.x, y: forward.y, z: forward.z });
    expect(
      new THREE.Vector3().copy(attributes.forward).dot(attributes.up as THREE.Vector3)
    ).toBeCloseTo(0);
  });

  it('skips the listener update when the scene has no camera', () => {
    const { entity } = makeEntity();
    const controller = new FMODSoundController(entity);

    controller.playSound(HIT_EVENT);

    expect(FMODAudio.setListenerAttributes).not.toHaveBeenCalled();
    expect(FMODAudio.playEventInSoundChannel).toHaveBeenCalledTimes(1);
  });

  it('plays a footstep with default event, surface and volume', () => {
    const { entity } = makeEntity(camera);
    const controller = new FMODSoundController(entity);

    controller.playFootstep();

    const args = lastPlayArgs();
    expect(args.eventPath).toBe('event:/Footstep');
    expect(args.options?.volume).toBe(0.15);
    expect(args.options?.parameters).toEqual({ Surface: 1 });
  });

  it('plays a footstep with a custom event', () => {
    const { entity } = makeEntity(camera);
    const controller = new FMODSoundController(entity);

    controller.playFootstep(SKELETON_FOOTSTEP_EVENT);

    expect(lastPlayArgs().eventPath).toBe('event:/Skeleton/Footstep');
  });

  it('does not set the surface parameter on footstep events without it', () => {
    const { entity } = makeEntity(camera);
    const controller = new FMODSoundController(entity);

    controller.playFootstep(NO_SURFACE_FOOTSTEP_EVENT);

    expect(lastPlayArgs().options?.parameters).toBeUndefined();
  });

  it('clamps parameters to the event parameter range', () => {
    const { entity } = makeEntity(camera);
    const controller = new FMODSoundController(entity);

    controller.playSound(PITCHED_EVENT, { parameters: { Pitch: 5 } });

    expect(lastPlayArgs().options?.parameters).toEqual({ Pitch: 1 });
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

  describe('footstep loop', () => {
    function footstepCount(): number {
      return vi.mocked(FMODAudio.playEventInSoundChannel).mock.calls.length;
    }

    it('plays a footstep immediately when started', () => {
      const { entity } = makeEntity(camera);
      const controller = new FMODSoundController(entity);

      controller.startFootsteps({ intervalMs: 400 });

      expect(footstepCount()).toBe(1);
      expect(lastPlayArgs().eventPath).toBe('event:/Footstep');
    });

    it('plays the next footstep once the accumulated delta time reaches the interval', () => {
      const { entity, events } = makeEntity(camera);
      const controller = new FMODSoundController(entity);

      controller.startFootsteps({ intervalMs: 400 });
      events.trigger('update', { deltaTime: 0.2 });
      events.trigger('update', { deltaTime: 0.19 });

      expect(footstepCount()).toBe(1);

      events.trigger('update', { deltaTime: 0.02 });

      expect(footstepCount()).toBe(2);
    });

    it('plays a single footstep per frame even after a long frame', () => {
      const { entity, events } = makeEntity(camera);
      const controller = new FMODSoundController(entity);

      controller.startFootsteps({ intervalMs: 400 });
      events.trigger('update', { deltaTime: 2 });

      expect(footstepCount()).toBe(2);
    });

    it('uses the provided event, surface and volume', () => {
      const { entity, events } = makeEntity(camera);
      const controller = new FMODSoundController(entity);

      controller.startFootsteps({
        intervalMs: 400,
        event: SKELETON_FOOTSTEP_EVENT,
        surface: 2,
        volume: 0.5,
      });
      events.trigger('update', { deltaTime: 0.4 });

      const args = lastPlayArgs();
      expect(args.eventPath).toBe('event:/Skeleton/Footstep');
      expect(args.options?.parameters).toEqual({ Surface: 2 });
      expect(args.options?.volume).toBe(0.5);
    });

    it('stops playing footsteps after stopFootsteps', () => {
      const { entity, events } = makeEntity(camera);
      const controller = new FMODSoundController(entity);

      controller.startFootsteps({ intervalMs: 400 });
      controller.stopFootsteps();
      events.trigger('update', { deltaTime: 1 });

      expect(footstepCount()).toBe(1);
    });

    it('restarts the accumulated time when started again', () => {
      const { entity, events } = makeEntity(camera);
      const controller = new FMODSoundController(entity);

      controller.startFootsteps({ intervalMs: 400 });
      events.trigger('update', { deltaTime: 0.3 });
      controller.startFootsteps({ intervalMs: 300 });
      events.trigger('update', { deltaTime: 0.2 });

      expect(footstepCount()).toBe(2);
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
