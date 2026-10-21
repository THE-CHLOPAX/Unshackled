import type { FMODEventDefinition } from 'FMOD';
import type { PlayerActionType } from 'renderer/types';

import * as THREE from 'three';
import { InputState, SceneCamera } from '@tgdf';

import { State } from '3D/classes/states';
import { Entity } from '3D/classes/gameObjects/Entity/Entity';

export type { ModelRecord, TextureRecord, AssetRecord } from '@tgdf';

export type AsyncAction = (entity: Entity) => Promise<void>;

export type EntityAction = {
  action: AsyncAction;
  sound?: FMODEventDefinition;
  freezeDurationMs?: number;
};

export type AIAttackAction = EntityAction & {
  minRange: number;
  maxRange: number;
};

export type PlayerAction = EntityAction & {
  staminaCost?: number;
};

export type ChainedAction = PlayerAction & {
  chain?: {
    next: ChainedAction;
    requiredInput: PlayerActionType;
    windowDelayMs: number;
    windowDurationMs: number;
  };
};

export type AIAttackOptions = {
  actions: AIAttackAction[];
};

export type GameCamera = SceneCamera & {
  addShake: (intensity: number) => void;
  pivotPoint: THREE.Vector3;
};

type StateNodeFor<E extends Entity, S extends State> = {
  state(entity: E): S;
  onInput?(ctx: { entity: E; input: InputState; currentState: S }): StateNodeFor<E, State> | null;
  onUpdate?(ctx: { entity: E; deltaTime: number; currentState: S }): StateNodeFor<E, State> | null;
};

export type StateNode<S extends State = State> = StateNodeFor<S['entity'], S>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EntityClass = abstract new (...args: any[]) => Entity;

export type StateMachineContext = {
  entity: Entity;
  currentState: State | null;
};

export type StateMachine = {
  initialNode: StateNode;
  onDamage(
    ctx: StateMachineContext & { currentHealth: number; damageAmount: number }
  ): StateNode | null;
  onDeath(ctx: StateMachineContext): StateNode | null;
  onInteract?(ctx: StateMachineContext & { target: Interactable }): StateNode | null;
};

export type Interactable = {
  interact(entity: Entity): void;
};
