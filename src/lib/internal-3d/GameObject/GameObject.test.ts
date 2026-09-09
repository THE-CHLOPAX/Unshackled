import * as THREE from 'three';
import { Input, InputState, GameObjectComponent } from '@tgdf';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { Scene } from '../Scene/Scene';
import { GameObject } from './GameObject';
import { MockCamera } from '../testUtils/MockCamera';
import { Input as InputClass } from '../../internal-input/Input';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

class TestScene extends Scene {
  camera = new MockCamera();
}

class TestGameObject extends GameObject {
  public onAwakeSpy = vi.fn();
  public onUpdateSpy = vi.fn();
  public onDestroyedSpy = vi.fn();
  public onInputSpy = vi.fn();

  protected override onAwake(): void {
    this.onAwakeSpy();
  }

  protected override onUpdate(deltaTime: number): void {
    this.onUpdateSpy(deltaTime);
  }

  protected override onDestroyed(): void {
    this.onDestroyedSpy();
  }

  protected override onInput(inputState: InputState): void {
    this.onInputSpy(inputState);
  }
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

function notifyAllInput(): void {
  (InputClass.getInstance() as unknown as { _notifyObjects(): void })._notifyObjects();
}

describe('GameObject', () => {
  let scene: TestScene;

  beforeEach(() => {
    scene = new TestScene();
    vi.spyOn(Input, 'registerNotifiable');
    vi.spyOn(Input, 'unregisterNotifiable');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('components', () => {
    it('adds a component to the map and returns it', () => {
      const gameObject = new TestGameObject({ scene });
      const component = new TestComponent(gameObject);

      const result = gameObject.addComponent('TestComponent', component);

      expect(result).toBe(component);
      expect(gameObject.gameObjectComponents.get('TestComponent')).toBe(component);
      expect(gameObject.gameObjectComponents.size).toBe(1);
    });

    it('returns the existing component when adding a duplicate name', () => {
      const gameObject = new TestGameObject({ scene });

      const first = new TestComponent(gameObject);
      gameObject.addComponent('TestComponent', first);
      const listenersCountAfterFirst = gameObject.events.listeners.length;

      const second = new TestComponent(gameObject);
      const result = gameObject.addComponent('TestComponent', second);
      const listenersCountAfterSecond = gameObject.events.listeners.length;

      expect(result).toBe(first);
      expect(gameObject.gameObjectComponents.size).toBe(1);
      expect(listenersCountAfterSecond).toEqual(listenersCountAfterFirst);
    });

    it('removeComponent calls destroy on the component and removes it from the map', () => {
      const gameObject = new TestGameObject({ scene });
      const component = new TestComponent(gameObject);
      gameObject.addComponent('TestComponent', component);

      const destroySpy = vi.spyOn(component, 'destroy');
      gameObject.removeComponent('TestComponent');

      expect(destroySpy).toHaveBeenCalledOnce();
      expect(gameObject.gameObjectComponents.has('TestComponent')).toBe(false);
    });

    it('does nothing when removing a component that does not exist', () => {
      const gameObject = new TestGameObject({ scene });
      const component = new TestComponent(gameObject);
      gameObject.addComponent('TestComponent', component);

      gameObject.removeComponent('MissingComponent');

      expect(gameObject.gameObjectComponents.has('TestComponent')).toBe(true);
    });

    it('getGameObjectComponentByType returns a component by constructor', () => {
      const gameObject = new TestGameObject({ scene });
      const component = new TestComponent(gameObject);
      gameObject.addComponent('TestComponent', component);

      expect(gameObject.getGameObjectComponentByType(TestComponent)).toBe(component);
    });
  });

  describe('awake', () => {
    it('awakes synchronously when added to the scene', () => {
      const gameObject = new TestGameObject({ scene });
      const awakeHandler = vi.fn();
      gameObject.events.on('awake', awakeHandler);

      scene.add(gameObject);

      expect(gameObject.isAwake).toBe(true);
      expect(awakeHandler).toHaveBeenCalledOnce();
      expect(gameObject.onAwakeSpy).toHaveBeenCalledOnce();
    });

    it('does not awake before being added to a parent', () => {
      const gameObject = new TestGameObject({ scene });
      const awakeHandler = vi.fn();
      gameObject.events.on('awake', awakeHandler);

      gameObject.update(0.16);

      expect(gameObject.isAwake).toBe(false);
      expect(awakeHandler).not.toHaveBeenCalled();
      expect(gameObject.onAwakeSpy).not.toHaveBeenCalled();
    });

    it('does not awake as a side effect of update once added', () => {
      const gameObject = new TestGameObject({ scene });
      scene.add(gameObject);
      gameObject.onAwakeSpy.mockClear();

      gameObject.update(0.16);
      gameObject.update(0.16);

      expect(gameObject.onAwakeSpy).not.toHaveBeenCalled();
      expect(gameObject.isAwake).toBe(true);
    });

    it('awakes when added to a parent that is not attached to the scene', () => {
      const parent = new THREE.Group();
      const gameObject = new TestGameObject({ scene });

      parent.add(gameObject);

      expect(gameObject.isAwake).toBe(true);
      expect(gameObject.onAwakeSpy).toHaveBeenCalledOnce();
    });

    it('awakes only once when re-parented between plain Object3D parents', () => {
      const parentA = new THREE.Group();
      const parentB = new THREE.Group();
      const gameObject = new TestGameObject({ scene });
      const awakeHandler = vi.fn();
      gameObject.events.on('awake', awakeHandler);

      parentA.add(gameObject);
      parentB.add(gameObject);

      expect(gameObject.onAwakeSpy).toHaveBeenCalledOnce();
      expect(awakeHandler).toHaveBeenCalledOnce();
    });

    it('does not re-awake when removed from and re-added to a plain parent', () => {
      const parent = new THREE.Group();
      const gameObject = new TestGameObject({ scene });

      parent.add(gameObject);
      parent.remove(gameObject);
      parent.add(gameObject);

      expect(gameObject.onAwakeSpy).toHaveBeenCalledOnce();
    });

    it('does not awake again when re-added to a parent after being destroyed', () => {
      const parent = new THREE.Group();
      const gameObject = new TestGameObject({ scene });

      parent.add(gameObject);
      gameObject.destroy();
      parent.remove(gameObject);
      gameObject.onAwakeSpy.mockClear();

      parent.add(gameObject);

      expect(gameObject.onAwakeSpy).not.toHaveBeenCalled();
      expect(gameObject.isAwake).toBe(false);
    });

    it('awakes attached components when the game object awakes', () => {
      const gameObject = new TestGameObject({ scene });
      const component = new TestComponent(gameObject);
      gameObject.addComponent('TestComponent', component);

      scene.add(gameObject);

      expect(component.awakeCalls).toBe(1);
    });

    it('awakes components added after the game object is already awake', () => {
      const gameObject = new TestGameObject({ scene });
      scene.add(gameObject);

      const component = new TestComponent(gameObject);
      gameObject.addComponent('TestComponent', component);

      expect(component.awakeCalls).toBe(1);
    });
  });

  describe('events', () => {
    it('triggers update event and calls onUpdate', () => {
      const gameObject = new TestGameObject({ scene });
      const updateHandler = vi.fn();
      gameObject.events.on('update', updateHandler);

      gameObject.update(0.25);

      expect(updateHandler).toHaveBeenCalledWith({ deltaTime: 0.25 });
      expect(gameObject.onUpdateSpy).toHaveBeenCalledWith(0.25);
    });

    it('forwards update events to components', () => {
      const gameObject = new TestGameObject({ scene });
      const component = new TestComponent(gameObject);
      gameObject.addComponent('TestComponent', component);

      gameObject.update(0.5);

      expect(component.onUpdateSpy).toHaveBeenCalledWith(0.5);
    });

    it('triggers input event and calls onInput via onInputNotify', () => {
      const gameObject = new TestGameObject({ scene });
      const inputHandler = vi.fn();
      gameObject.events.on('input', inputHandler);
      const inputState = Input.getState();

      gameObject.onInputNotify(inputState);

      expect(gameObject.onInputSpy).toHaveBeenCalledWith(inputState);
      expect(inputHandler).toHaveBeenCalledWith({ inputState });
    });

    it('forwards input events to components', () => {
      const gameObject = new TestGameObject({ scene });
      const component = new TestComponent(gameObject);
      gameObject.addComponent('TestComponent', component);
      const inputState = Input.getState();

      gameObject.onInputNotify(inputState);

      expect(component.onInputSpy).toHaveBeenCalledWith(inputState);
    });

    it('triggers destroyed event and calls onDestroyed when destroyed', () => {
      const gameObject = new TestGameObject({ scene });
      const destroyedHandler = vi.fn();
      gameObject.events.on('destroyed', destroyedHandler);

      gameObject.destroy();

      expect(destroyedHandler).toHaveBeenCalledOnce();
      expect(gameObject.onDestroyedSpy).toHaveBeenCalledOnce();
    });

    it('notifies components through the destroyed event when destroyed', () => {
      const gameObject = new TestGameObject({ scene });
      const component = new TestComponent(gameObject);
      gameObject.addComponent('TestComponent', component);

      gameObject.destroy();

      expect(component.onDestroyedSpy).toHaveBeenCalledOnce();
    });
  });

  describe('Input registration', () => {
    it('registers with Input on construction', () => {
      const gameObject = new TestGameObject({ scene });

      expect(Input.registerNotifiable).toHaveBeenCalledWith(gameObject);
    });

    it('unregisters from Input when destroyed', () => {
      const gameObject = new TestGameObject({ scene });

      gameObject.destroy();

      expect(Input.unregisterNotifiable).toHaveBeenCalledWith(gameObject);
    });

    it('does not receive input notifications after being destroyed', () => {
      const gameObject = new TestGameObject({ scene });
      const inputSpy = vi.spyOn(gameObject, 'onInputNotify');

      gameObject.destroy();
      notifyAllInput();

      expect(inputSpy).not.toHaveBeenCalled();
    });
  });

  describe('toggleInput', () => {
    it('has input enabled by default', () => {
      const gameObject = new TestGameObject({ scene });

      expect(gameObject.inputEnabled).toBe(true);
    });

    it('disables input handling when toggled off', () => {
      const gameObject = new TestGameObject({ scene });
      const inputHandler = vi.fn();
      gameObject.events.on('input', inputHandler);
      const inputState = Input.getState();

      gameObject.toggleInput(false);
      gameObject.onInputNotify(inputState);

      expect(gameObject.inputEnabled).toBe(false);
      expect(gameObject.onInputSpy).not.toHaveBeenCalled();
      expect(inputHandler).not.toHaveBeenCalled();
    });

    it('re-enables input handling when toggled back on', () => {
      const gameObject = new TestGameObject({ scene });
      const inputHandler = vi.fn();
      gameObject.events.on('input', inputHandler);
      const inputState = Input.getState();

      gameObject.toggleInput(false);
      gameObject.toggleInput(true);
      gameObject.onInputNotify(inputState);

      expect(gameObject.inputEnabled).toBe(true);
      expect(gameObject.onInputSpy).toHaveBeenCalledWith(inputState);
      expect(inputHandler).toHaveBeenCalledWith({ inputState });
    });

    it('does not forward input to components when input is disabled on the game object', () => {
      const gameObject = new TestGameObject({ scene });
      const component = new TestComponent(gameObject);
      gameObject.addComponent('TestComponent', component);
      const inputState = Input.getState();

      gameObject.toggleInput(false);
      gameObject.onInputNotify(inputState);

      expect(component.onInputSpy).not.toHaveBeenCalled();
    });
  });

  describe('resource tracking', () => {
    it('disposes tracked resources when a child is removed', () => {
      const gameObject = new TestGameObject({ scene });
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial();
      const mesh = new THREE.Mesh(geometry, material);
      const geometryDisposeSpy = vi.spyOn(geometry, 'dispose');
      const materialDisposeSpy = vi.spyOn(material, 'dispose');

      gameObject.add(mesh);
      gameObject.remove(mesh);

      expect(geometryDisposeSpy).toHaveBeenCalledOnce();
      expect(materialDisposeSpy).toHaveBeenCalledOnce();
    });
  });

  describe('destroy', () => {
    it('resets isAwake to false when destroyed', () => {
      const gameObject = new TestGameObject({ scene });
      scene.add(gameObject);

      gameObject.destroy();

      expect(gameObject.isAwake).toBe(false);
    });

    it('clears all components from the map when destroyed', () => {
      const gameObject = new TestGameObject({ scene });
      gameObject.addComponent('TestComponent', new TestComponent(gameObject));

      gameObject.destroy();

      expect(gameObject.gameObjectComponents.size).toBe(0);
    });

    it('destroys a GameObject child when removing it', () => {
      const gameObject = new TestGameObject({ scene });
      const child = new THREE.Object3D();
      const gameObjectChild = new TestGameObject({ scene });
      gameObject.add(child, gameObjectChild);

      gameObject.remove(gameObjectChild);

      expect(gameObjectChild.onDestroyedSpy).toHaveBeenCalledOnce();
    });

    it('triggers a cascade destruction of all nested game objects when removing them', () => {
      const gameObject = new TestGameObject({ scene });
      const childObject3D = new THREE.Object3D();
      const gameObjectChild = new TestGameObject({ scene });

      childObject3D.add(gameObjectChild);
      gameObject.add(childObject3D);

      gameObject.remove(childObject3D);

      expect(gameObjectChild.onDestroyedSpy).toHaveBeenCalledOnce();
    });
  });
});
