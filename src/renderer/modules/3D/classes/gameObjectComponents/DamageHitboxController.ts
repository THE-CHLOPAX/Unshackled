import * as THREE from 'three';
import { GameObjectComponent } from '@tgdf';

import { Entity } from '3D/classes/gameObjects/Entity';
import { DamageHitbox, DamageHitboxIgnoreCondition } from '3D/classes/gameObjects/DamageHitbox';

export class DamageHitboxController extends GameObjectComponent {
  private _attackHitbox: DamageHitbox | null = null;
  private _debugEnabled: boolean = false;

  public hitboxTimeline: gsap.core.Timeline | null = null;

  constructor(public entity: Entity) {
    super(entity);
  }

  public attachDamageHitbox(
    size: THREE.Vector3,
    damage: number,
    parentName: string,
    ignoreCondition: DamageHitboxIgnoreCondition
  ): void {
    if (this._attackHitbox || !this.scene) return;
    this._attackHitbox = new DamageHitbox(this.scene, size, damage, ignoreCondition);

    this._attackHitbox.rigidBody.toggleDebug(this._debugEnabled);

    this.entity.modelRenderer.addAttachment({
      object: this._attackHitbox,
      parentName: parentName,
    });
  }

  public toggleDebug(enabled: boolean): void {
    this._debugEnabled = enabled;
    this._attackHitbox?.rigidBody.toggleDebug(enabled);
  }

  public removeDamageHitbox(): void {
    if (!this._attackHitbox) return;
    this.entity.modelRenderer.removeAttachment(this._attackHitbox);
    this._attackHitbox = null;
  }

  public clearHitboxEvents(): void {
    this.removeDamageHitbox();
    this.hitboxTimeline?.kill();
    this.hitboxTimeline = null;
  }

  protected override onDestroyed(): void {
    super.onDestroyed();
    this.clearHitboxEvents();
  }
}
