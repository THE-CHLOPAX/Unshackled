import { gsap } from 'gsap';
import * as THREE from 'three';
import { assert, GameObject, getModelFromStore, isMesh, RigidBody, Scene } from '@tgdf';

import { PlayerActionType } from '3D/types';
import { FMOD_EVENTS } from 'renderer/FMOD/constants';
import { MODELS, WORLD_CELL_SIZE } from '3D/constants';
import { pixelateModelMaterial } from 'renderer/3D/utils/pixelateModelMaterial';

import { FMODSoundController } from '../../gameObjectComponents/FMODSoundController';
import { HintBillboardRenderer } from '../../gameObjectComponents/HintBillboardRenderer/HintBillboardRenderer';
import { InteractionController } from '../../gameObjectComponents/InteractionController/InteractionController';

const INTERACTION_RADIUS = 1;
const NAME_DISPLAY_RADIUS = INTERACTION_RADIUS * 2;
const HINT_OFFSET = new THREE.Vector3(0, 3, 0);
const TOGGLE_ACTION = PlayerActionType.ACTION_DOWN;

const OPEN_ANGLE = -Math.PI / 2;
const OPEN_CLOSE_DURATION_S = 0.4;

export class DungeonDoor extends GameObject {
  private _leaf: GameObject;
  private _rigidBody: RigidBody;
  private _size = new THREE.Vector3();
  private _interactionController: InteractionController;
  private _isOpen = false;
  private _rotationTween: gsap.core.Tween | null = null;
  private _fmodSoundController: FMODSoundController;

  constructor(scene: Scene) {
    super({ scene });

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

    this._fmodSoundController = this.addComponent(
      'FMODSoundController',
      new FMODSoundController(this)
    );

    const hintRenderer = this.addComponent(
      'HintBillboardRenderer',
      new HintBillboardRenderer(this, { offset: HINT_OFFSET })
    );

    this._interactionController = this.addComponent(
      'InteractionController',
      new InteractionController(this, hintRenderer, {
        interactionRadius: INTERACTION_RADIUS,
        name: {
          label: 'Dungeon Door',
          radius: NAME_DISPLAY_RADIUS,
        },
        interactions: {
          [TOGGLE_ACTION]: {
            hint: { icon: 'A', label: 'Open' },
            onInteract: () => this.toggle(),
          },
        },
      })
    );
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  public toggle(): void {
    this._fmodSoundController.playSound(FMOD_EVENTS.DOOR_SCREECH);
    if (this._isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public open(): void {
    if (this._isOpen) return;
    this._isOpen = true;
    this._interactionController.setHint(TOGGLE_ACTION, { label: 'Close' });
    this._rotateLeafTo(OPEN_ANGLE);
  }

  public close(): void {
    if (!this._isOpen) return;
    this._isOpen = false;
    this._interactionController.setHint(TOGGLE_ACTION, { label: 'Open' });
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
