import type {
  FMOD3DAttributes,
  FMODEventInstance,
  FMODEventDescription,
  FMODParameterDescription,
  FMODEventCallback,
  FMODBank,
  FMODObject,
  FMODStudioSystem,
  FMODOutVal,
  FMODEventInstanceWithPointer,
} from './fmodstudio';

import { Mock, It, Times } from 'moq.ts';
import { logger, useSoundsStore } from '@tgdf';
import { assert, describe, it, expect, vi, beforeEach } from 'vitest';

import { MESSAGES } from './constants';
import { FMODAudio } from './FMODAudio';
import FMODModuleFactory from './fmodstudio';
import { fetchBankBinary } from './utils/fetchBankBinary';
import { getInstancePointer } from './utils/getInstancePointer';

vi.mock('./fmodstudio', () => ({ default: vi.fn() }));
vi.mock('./utils/fetchBankBinary', () => ({ fetchBankBinary: vi.fn() }));
vi.mock('./utils/getInstancePointer', () => ({ getInstancePointer: vi.fn() }));
vi.mock('@tgdf', () => ({
  logger: vi.fn(),
  assert,
  useSoundsStore: {
    getState: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
  },
}));

const OK = 0;
const STUDIO_EVENT_CALLBACK_STOPPED = 0x20;
const INSTANCE_PTR = 42;

function buildInstanceMock(onSetCallback?: (callback: FMODEventCallback) => void) {
  const m = new Mock<FMODEventInstanceWithPointer>();
  m.setup((x) => x.start()).returns(OK);
  m.setup((x) => x.release()).returns(OK);
  m.setup((x) => x.stop(It.IsAny())).returns(OK);
  m.setup((x) => x.setVolume(It.IsAny())).returns(OK);
  m.setup((x) => x.setPitch(It.IsAny())).returns(OK);
  m.setup((x) => x.setParameterByName(It.IsAny(), It.IsAny(), It.IsAny())).returns(OK);
  m.setup((x) => x.set3DAttributes(It.IsAny())).returns(OK);
  if (onSetCallback) {
    m.setup((x) => x.setCallback(It.IsAny(), It.IsAny())).callback((interaction) => {
      onSetCallback(interaction.args[0] as FMODEventCallback);
      return OK;
    });
  } else {
    m.setup((x) => x.setCallback(It.IsAny(), It.IsAny())).returns(OK);
  }
  return m;
}

/** Creates the raw FMOD mock objects without instantiating FMODAudio. */
function makeMocks(instanceMock: Mock<FMODEventInstance>) {
  const instance = instanceMock.object();

  const desc = {
    createInstance: vi.fn((out: FMODOutVal<FMODEventInstance>) => {
      out.val = instance;
      return OK;
    }),
    loadSampleData: vi.fn(() => OK),
    getPath: vi.fn((out: FMODOutVal<string>) => {
      out.val = 'event:/Test/Event';
      return OK;
    }),
    getParameterDescriptionCount: vi.fn((out: FMODOutVal<number>) => {
      out.val = 1;
      return OK;
    }),
    getParameterDescriptionByIndex: vi.fn((_index: number, parameter: FMODParameterDescription) => {
      Object.assign(parameter, {
        name: 'Intensity',
        minimum: 0,
        maximum: 1,
        defaultvalue: 0.5,
        type: 0,
        flags: 0x08,
      });
      return OK;
    }),
  };

  const bank = {
    getEventCount: vi.fn((out: FMODOutVal<number>) => {
      out.val = 1;
      return OK;
    }),
    getEventList: vi.fn((out: FMODOutVal<unknown[]>, _cap: number, cntOut: FMODOutVal<number>) => {
      out.val = [desc];
      cntOut.val = 1;
      return OK;
    }),
  };

  const system = {
    getEvent: vi.fn((_path: string, out: FMODOutVal<FMODEventDescription>) => {
      out.val = desc as FMODEventDescription;
      return OK;
    }),
    update: vi.fn(() => OK),
    setListenerAttributes: vi.fn(
      (_listener: number, _attributes: FMOD3DAttributes, _position: null) => OK
    ),
    loadBankFile: vi.fn((_f: string, _fl: number, out: FMODOutVal<FMODBank>) => {
      out.val = bank as FMODBank;
      return OK;
    }),
  };

  const fmod = {
    OK,
    STUDIO_STOP_IMMEDIATE: 1,
    STUDIO_STOP_ALLOWFADEOUT: 2,
    STUDIO_LOAD_BANK_NORMAL: 0,
    STUDIO_EVENT_CALLBACK_STOPPED,
    ErrorString: () => '',
    FS_createDataFile: vi.fn(),
    STUDIO_PARAMETER_DESCRIPTION: () => ({}) as FMODParameterDescription,
    _3D_ATTRIBUTES: (): FMOD3DAttributes => ({
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      forward: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 0, z: 0 },
    }),
  };

  return { desc, bank, system, fmod };
}

