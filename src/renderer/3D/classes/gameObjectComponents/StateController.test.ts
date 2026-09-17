import { Mock } from 'moq.ts';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Emitter, GameObjectEventMap, InputState } from '@tgdf';

import { StateNode } from '../../types';
import { State } from '../../classes/states';
import { Entity } from '../gameObjects/Entity';
import { StateController } from './StateController';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

class FakeState extends State {
  public enterSpy = vi.fn();
  public exitSpy = vi.fn();
  public inputSpy = vi.fn();
  public updateSpy = vi.fn();

  constructor(
    entity: Entity,
    public label: string
  ) {
    super(entity);
  }

  public onEnter(): void {
    this.enterSpy();
  }

  public onExit(): void {
    this.exitSpy();
  }

  public onInput(inputState: InputState): void {
    this.inputSpy(inputState);
  }

  public onUpdate(deltaTime: number): void {
    this.updateSpy(deltaTime);
  }
}

describe('StateController', () => {
  let entity: Entity;
  let events: Emitter<GameObjectEventMap>;
  let inputState: InputState;
  let nodeAInputTransition: StateNode | null;
  let nodeAUpdateTransition: StateNode | null;
  let nodeA: StateNode<FakeState>;
  let nodeB: StateNode<FakeState>;

  beforeEach(() => {
    events = new Emitter<GameObjectEventMap>();
    entity = new Mock<Entity>().setup((e) => e.events).returns(events).object();

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

    nodeAInputTransition = null;
    nodeAUpdateTransition = null;

    nodeA = {
      state: (e) => new FakeState(e, 'A'),
      onInput: () => nodeAInputTransition,
      onUpdate: () => nodeAUpdateTransition,
    };

    nodeB = {
      state: (e) => new FakeState(e, 'B'),
    };
  });

  function triggerInput(): void {
    events.trigger('input', { inputState });
  }

  function triggerUpdate(deltaTime = 0.16): void {
    events.trigger('update', { deltaTime });
  }

  describe('construction', () => {
    it('instantiates the initial node and enters it', () => {
      const controller = new StateController(entity, nodeA);

      expect(controller.currentStateNode).toBe(nodeA);
      expect(controller.currentState).toBeInstanceOf(FakeState);
      expect((controller.currentState as FakeState).label).toBe('A');
      expect((controller.currentState as FakeState).enterSpy).toHaveBeenCalledOnce();
    });
  });

  describe('onInput', () => {
    it("calls the current state's own input handling every time", () => {
      const controller = new StateController(entity, nodeA);
      const state = controller.currentState as FakeState;

      triggerInput();
      triggerInput();

      expect(state.inputSpy).toHaveBeenCalledTimes(2);
      expect(state.inputSpy).toHaveBeenCalledWith(inputState);
    });

    it('stays on the same state and node when the node returns null', () => {
      const controller = new StateController(entity, nodeA);
      const state = controller.currentState as FakeState;

      triggerInput();

      expect(controller.currentState).toBe(state);
      expect(controller.currentStateNode).toBe(nodeA);
      expect(state.exitSpy).not.toHaveBeenCalled();
    });

    it('transitions to the returned node, exiting the old state and entering the new one', () => {
      const controller = new StateController(entity, nodeA);
      const oldState = controller.currentState as FakeState;
      nodeAInputTransition = nodeB;

      triggerInput();

      expect(oldState.exitSpy).toHaveBeenCalledOnce();
      expect(controller.currentStateNode).toBe(nodeB);
      expect(controller.currentState).not.toBe(oldState);
      expect((controller.currentState as FakeState).label).toBe('B');
      expect((controller.currentState as FakeState).enterSpy).toHaveBeenCalledOnce();
    });

    it('does not throw when the current node has no onInput handler', () => {
      const controller = new StateController(entity, nodeB);

      expect(() => triggerInput()).not.toThrow();
      expect(controller.currentStateNode).toBe(nodeB);
    });
  });

  describe('onUpdate', () => {
    it("calls the current state's own update handling every time", () => {
      const controller = new StateController(entity, nodeA);
      const state = controller.currentState as FakeState;

      triggerUpdate(0.1);
      triggerUpdate(0.2);

      expect(state.updateSpy).toHaveBeenCalledTimes(2);
      expect(state.updateSpy).toHaveBeenNthCalledWith(1, 0.1);
      expect(state.updateSpy).toHaveBeenNthCalledWith(2, 0.2);
    });

    it('stays on the same state and node when the node returns null', () => {
      const controller = new StateController(entity, nodeA);
      const state = controller.currentState as FakeState;

      triggerUpdate();

      expect(controller.currentState).toBe(state);
      expect(controller.currentStateNode).toBe(nodeA);
    });

    it('transitions to the returned node, exiting the old state and entering the new one', () => {
      const controller = new StateController(entity, nodeA);
      const oldState = controller.currentState as FakeState;
      nodeAUpdateTransition = nodeB;

      triggerUpdate();

      expect(oldState.exitSpy).toHaveBeenCalledOnce();
      expect(controller.currentStateNode).toBe(nodeB);
      expect((controller.currentState as FakeState).label).toBe('B');
    });

    it('does not throw when the current node has no onUpdate handler', () => {
      const controller = new StateController(entity, nodeB);

      expect(() => triggerUpdate()).not.toThrow();
      expect(controller.currentStateNode).toBe(nodeB);
    });
  });

  describe('transitioning to the already-active node', () => {
    it('is a no-op for onInput: keeps the same state instance and does not exit/re-enter it', () => {
      const controller = new StateController(entity, nodeA);
      const state = controller.currentState as FakeState;
      nodeAInputTransition = nodeA;

      triggerInput();

      expect(controller.currentState).toBe(state);
      expect(controller.currentStateNode).toBe(nodeA);
      expect(state.exitSpy).not.toHaveBeenCalled();
      expect(state.enterSpy).toHaveBeenCalledOnce();
    });

    it('is a no-op for onUpdate: keeps the same state instance and does not exit/re-enter it', () => {
      const controller = new StateController(entity, nodeA);
      const state = controller.currentState as FakeState;
      nodeAUpdateTransition = nodeA;

      triggerUpdate();

      expect(controller.currentState).toBe(state);
      expect(controller.currentStateNode).toBe(nodeA);
      expect(state.exitSpy).not.toHaveBeenCalled();
      expect(state.enterSpy).toHaveBeenCalledOnce();
    });
  });

  describe('requestTransition', () => {
    it('does not apply immediately', () => {
      const controller = new StateController(entity, nodeA);
      const state = controller.currentState as FakeState;
      const forced = new FakeState(entity, 'forced');

      controller.requestTransition(forced);

      expect(controller.currentState).toBe(state);
    });

    it('applies on the next input or update tick, exiting the old state and entering the forced one', () => {
      const controller = new StateController(entity, nodeA);
      const state = controller.currentState as FakeState;
      const forced = new FakeState(entity, 'forced');

      controller.requestTransition(forced);
      triggerUpdate();

      expect(state.exitSpy).toHaveBeenCalledOnce();
      expect(controller.currentState).toBe(forced);
      expect(forced.enterSpy).toHaveBeenCalledOnce();
    });

    it('clears the current state node, so the forced state never transitions again via the old node', () => {
      const controller = new StateController(entity, nodeA);
      const forced = new FakeState(entity, 'forced');
      nodeAInputTransition = nodeB;
      nodeAUpdateTransition = nodeB;

      controller.requestTransition(forced);
      triggerUpdate();

      expect(controller.currentStateNode).toBeNull();

      triggerInput();
      triggerUpdate();

      expect(controller.currentState).toBe(forced);
      expect(controller.currentStateNode).toBeNull();
    });

    it("still calls the forced state's own input/update handling even without a node", () => {
      const controller = new StateController(entity, nodeA);
      const forced = new FakeState(entity, 'forced');

      controller.requestTransition(forced);
      triggerUpdate();

      triggerInput();
      triggerUpdate(0.5);

      expect(forced.inputSpy).toHaveBeenCalledOnce();
      expect(forced.updateSpy).toHaveBeenCalledWith(0.5);
    });
  });

  describe('onDestroyed', () => {
    it('clears current state and node, and stops responding to further events', () => {
      const controller = new StateController(entity, nodeA);
      const state = controller.currentState as FakeState;

      controller.destroy();

      expect(controller.currentState).toBeNull();
      expect(controller.currentStateNode).toBeNull();

      state.updateSpy.mockClear();
      triggerUpdate();
      triggerInput();

      expect(state.updateSpy).not.toHaveBeenCalled();
      expect(state.inputSpy).not.toHaveBeenCalled();
    });
  });
});
