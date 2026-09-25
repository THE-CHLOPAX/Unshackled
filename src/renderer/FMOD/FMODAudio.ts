import type {
  FMOD3DAttributes,
  FMODCoreSystem,
  FMODEventInstance,
  FMODEventDescription,
  FMODObject,
  FMODParameterDescription,
  FMODOutVal,
  FMODBank,
  FMODStudioSystem,
  FMODVector,
} from './fmodstudio';

import { assert, logger, useSoundsStore } from '@tgdf';

import { MESSAGES } from './constants';
import { fmodOut } from './utils/fmodOut';
import FMODModuleFactory from './fmodstudio';
import { fetchBankBinary } from './utils/fetchBankBinary';
import { fmodCheckOrThrow } from './utils/fmodCheckOrThrow';
import { getInstancePointer } from './utils/getInstancePointer';
import { formatParameterDescription } from './utils/formatParameterDescription';

export type FMODPlayEventOptions = {
  playbackRate?: number;
  volume?: number;
  parameters?: Record<string, number>;
  attributes3D?: FMOD3DAttributes;
};

export type FMODDependencies = {
  fmod: FMODObject;
  system: FMODStudioSystem | null;
};

export class FMODAudio {
  public static getInstance(dependencies?: FMODDependencies): FMODAudio {
    if (!FMODAudio._instance) {
      FMODAudio._instance = new FMODAudio(dependencies);
    }
    return FMODAudio._instance;
  }

  private static _instance: FMODAudio | null = null;

  private _fmod: FMODObject;
  private _system: FMODStudioSystem | null = null;
  private _banks = new Map<string, FMODBank>();
  private _bankLoadPromises = new Map<string, Promise<void>>();
  private _initialized = false;
  private _initPromise: Promise<boolean> | null = null;
  private _updateInterval: ReturnType<typeof setInterval> | null = null;
  private _channelSubscriptions = new Map<number, () => void>();
  private _stopListeners = new Map<number, () => void>();
  private _warnedMissingParameters = new Set<string>();

  constructor(dependencies: FMODDependencies = { fmod: {} as FMODObject, system: null }) {
    this._fmod = dependencies.fmod;
    this._system = dependencies.system;
  }

  /**
   * Loads and initialises the FMOD Studio Emscripten runtime.
   * Resolves true on success, false if anything goes wrong.
   * Safe to call multiple times — subsequent calls return true immediately.
   */
  public init(wasmBinary: Uint8Array): Promise<boolean> {
    if (this._initialized) return Promise.resolve(true);
    if (this._initPromise) return this._initPromise;

    this._initPromise = new Promise<boolean>((resolve) => {
      this._fmod.wasmBinary = wasmBinary;
      this._fmod.INITIAL_MEMORY = 64 * 1024 * 1024;

      this._fmod.onRuntimeInitialized = () => {
        try {
          this._setupSystem();
          this._initialized = true;
          this._updateInterval = setInterval(() => this._system?.update(), 20);
          this._initPromise = null;
          resolve(true);
        } catch (_e) {
          logger({ message: MESSAGES.SYSTEM_SETUP_FAILED, type: 'error' });
          this._initPromise = null;
          resolve(false);
        }
      };

      try {
        FMODModuleFactory(this._fmod);
      } catch (_e) {
        logger({ message: MESSAGES.MODULE_FACTORY_FAILED, type: 'error' });
        this._initPromise = null;
        resolve(false);
      }
    });

    return this._initPromise;
  }

  /**
   * Fetches a bank file from the given URL, mounts it into FMOD's virtual FS
   * and loads it into the Studio system.
   * Must be called after init() has resolved true.
   */
  public loadBank(url: string): Promise<void> {
    if (!this._initialized || this._system === null) {
      throw new Error(MESSAGES.SYSTEM_NOT_INITIALIZED);
    }
    const bankName = url.split('/').pop() ?? url;

    if (this._banks.has(bankName)) {
      logger({ message: MESSAGES.BANK_ALREADY_LOADED(bankName), type: 'warn' });
      return Promise.resolve();
    }

    const inFlight = this._bankLoadPromises.get(bankName);
    if (inFlight) {
      logger({ message: MESSAGES.BANK_ALREADY_LOADING(bankName), type: 'warn' });
      return inFlight;
    }

    const loadPromise = this._loadBank(url, bankName, this._system).finally(() => {
      this._bankLoadPromises.delete(bankName);
    });
    this._bankLoadPromises.set(bankName, loadPromise);
    return loadPromise;
  }

