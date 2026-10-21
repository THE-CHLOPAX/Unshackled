import { assert, Emitter, GameObjectComponent, logger } from '@tgdf';

import { Entity } from '3D/classes/gameObjects/Entity';

export type HealthPointsControllerEvents = {
  damagetaken: { currentHealth: number; damageAmount: number };
  heal: { currentHealth: number; healAmount: number };
  death: void;
};

export type HealthPointsControllerOptions = {
  maxHealthPoints: number;
};

export class HealthPointsController extends GameObjectComponent {
  private _healthPoints: number;
  private _maxHealthPoints: number;
  private _isDead: boolean = false;
  private _isImmuneToDamage: boolean = false;

  public events: Emitter<HealthPointsControllerEvents> = new Emitter();

  constructor(
    gameObject: Entity,
    public readonly options: HealthPointsControllerOptions
  ) {
    super(gameObject);

    assert(
      options.maxHealthPoints > 0,
      '[HealthPointsController] Max health points must be greater than zero.'
    );

    this._healthPoints = options.maxHealthPoints;
    this._maxHealthPoints = options.maxHealthPoints;
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

  public get maxHealthPoints(): number {
    return this._maxHealthPoints;
  }

  public override get gameObject(): Entity {
    return super.gameObject as Entity;
  }

  public get isDead(): boolean {
    return this._isDead;
  }

  protected override onDestroyed(): void {
    this.events.removeAll();
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
    this._healthPoints = Math.min(this._maxHealthPoints, this._healthPoints + amount);

    const healAmount = this._healthPoints - oldHealthPoints;

    this.events.trigger('heal', { currentHealth: this._healthPoints, healAmount });
    this._isDead = this._healthPoints === 0;
  }

  public setHealthPoints(value: number): void {
    this._healthPoints = Math.min(Math.max(value, 0), this._maxHealthPoints);
    this._isDead = this._healthPoints === 0;
  }

  public setMaxHealthPoints(value: number): void {
    assert(value > 0, '[HealthPointsController] Max health points must be greater than zero.');

    this._maxHealthPoints = value;
    this.setHealthPoints(this._healthPoints);
  }

  public resetHealth(): void {
    this._healthPoints = this._maxHealthPoints;
    this._isDead = false;
  }
}
