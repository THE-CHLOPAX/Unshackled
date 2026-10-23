import * as THREE from 'three';
import { assert, Emitter, GameObject, RigidBody, Scene } from '@tgdf';

export type DetectionZoneShapeOptions = {
  size: THREE.Vector3;
  shape?: 'box' | 'sphere';
};

export type DetectionZoneOptions = DetectionZoneShapeOptions & {
  filter: (object: GameObject) => boolean;
};

export type DetectionZoneEventMap<T extends GameObject> = {
  'object-entered': { object: T };
  'object-left': { object: T };
};

export class DetectionZone<
  T extends GameObject = GameObject,
  TEventMap extends DetectionZoneEventMap<T> = DetectionZoneEventMap<T>,
> extends GameObject {
  public readonly rigidBody: RigidBody;
  public readonly zoneEvents = new Emitter<TEventMap>();

  private readonly _filter: (object: GameObject) => boolean;
  private readonly _onObjectDestroyed = new Map<T, () => void>();

  constructor(scene: Scene, options: DetectionZoneOptions) {
    super({ scene });

    this.name = 'DetectionZone';
    this._filter = options.filter;

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

  public get objects(): T[] {
    return Array.from(this._onObjectDestroyed.keys());
  }

  public has(object: T): boolean {
    return this._onObjectDestroyed.has(object);
  }

  public toggleDebug(enabled: boolean): void {
    this.rigidBody.toggleDebug(enabled);
  }

  public toggleDetection(enabled: boolean): void {
    this.rigidBody.setEnabled(enabled);

    if (!enabled) {
      for (const object of this.objects) {
        this._removeObject(object);
      }
    } else {
      const zonePhysicsCollider = this.rigidBody.getPhysicsCollider();
      assert(zonePhysicsCollider, 'Zone physics collider unavailable upon toggling detection');

      const world = this.scene.physics?.world;
      assert(world, 'Physics world unavailable upon toggling detection');

      world.intersectionPairsWith(zonePhysicsCollider, (otherCollider) => {
        const bodyHandle = otherCollider.parent()?.handle;
        if (bodyHandle === undefined) return;
        const otherObject = this.scene.physics?.getObjectFromHandle(bodyHandle);
        if (!(otherObject instanceof GameObject) || !this._filter(otherObject)) return;
        this._addObject(otherObject as T);
      });
    }
  }

  protected onObjectTracked(_object: T): void {}

  protected onObjectUntracked(_object: T): void {}

  protected override onAwake(): void {
    super.onAwake();

    this.rigidBody.addCollisionListener(`detection-zone-${this.id}`, ({ otherBody, started }) => {
      const otherObject = otherBody.gameObject;
      if (otherObject === undefined || !this._filter(otherObject)) return;

      if (started) {
        this._addObject(otherObject as T);
      } else {
        this._removeObject(otherObject as T);
      }
    });
  }

  protected override onDestroyed(): void {
    for (const object of this.objects) {
      this._untrack(object);
    }
    this._onObjectDestroyed.clear();
    super.onDestroyed();
  }

  private get _baseEvents(): Emitter<DetectionZoneEventMap<T>> {
    return this.zoneEvents as unknown as Emitter<DetectionZoneEventMap<T>>;
  }

  private _addObject(object: T): void {
    if (this._onObjectDestroyed.has(object)) return;

    const onDestroyed = () => this._removeObject(object);
    this._onObjectDestroyed.set(object, onDestroyed);
    object.events.once('destroyed', onDestroyed);
    this.onObjectTracked(object);

    this._baseEvents.trigger('object-entered', { object });
  }

  private _removeObject(object: T): void {
    if (!this._onObjectDestroyed.has(object)) return;

    this._untrack(object);
    this._onObjectDestroyed.delete(object);

    this._baseEvents.trigger('object-left', { object });
  }

  private _untrack(object: T): void {
    const onDestroyed = this._onObjectDestroyed.get(object);
    if (!onDestroyed) return;

    object.events.off('destroyed', onDestroyed);
    this.onObjectUntracked(object);
  }
}
