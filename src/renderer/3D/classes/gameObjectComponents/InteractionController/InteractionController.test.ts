import * as THREE from 'three';
import { Emitter, GameObject, Scene } from '@tgdf';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockCamera } from '@tgdf/internal-3d/testUtils/MockCamera';

import { Interactable, PlayerActionType } from '3D/types';

import { Entity } from '../../gameObjects/Entity';
import { Player } from '../../gameObjects/players/Player';
import { HintBillboardRenderer } from '../HintBillboardRenderer/HintBillboardRenderer';
import { InteractionController, InteractionControllerOptions } from './InteractionController';
import {
  PlayerDetectionZoneEventMap,
  PlayerDetectionZoneOptions,
} from '../../gameObjects/PlayerDetectionZone';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

class TestScene extends Scene {
  camera = new MockCamera();
}

const zones = vi.hoisted(() => [] as FakeZone[]);

type FakeZone = THREE.Object3D & {
  options: PlayerDetectionZoneOptions;
  players: Player[];
  playerEvents: Emitter<PlayerDetectionZoneEventMap>;
  destroy: ReturnType<typeof vi.fn>;
};

vi.mock('../../gameObjects/PlayerDetectionZone', async () => {
  const { Object3D } = await import('three');
  const { Emitter: ZoneEmitter } = await import('@tgdf');

  class PlayerDetectionZone extends Object3D {
    public players: Player[] = [];
    public playerEvents = new ZoneEmitter<PlayerDetectionZoneEventMap>();
    public destroy = vi.fn();

    constructor(
      _scene: Scene,
      public options: PlayerDetectionZoneOptions
    ) {
      super();
      zones.push(this as unknown as FakeZone);
    }
  }

  return { PlayerDetectionZone };
});

function createPlayer() {
  const requestInteraction = vi.fn((_target: Interactable) => true);
  const player = { stateController: { requestInteraction } } as unknown as Player;
  return { player, requestInteraction };
}

function createHintRenderer() {
  return {
    setTitle: vi.fn(),
    setHints: vi.fn(),
    setTitleVisible: vi.fn(),
    setHintsVisible: vi.fn(),
  };
}

function createController(options: Partial<InteractionControllerOptions> = {}) {
  const scene = new TestScene();
  const gameObject = new GameObject({ scene });
  const hintRenderer = createHintRenderer();
  const onOpen = vi.fn();
  const onLock = vi.fn();

  const controller = gameObject.addComponent(
    'InteractionController',
    new InteractionController(gameObject, hintRenderer as unknown as HintBillboardRenderer, {
      interactionRadius: 1.5,
      interactions: {
        [PlayerActionType.ACTION_DOWN]: { hint: { icon: 'A', label: 'Open' }, onInteract: onOpen },
        [PlayerActionType.ACTION_LEFT]: { hint: { icon: 'X', label: 'Lock' }, onInteract: onLock },
      },
      ...options,
    })
  );
  scene.add(gameObject);

  return { gameObject, controller, hintRenderer, onOpen, onLock };
}

function enterZone(zone: FakeZone, player: Player) {
  zone.players.push(player);
  zone.playerEvents.trigger('player-entered', { player });
}

function leaveZone(zone: FakeZone, player: Player) {
  zone.players.splice(zone.players.indexOf(player), 1);
  zone.playerEvents.trigger('player-left', { player });
}

function pressAction(zone: FakeZone, player: Player, type: PlayerActionType) {
  zone.playerEvents.trigger('player-action', { player, action: { type } as never });
}

function lastCall<T extends unknown[]>(mock: { mock: { calls: T[] } }): T {
  return mock.mock.calls[mock.mock.calls.length - 1];
}

