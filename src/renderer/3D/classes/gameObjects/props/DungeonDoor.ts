import { gsap } from 'gsap';
import * as THREE from 'three';
import { assert, GameObject, getModelFromStore, isMesh, RigidBody, Scene } from '@tgdf';

import { MODELS } from '3D/constants';
import { PlayerActionType } from '3D/types';
import { pixelateModelMaterial } from 'renderer/3D/utils/pixelateModelMaterial';

import { PlayerDetectionZone } from '../PlayerDetectionZone';
import {
  HintBillboardRenderer,
  HintBillboardRendererOptions,
} from '../../gameObjectComponents/HintBillboardRenderer/HintBillboardRenderer';

// Placeholder footprint for the interact sensor; tune to match the door model's actual size.
const INTERACTION_ZONE_SIZE = new THREE.Vector3(3, 2, 3);

const OPEN_ANGLE = -Math.PI / 2;
const OPEN_CLOSE_DURATION_S = 0.4;

const HINT_PROPS_OPEN: HintBillboardRendererOptions = { hint: { icon: 'A', label: 'Open' } };
const HINT_PROPS_CLOSE: HintBillboardRendererOptions = { hint: { icon: 'A', label: 'Close' } };

export class DungeonDoor extends GameObject {
  private _leaf: GameObject;
  private _rigidBody: RigidBody;
  private _size = new THREE.Vector3();
  private _hintBillboardRenderer: HintBillboardRenderer;
  private _isOpen = false;
  private _rotationTween: gsap.core.Tween | null = null;

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
    this._leaf.add(doorModel);
    this.add(this._leaf);

    this._rigidBody = this._leaf.addComponent(
      'RigidBody',
      new RigidBody(this._leaf, {
        type: 'kinematic',
        colliderShape: 'box',
      })
    );

    this._hintBillboardRenderer = this.addComponent(
      'HintBillboardRenderer',
      new HintBillboardRenderer(this, this._isOpen ? HINT_PROPS_CLOSE : HINT_PROPS_OPEN)
    );
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  public open(): void {
    if (this._isOpen) return;
    this._isOpen = true;
    this._hintBillboardRenderer.updateHint({ label: 'Close' });
    this._rotateLeafTo(OPEN_ANGLE);
  }

  public close(): void {
    if (!this._isOpen) return;
    this._isOpen = false;
    this._hintBillboardRenderer.updateHint({ label: 'Open' });
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

  protected override onAwake(): void {
    const interactionZone = new PlayerDetectionZone(this.scene, {
      size: INTERACTION_ZONE_SIZE,
      shape: 'sphere',
    });

    const updateHintVisibility = () => {
      if (interactionZone.players.length > 0) {
        this._hintBillboardRenderer.show();
      } else {
        this._hintBillboardRenderer.hide();
      }
    };

    interactionZone.playerEvents.on('player-entered', updateHintVisibility);
    interactionZone.playerEvents.on('player-left', updateHintVisibility);
    interactionZone.playerEvents.on('player-action', ({ action }) => {
      if (action.type === PlayerActionType.ACTION_DOWN) {
        if (this.isOpen) {
          this.close();
        } else {
          this.open();
        }
      }
    });
    this.add(interactionZone);
  }
}