  /**
   * Starts an FMOD Studio event and returns the instance.
   * @param eventPath The path of the event to play.
   * @param options The options for the event.
   * @returns The event instance.
   */
  public playEvent({
    eventPath,
    options,
    onStopped,
  }: {
    eventPath: string;
    options?: FMODPlayEventOptions;
    onStopped?: () => void;
  }): FMODEventInstance | null {
    if (!this._initialized || this._system === null) {
      logger({ message: MESSAGES.SYSTEM_NOT_INITIALIZED, type: 'error' });
      return null;
    }

    const descOut = fmodOut<FMODEventDescription>();
    fmodCheckOrThrow(this._fmod, this._system.getEvent(eventPath, descOut));
    assert(descOut.val !== undefined, MESSAGES.EVENT_NOT_FOUND);

    const instanceOut = fmodOut<FMODEventInstance>();
    fmodCheckOrThrow(this._fmod, descOut.val.createInstance(instanceOut));
    assert(instanceOut.val !== undefined, MESSAGES.EVENT_INSTANCE_NOT_CREATED);

    if (options?.attributes3D) {
      this.set3DAttributes(instanceOut.val, options.attributes3D);
    }

    fmodCheckOrThrow(this._fmod, instanceOut.val.start());

    if (onStopped) {
      this._stopListeners.set(getInstancePointer(instanceOut.val), onStopped);
    }

    // On event stopped, release the instance and clear the subscription (if any).
    instanceOut.val.setCallback((type, instance) => {
      if (type === this._fmod.STUDIO_EVENT_CALLBACK_STOPPED) {
        this._onEventStopped(instance);
      }
      return this._fmod.OK;
    }, this._fmod.STUDIO_EVENT_CALLBACK_STOPPED);

    if (options?.playbackRate) {
      fmodCheckOrThrow(this._fmod, instanceOut.val.setPitch(options.playbackRate));
    }
    if (options?.volume !== undefined) {
      fmodCheckOrThrow(this._fmod, instanceOut.val.setVolume(options.volume));
    }
    if (options?.parameters) {
      for (const [name, value] of Object.entries(options.parameters)) {
        const result = instanceOut.val.setParameterByName(name, value, false);
        if (result !== this._fmod.OK) {
          this._warnParameterNotSet(eventPath, name, result);
        }
      }
    }
    return instanceOut.val;
  }

  /**
   * Plays an event and ties its volume and mute state to a sound channel from
   * useSoundsStore. Future setChannelVolume / setChannelMuted calls automatically
   * propagate to the FMOD instance. The subscription is cleaned automatically when the event stops.
   */
  public playEventInSoundChannel({
    eventPath,
    channelId,
    options,
    onStopped,
  }: {
    eventPath: string;
    channelId: string;
    options?: FMODPlayEventOptions;
    onStopped?: () => void;
  }): FMODEventInstance | null {
    const instance = this.playEvent({ eventPath, options, onStopped });

    if (instance === null) {
      logger({ message: MESSAGES.EVENT_NOT_FOUND, type: 'error' });
      return null;
    }

    const eventVolume = options?.volume ?? 1;

    const applyChannel = () => {
      const channel = useSoundsStore.getState().soundChannels.get(channelId);
      if (channel) {
        if (channel.muted) {
          instance.setVolume(0);
        } else {
          instance.setVolume(channel.volume * eventVolume);
        }
      }
    };

    applyChannel();

    // Subscribe to the store — soundChannels is replaced with a new Map on every
    // setChannelVolume / setChannelMuted call, so each update triggers this.
    const unsubscribe = useSoundsStore.subscribe(applyChannel);

    this._channelSubscriptions.set(getInstancePointer(instance), unsubscribe);
    return instance;
  }

