import { FMODAudio } from './FMODAudio';

export type {
  FMOD3DAttributes,
  FMODBank,
  FMODCoreSystem,
  FMODEventDescription,
  FMODEventInstance,
  FMODObject,
  FMODOutVal,
  FMODStudioSystem,
  FMODVector,
} from './fmodstudio';
export type { FMODPlayEventOptions } from './FMODAudio';

const fmodAudio = FMODAudio.getInstance();

export { fmodAudio as FMODAudio };
export { FMOD_EVENTS } from './constants';

export { useFMODAudioInitialization } from './hooks/useFMODAudioInitialization';
