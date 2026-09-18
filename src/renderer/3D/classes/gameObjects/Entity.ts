import * as THREE from 'three';
import { MovementController, RigidBody, RigidBodyOptions } from '@tgdf';

import { StateNode } from '3D/types';
import { COLORS } from 'renderer/constants';
import { DeadState } from '3D/classes/states';
import { flashMaterial } from '3D/utils/flashMaterial';

import { GameSceneObject } from './GameSceneObject';
import { GameScene } from '../scenes/GameScene/GameScene';
import { StateController } from '../gameObjectComponents/StateController';
import { CooldownController } from '../gameObjectComponents/CooldownController';
import { DamageHitboxController } from '../gameObjectComponents/DamageHitboxController';
import {
  ModelRenderer,
  ModelRendererOptions,
} from '../gameObjectComponents/ModelRenderer/ModelRenderer';
import {
  HealthPointsController,
  HealthPointsControllerOptions,
} from '../gameObjectComponents/HealthPointsController';
import {
  HealthBarRenderer,
  HealthBarRendererOptions,
} from '../gameObjectComponents/HealthBarRenderer/HealthBarRenderer';
import {
  AnimationController,
  AnimationControllerOptions,
} from '../gameObjectComponents/AnimationController/AnimationController';

export type EntityMovementOptions = {
  speed?: number;
  sprintSpeed?: number;
  walkSpeed?: number;
};

export type EntityOptions = {
  modelOptions: ModelRendererOptions;
  healthOptions: HealthPointsControllerOptions;
  healthBarOptions?: HealthBarRendererOptions;
  rigidBodyOptions?: RigidBodyOptions;
  animationControllerOptions?: AnimationControllerOptions;
  movementOptions?: EntityMovementOptions;
  stateMachine: StateNode;
};

export class Entity extends GameSceneObject {
  public isEntity = true;

  public rigidBody: RigidBody;
  public modelRenderer: ModelRenderer;
  public stateController: StateController;
  public animationController: AnimationController;
  public damageHitboxController: DamageHitboxController;
  public cooldownController: CooldownController;
  public healthPointsController: HealthPointsController;
  public healthBarRenderer: HealthBarRenderer;
  public movementController: MovementController;
  public defaultSpeed: number;
  public sprintSpeed: number;
  public walkSpeed: number;

  private _spawnPosition: THREE.Vector3 = new THREE.Vector3();

  constructor(
    scene: GameScene,
    public options: EntityOptions
  ) {
    super({ scene });

    const speed = options.movementOptions?.speed ?? 0;
    this.defaultSpeed = speed;
    this.sprintSpeed = options.movementOptions?.sprintSpeed ?? speed * 1.5;
    this.walkSpeed = options.movementOptions?.walkSpeed ?? speed * 0.5;

    this.modelRenderer = this.addComponent(
      'ModelRenderer',
      new ModelRenderer(this, options.modelOptions)
    );

    this.animationController = this.addComponent(
      'AnimationController',
      new AnimationController(this, this.modelRenderer, options.animationControllerOptions)
    );

    this.rigidBody = this.addComponent(
      'RigidBody',
      new RigidBody(this, this.options.rigidBodyOptions)
    );

    this.movementController = this.addComponent(
      'MovementController',
      new MovementController(this, this.rigidBody, {
        defaultSpeed: this.defaultSpeed,
        sprintSpeed: this.sprintSpeed,
      })
    );

    this.healthPointsController = this.addComponent(
      'HealthPointsController',
      new HealthPointsController(this, options.healthOptions)
    );

    this.healthBarRenderer = this.addComponent(
      'HealthBarRenderer',
      new HealthBarRenderer(this, this.healthPointsController, options.healthBarOptions)
    );

    this.damageHitboxController = this.addComponent(
      'DamageHitboxController',
      new DamageHitboxController(this)
    );

    this.cooldownController = this.addComponent('CooldownController', new CooldownController(this));

    this.stateController = this.addComponent(
      'StateController',
      new StateController(this, this.options.stateMachine)
    );

    this.healthPointsController.events.on('damagetaken', this._onDamageTaken);
    this.healthPointsController.events.on('death', this._onDeath);
  }

  public get spawnPosition(): THREE.Vector3 {
    return this._spawnPosition.clone();
  }

  protected override onAwake(): void {
    this._spawnPosition.copy(this.position);
  }

  protected override onDestroyed(): void {
    this.healthPointsController.events.off('damagetaken', this._onDamageTaken);
    this.healthPointsController.events.off('death', this._onDeath);
    super.onDestroyed();
  }

  protected onDamageTaken(): void {}

  protected onDeath(): void {}

  private _onDamageTaken = (): void => {
    this.onDamageTaken();
    this._flashRed();
  };

  private _onDeath = (): void => {
    this._flashRed();
    this.stateController.requestTransition(new DeadState(this));
    this.onDeath();
  };

  private _flashRed = (): void => {
    flashMaterial({
      entity: this,
      material: new THREE.MeshBasicMaterial({ color: COLORS.RED }),
      duration: 0.1,
      fadeOut: { duration: 0.15 },
    });
  };
}
