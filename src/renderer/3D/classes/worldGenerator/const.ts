import { MODELS } from '3D/constants';

export const WORLD_GEN_GRID_SIZE = 64;

export const EMPTY_CELL_CODE = 0;

export const CELL_ROTATIONS = [0, 90, 180, 270] as const;

export type CellRotation = (typeof CELL_ROTATIONS)[number];

export type WorldGenTileDefinition = {
  code: number;
  label: string;
  modelId: string | null;
};

export const WORLD_GEN_TILE_DEFINITIONS: WorldGenTileDefinition[] = [
  { code: 0x552222, label: 'Floor', modelId: MODELS.DUNGEON_FLOOR.id },
  { code: 0x888888, label: 'Wall', modelId: MODELS.DUNGEON_WALL_BRICK_TALL.id },
  { code: 0xffaa33, label: 'Wall torch', modelId: MODELS.DUNGEON_WALL_TORCH.id },
  { code: 0x8a5a2b, label: 'Door', modelId: MODELS.DUNGEON_DOOR.id },
  { code: 0x5a5a5a, label: 'Pillar', modelId: MODELS.DUNGEON_PILLAR.id },
  { code: 0x00ff00, label: 'Spawn', modelId: null },
  { code: 0xff00ff, label: 'Level end', modelId: null },
];

export const codeToCssHex = (code: number): string =>
  `#${(code & 0xffffff).toString(16).padStart(6, '0')}`;

export const tileDefinitionByCode: ReadonlyMap<number, WorldGenTileDefinition> = new Map(
  WORLD_GEN_TILE_DEFINITIONS.map((definition) => [definition.code, definition])
);
