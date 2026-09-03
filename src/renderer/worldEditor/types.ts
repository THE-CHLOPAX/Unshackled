export type WorldGeneratorVec2 = { x: number; z: number };

export type WorldGeneratorCell = {
  code: number;
  rotation: number;
};

export type WorldGeneratorOutput = {
  width: number;
  height: number;
  data: WorldGeneratorCell[];
};
