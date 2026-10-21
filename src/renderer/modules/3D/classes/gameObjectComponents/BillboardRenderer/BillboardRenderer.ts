import type { ComponentType } from 'react';

import * as THREE from 'three';
import { GameObject, GameObjectComponent, logger } from '@tgdf';

import { BillboardRegistry } from '3D/classes/scenes/GameScene/BillboardRegistry/BillboardRegistry';
import { BILLBOARD_RENDERER_MESSAGES } from '3D/classes/gameObjectComponents/BillboardRenderer/constants';

export type BillboardElementOptions = {
  offset?: THREE.Vector3;
};

export class BillboardRenderer extends GameObjectComponent {
  private _elementIds = new Set<string>();

  constructor(
    gameObject: GameObject,
    private readonly _registry: BillboardRegistry
  ) {
    super(gameObject);
  }

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

    this._elementIds.add(id);
    this._registry.add(id, Component, props, {
      target: this.gameObject,
      offset: options?.offset ?? new THREE.Vector3(),
    });
  }

  public updateElement<P extends object>(id: string, props: Partial<P>): void {
    if (!this._elementIds.has(id)) {
      logger({ message: BILLBOARD_RENDERER_MESSAGES.ELEMENT_NOT_FOUND(id), type: 'warn' });
      return;
    }

    this._registry.update(id, props);
  }

  public getElements(id: string): HTMLDivElement[] {
    if (!this._elementIds.has(id)) return [];
    return this._registry.getElements(id);
  }

  public removeElement(id: string): void {
    if (!this._elementIds.has(id)) {
      logger({ message: BILLBOARD_RENDERER_MESSAGES.ELEMENT_NOT_FOUND(id), type: 'warn' });
      return;
    }

    this._elementIds.delete(id);
    this._registry.remove(id);
  }

  protected override onDestroyed(): void {
    super.onDestroyed();

    this._elementIds.forEach((id) => this._registry.remove(id));
    this._elementIds.clear();
  }
}
