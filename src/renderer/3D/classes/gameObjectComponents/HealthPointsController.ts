import gsap from 'gsap';
import * as THREE from 'three';
import { assert, Emitter, GameObjectComponent, logger } from '@tgdf';

import { Entity } from '../gameObjects/Entity';

export type HealthPointsControllerEvents = {
  damagetaken: { currentHealth: number; damageAmount: number };
  heal: { currentHealth: number; healAmount: number };
  death: void;
};

export type HealthPointsControllerOptions = {
  initialHealthPoints: number;
};

export class HealthPointsController extends GameObjectComponent {
  private _healthPoints: number;
  private _isDead: boolean = false;
  private _isImmuneToDamage: boolean = false;

  public events: Emitter<HealthPointsControllerEvents> = new Emitter();

  constructor(
    gameObject: Entity,
    public readonly options: HealthPointsControllerOptions
  ) {
    super(gameObject);

    assert(
      options.initialHealthPoints > 0,
      '[HealthPointsController] Initial health points must be greater than zero.'
    );

    this._healthPoints = options.initialHealthPoints;
  }

  public get isImmuneToDamage(): boolean {
    return this._isImmuneToDamage;
  }

  public set isImmuneToDamage(value: boolean) {
    this._isImmuneToDamage = value;
  }

  public get healthPoints(): number {
    return this._healthPoints;
  }

  public get initialHealthPoints(): number {
    return this.options.initialHealthPoints;
  }

  public override get gameObject(): Entity {
    return super.gameObject as Entity;
  }

  public get isDead(): boolean {
    return this._isDead;
  }

  public inflictDamage(amount: number): void {
    if (this._isDead || this._isImmuneToDamage) return;

    if (amount <= 0) {
      logger({
        message: '[HealthPointsController] Damage amount must be positive',
        type: 'warn',
      });
      return;
    }
    this._healthPoints = Math.max(this._healthPoints - amount, 0);
    this.events.trigger('damagetaken', { currentHealth: this._healthPoints, damageAmount: amount });
    this._isDead = this._healthPoints === 0;

    if (this._isDead) {
      this.events.trigger('death');
    }
  }

  public healDamage(amount: number): void {
    if (amount <= 0) {
      logger({
        message: '[HealthPointsController] Heal amount must be positive',
        type: 'warn',
      });
      return;
    }
    // Allow overhealing
    this._healthPoints = this._healthPoints + amount;
    this.events.trigger('heal', { currentHealth: this._healthPoints, healAmount: amount });
    this._isDead = this._healthPoints === 0;
  }

  public resetHealth(): void {
    this._healthPoints = this.options.initialHealthPoints;
    this._isDead = false;
  }

  public flashRed(onComplete?: () => void): void {
    const modelMaterials = this.gameObject.modelRenderer.getModelMaterials();

    if (!modelMaterials) return;

    modelMaterials.forEach((material) => {
      if (!('color' in material)) return;

      const color = material.color;

      if (color instanceof THREE.Color) {
        gsap.to(color, {
          r: 1,
          g: 0,
          b: 0,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            onComplete?.();
          },
        });
      }
    });
  }
}
