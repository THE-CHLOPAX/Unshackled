import * as THREE from 'three';

import { Player } from '3D/classes/gameObjects/Player/Player';
import { GameScene } from '3D/classes/scenes/GameScene/GameScene';
import { EquipmentItemRecord, PlayerActionType } from 'renderer/types';
import { ModelRenderer } from '3D/classes/gameObjectComponents/ModelRenderer/ModelRenderer';
import { InteractiveObject } from '3D/classes/gameObjects/InteractiveObject/InteractiveObject';
import { getPickableObjectInitialY } from 'renderer/modules/3D/utils/getPickableObjectInitialY';

const PICK_ACTION = PlayerActionType.INTERACT;
const HINT_OFFSET = new THREE.Vector3(0, 1, 0);

export class PickableObject extends InteractiveObject {
  public readonly isPickableObject = true;

  public readonly modelRenderer: ModelRenderer;

  constructor(
    scene: GameScene,
    public readonly item: EquipmentItemRecord,
    public readonly quantity: number = 1
  ) {
    super(scene, {
      skipUpdate: true,
      title: `${item.name}${quantity > 1 ? ` (x${quantity})` : ''}`,
      hintOffset: HINT_OFFSET,
      interactions: {
        [PICK_ACTION]: {
          hint: { label: 'Pick', actionType: PICK_ACTION },
          onInteract: (player) => this._pick(player),
        },
      },
    });

    this.modelRenderer = this.addComponent(
      'ModelRenderer',
      new ModelRenderer(this, this.item.modelOptions)
    );

    this.position.y = getPickableObjectInitialY(this);
  }

  private _pick(player: Player): void {
    this.setInteractionEnabled(PICK_ACTION, false);
    player.equipmentController.pickItemObject(this);
  }
}
