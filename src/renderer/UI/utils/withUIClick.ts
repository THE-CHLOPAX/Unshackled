import { logger, MAIN_SOUND_CHANNEL } from '@tgdf';

import { FMOD_EVENTS, FMODAudio } from 'renderer/FMOD';

function playUIClick(): void {
  try {
    FMODAudio.playEventInSoundChannel({
      eventPath: FMOD_EVENTS.UI_CLICK.path,
      channelId: MAIN_SOUND_CHANNEL,
      options: { volume: FMOD_EVENTS.UI_CLICK.volume },
    });
  } catch (error) {
    logger({ message: `Failed to play UI click: ${(error as Error).message}`, type: 'warn' });
  }
}

export function withUIClick<Args extends unknown[], Result>(
  callback: (...args: Args) => Result
): (...args: Args) => Result {
  return (...args) => {
    playUIClick();
    return callback(...args);
  };
}
