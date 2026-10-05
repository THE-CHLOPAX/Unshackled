import { Resolution } from './graphics';

export type NativeSaveFileResponse = { ok: boolean; path?: string; error?: string };

export type NativeRemoveFileResponse = { ok: boolean; error?: string };

export type NativeLoadFileResponse = { ok: boolean; path: string | null; contents: string | null };

export type NativeFileRoot = 'app' | 'userData';

export type NativeFileLocation = { root: NativeFileRoot; directory: string };

export type NativeSaveFileRequest = NativeFileLocation & { name: string; json: string };

export type NativeRemoveFileRequest = NativeFileLocation & { name: string };

export type NativeLoadFileRequest = NativeFileLocation & { path: string | undefined };

export type NativeListFilesRequest = NativeFileLocation & { extension?: string };

export type NativeListedFile = { name: string; contents: string };

export type NativeListFilesResponse = { ok: boolean; files: NativeListedFile[]; error?: string };

export type NativeEventMainMap = {
  'set-resolution-response': { resolution: Resolution };
  'set-fullscreen-response': { fullscreen: boolean };
  'get-fullscreen-state-response': { fullscreen: boolean };
  'save-file-response': NativeSaveFileResponse;
  'remove-file-response': NativeRemoveFileResponse;
  'load-file-response': NativeLoadFileResponse;
  'list-files-response': NativeListFilesResponse;
};

export type NativeEventRendererMap = {
  'app-quit-request': undefined;
  'set-resolution-request': { resolution: Resolution };
  'set-fullscreen-request': { fullscreen: boolean; resolution: Resolution };
  'get-fullscreen-state-request': undefined;
  'save-file-request': NativeSaveFileRequest;
  'remove-file-request': NativeRemoveFileRequest;
  'load-file-request': NativeLoadFileRequest;
  'list-files-request': NativeListFilesRequest;
};
