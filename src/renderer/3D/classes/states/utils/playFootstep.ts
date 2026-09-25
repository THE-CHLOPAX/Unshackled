import { MAIN_SOUND_CHANNEL } from '@tgdf';

import { FMOD_EVENTS, FMODAudio } from 'renderer/FMOD';
import { FMODPlayEventOptions } from 'renderer/FMOD/FMODAudio';

export type PlayFootstepOptions = {
  eventPath?: string;
  options?: FMODPlayEventOptions;
};

export function playFootstep({
  eventPath = FMOD_EVENTS.GENERIC_FOOTSTEP,
  options,
}: PlayFootstepOptions = {}): void {
  FMODAudio.playEventInSoundChannel({
    eventPath,
    channelId: MAIN_SOUND_CHANNEL,
    options,
  });
}
