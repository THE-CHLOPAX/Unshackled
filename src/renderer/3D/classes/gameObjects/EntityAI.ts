import { NavMeshAgent } from '@tgdf';
import { NavMesh, Crowd } from '@recast-navigation/core';

import { AIAttackOptions } from '../../types';
import { Entity, EntityOptions } from './Entity';
import { GameScene } from '../scenes/GameScene/GameScene';

export type EntityAIOptions = EntityOptions & {
  detectionRadius?: number;
  attack?: AIAttackOptions;
  enemyTypes?: (typeof Entity)[];
};

const DESPAWN_TIMEOUT = 3000;

export class EntityAI extends Entity {
  public navMeshAgent: NavMeshAgent;

  public readonly isEntityAi = true;

  private _enemyTypes: (typeof Entity)[] | null = null;
  private _detectionRadius: number | null = null;
  private _attack: AIAttackOptions | null = null;
  private _despawnTimeout: NodeJS.Timeout | null = null;

  constructor(
    scene: GameScene,
    public navMesh: NavMesh,
    public crowd: Crowd,
    public options: EntityAIOptions
  ) {
    super(scene, options);

    this.navMeshAgent = this.addComponent('NavMeshAgent', new NavMeshAgent(this, this.crowd));

    this._detectionRadius = options.detectionRadius ?? null;
    this._attack = options.attack ?? null;
    this._enemyTypes = options.enemyTypes ?? null;

    this.healthPointsController.events.once('death', this._despawnAfterTimeout);

    this.onInit();
  }

  public get attackOptions(): AIAttackOptions | null {
    return this._attack;
  }

  public get detectionRadius(): number | null {
    return this._detectionRadius;
  }

  public get enemyTypes(): (typeof Entity)[] | null {
    return this._enemyTypes;
  }

  protected onInit(): void {}

  private _despawnAfterTimeout = (): void => {
    this._despawnTimeout = setTimeout(() => {
      this.destroy();
      this.removeFromParent();
    }, DESPAWN_TIMEOUT);
  };

  protected override onDestroyed(): void {
    if (this._despawnTimeout) {
      clearTimeout(this._despawnTimeout);
      this._despawnTimeout = null;
    }
    super.onDestroyed();
  }
}
