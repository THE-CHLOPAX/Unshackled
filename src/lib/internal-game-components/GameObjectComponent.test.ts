import { Mock } from 'moq.ts';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Emitter, GameObject, GameObjectEventMap, InputState } from '@tgdf';

import { Scene } from '../internal-3d/Scene/Scene';
import { GameObjectComponent } from './GameObjectComponent';
import { MockCamera } from '../internal-3d/testUtils/MockCamera';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

class TestScene extends Scene {
  camera = new MockCamera();
}

class TestComponent extends GameObjectComponent {
  public awakeCalls!: number;
  public onUpdateSpy = vi.fn();
  public onInputSpy = vi.fn();
  public onDestroyedSpy = vi.fn();

  protected override onAwake(): void {
    this.awakeCalls = (this.awakeCalls ?? 0) + 1;
  }

  protected override onUpdate(deltaTime: number): void {
    this.onUpdateSpy(deltaTime);
  }

  protected override onInput(inputState: InputState): void {
    this.onInputSpy(inputState);
  }

  protected override onDestroyed(): void {
    this.onDestroyedSpy();
    super.onDestroyed();
  }
}

function createMockGameObject(isAwake: boolean) {
  const events = new Emitter<GameObjectEventMap>();
  const scene = new TestScene();

  return new Mock<GameObject>()
    .setup((gameObject) => gameObject.events)
    .returns(events)
    .setup((gameObject) => gameObject.isAwake)
    .returns(isAwake)
    .setup((gameObject) => gameObject.scene)
    .returns(scene)
    .object();
}

describe('GameObjectComponent', () => {
  let inputState: InputState;

  beforeEach(() => {
    inputState = {
      keyboard: { isKeyPressed: vi.fn().mockReturnValue(false) },
      mouse: {
        getX: () => 0,
        getY: () => 0,
        getWheelDelta: () => 0,
        isButtonPressed: vi.fn().mockReturnValue(false),
      },
      gamepad: {
        isButtonPressed: vi.fn().mockReturnValue(false),
        getAxisValue: vi.fn().mockReturnValue(0),
      },
    };
  });

  describe('when added to a game object', () => {
    it('does not call onAwake from the constructor, even when the game object is already awake', () => {
      const gameObject = createMockGameObject(true);
      const component = new TestComponent(gameObject);

      expect(component.awakeCalls ?? 0).toBe(0);
      expect(component.gameObject).toBe(gameObject);
      expect(component.scene).toBe(gameObject.scene);
    });

    it('calls onAwake when attached to an already-awake game object via addComponent', () => {
      const scene = new TestScene();
      const gameObject = new GameObject({ scene });
      scene.add(gameObject);

      const component = new TestComponent(gameObject);
      expect(component.awakeCalls ?? 0).toBe(0);

      gameObject.addComponent('TestComponent', component);

      expect(component.awakeCalls).toBe(1);
    });

    it('calls onAwake only once when the game object later emits awake after addComponent', () => {
      const scene = new TestScene();
      const gameObject = new GameObject({ scene });
      scene.add(gameObject);
      const component = new TestComponent(gameObject);
      gameObject.addComponent('TestComponent', component);

      gameObject.events.trigger('awake');

      expect(component.awakeCalls).toBe(1);
    });

    it('calls onAwake when the game object later emits awake', () => {
      const gameObject = createMockGameObject(false);
      const component = new TestComponent(gameObject);

      expect(component.awakeCalls ?? 0).toBe(0);

      gameObject.events.trigger('awake');

      expect(component.awakeCalls).toBe(1);
    });

    it('responds to update and input events from the game object', () => {
      const gameObject = createMockGameObject(false);
      const component = new TestComponent(gameObject);

      gameObject.events.trigger('update', { deltaTime: 0.16 });
      gameObject.events.trigger('input', { inputState });

      expect(component.onUpdateSpy).toHaveBeenCalledWith(0.16);
      expect(component.onInputSpy).toHaveBeenCalledWith(inputState);
    });

    it('works when attached through GameObject.addComponent', () => {
      const scene = new TestScene();
      const gameObject = new GameObject({ scene });
      scene.add(gameObject);

      const component = new TestComponent(gameObject);
      gameObject.addComponent('TestComponent', component);

      gameObject.update(0.25);
      gameObject.onInputNotify(inputState);

      expect(component.awakeCalls).toBe(1);
      expect(component.onUpdateSpy).toHaveBeenCalledWith(0.25);
      expect(component.onInputSpy).toHaveBeenCalledWith(inputState);
    });
  });

  describe('when removed from a game object', () => {
    it('destroys itself and unsubscribes from game object events', () => {
      const gameObject = createMockGameObject(false);
      const component = new TestComponent(gameObject);

      component.destroy();

      expect(component.onDestroyedSpy).toHaveBeenCalledOnce();

      gameObject.events.trigger('update', { deltaTime: 1 });
      gameObject.events.trigger('input', { inputState });
      gameObject.events.trigger('awake');
      gameObject.events.trigger('destroyed');

      expect(component.onUpdateSpy).not.toHaveBeenCalled();
      expect(component.onInputSpy).not.toHaveBeenCalled();
      expect(component.awakeCalls ?? 0).toBe(0);
    });

    it('cleans up when removed via GameObject.removeComponent', () => {
      const scene = new TestScene();
      const gameObject = new GameObject({ scene });
      const component = new TestComponent(gameObject);

      gameObject.addComponent('TestComponent', component);
      gameObject.removeComponent('TestComponent');

      expect(component.onDestroyedSpy).toHaveBeenCalledOnce();
      expect(gameObject.gameObjectComponents.has('TestComponent')).toBe(false);

      gameObject.events.trigger('update', { deltaTime: 1 });

      expect(component.onUpdateSpy).not.toHaveBeenCalled();
    });

    it('cleans up when the game object emits destroyed', () => {
      const gameObject = createMockGameObject(true);
      const component = new TestComponent(gameObject);

      gameObject.events.trigger('destroyed');

      expect(component.onDestroyedSpy).toHaveBeenCalledOnce();

      gameObject.events.trigger('update', { deltaTime: 1 });

      expect(component.onUpdateSpy).not.toHaveBeenCalled();
    });
  });
});
