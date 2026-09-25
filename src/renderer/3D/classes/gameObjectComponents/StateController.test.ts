import { Mock } from 'moq.ts';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Emitter, GameObjectEventMap, InputState } from '@tgdf';

import { State } from '../../classes/states';
import { Entity } from '../gameObjects/Entity';
import { StateController } from './StateController';
import { StateMachine, StateNode } from '../../types';
import { HealthPointsController, HealthPointsControllerEvents } from './HealthPointsController';

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
  let healthEvents: Emitter<HealthPointsControllerEvents>;
  let healthPointsController: HealthPointsController;
  let onDamage: ReturnType<typeof vi.fn<StateMachine['onDamage']>>;
  let onDeath: ReturnType<typeof vi.fn<StateMachine['onDeath']>>;

  beforeEach(() => {
    events = new Emitter<GameObjectEventMap>();
    entity = new Mock<Entity>()
      .setup((e) => e.events)
      .returns(events)
      .object();

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

    healthEvents = new Emitter<HealthPointsControllerEvents>();
    healthPointsController = new Mock<HealthPointsController>()
      .setup((h) => h.events)
      .returns(healthEvents)
      .object();

    onDamage = vi.fn<StateMachine['onDamage']>(() => null);
    onDeath = vi.fn<StateMachine['onDeath']>(() => null);
  });

  function createController(initialNode: StateNode): StateController {
    return new StateController(entity, { initialNode, onDamage, onDeath }, healthPointsController);
  }

  function triggerInput(): void {
    events.trigger('input', { inputState });
  }

  function triggerUpdate(deltaTime = 0.16): void {
    events.trigger('update', { deltaTime });
  }

  describe('construction', () => {
    it('instantiates the initial node and enters it', () => {
      const controller = createController(nodeA);

      expect(controller.currentStateNode).toBe(nodeA);
      expect(controller.currentState).toBeInstanceOf(FakeState);
      expect((controller.currentState as FakeState).label).toBe('A');
      expect((controller.currentState as FakeState).enterSpy).toHaveBeenCalledOnce();
    });
  });

  describe('onInput', () => {
    it("calls the current state's own input handling every time", () => {
      const controller = createController(nodeA);
      const state = controller.currentState as FakeState;

      triggerInput();
      triggerInput();

      expect(state.inputSpy).toHaveBeenCalledTimes(2);
      expect(state.inputSpy).toHaveBeenCalledWith(inputState);
    });

    it('stays on the same state and node when the node returns null', () => {
      const controller = createController(nodeA);
      const state = controller.currentState as FakeState;

      triggerInput();

      expect(controller.currentState).toBe(state);
      expect(controller.currentStateNode).toBe(nodeA);
      expect(state.exitSpy).not.toHaveBeenCalled();
    });

    it('transitions to the returned node, exiting the old state and entering the new one', () => {
      const controller = createController(nodeA);
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
      const controller = createController(nodeB);

      expect(() => triggerInput()).not.toThrow();
      expect(controller.currentStateNode).toBe(nodeB);
    });
  });

  describe('onUpdate', () => {
    it("calls the current state's own update handling every time", () => {
      const controller = createController(nodeA);
      const state = controller.currentState as FakeState;

      triggerUpdate(0.1);
      triggerUpdate(0.2);

      expect(state.updateSpy).toHaveBeenCalledTimes(2);
      expect(state.updateSpy).toHaveBeenNthCalledWith(1, 0.1);
      expect(state.updateSpy).toHaveBeenNthCalledWith(2, 0.2);
    });

    it('stays on the same state and node when the node returns null', () => {
      const controller = createController(nodeA);
      const state = controller.currentState as FakeState;

      triggerUpdate();

      expect(controller.currentState).toBe(state);
      expect(controller.currentStateNode).toBe(nodeA);
    });

    it('transitions to the returned node, exiting the old state and entering the new one', () => {
      const controller = createController(nodeA);
      const oldState = controller.currentState as FakeState;
      nodeAUpdateTransition = nodeB;

      triggerUpdate();

      expect(oldState.exitSpy).toHaveBeenCalledOnce();
      expect(controller.currentStateNode).toBe(nodeB);
      expect((controller.currentState as FakeState).label).toBe('B');
    });

    it('does not throw when the current node has no onUpdate handler', () => {
      const controller = createController(nodeB);

      expect(() => triggerUpdate()).not.toThrow();
      expect(controller.currentStateNode).toBe(nodeB);
    });
  });

  describe('transitioning to the already-active node', () => {
    it('is a no-op for onInput: keeps the same state instance and does not exit/re-enter it', () => {
      const controller = createController(nodeA);
      const state = controller.currentState as FakeState;
      nodeAInputTransition = nodeA;

      triggerInput();

      expect(controller.currentState).toBe(state);
      expect(controller.currentStateNode).toBe(nodeA);
      expect(state.exitSpy).not.toHaveBeenCalled();
      expect(state.enterSpy).toHaveBeenCalledOnce();
    });

    it('is a no-op for onUpdate: keeps the same state instance and does not exit/re-enter it', () => {
      const controller = createController(nodeA);
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
      const controller = createController(nodeA);
      const state = controller.currentState as FakeState;

      controller.requestTransition(nodeB);

      expect(controller.currentState).toBe(state);
      expect(controller.currentStateNode).toBe(nodeA);
    });

    it('applies on the next tick, exiting the old state and entering the forced node state', () => {
      const controller = createController(nodeA);
      const state = controller.currentState as FakeState;

      controller.requestTransition(nodeB);
      triggerUpdate();

      expect(state.exitSpy).toHaveBeenCalledOnce();
      expect(controller.currentStateNode).toBe(nodeB);
      expect((controller.currentState as FakeState).label).toBe('B');
      expect((controller.currentState as FakeState).enterSpy).toHaveBeenCalledOnce();
    });

    it('applies on the next input tick as well', () => {
      const controller = createController(nodeA);

      controller.requestTransition(nodeB);
      triggerInput();

      expect(controller.currentStateNode).toBe(nodeB);
    });

    it('re-enters the node even when it is already active', () => {
      const controller = createController(nodeA);
      const state = controller.currentState as FakeState;

      controller.requestTransition(nodeA);
      triggerUpdate();

      expect(state.exitSpy).toHaveBeenCalledOnce();
      expect(controller.currentState).not.toBe(state);
      expect(controller.currentStateNode).toBe(nodeA);
    });

    it('keeps following the graph from the forced node', () => {
      const nodeC: StateNode<FakeState> = { state: (e) => new FakeState(e, 'C') };
      const controller = createController(nodeB);
      nodeAUpdateTransition = nodeC;

      controller.requestTransition(nodeA);
      triggerUpdate();
      triggerUpdate();

      expect(controller.currentStateNode).toBe(nodeC);
      expect((controller.currentState as FakeState).label).toBe('C');
    });
  });

  describe('health events', () => {
    it('calls onDamage with the entity, current state and damage details', () => {
      const controller = createController(nodeA);

      healthEvents.trigger('damagetaken', { currentHealth: 70, damageAmount: 30 });

      expect(onDamage).toHaveBeenCalledWith({
        entity,
        currentState: controller.currentState,
        currentHealth: 70,
        damageAmount: 30,
      });
    });

    it('keeps the current state and node when onDamage returns null', () => {
      const controller = createController(nodeA);
      const state = controller.currentState;

      healthEvents.trigger('damagetaken', { currentHealth: 70, damageAmount: 30 });
      triggerUpdate();

      expect(controller.currentState).toBe(state);
      expect(controller.currentStateNode).toBe(nodeA);
    });

    it('forces a transition to the node returned by onDamage', () => {
      const controller = createController(nodeA);
      onDamage.mockReturnValue(nodeB);

      healthEvents.trigger('damagetaken', { currentHealth: 70, damageAmount: 30 });
      triggerUpdate();

      expect(controller.currentStateNode).toBe(nodeB);
      expect((controller.currentState as FakeState).label).toBe('B');
    });

    it('calls onDeath and forces a transition to the returned node', () => {
      const controller = createController(nodeA);
      const oldState = controller.currentState as FakeState;
      onDeath.mockReturnValue(nodeB);

      healthEvents.trigger('death');
      triggerUpdate();

      expect(onDeath).toHaveBeenCalledWith({ entity, currentState: oldState });
      expect(oldState.exitSpy).toHaveBeenCalledOnce();
      expect(controller.currentStateNode).toBe(nodeB);
      expect((controller.currentState as FakeState).label).toBe('B');
    });

    it('stops listening to health events once destroyed', () => {
      const controller = createController(nodeA);

      controller.destroy();
      healthEvents.trigger('damagetaken', { currentHealth: 70, damageAmount: 30 });
      healthEvents.trigger('death');

      expect(onDamage).not.toHaveBeenCalled();
      expect(onDeath).not.toHaveBeenCalled();
    });
  });

  describe('onDestroyed', () => {
    it('clears current state and node, and stops responding to further events', () => {
      const controller = createController(nodeA);
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
