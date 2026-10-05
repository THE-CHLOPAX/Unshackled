import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { Emitter, GameObject, RigidBody } from '@tgdf';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

import { PlayerActionType } from '3D/types';

import { Player } from './players/Player';
import { PlayerDetectionZone } from './PlayerDetectionZone';
import { MockGameScene } from '../scenes/GameScene/MockGameScene';
import { PlayerActionEvent, PlayerInputEventMap } from './players/PlayerRegisterableInputSource';

class TestScene extends MockGameScene {}

type Collide = (zone: PlayerDetectionZone, other: GameObject, started: boolean) => void;

async function createReadyScene(): Promise<{ scene: TestScene; collide: Collide }> {
  const scene = new TestScene();
  await scene.initializePhysicsWorld(new THREE.Vector3(0, 0, 0));

  const physics = scene.physics;
  if (!physics) throw new Error('Physics manager is undefined');

  const callbacks: Array<(h1: number, h2: number, started: boolean) => void> = [];
  vi.spyOn(physics, 'onCollision').mockImplementation((callback) => {
    callbacks.push(callback);
    return () => {};
  });

  const collide: Collide = (zone, other, started) => {
    const zoneHandle = zone.rigidBody.getHandle();
    const otherHandle = other.getGameObjectComponentByType(RigidBody)?.getHandle();
    if (zoneHandle == null || otherHandle == null) throw new Error('Missing handle');
    callbacks.forEach((callback) => callback(zoneHandle, otherHandle, started));
  };

  return { scene, collide };
}

function addBody(scene: TestScene, object: GameObject): void {
  scene.add(object);
  object.addComponent('RigidBody', new RigidBody(object, { enableCollisionDetection: true }));
  object.update(0);
}

function addPlayer(scene: TestScene) {
  const inputEvents = new Emitter<PlayerInputEventMap>();
  const player = new GameObject({ scene });
  Object.assign(player, { isPlayer: true });
  Object.defineProperty(player, 'inputSource', { value: { events: inputEvents } });
  addBody(scene, player);

  return { player: player as unknown as Player, inputEvents };
}

function addZone(scene: TestScene): PlayerDetectionZone {
  const zone = new PlayerDetectionZone(scene, { size: new THREE.Vector3(2, 2, 2) });
  scene.add(zone);
  zone.update(0);
  return zone;
}

const ACTION_DOWN: PlayerActionEvent = { type: PlayerActionType.ACTION_DOWN };

describe('PlayerDetectionZone', () => {
  beforeAll(async () => {
    await RAPIER.init();
  });

  let scene: TestScene;
  let collide: Collide;

  beforeEach(async () => {
    ({ scene, collide } = await createReadyScene());
  });

  it('emits player-entered and tracks the player when a player enters', () => {
    const zone = addZone(scene);
    const { player } = addPlayer(scene);
    const onEntered = vi.fn();
    zone.playerEvents.on('player-entered', onEntered);

    collide(zone, player, true);

    expect(onEntered).toHaveBeenCalledWith({ player });
    expect(zone.hasPlayer(player)).toBe(true);
    expect(zone.players).toEqual([player]);
  });

  it('ignores non-player objects', () => {
    const zone = addZone(scene);
    const other = new GameObject({ scene });
    addBody(scene, other);
    const onEntered = vi.fn();
    zone.playerEvents.on('player-entered', onEntered);

    collide(zone, other, true);

    expect(onEntered).not.toHaveBeenCalled();
    expect(zone.players).toEqual([]);
  });

  it('does not emit player-entered twice for the same player', () => {
    const zone = addZone(scene);
    const { player } = addPlayer(scene);
    const onEntered = vi.fn();
    zone.playerEvents.on('player-entered', onEntered);

    collide(zone, player, true);
    collide(zone, player, true);

    expect(onEntered).toHaveBeenCalledOnce();
  });

  it('forwards actions of players inside the zone', () => {
    const zone = addZone(scene);
    const { player, inputEvents } = addPlayer(scene);
    const onAction = vi.fn();
    zone.playerEvents.on('player-action', onAction);

    inputEvents.trigger('player-action', ACTION_DOWN);
    expect(onAction).not.toHaveBeenCalled();

    collide(zone, player, true);
    inputEvents.trigger('player-action', ACTION_DOWN);

    expect(onAction).toHaveBeenCalledWith({ player, action: ACTION_DOWN });
  });

  it('forwards actions only from the player who performed them', () => {
    const zone = addZone(scene);
    const first = addPlayer(scene);
    const second = addPlayer(scene);
    const onAction = vi.fn();
    zone.playerEvents.on('player-action', onAction);

    collide(zone, first.player, true);
    collide(zone, second.player, true);
    second.inputEvents.trigger('player-action', ACTION_DOWN);

    expect(onAction).toHaveBeenCalledOnce();
    expect(onAction).toHaveBeenCalledWith({ player: second.player, action: ACTION_DOWN });
  });

  it('emits player-left and stops forwarding actions when a player leaves', () => {
    const zone = addZone(scene);
    const { player, inputEvents } = addPlayer(scene);
    const onLeft = vi.fn();
    const onAction = vi.fn();
    zone.playerEvents.on('player-left', onLeft);
    zone.playerEvents.on('player-action', onAction);

    collide(zone, player, true);
    collide(zone, player, false);
    inputEvents.trigger('player-action', ACTION_DOWN);

    expect(onLeft).toHaveBeenCalledWith({ player });
    expect(onAction).not.toHaveBeenCalled();
    expect(zone.hasPlayer(player)).toBe(false);
  });

  it('does not emit player-left for a player that never entered', () => {
    const zone = addZone(scene);
    const { player } = addPlayer(scene);
    const onLeft = vi.fn();
    zone.playerEvents.on('player-left', onLeft);

    collide(zone, player, false);

    expect(onLeft).not.toHaveBeenCalled();
  });

  it('treats a destroyed player as leaving the zone', () => {
    const zone = addZone(scene);
    const { player, inputEvents } = addPlayer(scene);
    const onLeft = vi.fn();
    const onAction = vi.fn();
    zone.playerEvents.on('player-left', onLeft);
    zone.playerEvents.on('player-action', onAction);

    collide(zone, player, true);
    player.destroy();
    inputEvents.trigger('player-action', ACTION_DOWN);

    expect(onLeft).toHaveBeenCalledWith({ player });
    expect(onAction).not.toHaveBeenCalled();
    expect(zone.players).toEqual([]);
  });

  it('unsubscribes from players inside the zone when destroyed', () => {
    const zone = addZone(scene);
    const { player, inputEvents } = addPlayer(scene);
    const onAction = vi.fn();
    zone.playerEvents.on('player-action', onAction);

    collide(zone, player, true);
    zone.destroy();
    inputEvents.trigger('player-action', ACTION_DOWN);

    expect(onAction).not.toHaveBeenCalled();
    expect(zone.players).toEqual([]);
  });
});
