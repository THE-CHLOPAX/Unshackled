import * as THREE from 'three';
import { GameObjectComponent } from '@tgdf';

import { Entity } from '../gameObjects/Entity';
import { DamageHitbox } from '../gameObjects/DamageHitbox';

export class DamageHitboxController extends GameObjectComponent {
  private _attackHitbox: DamageHitbox | null = null;

  public hitboxTimeline: gsap.core.Timeline | null = null;

  constructor(public entity: Entity) {
    super(entity);
    this.entity.healthPointsController.events.on('damagetaken', this._onDamageTaken);
  }

  public attachDamageHitbox(size: THREE.Vector3, damage: number, parentName: string): void {
    if (this._attackHitbox || !this.scene) return;
    this._attackHitbox = new DamageHitbox(
      this.scene,
      size,
      damage,
      (other) => other === this.gameObject
    );

    this.entity.modelRenderer.addAttachment({
      object: this._attackHitbox,
      parentName: parentName,
    });
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
    this.entity.healthPointsController.events.off('damagetaken', this._onDamageTaken);
  }

  private _onDamageTaken = () => {
    this.clearHitboxEvents();
  };
}
