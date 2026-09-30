import { NativeFileLocation } from '@tgdf';

import { CampaignIdentifier, LevelIdentifier } from './types';

export const APP_VERSION = __APP_VERSION__;

// COLOR PALETTE
export const COLORS = {
  // Base
  GOLDEN: '#fffd88',
  LIGHT_KHAKI: '#6c6757',
  DARK_KHAKI: '#393424',
  SOFT_FAWN: '#deba6f',
  BLACK: '#000',
  RED: '#a91212',
  RED_LIGHT: '#dc4545',
  ORANGE: '#ffaa33',
  GREEN: '#00AB06',
  // Semantic
  BG_COLOR: '#191611',
  BG_COLOR_HIGHLIGHTED_HALF: '#211a0e',
  BG_COLOR_HIGHLIGHTED: '#312a1f',
  // Fonts
  FONT_COLOR_PRIMARY: '#e0d2b7',
  FONT_COLOR_HIGHLIGHT: '#ffdf9e',
  FONT_COLOR_DIMMED: '#7d6445',
} as const;

export const GRADIENTS = {
  BACKGROUND:
    `radial-gradient(ellipse at center, ${COLORS.BG_COLOR_HIGHLIGHTED_HALF} 0%, ` +
    `${COLORS.BG_COLOR} 100%)`,
} as const;

// WORLD GENERATION
export const WORLD_LAYER_COUNT = 4;

export const WORLD_MAPS_LOCATION: NativeFileLocation = {
  root: 'app',
  directory: 'src/renderer/assets/worldMaps',
};

export const SAVE_FILES_LOCATION: NativeFileLocation = {
  root: 'userData',
  directory: 'saveFiles',
};

export const SAVE_FILES_LOCATION_DEV: NativeFileLocation = {
  root: 'app',
  directory: 'saveFilesDebug',
};

// BILLBOARD DOM
export const BILLBOARD_OVERLAY_ELEMENT_ID = 'billboard-overlay';

// GAMEPLAY
export const PLAYER_CLASSES = ['monk'] as const;

export const BIOMES = ['dungeon'] as const;

export const INTRO_LEVEL_ID = 'intro';

export const DUNGEON_LEVELS: LevelIdentifier[] = [
  {
    id: INTRO_LEVEL_ID,
    mapUrl: 'test.json',
  },
] as const;

export const CAMPAIGN: CampaignIdentifier = [
  {
    id: 'dungeon',
    levelCount: 5,
    levels: DUNGEON_LEVELS,
    bossLevels: [],
  },
] as const;
