import * as THREE from 'three';

export type SceneEventsMap = {
  update: { deltaTime: number };
  'object-added': { object: THREE.Object3D };
  'object-removed': { object: THREE.Object3D };
  'renderer-change': { renderer: THREE.WebGLRenderer | null };
};

export type SceneCamera = THREE.Camera & {
  update: (deltaTime: number) => void;
};
