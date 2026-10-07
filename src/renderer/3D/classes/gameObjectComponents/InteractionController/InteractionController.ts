import * as THREE from 'three';
import { GameObject, GameObjectComponent } from '@tgdf';

import { HintBillboardHint } from 'UI';
import { Interactable, PlayerActionType } from '3D/types';

import { Entity } from '../../gameObjects/Entity';
import { Player } from '../../gameObjects/players/Player';
import { PlayerDetectionZone } from '../../gameObjects/PlayerDetectionZone';
import { HintBillboardRenderer } from '../HintBillboardRenderer/HintBillboardRenderer';
import { PlayerActionEvent } from '../../gameObjects/players/PlayerRegisterableInputSource';

export type InteractionDefinition = {
  hint: HintBillboardHint;
  onInteract: (entity: Entity) => void;
  enabled?: boolean;
};

export type InteractionControllerOptions = {
  interactionRadius: number;
  interactions: Partial<Record<PlayerActionType, InteractionDefinition>>;
  name?: {
    label: string;
    radius: number;
  };
};

type InteractionState = {
  definition: InteractionDefinition;
  interactable: Interactable;
};

export class InteractionController extends GameObjectComponent {
  private readonly _interactions = new Map<PlayerActionType, InteractionState>();
  private _interactionZone: PlayerDetectionZone | null = null;
  private _nameZone: PlayerDetectionZone | null = null;

  constructor(
    gameObject: GameObject,
    private readonly _hintRenderer: HintBillboardRenderer,
    private readonly _interactionOptions: InteractionControllerOptions
  ) {
    super(gameObject);

    for (const [action, definition] of Object.entries(_interactionOptions.interactions) as [
      PlayerActionType,
      InteractionDefinition,
    ][]) {
      this._interactions.set(action, {
        definition: { ...definition },
        interactable: { interact: (entity) => this._interact(action, entity) },
      });
    }

    this._hintRenderer.setTitle(_interactionOptions.name?.label);
    this._updateHints();
  }

  public get players(): Player[] {
    return this._interactionZone?.players ?? [];
  }

  public setHint(action: PlayerActionType, hint: Partial<HintBillboardHint>): void {
    const interaction = this._interactions.get(action);
    if (!interaction) return;

    interaction.definition.hint = { ...interaction.definition.hint, ...hint };
    this._updateHints();
  }

  public setInteractionEnabled(action: PlayerActionType, enabled: boolean): void {
    const interaction = this._interactions.get(action);
    if (!interaction) return;

    interaction.definition.enabled = enabled;
    this._updateHints();
  }

  public isInteractionEnabled(action: PlayerActionType): boolean {
    const interaction = this._interactions.get(action);
    return interaction !== undefined && interaction.definition.enabled !== false;
  }

  protected override onAwake(): void {
    const { interactionRadius, name } = this._interactionOptions;

    this._interactionZone = this._createZone(interactionRadius);
    this._interactionZone.playerEvents.on('player-entered', this._updateVisibility);
    this._interactionZone.playerEvents.on('player-left', this._updateVisibility);
    this._interactionZone.playerEvents.on('player-action', this._onPlayerAction);

    if (name) {
      this._nameZone = this._createZone(name.radius);
      this._nameZone.playerEvents.on('player-entered', this._updateVisibility);
      this._nameZone.playerEvents.on('player-left', this._updateVisibility);
    }
  }

  protected override onDestroyed(): void {
    for (const zone of [this._interactionZone, this._nameZone]) {
      zone?.playerEvents.removeAll();
      zone?.destroy();
    }
    this._interactionZone = null;
    this._nameZone = null;
    this._interactions.clear();
  }

  private _createZone(radius: number): PlayerDetectionZone {
    const zone = new PlayerDetectionZone(this.gameObject.scene, {
      size: new THREE.Vector3().setScalar(radius * 2),
      shape: 'sphere',
    });
    this.gameObject.add(zone);
    return zone;
  }

  private _updateVisibility = (): void => {
    const isInInteractionZone = (this._interactionZone?.players.length ?? 0) > 0;
    const isInNameZone = (this._nameZone?.players.length ?? 0) > 0;

    this._hintRenderer.setHintsVisible(isInInteractionZone);
    this._hintRenderer.setTitleVisible(isInInteractionZone || isInNameZone);
  };

  private _onPlayerAction = ({
    player,
    action,
  }: {
    player: Player;
    action: PlayerActionEvent;
  }): void => {
    const interaction = this._interactions.get(action.type);
    if (!interaction || !this.isInteractionEnabled(action.type)) return;

    player.stateController.requestInteraction(interaction.interactable);
  };

  private _interact(action: PlayerActionType, entity: Entity): void {
    const interaction = this._interactions.get(action);
    if (!interaction || !this.isInteractionEnabled(action)) return;

    interaction.definition.onInteract(entity);
  }

  private _updateHints(): void {
    const hints = [...this._interactions.values()]
      .filter(({ definition }) => definition.enabled !== false)
      .map(({ definition }) => definition.hint);

    this._hintRenderer.setHints(hints);
  }
}
