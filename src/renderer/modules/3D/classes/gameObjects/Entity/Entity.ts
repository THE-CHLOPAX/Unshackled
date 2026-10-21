import * as THREE from 'three';
import {
  MovementController,
  MovementControllerOptions,
  RegisterableInputSource,
  RigidBody,
  RigidBodyOptions,
} from '@tgdf';

import { StateMachine } from '3D/types';
import { GameScene } from '3D/classes/scenes/GameScene/GameScene';
import { GameSceneObject } from '3D/classes/gameObjects/GameSceneObject/GameSceneObject';
import { StateController } from '3D/classes/gameObjectComponents/StateController/StateController';
import { CooldownController } from '3D/classes/gameObjectComponents/CooldownController/CooldownController';
import { FMODSoundController } from '3D/classes/gameObjectComponents/FMODSoundController/FMODSoundController';
import { DamageHitboxController } from '3D/classes/gameObjectComponents/DamageHitboxController/DamageHitboxController';
import {
  ModelRenderer,
  ModelRendererOptions,
} from '3D/classes/gameObjectComponents/ModelRenderer/ModelRenderer';
import {
  AnimationController,
  AnimationControllerOptions,
} from '3D/classes/gameObjectComponents/AnimationController/AnimationController';
import {
  HealthPointsController,
  HealthPointsControllerOptions,
} from '3D/classes/gameObjectComponents/HealthPointsController/HealthPointsController';

export type EntityOptions = {
  modelOptions: ModelRendererOptions;
  healthOptions: HealthPointsControllerOptions;
  rigidBodyOptions?: RigidBodyOptions;
  animationControllerOptions?: AnimationControllerOptions;
  movementOptions?: MovementControllerOptions;
  stateMachine: StateMachine;
  inputSource?: RegisterableInputSource;
};

export class Entity extends GameSceneObject {
  public isEntity = true;

  public rigidBody: RigidBody;
  public modelRenderer: ModelRenderer;
  public stateController: StateController;
  public animationController: AnimationController;
  public damageHitboxController: DamageHitboxController;
  public cooldownController: CooldownController;
  public fmodSoundController: FMODSoundController;
  public healthPointsController: HealthPointsController;
  public movementController: MovementController;

  private _spawnPosition: THREE.Vector3 = new THREE.Vector3();

  constructor(
    scene: GameScene,
    public options: EntityOptions
  ) {
    super({ scene, inputSource: options.inputSource });

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
      new MovementController(this, this.rigidBody, options.movementOptions ?? { defaultSpeed: 0 })
    );

    this.healthPointsController = this.addComponent(
      'HealthPointsController',
      new HealthPointsController(this, options.healthOptions)
    );

    this.damageHitboxController = this.addComponent(
      'DamageHitboxController',
      new DamageHitboxController(this)
    );

    this.cooldownController = this.addComponent('CooldownController', new CooldownController(this));

    this.fmodSoundController = this.addComponent(
      'FMODSoundController',
      new FMODSoundController(this)
    );

    this.stateController = this.addComponent(
      'StateController',
      new StateController(this, this.options.stateMachine, this.healthPointsController)
    );
  }

  public get spawnPosition(): THREE.Vector3 {
    return this._spawnPosition.clone();
  }

  protected override onAwake(): void {
    this._spawnPosition.copy(this.position);
  }
}
