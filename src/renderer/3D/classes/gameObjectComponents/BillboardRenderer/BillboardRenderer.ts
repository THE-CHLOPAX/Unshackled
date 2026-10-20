import type { ComponentType } from 'react';

import * as THREE from 'three';
import { GameObjectComponent, logger } from '@tgdf';

import { hasBillboardRegistry } from '3D/utils/hasBillboardRegistry';
import { BillboardRegistry } from '3D/classes/scenes/GameScene/BillboardRegistry/BillboardRegistry';

import { BILLBOARD_RENDERER_MESSAGES } from './constants';

export type BillboardElementOptions = {
  offset?: THREE.Vector3;
};

export class BillboardRenderer extends GameObjectComponent {
  private _elementIds = new Set<string>();

  public addElement<P extends object>(
    id: string,
    Component: ComponentType<P>,
    props: P,
    options?: BillboardElementOptions
  ): void {
    if (this._elementIds.has(id)) {
      logger({ message: BILLBOARD_RENDERER_MESSAGES.ELEMENT_ALREADY_ADDED(id), type: 'warn' });
      return;
    }

    const registry = this._getRegistry();
    if (!registry) {
      logger({ message: BILLBOARD_RENDERER_MESSAGES.REGISTRY_NOT_FOUND(id), type: 'warn' });
      return;
    }

    this._elementIds.add(id);
    registry.add(id, Component, props, {
      target: this.gameObject,
      offset: options?.offset ?? new THREE.Vector3(),
    });
  }

  public updateElement<P extends object>(id: string, props: Partial<P>): void {
    if (!this._elementIds.has(id)) {
      logger({ message: BILLBOARD_RENDERER_MESSAGES.ELEMENT_NOT_FOUND(id), type: 'warn' });
      return;
    }

    this._getRegistry()?.update(id, props);
  }

  public getElements(id: string): HTMLDivElement[] {
    if (!this._elementIds.has(id)) return [];
    return this._getRegistry()?.getElements(id) ?? [];
  }

  public removeElement(id: string): void {
    if (!this._elementIds.has(id)) {
      logger({ message: BILLBOARD_RENDERER_MESSAGES.ELEMENT_NOT_FOUND(id), type: 'warn' });
      return;
    }

    this._elementIds.delete(id);
    this._getRegistry()?.remove(id);
  }

  protected override onDestroyed(): void {
    super.onDestroyed();

    const registry = this._getRegistry();
    this._elementIds.forEach((id) => registry?.remove(id));
    this._elementIds.clear();
  }

  private _getRegistry(): BillboardRegistry | undefined {
    const { scene } = this;
    return hasBillboardRegistry(scene) ? scene.billboards : undefined;
  }
}
