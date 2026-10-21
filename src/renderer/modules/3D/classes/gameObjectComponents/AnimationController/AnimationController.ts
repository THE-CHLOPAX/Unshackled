import * as THREE from 'three';
import { GameObject, GameObjectComponent, logger } from '@tgdf';

import { ModelRenderer } from '3D/classes/gameObjectComponents/ModelRenderer/ModelRenderer';
import { ANIMATION_CONTROLLER_MESSAGES } from '3D/classes/gameObjectComponents/AnimationController/constants';

export type AnimationEvent = {
  type: string;
  action: THREE.AnimationAction;
  direction: number;
};

export type AnimationPlayOptions = {
  playbackRate?: number;
  loop?: boolean;
  clampWhenFinished?: boolean;
  onComplete?: () => void;
};

export type AnimationControllerOptions = {
  playbackRates?: Record<string, number>;
  fadeOutDurations?: Record<string, number>;
};

const DEFAULT_FADE_OUT_DURATION = 0.2; // seconds
export class AnimationController extends GameObjectComponent {
  private _currentAction: THREE.AnimationAction | null = null;
  private _onCompleteCallbacks = new Map<THREE.AnimationAction, () => void>();
  private _animations: THREE.AnimationClip[] = [];
  private _animationMixer: THREE.AnimationMixer | null = null;
  private _actions: Map<string, THREE.AnimationAction> = new Map();

  constructor(
    gameObject: GameObject,
    modelRenderer: ModelRenderer,
    private _options?: AnimationControllerOptions
  ) {
    super(gameObject);

    const currentModel = modelRenderer.getModel();
    if (currentModel) {
      this._initializeAnimations(currentModel);
    }

    modelRenderer.onModelChange = this._initializeAnimations.bind(this);
  }

  public getAnimations(): THREE.AnimationClip[] {
    return this._animations;
  }

  public playAnimation(animationName: string, options?: AnimationPlayOptions): void {
    const action = this._getAnimationAction(animationName);
    if (!action) return;

    // If already playing this animation, update onComplete if provided but don't restart it
    if (this._currentAction === action && action.isRunning()) {
      if (options?.onComplete) {
        this._setOnCompleteCallback(action, options.onComplete);
      }
      return;
    }

    // Fade out and stop the previous action
    if (this._currentAction && this._currentAction !== action) {
      const fadeOutDuration =
        this._options?.fadeOutDurations?.[this._currentAction.getClip().name] ??
        DEFAULT_FADE_OUT_DURATION;
      this._currentAction.fadeOut(fadeOutDuration);
      this._clearOnCompleteCallback(this._currentAction);
    }

    // Apply playback rate if specified
    const playbackRate =
      options?.playbackRate ?? this._options?.playbackRates?.[animationName] ?? 1;
    const baseDuration = action.getClip().duration;
    action.setDuration(baseDuration / playbackRate);

    if (options?.loop === true) {
      action.setLoop(THREE.LoopRepeat, Infinity);
    } else {
      action.setLoop(THREE.LoopOnce, 0);
    }

    action.clampWhenFinished = options?.clampWhenFinished ?? false;

    // Reset and play the new action
    this._currentAction = action;
    if (options?.onComplete) {
      this._setOnCompleteCallback(action, options.onComplete);
    }

    action.reset();
    action.fadeIn(0.2);
    action.play();
  }

  public pauseAnimation(animationName: string): void {
    const action = this._getAnimationAction(animationName);
    if (!action) return;
    action.paused = true;
  }

  public stopAnimation(animationName: string): void {
    const action = this._getAnimationAction(animationName);
    if (!action) return;
    if (this._currentAction === action) {
      this._currentAction = null;
    }
    this._clearOnCompleteCallback(action);
    action.stop();
  }

  protected override onUpdate(deltaTime: number): void {
    if (this._animationMixer) {
      this._animationMixer.update(deltaTime);
    }
  }

  protected override onDestroyed(): void {
    this._disposeAnimationMixer();
    this._animations = [];
    super.onDestroyed();
  }

  private _getAnimationAction(animationName: string): THREE.AnimationAction | null {
    if (!this._animationMixer) {
      logger({
        message: ANIMATION_CONTROLLER_MESSAGES.NO_MIXER,
        type: 'warn',
      });
      return null;
    }

    // Return cached action if it exists
    const animationAction = this._actions.get(animationName);
    if (animationAction !== undefined) {
      return animationAction;
    }

    const clip = this._animations.find((anim) => anim.name === animationName);
    if (!clip) {
      logger({
        message: ANIMATION_CONTROLLER_MESSAGES.ANIMATION_NOT_FOUND(animationName),
        type: 'warn',
      });
      return null;
    }

    // Create and cache the action
    const action = this._animationMixer.clipAction(clip);
    this._actions.set(animationName, action);
    return action;
  }

  private _initializeAnimations(model: THREE.Object3D): void {
    // Clean up existing mixer before creating a new one
    this._disposeAnimationMixer();

    this._animations = [...model.animations];
    this._animationMixer = new THREE.AnimationMixer(model);

    this._animationMixer.addEventListener('finished', (event) => {
      const onComplete = this._onCompleteCallbacks.get(event.action);
      if (!onComplete) return;

      this._onCompleteCallbacks.delete(event.action);
      onComplete();
    });

    this._actions.clear(); // Clear cached actions
    this._onCompleteCallbacks.clear();
  }

  private _disposeAnimationMixer(): void {
    if (this._animationMixer) {
      this._animationMixer.stopAllAction();
      this._animationMixer.uncacheRoot(this._animationMixer.getRoot());
      this._animationMixer = null;
    }
    this._onCompleteCallbacks.clear();
  }

  private _setOnCompleteCallback(action: THREE.AnimationAction, onComplete: () => void): void {
    this._onCompleteCallbacks.set(action, onComplete);
  }

  private _clearOnCompleteCallback(action: THREE.AnimationAction): void {
    this._onCompleteCallbacks.delete(action);
  }
}
