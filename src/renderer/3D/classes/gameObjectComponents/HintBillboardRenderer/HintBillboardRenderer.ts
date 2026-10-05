import * as THREE from 'three';
import { GameObject } from '@tgdf';

import { HintBillboard, HintBillboardProps } from 'UI';

import { HINT_BILLBOARD_OFFSET } from './constants';
import { BillboardRenderer } from '../BillboardRenderer/BillboardRenderer';

export type HintBillboardRendererOptions = {
  hint: HintBillboardProps;
  offset?: THREE.Vector3;
};

export class HintBillboardRenderer extends BillboardRenderer {
  private readonly _hintId: string;
  private readonly _offset: THREE.Vector3;
  private _hint: HintBillboardProps;
  private _isVisible = false;

  constructor(gameObject: GameObject, options: HintBillboardRendererOptions) {
    super(gameObject);
    this._hintId = `hint-billboard-${gameObject.uuid}`;
    this._offset = options.offset ?? HINT_BILLBOARD_OFFSET;
    this._hint = options.hint;
  }

  public get isVisible(): boolean {
    return this._isVisible;
  }

  public get hint(): HintBillboardProps {
    return this._hint;
  }

  public updateHint(hint: Partial<HintBillboardProps>): void {
    this._hint = { ...this._hint, ...hint };

    if (this._isVisible) {
      this.updateElement<HintBillboardProps>(this._hintId, this._hint);
    }
  }

  public show(): void {
    if (this._isVisible) return;

    this.addElement(this._hintId, HintBillboard, this._hint, { offset: this._offset });
    this._isVisible = true;
  }

  public hide(): void {
    if (!this._isVisible) return;

    this.removeElement(this._hintId);
    this._isVisible = false;
  }

  protected override onDestroyed(): void {
    super.onDestroyed();
    this._isVisible = false;
  }
}
