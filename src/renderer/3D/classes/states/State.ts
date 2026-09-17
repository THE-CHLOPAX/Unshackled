import { InputState } from '@tgdf';

import { Entity } from '../gameObjects/Entity';

export abstract class State {
  constructor(public entity: Entity) {}

  public update(deltaTime: number): void {
    this.onUpdate(deltaTime);
  }

  public input(inputState: InputState): void {
    this.onInput(inputState);
  }

  public enter(): void {
    this.onEnter();
  }

  public exit(): void {
    this.onExit();
  }

  public abstract onEnter(): void;

  public abstract onExit(): void;

  public abstract onInput(inputState: InputState): void;

  public abstract onUpdate(deltaTime: number): void;
}
