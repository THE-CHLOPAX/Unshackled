import * as THREE from 'three';
import { GameObject, GameObjectConstructorOptions, RigidBody } from '@tgdf';

import { HintBillboardHint } from 'UI';
import { PlayerActionType } from 'renderer/types';
import { Player } from '3D/classes/gameObjects/Player/Player';
import { GameScene } from '3D/classes/scenes/GameScene/GameScene';
import { HintBillboardRenderer } from '3D/classes/gameObjectComponents/HintBillboardRenderer/HintBillboardRenderer';

export type InteractionDefinition = {
  hint: HintBillboardHint;
  onInteract: (player: Player) => void;
  enabled?: boolean;
};

export type InteractiveObjectOptions = Omit<GameObjectConstructorOptions, 'scene'> & {
  interactions: Partial<Record<PlayerActionType, InteractionDefinition>>;
  title?: string;
  hintOffset?: THREE.Vector3;
  colliderSize?: THREE.Vector3;
};

export class InteractiveObject extends GameObject {
  public readonly isInteractiveObject = true;
  public readonly hintBillboardRenderer: HintBillboardRenderer;
  public readonly interactionBody: RigidBody;

  private readonly _interactions = new Map<PlayerActionType, InteractionDefinition>();
  private readonly _titleViewers = new Set<Player>();
  private readonly _hintViewers = new Set<Player>();

  constructor(scene: GameScene, options: InteractiveObjectOptions) {
    const { interactions, title, hintOffset, colliderSize, ...gameObjectOptions } = options;

    super({ ...gameObjectOptions, scene });

    for (const [action, definition] of Object.entries(interactions) as [
      PlayerActionType,
      InteractionDefinition,
    ][]) {
      this._interactions.set(action, { ...definition });
    }

    this.hintBillboardRenderer = this.addComponent(
      'HintBillboardRenderer',
      new HintBillboardRenderer(this, this.scene.billboards, { offset: hintOffset, title })
    );

    this.interactionBody = this.addComponent(
      'InteractionBody',
      new RigidBody(this, { type: 'static', sensor: true, colliderSize })
    );

    this._updateHints();
  }

  public override get scene(): GameScene {
    return super.scene as GameScene;
  }

  public setTitle(title: string | undefined): void {
    this.hintBillboardRenderer.setTitle(title);
  }

  public setHint(action: PlayerActionType, hint: Partial<HintBillboardHint>): void {
    const interaction = this._interactions.get(action);
    if (!interaction) return;

    interaction.hint = { ...interaction.hint, ...hint };
    this._updateHints();
  }

  public setInteractionEnabled(action: PlayerActionType, enabled: boolean): void {
    const interaction = this._interactions.get(action);
    if (!interaction) return;

    interaction.enabled = enabled;
    this._updateHints();
  }

  public isInteractionEnabled(action: PlayerActionType): boolean {
    const interaction = this._interactions.get(action);
    return interaction !== undefined && interaction.enabled !== false;
  }

  public interact(action: PlayerActionType, player: Player): void {
    if (!this.isInteractionEnabled(action)) return;
    this._interactions.get(action)?.onInteract(player);
  }

  public showTitleFor(player: Player): void {
    if (this.isDestroyed) return;
    this._titleViewers.add(player);
    this._updateVisibility();
  }

  public hideTitleFor(player: Player): void {
    if (this.isDestroyed) return;
    this._titleViewers.delete(player);
    this._updateVisibility();
  }

  public showHintsFor(player: Player): void {
    if (this.isDestroyed) return;
    this._hintViewers.add(player);
    this._updateVisibility();
  }

  public hideHintsFor(player: Player): void {
    if (this.isDestroyed) return;
    this._hintViewers.delete(player);
    this._updateVisibility();
  }

  protected override onDestroyed(): void {
    this._titleViewers.clear();
    this._hintViewers.clear();
    this._interactions.clear();

    super.onDestroyed();
  }

  private _updateVisibility(): void {
    const areHintsVisible = this._hintViewers.size > 0;

    this.hintBillboardRenderer.setHintsVisible(areHintsVisible);
    this.hintBillboardRenderer.setTitleVisible(areHintsVisible || this._titleViewers.size > 0);
  }

  private _updateHints(): void {
    const hints = [...this._interactions.values()]
      .filter((definition) => definition.enabled !== false)
      .map((definition) => definition.hint);

    this.hintBillboardRenderer.setHints(hints);
  }
}
