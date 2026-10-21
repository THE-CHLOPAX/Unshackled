import { logger } from '@tgdf';

import { MESSAGES } from 'FMOD/constants';

export async function fetchWasmBinary(): Promise<Uint8Array> {
  // Pre-fetch the wasm binary and hand it to Emscripten directly via wasmBinary.
  // This bypasses Emscripten's __filename/__dirname path resolution which breaks
  // in Electron's renderer process (webpack shims __dirname to the Electron
  // resources path, causing it to look inside electron.asar).
  try {
    const response = await fetch('./fmodstudio.wasm');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  } catch (e) {
    logger({ message: MESSAGES.WASM_FETCH_FAILED(e), type: 'error' });
    throw new Error(MESSAGES.WASM_FETCH_FAILED(e));
  }
}
