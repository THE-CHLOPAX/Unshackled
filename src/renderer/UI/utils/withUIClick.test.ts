import { describe, it, expect, vi, beforeEach } from 'vitest';

import { FMODAudio } from 'renderer/FMOD';

import { withUIClick } from './withUIClick';

vi.mock('@tgdf', () => ({
  logger: vi.fn(),
  MAIN_SOUND_CHANNEL: 'main',
}));

vi.mock('renderer/FMOD', () => ({
  FMOD_EVENTS: { UI_CLICK: { path: 'event:/UI/Click', volume: 0.4, parameters: {} } },
  FMODAudio: { playEventInSoundChannel: vi.fn() },
}));

describe('withUIClick', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('plays the UI click event in the main channel before running the callback', () => {
    const callOrder: string[] = [];
    vi.mocked(FMODAudio.playEventInSoundChannel).mockImplementation(() => {
      callOrder.push('click');
      return null;
    });

    withUIClick(() => callOrder.push('callback'))();

    expect(FMODAudio.playEventInSoundChannel).toHaveBeenCalledWith({
      eventPath: 'event:/UI/Click',
      channelId: 'main',
      options: { volume: 0.4 },
    });
    expect(callOrder).toEqual(['click', 'callback']);
  });

  it('forwards arguments and returns the callback result', () => {
    const add = withUIClick((a: number, b: number) => a + b);

    expect(add(2, 3)).toBe(5);
  });

  it('still runs the callback when playing the click fails', () => {
    vi.mocked(FMODAudio.playEventInSoundChannel).mockImplementation(() => {
      throw new Error('Event not found');
    });
    const callback = vi.fn();

    withUIClick(callback)();

    expect(callback).toHaveBeenCalledOnce();
  });
});
