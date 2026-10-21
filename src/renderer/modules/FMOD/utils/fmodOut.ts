import { FMODOutVal } from 'FMOD/fmodstudio';

export function fmodOut<T>(): FMODOutVal<T> {
  return { val: undefined };
}
