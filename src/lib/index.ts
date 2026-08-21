import { Input } from './internal-input/Input';
import { ResourceTracker } from './internal-3d/ResourceTracker/ResourceTracker';

// Ipc handle
export { ipc } from './ipc';

// Internal stores
export * from './internal-store/useAssetStore';
export * from './internal-store/useGraphicsStore';
export * from './internal-store/useSoundsStore';
export * from './internal-store/useViewsStore';
export * from './internal-store/useGamepadStore';

// Internal UI
export * from './internal-ui/components';
export * from './internal-ui/ViewManager';
export * from './internal-ui/types/native';
export * from './internal-ui/types/graphics';
export * from './internal-ui/hooks/useClickOutside';
export * from './internal-ui/hooks/useDebounce';
export * from './internal-ui/hooks/useDebouncedCallback';
export * from './internal-ui/hooks/useDebounceWithQueueing';
export { logger } from './internal-ui/utils/logger';

// Internal Input
export * from './internal-input/types';
export * from './internal-input/hooks/useKeyPress';
export * from './internal-input/hooks/useMouseButton';
export * from './internal-input/Gamepad/GamepadInstance';
export * from './internal-input/Gamepad/GamepadMappings';
export * from './internal-input/hooks/useGamepadNavigation';
export * from './internal-input/hooks/useGamepadIndicator';

const AppInput = Input.getInstance();
export { AppInput as Input };

// Internal 3D
export * from './internal-3d/Emitter';
export * from './internal-3d/GameObject/GameObject';
export * from './internal-3d/PointLightPool/PointLightPool';
export * from './internal-3d/PhysicsManager/PhysicsManager';
export * from './internal-3d/Scene';
export * from './internal-ui/ThreeDViewer/ThreeDViewer';
export * from './internal-3d/types/gameObjects';
export * from './internal-3d/types/physics';
export * from './internal-3d/types/scene';
export * from './internal-3d/utils/traverseFind';
export * from './internal-3d/utils/isMesh';
export * from './internal-3d/utils/worldToScreen';

const ResourceTrackerInstance = ResourceTracker.getInstance();
export { ResourceTrackerInstance as ResourceTracker };

// Internal Game Components
export * from './internal-game-components';
export { GameObjectComponent } from './internal-game-components/GameObjectComponent';

// Internal Math
export * from './internal-math/utils/clamp';
export * from './internal-math/utils/compareFloats';
export * from './internal-math/utils/filterBelow';
export * from './internal-math/utils/randFromRange';

// Internal Utils
export { executeAsyncOperationsWithProgress } from './internal-utils/executeAsyncOperationsWithProgress';
export { assert } from './internal-utils/assert';
export { assertNever } from './internal-utils/assertNever';
export { throttle } from './internal-utils/throttle';
export { throttleWithLastValue } from './internal-utils/throttleWithLastValue';
export { arraysShallowCompare } from './internal-utils/arraysShallowCompare';
