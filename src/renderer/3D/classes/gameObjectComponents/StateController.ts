import { GameObjectComponent, InputState } from '@tgdf';

import { State } from '../../classes/states';
import { Entity } from '../gameObjects/Entity';
import { StateMachine, StateNode } from '../../types';
import { HealthPointsController, HealthPointsControllerEvents } from './HealthPointsController';

export class StateController extends GameObjectComponent {
  constructor(
    gameObject: Entity,
    private readonly _stateMachine: StateMachine,
    private readonly _healthPointsController: HealthPointsController
  ) {
    super(gameObject);

    this._setInitialStateNode(_stateMachine.initialNode);

    this._healthPointsController.events.on('damagetaken', this._onDamageTaken);
    this._healthPointsController.events.on('death', this._onDeath);
  }

  public override get gameObject(): Entity {
    return super.gameObject as Entity;
  }

  private _currentState: State | null = null;
  private _pendingNode: StateNode | null = null;
  private _currentStateNode: StateNode | null = null;

  public get currentState(): State | null {
    return this._currentState;
  }

  private _setCurrentState(newState: State | null): void {
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

  public requestTransition(node: StateNode): void {
    this._pendingNode = node;
  }

  protected override onInput(inputState: InputState): void {
    this._applyPendingNode();
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
    this._applyPendingNode();
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
    this._healthPointsController.events.off('damagetaken', this._onDamageTaken);
    this._healthPointsController.events.off('death', this._onDeath);
    this._pendingNode = null;
    this._currentState = null;
    this._currentStateNode = null;
    super.onDestroyed();
  }

  private _onDamageTaken = ({
    currentHealth,
    damageAmount,
  }: HealthPointsControllerEvents['damagetaken']): void => {
    this._requestTransitionIfAny(
      this._stateMachine.onDamage({
        entity: this.gameObject,
        currentState: this._currentState,
        currentHealth,
        damageAmount,
      })
    );
  };

  private _onDeath = (): void => {
    this._requestTransitionIfAny(
      this._stateMachine.onDeath({ entity: this.gameObject, currentState: this._currentState })
    );
  };

  private _requestTransitionIfAny(node: StateNode | null): void {
    if (node) this.requestTransition(node);
  }

  private _setInitialStateNode(node: StateNode): void {
    this._currentStateNode = node;
    this._setCurrentState(this._instantiate(node));
  }

  private _applyPendingNode(): void {
    const pendingNode = this._pendingNode;
    if (!pendingNode) return;

    this._pendingNode = null;
    this._currentStateNode = pendingNode;
    this._setCurrentState(this._instantiate(pendingNode));
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
