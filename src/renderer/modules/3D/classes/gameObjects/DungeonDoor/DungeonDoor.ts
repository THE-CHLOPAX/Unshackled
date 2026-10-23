import { gsap } from 'gsap';
import * as THREE from 'three';
import { assert, GameObject, getModelFromStore, isMesh, RigidBody } from '@tgdf';

import { PlayerActionType } from 'renderer/types';
import { MODELS, WORLD_CELL_SIZE } from '3D/constants';
import { GameScene } from '3D/classes/scenes/GameScene/GameScene';
import { pixelateModelMaterial } from '3D/utils/pixelateModelMaterial';
import { InteractiveObject } from '3D/classes/gameObjects/InteractiveObject/InteractiveObject';

const HINT_OFFSET = new THREE.Vector3(0, 3, 0);
const TOGGLE_ACTION = PlayerActionType.INTERACT;

const OPEN_ANGLE = -Math.PI / 2;
const OPEN_CLOSE_DURATION_S = 0.4;

export class DungeonDoor extends InteractiveObject {
  private _leaf: GameObject;
  private _rigidBody: RigidBody;
  private _size = new THREE.Vector3();
  private _isOpen = false;
  private _rotationTween: gsap.core.Tween | null = null;

  constructor(scene: GameScene) {
    super(scene, {
      title: 'Dungeon Door',
      hintOffset: HINT_OFFSET,
      interactions: {
        [TOGGLE_ACTION]: {
          hint: { actionType: TOGGLE_ACTION, label: 'Open' },
          onInteract: () => this.toggle(),
        },
      },
    });

    const doorModel = getModelFromStore(MODELS.DUNGEON_DOOR.id);
    assert(isMesh(doorModel), 'Model is not a mesh');

    const { material } = doorModel;

    pixelateModelMaterial(material);

    doorModel.scale.setScalar(0.6);
    doorModel.rotation.z = Math.PI / 2;

    new THREE.Box3().setFromObject(doorModel).getSize(this._size);
    const halfDepth = this._size.z / 2;

    this._leaf = new GameObject({ scene });
    this._leaf.position.set(0, 0, -halfDepth);
    doorModel.position.z += halfDepth;
    doorModel.position.y += WORLD_CELL_SIZE / 2;
    this._leaf.add(doorModel);
    this.add(this._leaf);

    this._rigidBody = this._leaf.addComponent(
      'RigidBody',
      new RigidBody(this._leaf, {
        type: 'kinematic',
        colliderShape: 'box',
      })
    );
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  public toggle(): void {
    if (this._isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public open(): void {
    if (this._isOpen) return;
    this._isOpen = true;
    this.setHint(TOGGLE_ACTION, { label: 'Close' });
    this._rotateLeafTo(OPEN_ANGLE);
  }

  public close(): void {
    if (!this._isOpen) return;
    this._isOpen = false;
    this.setHint(TOGGLE_ACTION, { label: 'Open' });
    this._rotateLeafTo(0);
  }

  protected override onDestroyed(): void {
    this._rotationTween?.kill();
    this._rotationTween = null;
    super.onDestroyed();
  }

  private _rotateLeafTo(angle: number): void {
    this._rotationTween?.kill();
    this._rotationTween = gsap.to(this._leaf.rotation, {
      y: angle,
      duration: OPEN_CLOSE_DURATION_S,
      ease: 'power2.inOut',
      onComplete: () => {
        this._rotationTween = null;
      },
    });
  }
}
