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
    this._isDead = this._healthPoints === 0;

    if (this._isDead) {
      this.events.trigger('death');
    } else {
      this.events.trigger('damagetaken', {
        currentHealth: this._healthPoints,
        damageAmount: amount,
      });
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

    const oldHealthPoints = this._healthPoints;
    this._healthPoints = Math.min(this.initialHealthPoints, this._healthPoints + amount);

    const healAmount = this._healthPoints - oldHealthPoints;

    this.events.trigger('heal', { currentHealth: this._healthPoints, healAmount });
    this._isDead = this._healthPoints === 0;
  }

  public resetHealth(): void {
    this._healthPoints = this.options.initialHealthPoints;
    this._isDead = false;
  }
}
