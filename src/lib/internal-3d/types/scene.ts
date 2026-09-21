import * as THREE from 'three';

export type SceneEventsMap = {
  update: { deltaTime: number };
  objectAdded: { object: THREE.Object3D };
  objectRemoved: { object: THREE.Object3D };
  rendererChange: { renderer: THREE.WebGLRenderer | null };
};

export type SceneCamera = THREE.Camera & {
  update: (deltaTime: number) => void;
};
