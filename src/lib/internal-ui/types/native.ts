import { Resolution } from './graphics';

export type NativeSaveFileResponse = { ok: boolean; path?: string; error?: string };

export type NativeLoadFileResponse = { ok: boolean; path: string | null; contents: string | null };

export type NativeSaveFileRequest = { name: string; json: string };

export type NativeLoadFileRequest = { path: string | undefined };

export type NativeEventMainMap = {
  'set-resolution-response': { resolution: Resolution };
  'set-fullscreen-response': { fullscreen: boolean };
  'get-fullscreen-state-response': { fullscreen: boolean };
  'save-file-response': NativeSaveFileResponse;
  'load-file-response': NativeLoadFileResponse;
};

export type NativeEventRendererMap = {
  'app-quit-request': undefined;
  'set-resolution-request': { resolution: Resolution };
  'set-fullscreen-request': { fullscreen: boolean; resolution: Resolution };
  'get-fullscreen-state-request': undefined;
  'save-file-request': NativeSaveFileRequest;
  'load-file-request': NativeLoadFileRequest;
};
