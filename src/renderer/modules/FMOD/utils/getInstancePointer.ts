import { FMODEventInstance, FMODEventInstanceWithPointer } from 'FMOD/fmodstudio';

export const getInstancePointer = (instance: FMODEventInstance): number => {
  if (isInstanceWithPointer(instance)) {
    return instance['$$'].ptr;
  }
  return -1;
};

function isInstanceWithPointer(
  instance: FMODEventInstance
): instance is FMODEventInstanceWithPointer {
  return '$$' in instance && (instance['$$'] as { ptr: number }).ptr !== undefined;
}
