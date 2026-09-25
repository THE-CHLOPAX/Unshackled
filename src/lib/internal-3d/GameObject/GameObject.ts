import * as THREE from 'three';
import {
  ResourceTracker,
  GameObjectComponent,
  GameObjectConstructorOptions,
  GameObjectEventMap,
  Input,
  InputState,
  logger,
} from '@tgdf';

import { Emitter } from '../Emitter';
import { Scene } from '../Scene/Scene';
import { GAME_OBJECT_MESSAGES } from './constants';
import { InputNotifiable, RegisterableInputSource } from '../../internal-input/Input';

export class GameObject extends THREE.Object3D implements InputNotifiable {
  public readonly skipUpdate: boolean;

  private _gameObjectComponents: Map<string, GameObjectComponent>;
  private _scene: Scene;
  private _emitter: Emitter<GameObjectEventMap> = new Emitter<GameObjectEventMap>();
  private _isAwake: boolean = false;
  private _isDestroyed: boolean = false;
  private _inputEnabled: boolean = true;
  private _inputSource: RegisterableInputSource;

  constructor({ scene, skipUpdate = false, inputSource }: GameObjectConstructorOptions) {
    super();
    this._scene = scene;
    this.skipUpdate = skipUpdate;
    this._gameObjectComponents = new Map<string, GameObjectComponent>();
    this._inputSource = inputSource ?? Input;

    this.addEventListener('added', this._onAwakeHandler);

    this._inputSource.registerNotifiable(this);
  }

  public get scene(): Scene {
    return this._scene;
  }

  public get gameObjectComponents(): Map<string, GameObjectComponent> {
    return this._gameObjectComponents;
  }

  public get events(): Emitter<GameObjectEventMap> {
    return this._emitter;
  }

  public get isAwake(): boolean {
    return this._isAwake;
  }

  public get inputEnabled(): boolean {
    return this._inputEnabled;
  }

  public get inputSource(): RegisterableInputSource {
    return this._inputSource;
  }

  public toggleInput(enabled: boolean): void {
    this._inputEnabled = enabled;
  }

  public getGameObjectComponentByType<C extends GameObjectComponent>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: new (...args: any[]) => C
  ): C | undefined {
    for (const component of this._gameObjectComponents.values()) {
      if (component instanceof type) {
        return component as C;
      }
    }
    return undefined;
  }

  public update(deltaTime: number): void {
    this.events.trigger('update', { deltaTime });

    this.onUpdate(deltaTime);
  }

  public addComponent<C extends GameObjectComponent>(name: string, component: C): C {
    const alreadyAddedComponent = this._gameObjectComponents.get(name);
    if (alreadyAddedComponent) {
      logger({
        message: GAME_OBJECT_MESSAGES.ADD_COMPONENT_DUPLICATE(name),
        type: 'warn',
      });
      component.destroy();
      return alreadyAddedComponent as C;
    }

    this._gameObjectComponents.set(name, component);
    if (this._isAwake) component.wake();
    return component;
  }

  public removeComponent(name: string): void {
    const component = this._gameObjectComponents.get(name);
    if (!component) {
      logger({
        message: GAME_OBJECT_MESSAGES.REMOVE_COMPONENT_NOT_FOUND(name),
        type: 'warn',
      });
      return;
    }
    component.destroy();
    this._gameObjectComponents.delete(name);
  }

  /**
   * Unregisters from its input source and triggers the destroyed event.
   * Does not remove the 3D object from the parent.
   */
  public destroy(): void {
    if (this._isDestroyed) return;
    this._isDestroyed = true;

    this._inputSource.unregisterNotifiable(this);

    this._emitter.trigger('destroyed');
    this._gameObjectComponents.clear();

    this.onDestroyed();
    this._isAwake = false;
    this.removeEventListener('added', this._onAwakeHandler);
  }

  public override add(...objects: THREE.Object3D[]): this {
    super.add(...objects);

    objects.forEach((object) => {
      logger({
        message: GAME_OBJECT_MESSAGES.ADDING_OBJECT_TO_GAME_OBJECT(object),
        type: 'info',
      });
      ResourceTracker.trackObject(object);
    });

    return this;
  }

  public override remove(...objects: THREE.Object3D[]): this {
    objects.forEach((object) => {
      logger({
        message: GAME_OBJECT_MESSAGES.REMOVING_OBJECT_FROM_GAME_OBJECT(object),
        type: 'info',
      });

      object.traverse((child) => {
        if (child instanceof GameObject) {
          child.destroy();
        }
      });

      super.remove(object);

      ResourceTracker.disposeObjectResources(object);
      ResourceTracker.untrackObject(object);
    });

    return this;
  }

  public onInputNotify(_inputState: InputState): void {
    if (!this._inputEnabled) return;

    this.onInput(_inputState);

    this._emitter.trigger('input', { inputState: _inputState });
  }

  protected onAwake(): void {}

  protected onUpdate(_deltaTime: number): void {}

  protected onDestroyed(): void {}

  protected onInput(_inputState: InputState): void {}

  private _onAwakeHandler = () => {
    if (this._isAwake) return;
    this._isAwake = true;
    this._emitter.trigger('awake');
    this.onAwake();
  };
}
