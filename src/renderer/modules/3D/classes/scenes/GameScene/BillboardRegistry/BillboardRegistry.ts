import type { ComponentType } from 'react';
import type { BillboardView } from '3D/classes/scenes/GameScene/BillboardRegistry/BillboardView';

import * as THREE from 'three';

export type BillboardEntry = {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: ComponentType<any>;
  props: Record<string, unknown>;
  target: THREE.Object3D;
  offset: THREE.Vector3;
};

export type BillboardEntryPlacement = {
  target: THREE.Object3D;
  offset: THREE.Vector3;
};

export class BillboardRegistry {
  private readonly _entries = new Map<string, BillboardEntry>();
  private readonly _listeners = new Set<() => void>();
  private readonly _views = new Set<BillboardView>();
  private _snapshot: readonly BillboardEntry[] = [];

  public has(id: string): boolean {
    return this._entries.has(id);
  }

  public get(id: string): BillboardEntry | undefined {
    return this._entries.get(id);
  }

  public add<P extends object>(
    id: string,
    Component: ComponentType<P>,
    props: P,
    { target, offset }: BillboardEntryPlacement
  ): void {
    this._entries.set(id, {
      id,
      Component: Component as ComponentType<Record<string, unknown>>,
      props: props as Record<string, unknown>,
      target,
      offset,
    });
    this._commit();
  }

  public update<P extends object>(id: string, props: Partial<P>): void {
    const existing = this._entries.get(id);
    if (!existing) return;

    this._entries.set(id, { ...existing, props: { ...existing.props, ...props } });
    this._commit();
  }

  public remove(id: string): void {
    if (!this._entries.delete(id)) return;
    this._commit();
  }

  public clear(): void {
    if (this._entries.size === 0) return;
    this._entries.clear();
    this._commit();
  }

  public subscribe = (listener: () => void): (() => void) => {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  };

  public getSnapshot = (): readonly BillboardEntry[] => {
    return this._snapshot;
  };

  public attachView(view: BillboardView): void {
    this._views.add(view);
  }

  public detachView(view: BillboardView): void {
    this._views.delete(view);
  }

  public getElements(id: string): HTMLDivElement[] {
    const elements: HTMLDivElement[] = [];
    this._views.forEach((view) => {
      const node = view.getNode(id);
      if (node) elements.push(node);
    });
    return elements;
  }

  private _commit(): void {
    this._snapshot = Array.from(this._entries.values());
    this._listeners.forEach((listener) => listener());
  }
}
