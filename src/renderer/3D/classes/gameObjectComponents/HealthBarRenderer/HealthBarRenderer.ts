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
  offset: THREE.Vector3;
};

export class HealthBarRenderer extends BillboardRenderer {
  private _healthBarId: string;
  private _healthBarTimeout: NodeJS.Timeout | null = null;
  private _healthBarTween: GSAPTween | null = null;

  constructor(
    gameObject: Entity,
    public readonly healthPointsController: HealthPointsController,
    public readonly options: HealthBarRendererOptions = { offset: HEALTH_BAR_OFFSET }
  ) {
    super(gameObject);
    this._healthBarId = `health-bar-${gameObject.uuid}`;
  }

  // Subscribe to HealthPointController events.
  protected onAwake(): void {
    this.healthPointsController.events.on('damagetaken', this._updateHealthBar);
    this.healthPointsController.events.on('heal', this._updateHealthBar);
  }

  // Unsubscribe HealthPointController events.
  protected onDestroyed(): void {
    this.healthPointsController.events.off('damagetaken', this._updateHealthBar);
    this.healthPointsController.events.off('heal', this._updateHealthBar);
    this._removeHealthBar();
  }

  private _updateHealthBar = () => {
    if (this._healthBarTimeout) clearTimeout(this._healthBarTimeout);

    const progress =
      this.healthPointsController.healthPoints / this.healthPointsController.initialHealthPoints;

    const healthBarElement = this.getElement(this._healthBarId);
    if (healthBarElement) {
      this.updateElement(this._healthBarId, {
        progress,
      } satisfies HealthBarProps);
    } else {
      this.addElement(this._healthBarId, HealthBar, { progress }, { offset: this.options.offset });
    }

    this._healthBarTimeout = setTimeout(
      this._fadeHealthBar.bind(this),
      HEALTH_BAR_VISIBLE_DURATION_MS
    );
  };

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

    if (this._healthBarTween) {
      this._healthBarTween.kill();
      this._healthBarTween = null;
    }

    const healthBarElement = this.getElement(this._healthBarId);
    if (healthBarElement) {
      this.removeElement(this._healthBarId);
    }
  }
}
