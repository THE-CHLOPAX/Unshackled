import gsap from 'gsap';
import * as THREE from 'three';

import { Entity } from '3D/classes/gameObjects/Entity';
import { StaminaBar, StaminaBarProps } from 'UI/components/StaminaBar/StaminaBar';
import { StaminaPointsController } from '3D/classes/gameObjectComponents/StaminaPointsController';
import { BillboardRegistry } from '3D/classes/scenes/GameScene/BillboardRegistry/BillboardRegistry';
import { BillboardRenderer } from '3D/classes/gameObjectComponents/BillboardRenderer/BillboardRenderer';
import {
  STAMINA_BAR_OFFSET,
  STAMINA_BAR_HIDE_DELAY_MS,
  STAMINA_BAR_IDLE_HIDE_DELAY_MS,
  STAMINA_BAR_FADE_DURATION_S,
  STAMINA_BAR_PROGRESS_STEPS,
} from '3D/classes/gameObjectComponents/StaminaBarRenderer/constants';

export class StaminaBarRenderer extends BillboardRenderer {
  private _staminaBarId: string;
  private _hideTimeout: NodeJS.Timeout | null = null;
  private _fadeTween: GSAPTween | null = null;
  private _hasElement = false;
  private _lastProgress = 1;

  constructor(
    public readonly entity: Entity,
    registry: BillboardRegistry,
    public readonly staminaPointsController: StaminaPointsController,
    public readonly offset: THREE.Vector3 = STAMINA_BAR_OFFSET
  ) {
    super(entity, registry);
    this._staminaBarId = `stamina-bar-${entity.uuid}`;
  }

  protected override onAwake(): void {
    this._lastProgress = this._getProgress();
    this.staminaPointsController.events.on('short-term-stamina-change', this._updateStaminaBar);
  }

  protected override onDestroyed(): void {
    this.staminaPointsController.events.off('short-term-stamina-change', this._updateStaminaBar);
    this._removeStaminaBar();
    super.onDestroyed();
  }

  private _getProgress(): number {
    const { shortTermStamina, maxShortTermStamina } = this.staminaPointsController;
    const progress = shortTermStamina / maxShortTermStamina;
    return Math.round(progress * STAMINA_BAR_PROGRESS_STEPS) / STAMINA_BAR_PROGRESS_STEPS;
  }

  private _updateStaminaBar = () => {
    const progress = this._getProgress();
    if (progress === this._lastProgress) return;

    if (this._hideTimeout) {
      clearTimeout(this._hideTimeout);
      this._hideTimeout = null;
    }

    if (this._hasElement) {
      if (this._fadeTween) {
        this._fadeTween.revert();
        this._fadeTween.kill();
        this._fadeTween = null;
      }

      this.updateElement<StaminaBarProps>(this._staminaBarId, { progress });
    } else {
      this._hasElement = true;
      this.addElement(this._staminaBarId, StaminaBar, { progress } satisfies StaminaBarProps, {
        offset: this.offset,
      });
    }

    this._hideTimeout = setTimeout(
      this._fadeStaminaBar.bind(this),
      progress >= 1 ? STAMINA_BAR_HIDE_DELAY_MS : STAMINA_BAR_IDLE_HIDE_DELAY_MS
    );

    this._lastProgress = progress;
  };

  private _fadeStaminaBar(): void {
    this._hideTimeout = null;

    const staminaBarElements = this.getElements(this._staminaBarId);
    if (staminaBarElements.length === 0) {
      this._removeStaminaBar();
      return;
    }

    this._fadeTween = gsap.to(staminaBarElements, {
      opacity: 0,
      duration: STAMINA_BAR_FADE_DURATION_S,
      onComplete: () => this._removeStaminaBar(),
    });
  }

  private _removeStaminaBar(): void {
    if (this._hideTimeout) {
      clearTimeout(this._hideTimeout);
      this._hideTimeout = null;
    }

    if (this._fadeTween) {
      this._fadeTween.kill();
      this._fadeTween = null;
    }

    if (this._hasElement) {
      this.removeElement(this._staminaBarId);
      this._hasElement = false;
    }
  }
}
