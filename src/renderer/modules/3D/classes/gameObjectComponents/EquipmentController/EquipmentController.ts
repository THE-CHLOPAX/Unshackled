import { GameObjectComponent } from '@tgdf';

import { EquipmentItemRecord } from 'renderer/types';
import { Player } from '3D/classes/gameObjects/Player/Player';
import { PickableObject } from '3D/classes/gameObjects/PickableObject/PickableObject';

export type EquipmentControllerItemRecord = {
  item: EquipmentItemRecord;
  quantity: number;
};

export class EquipmentController extends GameObjectComponent {
  private _items: Map<string, EquipmentControllerItemRecord> = new Map();

  constructor(gameObject: Player) {
    super(gameObject);
  }

  public override get gameObject(): Player {
    return super.gameObject as Player;
  }

  public get items(): Map<string, EquipmentControllerItemRecord> {
    return this._items;
  }

  public pickItemObject(gameObject: PickableObject) {
    if (!this.addItem(gameObject.item, gameObject.quantity)) return;
    this.gameObject.scene.remove(gameObject);
  }

  public dropItemObject(item: EquipmentItemRecord, quantity: number = 1): void {
    if (!this.removeItem(item, quantity)) return;

    const itemObject = new PickableObject(this.gameObject.scene, item, quantity);

    itemObject.position.x = this.gameObject.position.x;
    itemObject.position.z = this.gameObject.position.z;

    this.gameObject.scene.add(itemObject);
  }

  public addItem(item: EquipmentItemRecord, quantity: number = 1): boolean {
    if (quantity <= 0) return false;
    const currentQuantity = this._items.get(item.id)?.quantity ?? 0;
    this._items.set(item.id, { item, quantity: currentQuantity + quantity });
    return true;
  }

  public removeItem(item: EquipmentItemRecord, quantity: number = 1): boolean {
    if (quantity <= 0) return false;
    const currentQuantity = this._items.get(item.id)?.quantity ?? 0;

    if (currentQuantity < quantity) return false;

    const newQuantity = currentQuantity - quantity;
    if (newQuantity > 0) {
      this._items.set(item.id, { item, quantity: newQuantity });
    } else if (newQuantity === 0) {
      this._items.delete(item.id);
    }
    return true;
  }
}
