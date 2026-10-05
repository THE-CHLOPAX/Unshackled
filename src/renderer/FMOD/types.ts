export type FMODParameterDefinition = {
  min: number;
  max: number;
  discrete?: boolean;
  automatic?: boolean;
  readOnly?: boolean;
  global?: boolean;
};

export type FMODEventDefinition = {
  path: string;
  parameters: Readonly<Record<string, FMODParameterDefinition>>;
};

type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>;

export type IntRange<Min extends number, Max extends number> =
  | Exclude<Enumerate<Max>, Enumerate<Min>>
  | Max;

export type FMODParameterValue<P extends FMODParameterDefinition> = P extends {
  min: infer Min extends number;
  max: infer Max extends number;
  discrete: true;
}
  ? IntRange<Min, Max>
  : number;

export type FMODSettableParameterName<E extends FMODEventDefinition> = {
  [K in keyof E['parameters']]: E['parameters'][K] extends
    | { automatic: true }
    | { readOnly: true }
    | { global: true }
    ? never
    : K;
}[keyof E['parameters']];

export type FMODEventParameters<E extends FMODEventDefinition> = [
  FMODSettableParameterName<E>,
] extends [never]
  ? Record<string, never>
  : { [K in FMODSettableParameterName<E>]?: FMODParameterValue<E['parameters'][K]> };
