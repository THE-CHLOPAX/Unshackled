import * as THREE from 'three';
import { worldToScreen } from '@tgdf';

import { BillboardRegistry } from '3D/classes/scenes/GameScene/BillboardRegistry/BillboardRegistry';

const _worldPosition = new THREE.Vector3();

export class BillboardView {
  private readonly _nodes = new Map<string, HTMLDivElement>();
  private _width = 0;
  private _height = 0;

  constructor(public readonly registry: BillboardRegistry) {}

  public attach(): void {
    this.registry.attachView(this);
  }

  public detach(): void {
    this.registry.detachView(this);
  }

  public getNode(id: string): HTMLDivElement | undefined {
    return this._nodes.get(id);
  }

  public setNode(id: string, node: HTMLDivElement | null): void {
    if (node) {
      this._nodes.set(id, node);
    } else {
      this._nodes.delete(id);
    }
  }

  public setSize(width: number, height: number): void {
    this._width = width;
    this._height = height;
  }

  public updatePositions(camera: THREE.Camera): void {
    if (this._width === 0 || this._height === 0) return;

    this._nodes.forEach((node, id) => {
      const entry = this.registry.get(id);
      if (!entry) return;

      entry.target.getWorldPosition(_worldPosition).add(entry.offset);
      const { x, y, visible } = worldToScreen(_worldPosition, camera, this._width, this._height);

      node.style.visibility = visible ? 'visible' : 'hidden';
      if (visible) {
        node.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%)`;
      }
    });
  }
}
