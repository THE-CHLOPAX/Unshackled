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
} from './constants';

export type HealthBarRendererOptions = {
  name?: string;
  offset: THREE.Vector3;
};

export class HealthBarRenderer extends BillboardRenderer {
  private _healthBarId: string;
  private _healthBarTimeout: NodeJS.Timeout | null = null;
  private _healthBarTween: GSAPTween | null = null;
  private _hasElement: boolean = false;
  private _lastProgress = 1;

  constructor(
    public readonly entity: Entity,
    public readonly healthPointsController: HealthPointsController,
    public readonly options: HealthBarRendererOptions = { offset: HEALTH_BAR_OFFSET }
  ) {
    super(entity);
    this._healthBarId = `health-bar-${entity.uuid}`;
  }

  // Subscribe to HealthPointController events.
  protected onAwake(): void {
    const { healthPoints, maxHealthPoints } = this.healthPointsController;
    this._lastProgress = healthPoints / maxHealthPoints;

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

    const progress =
      this.healthPointsController.healthPoints / this.healthPointsController.maxHealthPoints;

    if (this._hasElement) {
      // Reset and kill fade tween if active
      if (this._healthBarTween) {
        this._healthBarTween.revert();
        this._healthBarTween.kill();
        this._healthBarTween = null;
      }

      this.updateElement<HealthBarProps>(this._healthBarId, { progress });
    } else {
      this._hasElement = true;
      this.addElement(
        this._healthBarId,
        HealthBar,
        {
          entity: this.entity,
          name: this.options.name,
          progress,
          initialProgress: this._lastProgress,
        } satisfies HealthBarProps,
        { offset: this.options.offset }
      );
    }

    this._healthBarTimeout = setTimeout(
      this._fadeHealthBar.bind(this),
      HEALTH_BAR_VISIBLE_DURATION_MS
    );

    this._lastProgress = progress;
  };

  private _fadeHealthBar(): void {
    const healthBarElements = this.getElements(this._healthBarId);
    if (healthBarElements.length === 0) {
      this._removeHealthBar();
      return;
    }

    this._healthBarTween = gsap.to(healthBarElements, {
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

    if (this._healthBarTween) {
      this._healthBarTween.kill();
      this._healthBarTween = null;
    }

    if (this._hasElement) {
      this.removeElement(this._healthBarId);
      this._hasElement = false;
    }
  }
}
