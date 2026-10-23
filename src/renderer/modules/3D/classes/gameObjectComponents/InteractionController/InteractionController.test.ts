import * as THREE from 'three';
import { Emitter, GameObject, Scene } from '@tgdf';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockCamera } from '@tgdf/internal-3d/testUtils/MockCamera';

import { Interactable } from '3D/types';
import { PlayerActionType } from 'renderer/types';
import { Player } from '3D/classes/gameObjects/Player/Player';
import { InteractiveObject } from '3D/classes/gameObjects/InteractiveObject/InteractiveObject';
import { PlayerInputEventMap } from '3D/classes/gameObjects/Player/PlayerRegisterableInputSource';
import { InteractionController } from '3D/classes/gameObjectComponents/InteractionController/InteractionController';
import {
  DetectionZoneEventMap,
  DetectionZoneOptions,
} from '3D/classes/gameObjects/DetectionZone/DetectionZone';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

class TestScene extends Scene {
  camera = new MockCamera();
}

const zones = vi.hoisted(() => [] as FakeZone[]);

type FakeZone = THREE.Object3D & {
  options: DetectionZoneOptions;
  objects: InteractiveObject[];
  zoneEvents: Emitter<DetectionZoneEventMap<InteractiveObject>>;
  toggleDetection: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
};

vi.mock('3D/classes/gameObjects/DetectionZone/DetectionZone', async () => {
  const { Object3D } = await import('three');
  const { Emitter: ZoneEmitter } = await import('@tgdf');

  class DetectionZone extends Object3D {
    public objects: InteractiveObject[] = [];
    public zoneEvents = new ZoneEmitter<DetectionZoneEventMap<InteractiveObject>>();
    public toggleDetection = vi.fn();
    public toggleDebug = vi.fn();
    public destroy = vi.fn();

    constructor(
      _scene: Scene,
      public options: DetectionZoneOptions
    ) {
      super();
      zones.push(this as unknown as FakeZone);
    }
  }

  return { DetectionZone };
});

const INTERACTION_RADIUS = 1.5;
const TITLE_DISPLAY_RADIUS = 4;

function createPlayer() {
  const scene = new TestScene();
  const requestInteraction = vi.fn((_target: Interactable) => true);
  const inputEvents = new Emitter<PlayerInputEventMap>();

  const player = Object.defineProperties(new GameObject({ scene }), {
    inputSource: { value: { events: inputEvents } },
    stateController: { value: { requestInteraction } },
  }) as unknown as Player;

  const controller = player.addComponent(
    'InteractionController',
    new InteractionController(player, {
      interactionRadius: INTERACTION_RADIUS,
      titleDisplayRadius: TITLE_DISPLAY_RADIUS,
    })
  );
  scene.add(player);

  const [interactionZone, titleZone] = zones.slice(-2);

  return { player, controller, requestInteraction, inputEvents, interactionZone, titleZone };
}

function createInteractiveObject(
  position = new THREE.Vector3(),
  enabledActions: PlayerActionType[] = [PlayerActionType.ACTION_DOWN]
) {
  const object = new THREE.Object3D();
  object.position.copy(position);
  const hintViewers = new Set<Player>();

  return Object.assign(object, {
    isInteractiveObject: true,
    hintViewers,
    isInteractionEnabled: vi.fn((action: PlayerActionType) => enabledActions.includes(action)),
    interact: vi.fn(),
    showHintsFor: vi.fn((player: Player) => hintViewers.add(player)),
    hideHintsFor: vi.fn((player: Player) => hintViewers.delete(player)),
    showTitleFor: vi.fn(),
    hideTitleFor: vi.fn(),
  }) as unknown as InteractiveObject & {
    hintViewers: Set<Player>;
    interact: ReturnType<typeof vi.fn>;
    showHintsFor: ReturnType<typeof vi.fn>;
    hideHintsFor: ReturnType<typeof vi.fn>;
    showTitleFor: ReturnType<typeof vi.fn>;
    hideTitleFor: ReturnType<typeof vi.fn>;
  };
}

function enterZone(zone: FakeZone, object: InteractiveObject) {
  zone.objects.push(object);
  zone.zoneEvents.trigger('object-entered', { object });
}

