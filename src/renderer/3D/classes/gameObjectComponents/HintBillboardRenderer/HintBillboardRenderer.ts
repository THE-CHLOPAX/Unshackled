import * as THREE from 'three';
import { GameObject } from '@tgdf';

import { HintBillboard, HintBillboardHint, HintBillboardProps } from 'UI';

import { HINT_BILLBOARD_OFFSET } from './constants';
import { BillboardRenderer } from '../BillboardRenderer/BillboardRenderer';

export type HintBillboardRendererOptions = {
  title?: string;
  hints?: HintBillboardHint[];
  offset?: THREE.Vector3;
};

export class HintBillboardRenderer extends BillboardRenderer {
  private readonly _hintId: string;
  private readonly _offset: THREE.Vector3;
  private _title: string | undefined;
  private _hints: HintBillboardHint[];
  private _isTitleVisible = false;
  private _areHintsVisible = false;
  private _isRendered = false;

  constructor(gameObject: GameObject, options: HintBillboardRendererOptions = {}) {
    super(gameObject);
    this._hintId = `hint-billboard-${gameObject.uuid}`;
    this._offset = options.offset ?? HINT_BILLBOARD_OFFSET;
    this._title = options.title;
    this._hints = options.hints ?? [];
  }

  public get isVisible(): boolean {
    return this._isRendered;
  }

  public get title(): string | undefined {
    return this._title;
  }

  public get hints(): readonly HintBillboardHint[] {
    return this._hints;
  }

  public setTitle(title: string | undefined): void {
    this._title = title;
    this._render();
  }

  public setHints(hints: HintBillboardHint[]): void {
    this._hints = [...hints];
    this._render();
  }

  public setTitleVisible(visible: boolean): void {
    this._isTitleVisible = visible;
    this._render();
  }

  public setHintsVisible(visible: boolean): void {
    this._areHintsVisible = visible;
    this._render();
  }

  public show(): void {
    this._isTitleVisible = true;
    this._areHintsVisible = true;
    this._render();
  }

  public hide(): void {
    this._isTitleVisible = false;
    this._areHintsVisible = false;
    this._render();
  }

  protected override onDestroyed(): void {
    super.onDestroyed();
    this._isRendered = false;
  }

  private _getVisibleProps(): HintBillboardProps {
    return {
      title: this._isTitleVisible ? this._title : undefined,
      hints: this._areHintsVisible ? this._hints : [],
    };
  }

  private _render(): void {
    const props = this._getVisibleProps();
    const shouldRender = props.title !== undefined || props.hints.length > 0;

    if (shouldRender && this._isRendered) {
      this.updateElement<HintBillboardProps>(this._hintId, props);
    } else if (shouldRender) {
      this.addElement(this._hintId, HintBillboard, props, { offset: this._offset });
      this._isRendered = true;
    } else if (this._isRendered) {
      this.removeElement(this._hintId);
      this._isRendered = false;
    }
  }
}
