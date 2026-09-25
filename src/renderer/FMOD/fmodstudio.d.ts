/** Mutable out-value holder — passed as {} and populated by FMOD before the call returns. */
export type FMODOutVal<T = unknown> = { val: T | undefined };

export type FMODEventCallback = (type: number, event: FMODEventInstance) => number;

export interface FMODEventInstance {
  start(): number;
  stop(mode: number): number;
  release(): number;
  setCallback(callback: FMODEventCallback | null, callbackmask: number): number;
  setVolume(volume: number): number;
  getVolume(outval: FMODOutVal<number>): number;
  /** Pitch multiplier: 1.0 = normal, 2.0 = double speed, 0.5 = half speed. */
  setPitch(pitch: number): number;
  getPitch(outval: FMODOutVal<number>): number;
  /** Drive a named parameter defined in FMOD Studio (e.g. intensity, distance). */
  setParameterByName(name: string, value: number, ignoreSeekSpeed: boolean): number;
  getParameterByName(name: string, outval: FMODOutVal<number>): number;
}

export type FMODEventInstanceWithPointer = FMODEventInstance & {
  $$: {
    ptr: number;
  };
};

export interface FMODParameterDescription {
  name: string;
  minimum: number;
  maximum: number;
  defaultvalue: number;
  type: number;
  flags: number;
}

export interface FMODEventDescription {
  createInstance(outval: FMODOutVal<FMODEventInstance>): number;
  loadSampleData(): number;
  getPath(outval: FMODOutVal<string>, size: number, retrieved: null): number;
  getParameterDescriptionCount(outval: FMODOutVal<number>): number;
  getParameterDescriptionByIndex(index: number, parameter: FMODParameterDescription): number;
}

export interface FMODBank {
  getEventCount(outval: FMODOutVal<number>): number;
  getEventList(
    outval: FMODOutVal<FMODEventDescription[]>,
    capacity: number,
    countOut: FMODOutVal<number>
  ): number;
}

export interface FMODCoreSystem {
  setDSPBufferSize(bufferlength: number, numbuffers: number): number;
  getDriverInfo(
    id: number,
    name: null,
    namelen: null,
    samplerate: FMODOutVal<number>,
    speakermode: null,
    speakermodechannels: null
  ): number;
  setSoftwareFormat(samplerate: number, speakermode: number, numrawspeakers: number): number;
}

export interface FMODStudioSystem {
  initialize(
    maxchannels: number,
    studioflags: number,
    coreflags: number,
    extradriverdata: null
  ): number;
  getCoreSystem(outval: FMODOutVal<FMODCoreSystem>): number;
  loadBankFile(filename: string, flags: number, outval: FMODOutVal<FMODBank>): number;
  getEvent(path: string, outval: FMODOutVal<FMODEventDescription>): number;
  update(): number;
}

/** The FMOD module object — passed as config, then populated with the full API on runtime init. */
export interface FMODObject {
  // ── Lifecycle callbacks (set before calling the factory) ──────────────────
  preRun: () => void;
  onRuntimeInitialized: () => void;
  INITIAL_MEMORY: number;
  /** Provide the wasm binary directly to skip Emscripten's file-path resolution. */
  wasmBinary: ArrayBuffer | Uint8Array;

  // ── Result constants ───────────────────────────────────────────────────────
  readonly OK: number;
  readonly STUDIO_INIT_NORMAL: number;
  readonly INIT_NORMAL: number;
  readonly STUDIO_LOAD_BANK_NORMAL: number;
  readonly STUDIO_STOP_IMMEDIATE: number;
  readonly STUDIO_STOP_ALLOWFADEOUT: number;
  readonly STUDIO_EVENT_CALLBACK_STOPPED: number;
  readonly SPEAKERMODE_DEFAULT: number;

  // ── Core API ───────────────────────────────────────────────────────────────
  ErrorString(result: number): string;
  STUDIO_PARAMETER_DESCRIPTION(): FMODParameterDescription;
  Studio_System_Create(outval: FMODOutVal<FMODStudioSystem>): number;

  // ── Audio context resume (call on first user gesture if audio is silent) ──
  OutputWebAudio_resumeAudio?: () => void;
  OutputAudioWorklet_resumeAudio?: () => void;

  // ── Virtual file system ────────────────────────────────────────────────────
  FS_createPreloadedFile(
    parent: string,
    name: string,
    url: string,
    canRead: boolean,
    canWrite: boolean
  ): void;
  FS_createDataFile(
    parent: string,
    name: string,
    data: Uint8Array,
    canRead: boolean,
    canWrite: boolean,
    canOwn?: boolean
  ): void;
  FS_unlink(path: string): void;
}

/**
 * Factory exported by fmodstudio.js.
 * Call with a plain object — FMOD populates it with the full API asynchronously
 * via the onRuntimeInitialized callback.
 */
declare function FMODModuleFactory(config: Partial<FMODObject>): void;

export default FMODModuleFactory;
