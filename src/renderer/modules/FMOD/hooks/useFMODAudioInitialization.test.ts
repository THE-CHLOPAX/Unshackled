import { It, Mock, Times } from 'moq.ts';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { FMODAudio } from 'FMOD/FMODAudio';
import { fetchWasmBinary } from 'FMOD/utils/fetchWasmBinary';
import { useFMODAudioInitialization } from 'FMOD/hooks/useFMODAudioInitialization';

vi.mock('@tgdf', () => ({ logger: vi.fn() }));
vi.mock('FMOD/FMODAudio', () => ({ FMODAudio: { getInstance: vi.fn() } }));
vi.mock('FMOD/utils/fetchWasmBinary', () => ({ fetchWasmBinary: vi.fn() }));

const BANK_URLS = ['/assets/sounds/banks/Master.bank', '/assets/sounds/banks/Master.strings.bank'];
const WASM_BINARY = new Uint8Array([0, 1, 2]);

function buildAudioMock(options: { initialized: boolean; loadedBankUrls: string[] }) {
  const mock = new Mock<FMODAudio>();
  mock.setup((x) => x.isInitialized).returns(options.initialized);
  mock
    .setup((x) => x.isBankLoaded(It.IsAny()))
    .callback(({ args: [url] }) => options.loadedBankUrls.includes(url as string));
  mock.setup((x) => x.init(It.IsAny())).returns(Promise.resolve(true));
  mock.setup((x) => x.loadBank(It.IsAny())).returns(Promise.resolve());
  mock.setup((x) => x.logAvailableEvents()).returns(undefined);
  vi.mocked(FMODAudio.getInstance).mockReturnValue(mock.object());
  return mock;
}

describe('useFMODAudioInitialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchWasmBinary).mockResolvedValue(WASM_BINARY);
  });

  it('skips all initialization logic when FMOD is initialized and banks are loaded', async () => {
    const audioMock = buildAudioMock({ initialized: true, loadedBankUrls: BANK_URLS });

    const { result } = renderHook(() => useFMODAudioInitialization({ preloadBankUrls: BANK_URLS }));

    expect(result.current).toEqual({
      instance: audioMock.object(),
      isReady: true,
      isLoading: false,
      isError: false,
    });

    await Promise.resolve();

    expect(fetchWasmBinary).not.toHaveBeenCalled();
    audioMock.verify((x) => x.init(It.IsAny()), Times.Never());
    audioMock.verify((x) => x.loadBank(It.IsAny()), Times.Never());
    audioMock.verify((x) => x.logAvailableEvents(), Times.Never());
  });

  it('runs initialization when FMOD is not initialized yet', async () => {
    const audioMock = buildAudioMock({ initialized: false, loadedBankUrls: [] });

    const { result } = renderHook(() => useFMODAudioInitialization({ preloadBankUrls: BANK_URLS }));

    expect(result.current.isReady).toBe(false);
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.isLoading).toBe(false);
    expect(fetchWasmBinary).toHaveBeenCalledOnce();
    audioMock.verify((x) => x.init(WASM_BINARY), Times.Once());
    BANK_URLS.forEach((url) => audioMock.verify((x) => x.loadBank(url), Times.Once()));
  });

  it('runs initialization when FMOD is initialized but a requested bank is not loaded', async () => {
    const audioMock = buildAudioMock({ initialized: true, loadedBankUrls: [BANK_URLS[0]] });

    const { result } = renderHook(() => useFMODAudioInitialization({ preloadBankUrls: BANK_URLS }));

    expect(result.current.isReady).toBe(false);

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(fetchWasmBinary).toHaveBeenCalledOnce();
    audioMock.verify((x) => x.init(It.IsAny()), Times.Once());
  });
});
