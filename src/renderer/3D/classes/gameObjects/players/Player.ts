import { IdleState, State } from '../../states';
import { Entity, EntityOptions } from '../Entity';
import { GameScene } from '../../scenes/GameScene/GameScene';
import { PlayerActionType, SequenceSkill } from '../../../../../renderer/3D/types';
import { InputSequenceTracker } from './InputSequenceTracker/InputSequenceTracker';

export type PlayerOptions = EntityOptions & {
  actions: {
    [key in PlayerActionType]?: (entity: Player) => State;
  };
  sequenceSkills?: SequenceSkill[];
  sequenceTimeoutMs: number;
};

export class Player extends Entity {
  public isPlayer = true;
  public readonly sequenceSkills: SequenceSkill[];
  public readonly sequenceTracker: InputSequenceTracker;

  private _skillCooldownEndsAt = new Map<SequenceSkill, number>();

  constructor(
    scene: GameScene,
    public options: PlayerOptions
  ) {
    super(scene, options);

    this.sequenceSkills = options.sequenceSkills ?? [];
    this.sequenceTracker = new InputSequenceTracker(options.sequenceTimeoutMs);

    this.stateController.currentState = new IdleState(this);
  }

  public onAction(actionType: PlayerActionType): State | null {
    return this.options.actions[actionType]?.(this) || null;
  }

  public isSkillOnCooldown(skill: SequenceSkill): boolean {
    const cooldownEndsAt = this._skillCooldownEndsAt.get(skill);
    return cooldownEndsAt !== undefined && performance.now() < cooldownEndsAt;
  }

  public startSkillCooldown(skill: SequenceSkill): void {
    this._skillCooldownEndsAt.set(skill, performance.now() + skill.cooldownMs);
  }
}
