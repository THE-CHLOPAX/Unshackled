import * as THREE from 'three';
import { GameObjectComponent } from '@tgdf';

import { PlayerActionType } from 'renderer/types';
import { Player } from '3D/classes/gameObjects/Player/Player';
import { isInteractiveObject } from '3D/utils/isInteractiveObject';
import { DetectionZone } from '3D/classes/gameObjects/DetectionZone/DetectionZone';
import { InteractiveObject } from '3D/classes/gameObjects/InteractiveObject/InteractiveObject';
import { PlayerActionEvent } from '3D/classes/gameObjects/Player/PlayerRegisterableInputSource';

export type InteractionControllerOptions = {
  interactionRadius: number;
  titleDisplayRadius: number;
};

type InteractiveObjectZone = DetectionZone<InteractiveObject>;

export class InteractionController extends GameObjectComponent {
  private _interactionZone: InteractiveObjectZone | null = null;
  private _titleZone: InteractiveObjectZone | null = null;
  private _currentClosestObject: InteractiveObject | null = null;

  private readonly _playerPosition = new THREE.Vector3();
  private readonly _objectPosition = new THREE.Vector3();

  constructor(
    gameObject: Player,
    private readonly _options: InteractionControllerOptions
  ) {
    super(gameObject);
  }

  public override get gameObject(): Player {
    return super.gameObject as Player;
  }

  public get interactiveObjects(): InteractiveObject[] {
    return this._interactionZone?.objects ?? [];
  }

  public toggleDetection(enabled: boolean): void {
    this._interactionZone?.toggleDetection(enabled);
    this._titleZone?.toggleDetection(enabled);
  }

  protected override onAwake(): void {
    const { interactionRadius, titleDisplayRadius } = this._options;

    this._interactionZone = this._createZone(interactionRadius);

    this._titleZone = this._createZone(titleDisplayRadius);
    this._titleZone.zoneEvents.on('object-entered', this._onTitleZoneEntered);
    this._titleZone.zoneEvents.on('object-left', this._onTitleZoneLeft);

    this.gameObject.inputSource.events.on('player-action', this._onPlayerInteraction);
  }

  protected override onDestroyed(): void {
    this.gameObject.inputSource.events.off('player-action', this._onPlayerInteraction);

    for (const object of this._interactionZone?.objects ?? []) {
      object.hideHintsFor(this.gameObject);
    }
    for (const object of this._titleZone?.objects ?? []) {
      object.hideTitleFor(this.gameObject);
    }

    for (const zone of [this._interactionZone, this._titleZone]) {
      zone?.zoneEvents.removeAll();
      zone?.destroy();
    }
    this._interactionZone = null;
    this._titleZone = null;
  }

  protected override onUpdate(_deltaTime: number): void {
    const closestObjectInInteractionZone = this._findClosestTarget();

    if (closestObjectInInteractionZone !== this._currentClosestObject) {
      this._currentClosestObject?.hideHintsFor(this.gameObject);
      this._currentClosestObject = closestObjectInInteractionZone;

      if (this._currentClosestObject) {
        this._currentClosestObject.showHintsFor(this.gameObject);
      }
    }
  }

  private _createZone(radius: number): InteractiveObjectZone {
    const size = new THREE.Vector3().setScalar(radius * 2);
    const zone = new DetectionZone<InteractiveObject>(this.gameObject.scene, {
      size,
      shape: 'sphere',
      filter: isInteractiveObject,
    });

    zone.position.y -= size.y / 2;

    this.gameObject.add(zone);
    return zone;
  }

  private _onTitleZoneEntered = ({ object }: { object: InteractiveObject }): void => {
    object.showTitleFor(this.gameObject);
  };

  private _onTitleZoneLeft = ({ object }: { object: InteractiveObject }): void => {
    object.hideTitleFor(this.gameObject);
  };

  private _onPlayerInteraction = (action: PlayerActionEvent): void => {
    if (action.type !== PlayerActionType.INTERACT) return;

    const target = this._currentClosestObject;
    if (!target) return;

    const player = this.gameObject;
    player.stateController.requestInteraction({
      interact: () => target.interact(action.type, player),
    });
  };

  private _findClosestTarget(): InteractiveObject | null {
    this.gameObject.getWorldPosition(this._playerPosition);

    let closest: InteractiveObject | null = null;
    let closestDistance = Infinity;

    for (const object of this.interactiveObjects) {
      if (!object.isInteractionEnabled(PlayerActionType.INTERACT)) continue;

      const objectPosition = object.getWorldPosition(this._objectPosition);

      const distance = Math.sqrt(
        (objectPosition.x - this._playerPosition.x) ** 2 +
          (objectPosition.z - this._playerPosition.z) ** 2
      );

      if (distance < closestDistance) {
        closest = object;
        closestDistance = distance;
      }
    }

    return closest;
  }
}
