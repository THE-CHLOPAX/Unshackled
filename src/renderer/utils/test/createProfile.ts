import { PlayerProfile } from 'renderer/types';

export function createProfile(overrides: Partial<PlayerProfile> = {}): PlayerProfile {
  const id = overrides.id ?? 'profile-1';

  return {
    id,
    name: id,
    class: 'monk',
    currentHealthPoints: 100,
    maxHealthPoints: 100,
    currentShortTermStamina: 100,
    maxShortTermStamina: 100,
    currentLongTermStamina: 100,
    maxLongTermStamina: 100,
    ...overrides,
  };
}
