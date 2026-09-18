import gsap from 'gsap';
import * as THREE from 'three';

import { HealthBar, HealthBarProps } from 'UI';

import { Entity } from '../../gameObjects/Entity';
import { HealthPointsController } from '../HealthPointsController';
import { BillboardRenderer } from '../BillboardRenderer/BillboardRenderer';
import {
  HEALTH_BAR_OFFSET,
  HEALTH_BAR_VISIBLE_DURATION_MS,
  HEALTH_BAR_FADE_DURATION_S,
  RECENT_DAMAGE_VISIBLE_DURATION_S,
} from './constants';

export type HealthBarRendererOptions = {
  offset: THREE.Vector3;
};

export class HealthBarRenderer extends BillboardRenderer {
  private _healthBarId: string;
  private _healthBarTimeout: NodeJS.Timeout | null = null;
  private _syncRecentDamageTimeout: NodeJS.Timeout | null = null;
  private _healthBarTween: GSAPTween | null = null;
  private _hasElement: boolean = false;
  private _lastProgress: number;
  private _recentDamageAccumulator = 0;

  constructor(
    public readonly entity: Entity,
    public readonly healthPointsController: HealthPointsController,
    public readonly options: HealthBarRendererOptions = { offset: HEALTH_BAR_OFFSET }
  ) {
    super(entity);
    this._healthBarId = `health-bar-${entity.uuid}`;

    const { healthPoints, initialHealthPoints } = healthPointsController;
    this._lastProgress = healthPoints / initialHealthPoints;
  }

  // Subscribe to HealthPointController events.
  protected onAwake(): void {
    this.healthPointsController.events.on('damagetaken', this._updateHealthBar);
    this.healthPointsController.events.on('death', this._updateHealthBar);
    this.healthPointsController.events.on('heal', this._updateHealthBar);
  }

  // Unsubscribe HealthPointController events.
  protected onDestroyed(): void {
    this.healthPointsController.events.off('damagetaken', this._updateHealthBar);
    this.healthPointsController.events.off('death', this._updateHealthBar);
    this.healthPointsController.events.off('heal', this._updateHealthBar);
    this._removeHealthBar();
  }

  private _updateHealthBar = () => {
    if (this._healthBarTimeout) clearTimeout(this._healthBarTimeout);
    if (this._syncRecentDamageTimeout) clearTimeout(this._syncRecentDamageTimeout);

    const progress =
      this.healthPointsController.healthPoints / this.healthPointsController.initialHealthPoints;

    const progressDelta = this._lastProgress - progress;

    this._recentDamageAccumulator += progressDelta;

    if (this._hasElement) {
      // Reset and kill fade tween if active
      if (this._healthBarTween) {
        this._healthBarTween.revert();
        this._healthBarTween.kill();
        this._healthBarTween = null;
      }

      this.updateElement(this._healthBarId, {
        entity: this.entity,
        progress,
        fadeOutEnabled: false,
        progressDelta,
        progressDeltaAccumulated: this._recentDamageAccumulator,
      } satisfies HealthBarProps);
    } else {
      this._hasElement = true;
      this.addElement(
        this._healthBarId,
        HealthBar,
        {
          entity: this.entity,
          progress,
          fadeOutEnabled: false,
          progressDelta,
          progressDeltaAccumulated: this._recentDamageAccumulator,
        },
        { offset: this.options.offset }
      );
    }

    this._healthBarTimeout = setTimeout(
      this._fadeHealthBar.bind(this),
      HEALTH_BAR_VISIBLE_DURATION_MS
    );

    this._lastProgress = progress;

    this._syncRecentDamageTimeout = setTimeout(
      this._syncRecentDamageToProgress.bind(this),
      RECENT_DAMAGE_VISIBLE_DURATION_S * 1000
    );
  };

  private _syncRecentDamageToProgress(): void {
    this._recentDamageAccumulator = 0;
    this.updateElement(this._healthBarId, {
      progress: this._lastProgress,
      progressDelta: 0,
      progressDeltaAccumulated: this._recentDamageAccumulator,
      fadeOutEnabled: true,
    });
  }

  private _fadeHealthBar(): void {
    const healthBarElement = this.getElement(this._healthBarId);
    if (!healthBarElement) return;
    this._healthBarTween = gsap.to(healthBarElement, {
      opacity: 0,
      duration: HEALTH_BAR_FADE_DURATION_S,
      onComplete: () => this._removeHealthBar(),
    });
  }

  private _removeHealthBar(): void {
    if (this._healthBarTimeout) {
      clearTimeout(this._healthBarTimeout);
      this._healthBarTimeout = null;
    }

    if (this._syncRecentDamageTimeout) {
      clearTimeout(this._syncRecentDamageTimeout);
      this._syncRecentDamageTimeout = null;
    }

    if (this._healthBarTween) {
      this._healthBarTween.kill();
      this._healthBarTween = null;
    }

    const healthBarElement = this.getElement(this._healthBarId);
    if (healthBarElement) {
      this.removeElement(this._healthBarId);
      this._hasElement = false;
    }
  }
}
