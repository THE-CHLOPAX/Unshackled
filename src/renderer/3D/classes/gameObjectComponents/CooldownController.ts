import { GameObjectComponent } from '@tgdf';

import { Entity } from '../gameObjects/Entity';

export class CooldownController extends GameObjectComponent {
  private _cooldownEndsAt = new Map<string, number>();

  constructor(public entity: Entity) {
    super(entity);
  }

  public isOnCooldown(key: string): boolean {
    const endsAt = this._cooldownEndsAt.get(key);
    return endsAt !== undefined && performance.now() < endsAt;
  }

  public startCooldown(key: string, durationMs: number): void {
    this._cooldownEndsAt.set(key, performance.now() + durationMs);
  }
}
