import { MESSAGES } from 'FMOD/constants';
import { FMODObject } from 'FMOD/fmodstudio';

export function fmodCheckOrThrow(fmod: FMODObject, result: number): void {
  if (result !== fmod.OK) {
    throw new Error(MESSAGES.API_ERROR(fmod.ErrorString(result)));
  }
}
