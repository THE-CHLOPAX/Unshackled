import { assert, clamp, Emitter, GameObjectComponent } from '@tgdf';

import { Entity } from '../gameObjects/Entity';

export const SHORT_TERM_STAMINA_REPLENISH_TIMEOUT_S = 1;
export const GENERAL_REPLENISH_RATE_PER_S = 25;

export type StaminaPointsControllerEvents = {
  'short-term-stamina-change': number;
  'long-term-stamina-change': number;
  'max-short-term-stamina-change': number;
  'max-long-term-stamina-change': number;
};

export type StaminaPointsControllerOptions = {
  maxLongTermStamina: number;
  maxShortTermStamina: number;
};

export class StaminaPointsController extends GameObjectComponent {
  private _longTermStamina: number;
  private _maxLongTermStamina: number;
  private _shortTermStamina: number;
  private _maxShortTermStamina: number;

  private _timeSinceShortTermDrainAttemptS = 0;

  public events: Emitter<StaminaPointsControllerEvents> = new Emitter();

  constructor(
    gameObject: Entity,
    public readonly options: StaminaPointsControllerOptions
  ) {
    super(gameObject);

    assert(
      options.maxLongTermStamina >= 0 && options.maxShortTermStamina >= 0,
      '[StaminaPointsController] Max stamina cannot be negative.'
    );
    this._maxLongTermStamina = options.maxLongTermStamina;
    this._maxShortTermStamina = options.maxShortTermStamina;
    this._longTermStamina = options.maxLongTermStamina;
    this._shortTermStamina = options.maxShortTermStamina;
  }

  public get longTermStamina(): number {
    return this._longTermStamina;
  }

  public get shortTermStamina(): number {
    return this._shortTermStamina;
  }

  public get maxLongTermStamina(): number {
    return this._maxLongTermStamina;
  }

  public get maxShortTermStamina(): number {
    return this._maxShortTermStamina;
  }

  public setMaxLongTermStamina(maxLongTermStamina: number): void {
    const clamped = Math.max(0, maxLongTermStamina);

    if (this._maxLongTermStamina === clamped) return;
    this._maxLongTermStamina = clamped;

    if (this._longTermStamina > this._maxLongTermStamina) {
      this.setLongTermStamina(this._maxLongTermStamina);
    }

    this.events.trigger('max-long-term-stamina-change', this._maxLongTermStamina);
  }

  public setMaxShortTermStamina(maxShortTermStamina: number): void {
    const clamped = Math.max(0, maxShortTermStamina);

    if (this._maxShortTermStamina === clamped) return;
    this._maxShortTermStamina = clamped;

    if (this._shortTermStamina > this._maxShortTermStamina) {
      this.setShortTermStamina(this._maxShortTermStamina);
    }

    this.events.trigger('max-short-term-stamina-change', this._maxShortTermStamina);
  }

  public setShortTermStamina(shortTermStamina: number): void {
    this._setStamina(clamp(shortTermStamina, 0, this._maxShortTermStamina), this._longTermStamina);
  }

  public setLongTermStamina(longTermStamina: number): void {
    this._setStamina(this._shortTermStamina, clamp(longTermStamina, 0, this._maxLongTermStamina));
  }

  public markShortTermDrainAttempt(): void {
    this._timeSinceShortTermDrainAttemptS = 0;
  }

  public drainShortTermStamina(amount: number): number {
    this.markShortTermDrainAttempt();

    if (amount <= 0) return 0;

    const drained = Math.min(amount, this._shortTermStamina);

    this.setShortTermStamina(this._shortTermStamina - drained);

    return drained;
  }

  public restoreShortTermStamina(amount: number): void {
    if (amount <= 0) return;

    this.setShortTermStamina(this._shortTermStamina + amount);
  }

  public drainLongTermStamina(amount: number): number {
    if (amount <= 0) return 0;

    const drained = Math.min(amount, this._longTermStamina);
    this.setLongTermStamina(this._longTermStamina - drained);

    return drained;
  }

  public restoreLongTermStamina(amount: number): void {
    if (amount <= 0) return;

    this.setLongTermStamina(this._longTermStamina + amount);
  }

  protected override onUpdate(deltaTime: number): void {
    this._timeSinceShortTermDrainAttemptS += deltaTime;

    this._refillShortTermStamina(deltaTime);
  }

  protected override onDestroyed(): void {
    this.events.removeAll();
  }

  private _refillShortTermStamina(deltaTime: number): void {
    if (
      this._timeSinceShortTermDrainAttemptS <= SHORT_TERM_STAMINA_REPLENISH_TIMEOUT_S ||
      this._shortTermStamina >= this._maxShortTermStamina ||
      this._longTermStamina <= 0
    )
      return;

    const shortTermDiffFromMax = this._maxShortTermStamina - this._shortTermStamina;
    const toDrain = Math.min(GENERAL_REPLENISH_RATE_PER_S * deltaTime, shortTermDiffFromMax);
    const drained = this.drainLongTermStamina(toDrain);
    this.restoreShortTermStamina(drained);
  }

  private _setStamina(shortTermStamina: number, longTermStamina: number): void {
    if (shortTermStamina !== this._shortTermStamina) {
      this._shortTermStamina = shortTermStamina;
      this.events.trigger('short-term-stamina-change', shortTermStamina);
    }

    if (longTermStamina !== this._longTermStamina) {
      this._longTermStamina = longTermStamina;
      this.events.trigger('long-term-stamina-change', longTermStamina);
    }
  }
}
