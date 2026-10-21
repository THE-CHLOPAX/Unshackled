import { describe, it, expect, vi, beforeEach } from 'vitest';

const { keyboard, gamepad } = vi.hoisted(() => ({
  keyboard: vi.fn(() => ({ type: 'keyboard' })),
  gamepad: vi.fn((index: number) => ({ type: 'gamepad', index })),
}));

vi.mock('@tgdf', () => ({ PlayerInput: { keyboard, gamepad } }));
vi.mock('Store/useActivePlayersStore', () => ({}));

import { createActivePlayerInput } from 'renderer/utils/createActivePlayerInput';

describe('createActivePlayerInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates keyboard input for keyboard players', () => {
    createActivePlayerInput({ id: 'p1', name: 'P1', controls: 'keyboard' });

    expect(keyboard).toHaveBeenCalledOnce();
    expect(gamepad).not.toHaveBeenCalled();
  });

  it('creates gamepad input bound to the player gamepad index', () => {
    createActivePlayerInput({ id: 'p1', name: 'P1', controls: 'gamepad', gamepadIndex: 2 });

    expect(gamepad).toHaveBeenCalledWith(2);
    expect(keyboard).not.toHaveBeenCalled();
  });

  it('falls back to keyboard for a gamepad player without a gamepad index', () => {
    createActivePlayerInput({ id: 'p1', name: 'P1', controls: 'gamepad' });

    expect(keyboard).toHaveBeenCalledOnce();
    expect(gamepad).not.toHaveBeenCalled();
  });
});
