import * as THREE from 'three';
import { MovementController, RigidBody, RigidBodyOptions } from '@tgdf';

import { GameScene } from '../scenes/GameScene';
import { GameSceneObject } from './GameSceneObject';
import { StateController } from '../gameObjectComponents/StateController';
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
};

export class Entity extends GameSceneObject {
  public isEntity = true;

  public rigidBody: RigidBody;
  public modelRenderer: ModelRenderer;
  public stateController: StateController;
  public animationController: AnimationController;
  public damageHitboxController: DamageHitboxController;
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

    this.stateController = this.addComponent('StateController', new StateController(this));
  }

  public get spawnPosition(): THREE.Vector3 {
    return this._spawnPosition.clone();
  }

  protected override onAwake(): void {
    this._spawnPosition.copy(this.position);
  }
}
