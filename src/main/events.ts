import path from 'path';
import { app, dialog, screen } from 'electron';
import { readFile, mkdir, writeFile } from 'fs/promises';
import { Resolution } from '@tgdf/internal-ui/types/graphics';
import { NativeLoadFileRequest, NativeSaveFileRequest } from '@tgdf';

import { mainWindow, main } from './main';
import { getZoomFactorForResolution } from './utils/getZoomFactorForResolution';

const currentResolution: Resolution = { width: 1280, height: 720 };

const WORLD_MAPS_DIR = 'src/renderer/assets/worldMaps';

export function bindUserEvents(): void {
  main.on('app-quit-request', onCloseAppRequest);
  main.on('set-resolution-request', onResolutionRequest);
  main.on('set-fullscreen-request', onFullscreenRequest);
  main.on('get-fullscreen-state-request', onGetFullscreenStateRequest);
  main.on('save-file-request', onSaveFileRequest);
  main.on('load-file-request', onLoadFileRequest);

  if (!mainWindow) {
    return;
  }

  mainWindow.on('enter-full-screen', onEnterFullscreen);
  mainWindow.on('leave-full-screen', onLeaveFullscreen);
}

export function onCloseAppRequest(): void {
  if (!mainWindow) {
    return;
  }
  mainWindow.close();
}

export function onResolutionRequest(request: { resolution: Resolution }): void {
  if (!mainWindow) {
    return;
  }

  const { resolution } = request;
  const fullscreen = mainWindow.isFullScreen();

  currentResolution.width = resolution.width;
  currentResolution.height = resolution.height;

  let zoomFactor = 1;

  // If fullscreen, set resolution by manipulating zoom level
  if (fullscreen) {
    zoomFactor = getZoomFactorForResolution(resolution, mainWindow, true);
  } else {
    mainWindow.setContentSize(resolution.width, resolution.height);
  }

  mainWindow.setFullScreen(fullscreen);
  mainWindow.webContents.setZoomFactor(zoomFactor);

  main.send('set-resolution-response', { resolution });
}

export function onGetFullscreenStateRequest(): void {
  if (!mainWindow) {
    return;
  }

  const fullscreen = mainWindow.isFullScreen();
  main.send('get-fullscreen-state-response', { fullscreen });
}

export function onFullscreenRequest(request: {
  resolution: Resolution;
  fullscreen: boolean;
}): void {
  if (!mainWindow) {
    return;
  }

  const { fullscreen, resolution } = request;

  currentResolution.width = resolution.width;
  currentResolution.height = resolution.height;

  if (process.platform === 'win32' && fullscreen) {
    const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workAreaSize;
    mainWindow.setContentSize(display.width, display.height);
  }

  mainWindow.setFullScreen(fullscreen);
}

export async function onSaveFileRequest(request: NativeSaveFileRequest): Promise<void> {
  try {
    const slug =
      request.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-') || 'untitled';
    const directory = path.join(app.getAppPath(), WORLD_MAPS_DIR);

    await mkdir(directory, { recursive: true });

    const filePath = path.join(directory, `${slug}.json`);
    await writeFile(filePath, request.json, 'utf-8');

    main.send('save-file-response', { ok: true, path: filePath });
  } catch (error) {
    main.send('save-file-response', { ok: false, error: String(error) });
  }
}

export async function onLoadFileRequest(request: NativeLoadFileRequest): Promise<void> {
  try {
    let filePath: string;
    const directory = path.join(app.getAppPath(), WORLD_MAPS_DIR);

    if (request.path !== undefined) {
      filePath = path.join(directory, request.path);
    } else {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Json files', extensions: ['json'] }],
      });
      if (result.canceled) {
        main.send('load-file-response', { ok: false, path: null, contents: null });
        return;
      }
      filePath = result.filePaths[0];
    }

    const contents = await readFile(filePath, 'utf8');

    main.send('load-file-response', { ok: true, path: filePath, contents });
  } catch (_error) {
    main.send('load-file-response', { ok: false, path: null, contents: null });
  }
}

export function onEnterFullscreen() {
  if (!mainWindow) {
    return;
  }

  const zoomFactor = getZoomFactorForResolution(currentResolution, mainWindow, true);
  mainWindow.webContents.setZoomFactor(zoomFactor);

  main.send('set-fullscreen-response', { fullscreen: true });
}

export function onLeaveFullscreen() {
  mainWindow?.setContentSize(currentResolution.width, currentResolution.height);
  mainWindow?.webContents.setZoomFactor(1);
  main.send('set-fullscreen-response', { fullscreen: false });
}
