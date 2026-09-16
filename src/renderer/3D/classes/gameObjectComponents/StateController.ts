import { GameObjectComponent, InputState } from '@tgdf';

import { StateNode } from '../../types';
import { State } from '../../classes/states';
import { Entity } from '../gameObjects/Entity';

export class StateController extends GameObjectComponent {
  constructor(gameObject: Entity, initialStateNode: StateNode) {
    super(gameObject);

    this._setInitialStateNode(initialStateNode);
  }

  public override get gameObject(): Entity {
    return super.gameObject as Entity;
  }

  private _currentState: State | null = null;
  private _pendingState: State | null = null;
  private _currentStateNode: StateNode | null = null;

  public get currentState(): State | null {
    return this._currentState;
  }

  private _setCurrentState(newState: State | null): void {
    this._pendingState = null;
    if (this._currentState) {
      this._currentState.exit();
    }
    this._currentState = newState;
    if (this._currentState) {
      this._currentState.enter();
    }
  }

  public get currentStateNode(): StateNode | null {
    return this._currentStateNode;
  }

  public requestTransition(newState: State): void {
    this._pendingState = newState;
    this._currentStateNode = null;
  }

  protected override onInput(inputState: InputState): void {
    this._applyPendingState();
    if (!this._currentState) return;

    this._currentState.input(inputState);
    if (!this._currentStateNode) return;

    this._applyNodeTransition(
      this._currentStateNode.onInput?.({
        entity: this.gameObject,
        input: inputState,
        currentState: this._currentState,
      }) ?? null
    );
  }

  public override onUpdate(deltaTime: number): void {
    this._applyPendingState();
    if (!this._currentState) return;

    this._currentState.update(deltaTime);
    if (!this._currentStateNode) return;

    this._applyNodeTransition(
      this._currentStateNode.onUpdate?.({
        entity: this.gameObject,
        deltaTime,
        currentState: this._currentState,
      }) ?? null
    );
  }

  public override onDestroyed(): void {
    this._pendingState = null;
    this._currentState = null;
    this._currentStateNode = null;
    super.onDestroyed();
  }

  private _setInitialStateNode(node: StateNode): void {
    this._currentStateNode = node;
    this._setCurrentState(this._instantiate(node));
  }

  private _applyPendingState(): void {
    const pendingState = this._pendingState;
    if (pendingState) {
      this._setCurrentState(pendingState);
    }
  }

  private _applyNodeTransition(nextNode: StateNode | null): void {
    if (!nextNode || nextNode === this._currentStateNode) return;
    this._currentStateNode = nextNode;
    this._setCurrentState(this._instantiate(nextNode));
  }

  private _instantiate(node: StateNode): State {
    return node.state(this.gameObject);
  }
}