  /**
   * Stops a playing event instance and releases it.
   * @param instance  The value returned by playEvent().
   * @param allowFadeout  When true, lets the event tail/fadeout play before stopping.
   *                      Defaults to false (immediate cut).
   */
  public stopEvent(instance: FMODEventInstance, allowFadeout = false): void {
    const mode = allowFadeout
      ? this._fmod.STUDIO_STOP_ALLOWFADEOUT
      : this._fmod.STUDIO_STOP_IMMEDIATE;

    instance.stop(mode);
  }

  public set3DAttributes(instance: FMODEventInstance, attributes: FMOD3DAttributes): void {
    fmodCheckOrThrow(this._fmod, instance.set3DAttributes(this._to3DAttributes(attributes)));
  }

  public setListenerAttributes(
    attributes: FMOD3DAttributes,
    attenuationPosition: FMODVector | null = null
  ): void {
    if (!this._initialized || this._system === null) return;

    fmodCheckOrThrow(
      this._fmod,
      this._system.setListenerAttributes(0, this._to3DAttributes(attributes), attenuationPosition)
    );
  }

  /**
   * Resumes the Web Audio context after the first user gesture.
   * Browsers suspend audio until the user interacts — call this inside any
   * click or keydown handler if sounds aren't playing after init.
   */
  public resumeAudio(): void {
    this._fmod.OutputWebAudio_resumeAudio?.();
    this._fmod.OutputAudioWorklet_resumeAudio?.();
  }

  /**
   * Drives the FMOD Studio update loop.
   * The internal setInterval already calls this every 20 ms — only use this
   * method if you want to tick FMOD in sync with your own render loop instead.
   */
  public update(): void {
    this._system?.update();
  }

