import { NavMeshAgent } from '@tgdf';
import { NavMesh, Crowd } from '@recast-navigation/core';

import { AIAttackOptions, EntityClass } from '3D/types';
import { GameScene } from '3D/classes/scenes/GameScene/GameScene';
import { Entity, EntityOptions } from '3D/classes/gameObjects/Entity';
import {
  HealthBarRenderer,
  HealthBarRendererOptions,
} from '3D/classes/gameObjectComponents/HealthBarRenderer/HealthBarRenderer';

export type EntityAIOptions = EntityOptions & {
  detectionRadius?: number;
  healthBarOptions?: HealthBarRendererOptions;
  attack?: AIAttackOptions;
  enemyTypes?: EntityClass[];
};

const DESPAWN_TIMEOUT = 3000;

export class EntityAI extends Entity {
  public navMeshAgent: NavMeshAgent;

  public readonly isEntityAi = true;

  private _enemyTypes: EntityClass[] | null = null;
  private _detectionRadius: number | null = null;
  private _attack: AIAttackOptions | null = null;
  private _despawnTimeout: NodeJS.Timeout | null = null;
  private _healthBarRenderer: HealthBarRenderer | null = null;

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

    this._healthBarRenderer = this.addComponent(
      'HealthBarRenderer',
      new HealthBarRenderer(
        this,
        scene.billboards,
        this.healthPointsController,
        options.healthBarOptions
      )
    );

    this.onInit();
  }

  public get attackOptions(): AIAttackOptions | null {
    return this._attack;
  }

  public get detectionRadius(): number | null {
    return this._detectionRadius;
  }

  public get enemyTypes(): EntityClass[] | null {
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
