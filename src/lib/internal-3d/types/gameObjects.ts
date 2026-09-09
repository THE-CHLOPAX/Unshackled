import { Scene } from '../Scene/Scene';
import { InputState } from '../../internal-input/types';

export type GameObjectComponentTemplate = {
  name: string;
  options?: unknown;
};

export type GameObjectConstructorOptions = {
  scene: Scene;
  skipUpdate?: boolean;
};

/**
 * Base event map for GameObject.
 * Can be extended via declaration merging to add component-specific events.
 *
 * @example
 * ```typescript
 * // In your component file or a .d.ts file:
 * declare module '@tgdf' {
 *   interface GameObjectEventMap {
 *     'animationController:complete': { animationName: string };
 *     'animationController:start': { animationName: string };
 *   }
 * }
 * ```
 */
export interface GameObjectEventMap {
  awake: void;
  destroyed: void;
  update: { deltaTime: number };
  input: { inputState: InputState };
}
