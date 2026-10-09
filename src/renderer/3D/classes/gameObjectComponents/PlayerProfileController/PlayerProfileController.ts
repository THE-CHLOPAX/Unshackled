import { GameObjectComponent } from '@tgdf';

import { useRunStore } from 'Store/useRunStore';

import { Entity } from '../../gameObjects/Entity';
import { HealthPointsController } from '../HealthPointsController';

export class PlayerProfileController extends GameObjectComponent {
  constructor(
    gameObject: Entity,
    public readonly playerProfileId: string,
    private readonly _healthPointsController: HealthPointsController
  ) {
    super(gameObject);

    this._healthPointsController.events.on('damagetaken', this._syncHealthPoints);
    this._healthPointsController.events.on('heal', this._syncHealthPoints);
    this._healthPointsController.events.on('death', this._syncHealthPoints);
  }

  protected override onDestroyed(): void {
    this._healthPointsController.events.off('damagetaken', this._syncHealthPoints);
    this._healthPointsController.events.off('heal', this._syncHealthPoints);
    this._healthPointsController.events.off('death', this._syncHealthPoints);
  }

  private _syncHealthPoints = (): void => {
    useRunStore.getState().updatePlayerProfile(this.playerProfileId, {
      currentHealthPoints: this._healthPointsController.healthPoints,
    });
  };
}
