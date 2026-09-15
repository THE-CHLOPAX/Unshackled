import { InputState } from '@tgdf';

import { Entity } from '../gameObjects/Entity';

export abstract class State {
  constructor(public entity: Entity) {}

  public update(deltaTime: number): State {
    return this.onUpdate(deltaTime);
  }

  public input(inputState: InputState): State {
    return this.onInput(inputState);
  }

  public enter(): void {
    this.onEnter();
  }

  public exit(): void {
    this.onExit();
  }

  public abstract onEnter(): void;

  public abstract onExit(): void;

  public abstract onInput(inputState: InputState): State;

  public abstract onUpdate(deltaTime: number): State;
}
