import { PlayerInput } from '@tgdf';

import { ActivePlayerState } from 'Store/useActivePlayersStore';

export function createActivePlayerInput({
  controls,
  gamepadIndex,
}: ActivePlayerState): PlayerInput {
  return controls === 'gamepad' && gamepadIndex !== undefined
    ? PlayerInput.gamepad(gamepadIndex)
    : PlayerInput.keyboard();
}
