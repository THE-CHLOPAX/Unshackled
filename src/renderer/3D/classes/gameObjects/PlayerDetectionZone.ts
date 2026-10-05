import * as THREE from 'three';
import { Emitter, GameObject, RigidBody, Scene } from '@tgdf';

import { isPlayer } from '3D/utils/isPlayer';

import { Player } from './players/Player';
import { PlayerActionEvent } from './players/PlayerRegisterableInputSource';

export type PlayerDetectionZoneOptions = {
  size: THREE.Vector3;
  shape?: 'box' | 'sphere';
};

export type PlayerDetectionZoneEventMap = {
  'player-entered': { player: Player };
  'player-left': { player: Player };
  'player-action': { player: Player; action: PlayerActionEvent };
};

type PlayerSubscription = {
  onAction: (action: PlayerActionEvent) => void;
  onDestroyed: () => void;
};

export class PlayerDetectionZone extends GameObject {
  public readonly rigidBody: RigidBody;
  public readonly playerEvents = new Emitter<PlayerDetectionZoneEventMap>();

  private readonly _playerSubscriptions = new Map<Player, PlayerSubscription>();

  constructor(scene: Scene, options: PlayerDetectionZoneOptions) {
    super({ scene });

    this.name = 'PlayerDetectionZone';

    this.rigidBody = this.addComponent(
      'RigidBody',
      new RigidBody(this, {
        type: 'kinematic',
        sensor: true,
        enableCollisionDetection: true,
        colliderShape: options.shape ?? 'box',
        colliderSize: options.size,
      })
    );
  }

  public get players(): Player[] {
    return Array.from(this._playerSubscriptions.keys());
  }

  public toggleDebug(enabled: boolean): void {
    this.rigidBody.toggleDebug(enabled);
  }

  public hasPlayer(player: Player): boolean {
    return this._playerSubscriptions.has(player);
  }

  protected override onAwake(): void {
    super.onAwake();

    this.rigidBody.addCollisionListener(
      `player-detection-zone-${this.id}`,
      ({ otherBody, started }) => {
        const otherObject = otherBody.gameObject;
        if (otherObject === undefined || !isPlayer(otherObject)) return;

        if (started) {
          this._addPlayer(otherObject);
        } else {
          this._removePlayer(otherObject);
        }
      }
    );
  }

  protected override onDestroyed(): void {
    for (const player of this.players) {
      this._unsubscribe(player);
    }
    this._playerSubscriptions.clear();
    super.onDestroyed();
  }

  private _addPlayer(player: Player): void {
    if (this._playerSubscriptions.has(player)) return;

    const subscription: PlayerSubscription = {
      onAction: (action) => this.playerEvents.trigger('player-action', { player, action }),
      onDestroyed: () => this._removePlayer(player),
    };

    this._playerSubscriptions.set(player, subscription);
    player.inputSource.events.on('player-action', subscription.onAction);
    player.events.once('destroyed', subscription.onDestroyed);

    this.playerEvents.trigger('player-entered', { player });
  }

  private _removePlayer(player: Player): void {
    if (!this._playerSubscriptions.has(player)) return;

    this._unsubscribe(player);
    this._playerSubscriptions.delete(player);

    this.playerEvents.trigger('player-left', { player });
  }

  private _unsubscribe(player: Player): void {
    const subscription = this._playerSubscriptions.get(player);
    if (!subscription) return;

    player.inputSource.events.off('player-action', subscription.onAction);
    player.events.off('destroyed', subscription.onDestroyed);
  }
}
