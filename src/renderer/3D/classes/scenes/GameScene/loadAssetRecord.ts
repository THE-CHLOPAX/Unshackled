import { AssetRecord, useAssetStore } from '@tgdf';

import { loadModelRecord } from './loadModelRecord';

export function loadAssetRecord(record: AssetRecord): Promise<unknown> {
  if (record.type === 'texture') {
    return useAssetStore.getState().loadTexture(record.id, record.path, record.colorSpace);
  }
  return loadModelRecord(record);
}
