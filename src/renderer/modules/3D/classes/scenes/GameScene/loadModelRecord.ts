import { ModelRecord, useAssetStore } from '@tgdf';

export function loadModelRecord(record: ModelRecord): Promise<unknown> {
  const { loadModelGLTF, loadModelFBX, loadModelJSON } = useAssetStore.getState();
  const extension = record.path.split('.').pop()?.toLowerCase();

  const modelOptions = {
    nameExtractor: record.nameExtractor,
    centerOrigin: record.centerOrigin ?? true,
  };

  switch (extension) {
    case 'fbx':
      return loadModelFBX(record.id, record.path, modelOptions);
    case 'json':
      return loadModelJSON(record.id, record.path, record.nameExtractor);
    default:
      return loadModelGLTF(record.id, record.path, modelOptions);
  }
}
