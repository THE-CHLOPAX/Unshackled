import { app, BrowserWindow, ipcMain } from 'electron';
import { NativeEventMainMap, NativeEventRendererMap } from '@tgdf/internal-ui/types/native';

import { bindUserEvents } from './events';
import { isDev } from '../lib/internal-utils/isDev';
import { createWindow } from './utils/createWindow';

export let mainWindow: BrowserWindow | null = null;

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  mainWindow = createWindow();
  mainWindow?.webContents.on('dom-ready', () => {
    mainWindow?.webContents.setZoomFactor(1.0);
  });

  // Open devtools on F12 if in development mode
  if (isDev) {
    mainWindow?.webContents.on('before-input-event', (event, input) => {
      if (input.type === 'keyDown' && input.key === 'F12') {
        mainWindow?.webContents.toggleDevTools();
        event.preventDefault();
      }
    });
  }

  // Bind IPC event handlers
  bindUserEvents();
});

// Quit when all windows are closed
app.on('window-all-closed', (): void => {
  app.quit();
});

export const main = {
  send: <T extends keyof NativeEventMainMap>(channel: T, data: NativeEventMainMap[T]) =>
    mainWindow?.webContents.send(channel, data ?? {}),
  on: <T extends keyof NativeEventRendererMap>(
    channel: T,
    func: (args: NativeEventRendererMap[T]) => void
  ) => ipcMain.on(channel, (_, ...args) => func(args[0])),
  once: <T extends keyof NativeEventRendererMap>(
    channel: T,
    func: (args: NativeEventRendererMap[T]) => void
  ) => ipcMain.once(channel, (_, ...args) => func(args[0])),
  off: <T extends keyof NativeEventRendererMap>(
    channel: T,
    func: (args: NativeEventRendererMap[T]) => void
  ) => ipcMain.off(channel, (_, ...args) => func(args[0])),
};