/** Instantiates FMODAudio with pre-wired mocks injected via the constructor. */
function wireAudio(instanceMock: Mock<FMODEventInstance>) {
  const mocks = makeMocks(instanceMock);
  const audio = FMODAudio.getInstance({
    fmod: mocks.fmod as unknown as FMODObject,
    system: mocks.system as unknown as FMODStudioSystem,
  });
  audio['_initialized'] = true;
  return { audio, ...mocks };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('FMODAudio', () => {
  const mockFetchWasmBinary = vi.fn().mockResolvedValue(new Uint8Array(0));

  beforeEach(() => {
    FMODAudio['_instance'] = null;
    vi.clearAllMocks();
    vi.mocked(fetchBankBinary).mockResolvedValue(new Uint8Array(4));
  });

  describe('init', () => {
    it('initializes the runtime and returns true', async () => {
      const coreSystem = {
        setDSPBufferSize: vi.fn(() => OK),
        getDriverInfo: vi.fn((_id: number, _n: null, _nl: null, out: FMODOutVal<number>) => {
          out.val = 44100;
          return OK;
        }),
        setSoftwareFormat: vi.fn(() => OK),
      };
      const system = {
        getCoreSystem: vi.fn((out: FMODOutVal<typeof coreSystem>) => {
          out.val = coreSystem;
          return OK;
        }),
        initialize: vi.fn(() => OK),
        update: vi.fn(() => OK),
      };

      vi.mocked(FMODModuleFactory).mockImplementation((config: Partial<FMODObject>) => {
        Object.assign(config, {
          OK,
          STUDIO_INIT_NORMAL: 0,
          INIT_NORMAL: 0,
          INIT_3D_RIGHTHANDED: 4,
          SPEAKERMODE_DEFAULT: 0,
          ErrorString: () => '',
          Studio_System_Create: (out: FMODOutVal<typeof system>) => {
            out.val = system;
            return OK;
          },
        });
        (config as { onRuntimeInitialized(): void }).onRuntimeInitialized();
      });

      const wasmBinary = await mockFetchWasmBinary();
      const audio = FMODAudio.getInstance();
      expect(await audio.init(wasmBinary)).toBe(true);
      expect(await audio.init(wasmBinary)).toBe(true); // idempotent
      expect(vi.mocked(FMODModuleFactory)).toHaveBeenCalledTimes(1);
      expect(system.initialize).toHaveBeenCalledWith(1024, 0, 4, null);
    });

    it('returns existing promise when init is called multiple times before it resolves', async () => {
      vi.mocked(FMODModuleFactory).mockImplementation(() => {
        // intentionally do NOT call onRuntimeInitialized yet
      });

      const wasmBinary = await mockFetchWasmBinary();
      const audio = FMODAudio.getInstance();
      const promise = audio.init(wasmBinary);
      const concurrentPromise = audio.init(wasmBinary);
      expect(promise).toBe(concurrentPromise);
    });
  });

  describe('loadBank', () => {
    it('fetches the bank, mounts it in FS and stores the reference', async () => {
      const { audio, fmod, system } = wireAudio(buildInstanceMock());
      await audio.loadBank('/assets/Master.bank');

      expect(fetchBankBinary).toHaveBeenCalledWith('/assets/Master.bank');

      expect(fmod.FS_createDataFile).toHaveBeenCalledWith(
        '/',
        'Master.bank',
        expect.any(Uint8Array),
        true,
        false
      );
      expect(system.loadBankFile).toHaveBeenCalledWith('/Master.bank', OK, expect.any(Object));
      expect(audio['_banks'].size).toBe(1);
    });

    it('returns the same in-flight promise when the same bank is already loading', async () => {
      let resolveFetch: (value: Uint8Array) => void = () => {};
      vi.mocked(fetchBankBinary).mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
      );

      const { audio, system } = wireAudio(buildInstanceMock());
      const first = audio.loadBank('/assets/Master.bank');
      const second = audio.loadBank('/assets/Master.bank');

      expect(first).toBe(second);
      expect(logger).toHaveBeenCalledWith(
        expect.objectContaining({ message: MESSAGES.BANK_ALREADY_LOADING('Master.bank') })
      );
      expect(fetchBankBinary).toHaveBeenCalledTimes(1);

      resolveFetch(new Uint8Array(4));

      await Promise.all([first, second]);

      expect(system.loadBankFile).toHaveBeenCalledTimes(1);
      expect(audio['_banks'].size).toBe(1);
    });

    it('does not load the same bank if it is already loaded', async () => {
      const { audio, system } = wireAudio(buildInstanceMock());
      await audio.loadBank('/assets/Master.bank');
      expect(system.loadBankFile).toHaveBeenCalledTimes(1);
      expect(audio['_banks'].size).toBe(1);

      await audio.loadBank('/assets/Master.bank');
      expect(system.loadBankFile).toHaveBeenCalledTimes(1);
      expect(audio['_banks'].size).toBe(1);
      expect(logger).toHaveBeenCalledWith(
        expect.objectContaining({ message: MESSAGES.BANK_ALREADY_LOADED('Master.bank') })
      );
    });
  });

  describe('playEvent', () => {
    it('starts the instance and applies volume, playbackRate and parameters', () => {
      const m = buildInstanceMock();
      const { audio } = wireAudio(m);

      audio.playEvent({
        eventPath: 'event:/Music/Theme',
        options: { volume: 0.5, playbackRate: 1.5, parameters: { intensity: 2, wetness: 0.3 } },
      });

      m.verify((x) => x.start(), Times.Once());
      m.verify((x) => x.setVolume(0.5), Times.Once());
      m.verify((x) => x.setPitch(1.5), Times.Once());
      m.verify((x) => x.setParameterByName('intensity', 2, false), Times.Once());
      m.verify((x) => x.setParameterByName('wetness', 0.3, false), Times.Once());
    });
  });

  describe('3D attributes', () => {
    const ATTRIBUTES: FMOD3DAttributes = {
      position: { x: 1, y: 2, z: 3 },
      velocity: { x: 0, y: 0, z: 0 },
      forward: { x: 0, y: 0, z: 1 },
      up: { x: 0, y: 1, z: 0 },
    };

    it('applies 3D attributes before starting the instance', () => {
      const calls: string[] = [];
      const m = buildInstanceMock();
      m.setup((x) => x.set3DAttributes(It.IsAny())).callback(() => {
        calls.push('set3DAttributes');
        return OK;
      });
      m.setup((x) => x.start()).callback(() => {
        calls.push('start');
        return OK;
      });
      const { audio } = wireAudio(m);

      audio.playEvent({ eventPath: 'event:/Sfx/Hit', options: { attributes3D: ATTRIBUTES } });

      m.verify((x) => x.set3DAttributes(It.Is((a) => (a as FMOD3DAttributes).position.x === 1)));
      expect(calls).toEqual(['set3DAttributes', 'start']);
    });

    it('does not set 3D attributes when none are provided', () => {
      const m = buildInstanceMock();
      const { audio } = wireAudio(m);

      audio.playEvent({ eventPath: 'event:/Sfx/Hit' });

      m.verify((x) => x.set3DAttributes(It.IsAny()), Times.Never());
    });

    it('copies listener attributes into an FMOD struct for listener 0', () => {
      const { audio, system } = wireAudio(buildInstanceMock());

      audio.setListenerAttributes(ATTRIBUTES);

      expect(system.setListenerAttributes).toHaveBeenCalledWith(0, ATTRIBUTES, null);
      expect(system.setListenerAttributes.mock.calls[0][1]).not.toBe(ATTRIBUTES);
    });
  });

  describe('parameters', () => {
    it('warns once instead of throwing when a parameter cannot be set', () => {
      const m = buildInstanceMock();
      m.setup((x) => x.setParameterByName('surface', It.IsAny(), It.IsAny())).returns(OK + 1);
      const { audio } = wireAudio(m);

      const play = () =>
        audio.playEvent({ eventPath: 'event:/Sfx/Step', options: { parameters: { surface: 1 } } });

      expect(play).not.toThrow();
      play();

      const warnings = vi
        .mocked(logger)
        .mock.calls.filter(([entry]) => 'type' in entry && entry.type === 'warn');
      expect(warnings).toHaveLength(1);
    });
  });

  describe('onStopped', () => {
    it('calls onStopped when the STOPPED callback fires', () => {
      const captured: { callback: FMODEventCallback | null } = { callback: null };
      const m = buildInstanceMock((callback) => {
        captured.callback = callback;
      });
      vi.mocked(getInstancePointer).mockReturnValue(INSTANCE_PTR);
      const { audio } = wireAudio(m);
      const onStopped = vi.fn();

      audio.playEvent({ eventPath: 'event:/Sfx/Hit', onStopped });

      const callbackWrapper = { release: vi.fn(() => OK) } as unknown as FMODEventInstance;
      assert(captured.callback !== null);
      captured.callback(STUDIO_EVENT_CALLBACK_STOPPED, callbackWrapper);

      expect(onStopped).toHaveBeenCalledTimes(1);
      expect(audio['_stopListeners'].has(INSTANCE_PTR)).toBe(false);
    });
  });

  describe('stopEvent', () => {
    it('stops the instance immediately by default', () => {
      const m = buildInstanceMock();
      const { audio, fmod } = wireAudio(m);
      const inst = audio.playEvent({ eventPath: 'event:/Sfx/Hit' });

      assert(inst !== null);

      audio.stopEvent(inst);

      m.verify((x) => x.stop(fmod.STUDIO_STOP_IMMEDIATE), Times.Once());
    });

    it('uses ALLOWFADEOUT mode when requested', () => {
      const m = buildInstanceMock();
      const { audio, fmod } = wireAudio(m);
      const inst = audio.playEvent({ eventPath: 'event:/Sfx/Hit' });

      assert(inst !== null);

      audio.stopEvent(inst, true);

      m.verify((x) => x.stop(fmod.STUDIO_STOP_ALLOWFADEOUT), Times.Once());
    });
  });

  describe('logAvailableEvents', () => {
    it('iterates all banks and logs their event paths with parameters', () => {
      const m = buildInstanceMock();
      const { bank, system, fmod } = makeMocks(m);
      const audio = FMODAudio.getInstance({
        fmod: fmod as unknown as FMODObject,
        system: system as unknown as FMODStudioSystem,
      });
      audio['_initialized'] = true;
      audio['_banks'] = new Map([['Master.bank', bank as FMODBank]]);

      audio.logAvailableEvents();

      expect(bank.getEventCount).toHaveBeenCalled();
      expect(bank.getEventList).toHaveBeenCalled();
      expect(vi.mocked(logger)).toHaveBeenCalledWith({
        group: {
          label: '[FMOD] Available Events',
          body: 'event:/Test/Event\n  Intensity: 0 to 1 (default 0.5) [discrete]',
        },
        type: 'info',
      });
    });
  });

  describe('playEventInSoundChannel', () => {
    const CHANNEL = 'sfx';

    it('applies the channel volume to the instance', () => {
      const m = buildInstanceMock();
      const { audio } = wireAudio(m);
      vi.mocked(useSoundsStore.getState).mockReturnValue({
        soundChannels: new Map([[CHANNEL, { id: CHANNEL, volume: 0.6, muted: false }]]),
      } as never);

      audio.playEventInSoundChannel({ eventPath: 'event:/Sfx/Amb', channelId: CHANNEL });

      m.verify((x) => x.setVolume(0.6), Times.Once());
    });

    it('multiplies the channel volume by the volume from options', () => {
      const m = buildInstanceMock();
      const { audio } = wireAudio(m);
      vi.mocked(useSoundsStore.getState).mockReturnValue({
        soundChannels: new Map([[CHANNEL, { id: CHANNEL, volume: 0.5, muted: false }]]),
      } as never);

      audio.playEventInSoundChannel({
        eventPath: 'event:/Sfx/Amb',
        channelId: CHANNEL,
        options: { volume: 0.4 },
      });

      m.verify((x) => x.setVolume(0.2), Times.Once());
    });

    it('keeps the volume from options when the channel volume changes', () => {
      const m = buildInstanceMock();
      const { audio } = wireAudio(m);
      const channels = { volume: 0.5 };
      vi.mocked(useSoundsStore.getState).mockImplementation(
        () =>
          ({
            soundChannels: new Map([
              [CHANNEL, { id: CHANNEL, volume: channels.volume, muted: false }],
            ]),
          }) as never
      );
      let onStoreChange: () => void = () => {};
      vi.mocked(useSoundsStore.subscribe).mockImplementation((listener) => {
        onStoreChange = listener as () => void;
        return () => {};
      });

      audio.playEventInSoundChannel({
        eventPath: 'event:/Sfx/Amb',
        channelId: CHANNEL,
        options: { volume: 0.5 },
      });
      channels.volume = 0.8;
      onStoreChange();

      m.verify((x) => x.setVolume(0.4), Times.Once());
    });

    it('sets volume to 0 when the channel is muted', () => {
      const m = buildInstanceMock();
      const { audio } = wireAudio(m);
      vi.mocked(useSoundsStore.getState).mockReturnValue({
        soundChannels: new Map([[CHANNEL, { id: CHANNEL, volume: 1, muted: true }]]),
      } as never);

      audio.playEventInSoundChannel({ eventPath: 'event:/Sfx/Amb', channelId: CHANNEL });

      m.verify((x) => x.setVolume(0), Times.Once());
    });

    it('applies playbackRate and parameters from options', () => {
      const m = buildInstanceMock();
      const { audio } = wireAudio(m);
      vi.mocked(useSoundsStore.getState).mockReturnValue({
        soundChannels: new Map([[CHANNEL, { id: CHANNEL, volume: 1, muted: false }]]),
      } as never);

      audio.playEventInSoundChannel({
        eventPath: 'event:/Sfx/Amb',
        channelId: CHANNEL,
        options: { playbackRate: 2, parameters: { mood: 1 } },
      });

      m.verify((x) => x.setPitch(2), Times.Once());
      m.verify((x) => x.setParameterByName('mood', 1, false), Times.Once());
    });

    it('unsubscribes and releases when STOPPED callback fires after stopEvent', () => {
      const captured: { callback: FMODEventCallback | null } = { callback: null };
      const m = buildInstanceMock((callback) => {
        captured.callback = callback;
      });

      vi.mocked(getInstancePointer).mockReturnValue(INSTANCE_PTR);

      const unsubscribe = vi.fn();
      vi.mocked(useSoundsStore.subscribe).mockReturnValue(unsubscribe);
      vi.mocked(useSoundsStore.getState).mockReturnValue({
        soundChannels: new Map([[CHANNEL, { id: CHANNEL, volume: 1, muted: false }]]),
      } as never);

      const { audio, fmod } = wireAudio(m);
      const inst = audio.playEventInSoundChannel({
        eventPath: 'event:/Sfx/Amb',
        channelId: CHANNEL,
      });

      assert(inst !== null);
      expect(audio['_channelSubscriptions'].has(INSTANCE_PTR)).toBe(true);

      audio.stopEvent(inst);
      m.verify((x) => x.stop(fmod.STUDIO_STOP_IMMEDIATE), Times.Once());

      const callbackWrapper = {
        release: vi.fn(() => OK),
      } as unknown as FMODEventInstance;

      assert(captured.callback !== null);
      captured.callback(STUDIO_EVENT_CALLBACK_STOPPED, callbackWrapper);

      expect(unsubscribe).toHaveBeenCalledTimes(1);
      expect(audio['_channelSubscriptions'].has(INSTANCE_PTR)).toBe(false);
      expect(callbackWrapper.release).toHaveBeenCalledTimes(1);
      expect(logger).toHaveBeenCalledWith(
        expect.objectContaining({ message: MESSAGES.EVENT_SOUND_CHANNEL_SUBSCRIPTION_CLEARED })
      );
    });
  });
});
