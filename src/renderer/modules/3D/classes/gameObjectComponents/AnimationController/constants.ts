export const ANIMATION_CONTROLLER_MESSAGES = {
  NO_MIXER:
    '[AnimationController] No animation mixer available. Make sure a model with animations is set.',
  ANIMATION_NOT_FOUND: (animationName: string) =>
    `[AnimationController] Animation "${animationName}" not found on model.`,
} as const;