function leaveZone(zone: FakeZone, object: InteractiveObject) {
  zone.objects.splice(zone.objects.indexOf(object), 1);
  zone.zoneEvents.trigger('object-left', { object });
}

function pressAction(inputEvents: Emitter<PlayerInputEventMap>, type: PlayerActionType) {
  inputEvents.trigger('player-action', { type } as never);
}

function lastCall<T extends unknown[]>(mock: { mock: { calls: T[] } }): T {
  return mock.mock.calls[mock.mock.calls.length - 1];
}

describe('InteractionController', () => {
  beforeEach(() => {
    zones.length = 0;
    vi.clearAllMocks();
  });

  it('attaches sphere interaction and title zones to the player when awake', () => {
    const { player, interactionZone, titleZone } = createPlayer();

    expect(zones).toHaveLength(2);
    expect(interactionZone.options).toMatchObject({
      size: new THREE.Vector3().setScalar(INTERACTION_RADIUS * 2),
      shape: 'sphere',
    });
    expect(titleZone.options).toMatchObject({
      size: new THREE.Vector3().setScalar(TITLE_DISPLAY_RADIUS * 2),
      shape: 'sphere',
    });
    expect(interactionZone.parent).toBe(player);
    expect(titleZone.parent).toBe(player);
  });

  it('detects only interactive objects', () => {
    const { interactionZone, titleZone } = createPlayer();
    const plain = new GameObject({ scene: new TestScene() });

    for (const zone of [interactionZone, titleZone]) {
      expect(zone.options.filter(createInteractiveObject() as unknown as GameObject)).toBe(true);
      expect(zone.options.filter(plain)).toBe(false);
    }
  });

  it('shows and hides the title for objects entering and leaving the title zone', () => {
    const { player, titleZone } = createPlayer();
    const object = createInteractiveObject();

    enterZone(titleZone, object);
    expect(object.showTitleFor).toHaveBeenCalledExactlyOnceWith(player);
    expect(object.showHintsFor).not.toHaveBeenCalled();

    leaveZone(titleZone, object);
    expect(object.hideTitleFor).toHaveBeenCalledExactlyOnceWith(player);
  });

  it('ignores actions when no object in the interaction zone supports them', () => {
    const { requestInteraction, inputEvents, interactionZone, titleZone } = createPlayer();
    const titleOnly = createInteractiveObject(new THREE.Vector3(), [PlayerActionType.ACTION_UP]);
    enterZone(interactionZone, createInteractiveObject());
    enterZone(titleZone, titleOnly);

    pressAction(inputEvents, PlayerActionType.ACTION_UP);

    expect(requestInteraction).not.toHaveBeenCalled();
  });

  it('toggles detection on both zones', () => {
    const { controller, interactionZone, titleZone } = createPlayer();

    controller.toggleDetection(false);

    expect(interactionZone.toggleDetection).toHaveBeenCalledWith(false);
    expect(titleZone.toggleDetection).toHaveBeenCalledWith(false);
  });

  it('hides its hints and titles and destroys its zones when the player is destroyed', () => {
    const { player, requestInteraction, inputEvents, interactionZone, titleZone } = createPlayer();
    const object = createInteractiveObject();
    enterZone(interactionZone, object);
    enterZone(titleZone, object);

    player.destroy();
    pressAction(inputEvents, PlayerActionType.ACTION_DOWN);

    expect(object.hideHintsFor).toHaveBeenCalledWith(player);
    expect(object.hideTitleFor).toHaveBeenCalledWith(player);
    expect(interactionZone.destroy).toHaveBeenCalledOnce();
    expect(titleZone.destroy).toHaveBeenCalledOnce();
    expect(requestInteraction).not.toHaveBeenCalled();
  });

  describe('closest object hints', () => {
    const INTERACT = [PlayerActionType.INTERACT];

    function shownHints(...objects: ReturnType<typeof createInteractiveObject>[]): boolean[] {
      return objects.map((object) => object.hintViewers.size > 0);
    }

    it('shows hints only for the closest object in the interaction zone', () => {
      const { player, interactionZone } = createPlayer();
      const far = createInteractiveObject(new THREE.Vector3(1, 0, 0), INTERACT);
      const near = createInteractiveObject(new THREE.Vector3(0.4, 0, 0), INTERACT);
      const middle = createInteractiveObject(new THREE.Vector3(0, 0, 0.7), INTERACT);
      enterZone(interactionZone, far);
      enterZone(interactionZone, near);
      enterZone(interactionZone, middle);

      player.update(0);

      expect(shownHints(far, near, middle)).toEqual([false, true, false]);
      expect(far.showHintsFor).not.toHaveBeenCalled();
      expect(middle.showHintsFor).not.toHaveBeenCalled();
    });

    it('shows no hints while the interaction zone is empty', () => {
      const { player, titleZone } = createPlayer();
      const titleOnly = createInteractiveObject(new THREE.Vector3(2, 0, 0), INTERACT);
      enterZone(titleZone, titleOnly);

      player.update(0);

      expect(shownHints(titleOnly)).toEqual([false]);
    });

    it('moves the hints to another object once it becomes the closest', () => {
      const { player, interactionZone } = createPlayer();
      const left = createInteractiveObject(new THREE.Vector3(-1, 0, 0), INTERACT);
      const right = createInteractiveObject(new THREE.Vector3(1, 0, 0), INTERACT);
      enterZone(interactionZone, left);
      enterZone(interactionZone, right);

      player.position.set(-0.5, 0, 0);
      player.update(0);
      expect(shownHints(left, right)).toEqual([true, false]);

      player.position.set(0.5, 0, 0);
      player.update(0);
      expect(shownHints(left, right)).toEqual([false, true]);
      expect(left.hideHintsFor).toHaveBeenCalledWith(player);
    });

    it('moves the hints to the next closest object when the closest one leaves the zone', () => {
      const { player, interactionZone } = createPlayer();
      const near = createInteractiveObject(new THREE.Vector3(0.2, 0, 0), INTERACT);
      const far = createInteractiveObject(new THREE.Vector3(1, 0, 0), INTERACT);
      enterZone(interactionZone, near);
      enterZone(interactionZone, far);
      player.update(0);

      leaveZone(interactionZone, near);
      player.update(0);

      expect(shownHints(near, far)).toEqual([false, true]);
    });

    it('hides the hints once the last object leaves the zone', () => {
      const { player, interactionZone } = createPlayer();
      const object = createInteractiveObject(new THREE.Vector3(0.5, 0, 0), INTERACT);
      enterZone(interactionZone, object);
      player.update(0);

      leaveZone(interactionZone, object);
      player.update(0);

      expect(shownHints(object)).toEqual([false]);
    });

    it('skips closer objects whose interaction is disabled', () => {
      const { player, interactionZone } = createPlayer();
      const disabled = createInteractiveObject(new THREE.Vector3(0.1, 0, 0), []);
      const enabled = createInteractiveObject(new THREE.Vector3(1, 0, 0), INTERACT);
      enterZone(interactionZone, disabled);
      enterZone(interactionZone, enabled);

      player.update(0);

      expect(shownHints(disabled, enabled)).toEqual([false, true]);
    });

    it('measures distance on the ground plane, ignoring height', () => {
      const { player, interactionZone } = createPlayer();
      const above = createInteractiveObject(new THREE.Vector3(0.2, 3, 0), INTERACT);
      const level = createInteractiveObject(new THREE.Vector3(0.5, 0, 0), INTERACT);
      enterZone(interactionZone, above);
      enterZone(interactionZone, level);

      player.update(0);

      expect(shownHints(above, level)).toEqual([true, false]);
    });

    it('interacts with the object showing the hints', () => {
      const { player, requestInteraction, inputEvents, interactionZone } = createPlayer();
      const near = createInteractiveObject(new THREE.Vector3(0.3, 0, 0), INTERACT);
      const far = createInteractiveObject(new THREE.Vector3(1, 0, 0), INTERACT);
      enterZone(interactionZone, far);
      enterZone(interactionZone, near);
      player.update(0);

      pressAction(inputEvents, PlayerActionType.INTERACT);
      lastCall(requestInteraction)[0].interact(player);

      expect(near.interact).toHaveBeenCalledExactlyOnceWith(PlayerActionType.INTERACT, player);
      expect(far.interact).not.toHaveBeenCalled();
    });
  });
});
