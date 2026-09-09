import { Scene, GameObject, InputState } from '@tgdf';

export abstract class GameObjectComponent<T = unknown> {
  private _gameObject: GameObject;
  protected options: Partial<T>;

  private _isAwake = false;

  constructor(gameObject: GameObject, options?: Partial<T>) {
    this._gameObject = gameObject;
    this.options = options ?? {};

    this._bindGameObjectEvents();
  }

  public wake(): void {
    this._onAwakeHandler();
  }

  public get gameObject(): GameObject {
    return this._gameObject;
  }

  public get scene(): Scene | undefined {
    return this.gameObject.scene;
  }

  public destroy(): void {
    this._onDestroyedHandler();
  }

  protected onUpdate(_deltaTime: number): void {}

  protected onAwake(): void {}

  protected onDestroyed(): void {}

  protected onInput(_inputState: InputState): void {}

  private _bindGameObjectEvents(): void {
    this._gameObject.events.once('awake', this._onAwakeHandler);
    this._gameObject.events.on('input', this._onInputHandler);
    this._gameObject.events.on('update', this._onUpdateHandler);
    this._gameObject.events.on('destroyed', this._onDestroyedHandler);
  }

  private _onAwakeHandler = () => {
    if (this._isAwake) return;
    this._isAwake = true;
    this.onAwake();
  };

  private _onInputHandler = ({ inputState }: { inputState: InputState }) => {
    this.onInput(inputState);
  };

  private _onUpdateHandler = ({ deltaTime }: { deltaTime: number }) => {
    this.onUpdate(deltaTime);
  };

  private _onDestroyedHandler = () => {
    this._gameObject.events.off('awake', this._onAwakeHandler);
    this._gameObject.events.off('input', this._onInputHandler);
    this._gameObject.events.off('update', this._onUpdateHandler);
    this._gameObject.events.off('destroyed', this._onDestroyedHandler);
    this.onDestroyed();
  };
}