describe('InteractionController', () => {
  beforeEach(() => {
    zones.length = 0;
    vi.clearAllMocks();
  });

  it('adds a sphere interaction zone sized from the radius when awake', () => {
    const { gameObject } = createController();

    expect(zones).toHaveLength(1);
    expect(zones[0].options).toEqual({ size: new THREE.Vector3(3, 3, 3), shape: 'sphere' });
    expect(zones[0].parent).toBe(gameObject);
  });

  it('passes all interaction hints in config order to the renderer', () => {
    const { hintRenderer } = createController();

    expect(lastCall(hintRenderer.setHints)[0]).toEqual([
      { icon: 'A', label: 'Open' },
      { icon: 'X', label: 'Lock' },
    ]);
  });

  it('shows hints only while a player is in the interaction zone', () => {
    const { hintRenderer } = createController();
    const { player } = createPlayer();

    enterZone(zones[0], player);
    expect(lastCall(hintRenderer.setHintsVisible)[0]).toBe(true);

    leaveZone(zones[0], player);
    expect(lastCall(hintRenderer.setHintsVisible)[0]).toBe(false);
  });

  it('keeps hints visible while any player is still in the zone', () => {
    const { hintRenderer } = createController();
    const first = createPlayer().player;
    const second = createPlayer().player;

    enterZone(zones[0], first);
    enterZone(zones[0], second);
    leaveZone(zones[0], first);

    expect(lastCall(hintRenderer.setHintsVisible)[0]).toBe(true);
  });

  it('requests an interaction on the player for a configured action', () => {
    const { onLock } = createController();
    const { player, requestInteraction } = createPlayer();

    pressAction(zones[0], player, PlayerActionType.ACTION_LEFT);
    const [target] = lastCall(requestInteraction);
    target.interact({} as Entity);

    expect(requestInteraction).toHaveBeenCalledOnce();
    expect(onLock).toHaveBeenCalledOnce();
  });

  it('passes the interacting entity to the callback', () => {
    const { onOpen } = createController();
    const { player, requestInteraction } = createPlayer();
    const entity = {} as Entity;

    pressAction(zones[0], player, PlayerActionType.ACTION_DOWN);
    lastCall(requestInteraction)[0].interact(entity);

    expect(onOpen).toHaveBeenCalledWith(entity);
  });

  it('ignores actions that are not configured', () => {
    createController();
    const { player, requestInteraction } = createPlayer();

    pressAction(zones[0], player, PlayerActionType.ACTION_UP);

    expect(requestInteraction).not.toHaveBeenCalled();
  });

  it('updates a hint at runtime', () => {
    const { controller, hintRenderer } = createController();

    controller.setHint(PlayerActionType.ACTION_DOWN, { label: 'Close' });

    expect(lastCall(hintRenderer.setHints)[0]).toEqual([
      { icon: 'A', label: 'Close' },
      { icon: 'X', label: 'Lock' },
    ]);
  });

  it('hides and ignores disabled interactions', () => {
    const { controller, hintRenderer } = createController();
    const { player, requestInteraction } = createPlayer();

    controller.setInteractionEnabled(PlayerActionType.ACTION_LEFT, false);
    pressAction(zones[0], player, PlayerActionType.ACTION_LEFT);

    expect(lastCall(hintRenderer.setHints)[0]).toEqual([{ icon: 'A', label: 'Open' }]);
    expect(requestInteraction).not.toHaveBeenCalled();
  });

  it('skips the callback when the interaction was disabled before it triggered', () => {
    const { controller, onLock } = createController();
    const { player, requestInteraction } = createPlayer();

    pressAction(zones[0], player, PlayerActionType.ACTION_LEFT);
    controller.setInteractionEnabled(PlayerActionType.ACTION_LEFT, false);
    lastCall(requestInteraction)[0].interact({} as Entity);

    expect(onLock).not.toHaveBeenCalled();
  });

  describe('name', () => {
    const NAME = { label: 'Dungeon door', radius: 4 };

    it('does not create a name zone or title without a name', () => {
      const { hintRenderer } = createController();

      expect(zones).toHaveLength(1);
      expect(hintRenderer.setTitle).toHaveBeenCalledWith(undefined);
    });

    it('creates a separate name zone and sets the title', () => {
      const { hintRenderer } = createController({ name: NAME });

      expect(zones).toHaveLength(2);
      expect(zones[1].options.size).toEqual(new THREE.Vector3(8, 8, 8));
      expect(hintRenderer.setTitle).toHaveBeenCalledWith('Dungeon door');
    });

    it('shows only the title while a player is in the name zone alone', () => {
      const { hintRenderer } = createController({ name: NAME });
      const { player } = createPlayer();

      enterZone(zones[1], player);

      expect(lastCall(hintRenderer.setTitleVisible)[0]).toBe(true);
      expect(lastCall(hintRenderer.setHintsVisible)[0]).toBe(false);
    });

    it('shows the title and hints while a player is in the interaction zone', () => {
      const { hintRenderer } = createController({ name: NAME });
      const { player } = createPlayer();

      enterZone(zones[0], player);

      expect(lastCall(hintRenderer.setTitleVisible)[0]).toBe(true);
      expect(lastCall(hintRenderer.setHintsVisible)[0]).toBe(true);
    });

    it('hides the title once no player is in either zone', () => {
      const { hintRenderer } = createController({ name: NAME });
      const { player } = createPlayer();

      enterZone(zones[1], player);
      leaveZone(zones[1], player);

      expect(lastCall(hintRenderer.setTitleVisible)[0]).toBe(false);
    });
  });

  it('destroys its zones when the game object is destroyed', () => {
    const { gameObject } = createController({ name: { label: 'Door', radius: 4 } });

    gameObject.destroy();

    expect(zones.every((zone) => zone.destroy.mock.calls.length === 1)).toBe(true);
  });
});
