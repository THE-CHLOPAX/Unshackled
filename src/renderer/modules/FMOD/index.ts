import { FMODAudio } from 'FMOD/FMODAudio';

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
} from 'FMOD/fmodstudio';
export type { FMODPlayEventOptions } from 'FMOD/FMODAudio';
export type {
  FMODAudioEventMap,
  FMODEventDefinition,
  FMODEventParameters,
  FMODParameterDefinition,
  FMODParameterValue,
  FMODSettableParameterName,
} from 'FMOD/types';

const fmodAudio = FMODAudio.getInstance();

export { fmodAudio as FMODAudio };
export { FMOD_EVENTS } from 'FMOD/constants';

export { useFMODAudioInitialization } from 'FMOD/hooks/useFMODAudioInitialization';
