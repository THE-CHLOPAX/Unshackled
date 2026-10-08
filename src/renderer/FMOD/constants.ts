import type { FMODEventDefinition } from './types';

export const FMOD_EVENTS = {
  MONK_ATTACK_3: { path: 'event:/SFX/Player/Attack no. 3', volume: 1, parameters: {} },
  GENERIC_HIT: {
    path: 'event:/SFX/Player/Hit',
    volume: 1,
    parameters: { Distance: { min: 0, max: 20, defaultValue: 0, automatic: true, readOnly: true } },
  },
  GENERIC_FOOTSTEP: {
    path: 'event:/SFX/Player/Footstep',
    volume: 0.1,
    parameters: { Surface: { min: 0, max: 10, defaultValue: 1 } },
  },
  GENERIC_DASH: { path: 'event:/SFX/Player/Dash', volume: 1, parameters: {} },
  GENERIC_SWOOSH: { path: 'event:/SFX/Player/Attack', volume: 1, parameters: {} },
  AMBIENT_TORCH_LOOP: {
    path: 'event:/SFX/Ambient/Ambient_Torch_Loop',
    volume: 1,
    parameters: { Distance: { min: 0, max: 20, defaultValue: 0, automatic: true, readOnly: true } },
  },
  GENERAL_ENEMY_FOOTSTEP: {
    path: 'event:/SFX/Enemies/General Enemy/Enemy_Footstep',
    volume: 1,
    parameters: {
      Distance: { min: 0, max: 20, defaultValue: 0, automatic: true, readOnly: true },
      Surface: { min: 0, max: 10, defaultValue: 0 },
    },
  },
  SKELETON_ATTACK: {
    path: 'event:/SFX/Enemies/Skeleton/Attack',
    volume: 1,
    parameters: { Distance: { min: 0, max: 20, defaultValue: 0, automatic: true, readOnly: true } },
  },
  SKELETON_FOOTSTEP: {
    path: 'event:/SFX/Enemies/Skeleton/Footstep',
    volume: 0.75,
    parameters: { Distance: { min: 0, max: 20, defaultValue: 0, automatic: true, readOnly: true } },
  },
  SKELETON_SPAWN: { path: 'event:/SFX/Enemies/Skeleton/Spawn', volume: 1, parameters: {} },
  UI_CLICK: { path: 'event:/SFX/UI/UI_Click', volume: 1, parameters: {} },
} as const satisfies Record<string, FMODEventDefinition>;

export const MESSAGES = {
  SYSTEM_SETUP_FAILED: '[FMOD] System setup failed',
  HOOK_INITIALIZATION_FAILED: '[FMOD] Failed to initialize FMOD Audio',
  MODULE_FACTORY_FAILED: '[FMOD] Module factory failed',
  SYSTEM_NOT_INITIALIZED: '[FMOD] System not initialized',
  SYSTEM_NOT_CREATED: '[FMOD] System not created',
  CORE_SYSTEM_NOT_FOUND: '[FMOD] Core system not found',
  DRIVER_NOT_FOUND: '[FMOD] Driver not found',
  EVENT_NOT_FOUND: '[FMOD] Event not found',
  EVENT_INSTANCE_NOT_CREATED: '[FMOD] Event instance not created',
  EVENT_PLAY_FAILED: (eventPath: string, error: unknown) =>
    `[FMOD] Failed to play event "${eventPath}": ${error}`,
  EVENT_SOUND_CHANNEL_SUBSCRIPTION_CLEARED: '[FMOD] Event sound channel subscription cleared',
  EVENT_COUNT_NOT_FOUND: '[FMOD] Event count not found',
  EVENT_LIST_NOT_FOUND: '[FMOD] Event list not found',
  EVENT_PATH_NOT_FOUND: '[FMOD] Event path not found',
  AVAILABLE_EVENTS_LABEL: '[FMOD] Available Events',
  PARAMETER_COUNT_NOT_FOUND: '[FMOD] Parameter count not found',
  PARAMETER_NOT_SET: (eventPath: string, name: string, error: string) =>
    `[FMOD] Failed to set parameter "${name}" on "${eventPath}": ${error}`,
  BANK_NOT_LOADED: '[FMOD] Bank not loaded',
  BANK_LOAD_FAILED: (url: string, error: unknown) =>
    `[FMOD] Failed to load bank "${url}": ${error}`,
  BANK_ALREADY_LOADED: (bankName: string) => `[FMOD] Bank "${bankName}" already loaded`,
  BANK_ALREADY_LOADING: (bankName: string) => `[FMOD] Bank "${bankName}" already loading`,
  BANK_FETCH_FAILED: (url: string, status: number, statusText: string) =>
    `[FMOD] Failed to fetch bank "${url}": ${status} ${statusText}`,
  LOADED_BANK: (bankName: string) => `[FMOD] Loaded bank "${bankName}"`,
  WASM_FETCH_FAILED: (error: unknown) => `[FMOD] Failed to fetch fmodstudio.wasm: ${error}`,
  API_ERROR: (detail: string) => `[FMOD] ${detail}`,
};
