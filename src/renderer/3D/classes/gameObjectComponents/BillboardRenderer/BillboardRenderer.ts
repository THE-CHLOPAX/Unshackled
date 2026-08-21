import type { ComponentType } from 'react';

import * as THREE from 'three';
import { GameObjectComponent, logger, throttle, worldToScreen } from '@tgdf';

import {
  addOverlayEntry,
  updateOverlayEntry,
  removeOverlayEntry,
  overlayElementRefs,
  overlayContainerSize,
} from 'renderer/store/useOverlayStore';

import { BILLBOARD_POSITION_UPDATE_INTERVAL_MS, BILLBOARD_RENDERER_MESSAGES } from './constants';

export type BillboardElementOptions = {
  offset?: THREE.Vector3;
};

type TrackedBillboardElement = {
  offset: THREE.Vector3;
};

// Module scoped, allocated once to avoid allocating a new vector every throttled tick
// for every tracked element.
const _worldPosition = new THREE.Vector3();

export class BillboardRenderer extends GameObjectComponent {
  private _elements: Map<string, TrackedBillboardElement> = new Map();
  private _throttledUpdatePositions = throttle(
    () => this._updatePositions(),
    BILLBOARD_POSITION_UPDATE_INTERVAL_MS
  );

  public addElement<P extends object>(
    id: string,
    Component: ComponentType<P>,
    props: P,
    options?: BillboardElementOptions
  ): void {
    if (this._elements.has(id)) {
      logger({ message: BILLBOARD_RENDERER_MESSAGES.ELEMENT_ALREADY_ADDED(id), type: 'warn' });
      return;
    }

    this._elements.set(id, { offset: options?.offset ?? new THREE.Vector3() });
    addOverlayEntry(id, Component, props);
  }

  public updateElement<P extends object>(id: string, props: Partial<P>): void {
    if (!this._elements.has(id)) {
      logger({ message: BILLBOARD_RENDERER_MESSAGES.ELEMENT_NOT_FOUND(id), type: 'warn' });
      return;
    }

    updateOverlayEntry(id, props);
  }

  public getElement(id: string): HTMLDivElement | undefined {
    return overlayElementRefs.get(id);
  }

  public removeElement(id: string): void {
    if (!this._elements.has(id)) {
      logger({ message: BILLBOARD_RENDERER_MESSAGES.ELEMENT_NOT_FOUND(id), type: 'warn' });
      return;
    }

    this._elements.delete(id);
    removeOverlayEntry(id);
  }

  protected override onUpdate(deltaTime: number): void {
    super.onUpdate(deltaTime);
    if (this._elements.size === 0) return;

    this._throttledUpdatePositions();
  }

  private _updatePositions(): void {
    const camera = this.scene?.camera;
    const { width, height } = overlayContainerSize;
    if (!camera || width === 0 || height === 0) return;

    this._elements.forEach((element, id) => {
      const node = overlayElementRefs.get(id);
      if (!node) return;

      this.gameObject.getWorldPosition(_worldPosition).add(element.offset);
      const { x, y, visible } = worldToScreen(_worldPosition, camera, width, height);

      node.style.visibility = visible ? 'visible' : 'hidden';
      if (visible) {
        node.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%)`;
      }
    });
  }

  protected override onDestroyed(): void {
    super.onDestroyed();

    this._elements.forEach((_element, id) => removeOverlayEntry(id));
    this._elements.clear();
  }
}