  public logAvailableEvents(): void {
    const eventLines: string[] = [];
    const banks = Array.from(this._banks.values());

    for (const bank of banks) {
      const countOut = fmodOut<number>();
      fmodCheckOrThrow(this._fmod, bank.getEventCount(countOut));
      assert(countOut.val !== undefined, MESSAGES.EVENT_COUNT_NOT_FOUND);

      const listOut = fmodOut<FMODEventDescription[]>();
      fmodCheckOrThrow(
        this._fmod,
        bank.getEventList(listOut, countOut.val, {} as FMODOutVal<number>)
      );
      assert(listOut.val !== undefined, MESSAGES.EVENT_LIST_NOT_FOUND);

      for (const desc of listOut.val) {
        const pathOut = fmodOut<string>();
        fmodCheckOrThrow(this._fmod, desc.getPath(pathOut, 256, null));
        assert(pathOut.val !== undefined, MESSAGES.EVENT_PATH_NOT_FOUND);
        eventLines.push(pathOut.val);

        for (const parameter of this._getParameterDescriptions(desc)) {
          eventLines.push(`  ${formatParameterDescription(parameter)}`);
        }
      }
    }

    logger({
      group: { label: MESSAGES.AVAILABLE_EVENTS_LABEL, body: eventLines.join('\n') },
      type: 'info',
    });
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private _getParameterDescriptions(desc: FMODEventDescription): FMODParameterDescription[] {
    const countOut = fmodOut<number>();
    fmodCheckOrThrow(this._fmod, desc.getParameterDescriptionCount(countOut));
    assert(countOut.val !== undefined, MESSAGES.PARAMETER_COUNT_NOT_FOUND);

    const parameters: FMODParameterDescription[] = [];
    for (let index = 0; index < countOut.val; index++) {
      const parameter = this._fmod.STUDIO_PARAMETER_DESCRIPTION();
      fmodCheckOrThrow(this._fmod, desc.getParameterDescriptionByIndex(index, parameter));
      parameters.push(parameter);
    }
    return parameters;
  }

  private async _loadBank(url: string, bankName: string, system: FMODStudioSystem): Promise<void> {
    try {
      const data = await fetchBankBinary(url);

      this._fmod.FS_createDataFile('/', bankName, data, true, false);

      const bankOut = fmodOut<FMODBank>();
      fmodCheckOrThrow(
        this._fmod,
        system.loadBankFile(`/${bankName}`, this._fmod.STUDIO_LOAD_BANK_NORMAL, bankOut)
      );
      assert(bankOut.val !== undefined, MESSAGES.BANK_NOT_LOADED);
      logger({ message: MESSAGES.LOADED_BANK(bankName), type: 'info' });

      this._banks.set(bankName, bankOut.val);
    } catch (error) {
      logger({ message: MESSAGES.BANK_LOAD_FAILED(url, error), type: 'error' });
    }
  }

  private _setupSystem(): void {
    const studioOut = fmodOut<FMODStudioSystem>();
    fmodCheckOrThrow(this._fmod, this._fmod.Studio_System_Create(studioOut));
    assert(studioOut.val !== undefined, MESSAGES.SYSTEM_NOT_CREATED);
    this._system = studioOut.val;

    const coreOut = fmodOut<FMODCoreSystem>();
    fmodCheckOrThrow(this._fmod, this._system.getCoreSystem(coreOut));
    assert(coreOut.val !== undefined, MESSAGES.CORE_SYSTEM_NOT_FOUND);
    const coreSystem = coreOut.val;

    const driverOut = fmodOut<number>();

    // Reduce audio latency — 2048 samples is safe for WebAudio (non-AudioWorklet) paths.
    fmodCheckOrThrow(this._fmod, coreSystem.setDSPBufferSize(2048, 2));

    // Match the mixer sample rate to the OS output rate to avoid unnecessary resampling.
    fmodCheckOrThrow(this._fmod, coreSystem.getDriverInfo(0, null, null, driverOut, null, null));
    assert(driverOut.val !== undefined, MESSAGES.DRIVER_NOT_FOUND);

    fmodCheckOrThrow(
      this._fmod,
      coreSystem.setSoftwareFormat(driverOut.val, this._fmod.SPEAKERMODE_DEFAULT, 0)
    );

    fmodCheckOrThrow(
      this._fmod,
      this._system.initialize(
        1024,
        this._fmod.STUDIO_INIT_NORMAL,
        this._fmod.INIT_NORMAL | this._fmod.INIT_3D_RIGHTHANDED,
        null
      )
    );
  }

  private _to3DAttributes(attributes: FMOD3DAttributes): FMOD3DAttributes {
    const fmodAttributes = this._fmod._3D_ATTRIBUTES();
    this._copyVector(fmodAttributes.position, attributes.position);
    this._copyVector(fmodAttributes.velocity, attributes.velocity);
    this._copyVector(fmodAttributes.forward, attributes.forward);
    this._copyVector(fmodAttributes.up, attributes.up);
    return fmodAttributes;
  }

  private _copyVector(target: FMODVector, source: FMODVector): void {
    target.x = source.x;
    target.y = source.y;
    target.z = source.z;
  }

  private _warnParameterNotSet(eventPath: string, name: string, result: number): void {
    const key = `${eventPath}:${name}`;
    if (this._warnedMissingParameters.has(key)) return;
    this._warnedMissingParameters.add(key);
    logger({
      message: MESSAGES.PARAMETER_NOT_SET(eventPath, name, this._fmod.ErrorString(result)),
      type: 'warn',
    });
  }

  private _onEventStopped(instance: FMODEventInstance): void {
    const onStopped = this._stopListeners.get(getInstancePointer(instance));
    if (onStopped) {
      this._stopListeners.delete(getInstancePointer(instance));
      onStopped();
    }

    const unsubscribe = this._channelSubscriptions.get(getInstancePointer(instance));
    if (unsubscribe) {
      logger({ message: MESSAGES.EVENT_SOUND_CHANNEL_SUBSCRIPTION_CLEARED, type: 'info' });
      unsubscribe();
      this._channelSubscriptions.delete(getInstancePointer(instance));
    }
    instance.release();
  }
}
