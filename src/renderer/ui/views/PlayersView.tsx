import { useCallback, useEffect } from 'react';
import {
  InternalFlex,
  InternalText,
  InternalSelect,
  InternalButton,
  InternalCheckbox,
} from '@tgdf';

import { COLORS } from '../../constants';
import { BackToViewLayout } from '../layouts/BackToViewLayout';
import { ActivePlayerState, useActivePlayersStore } from '../../store/useActivePlayersStore';

export function PlayersView() {
  const {
    basePlayer,
    enableAdditionalPlayers,
    getActivePlayers,
    setEnableAdditionalPlayers,
    removeAdditionalPlayer,
    changePlayerControls,
    getKeyboardPlayers,
    getUnoccupiedGamepads,
    syncConnectedGamepads,
  } = useActivePlayersStore();

  useEffect(() => {
    syncConnectedGamepads();
  }, [syncConnectedGamepads]);

  const handleRemovePlayer = useCallback(
    (playerId: string) => {
      removeAdditionalPlayer(playerId);
    },
    [removeAdditionalPlayer]
  );

  const handleChangePlayerControls = useCallback(
    (player: ActivePlayerState, value: ActivePlayerState['controls']) => {
      changePlayerControls(player.id, value);
    },
    [changePlayerControls]
  );

  const getAvailableControls = useCallback(
    (playerControls: ActivePlayerState['controls']) => [
      {
        label: 'Keyboard',
        value: 'keyboard' as const,
        disabled: getKeyboardPlayers().size >= 1 && playerControls !== 'keyboard',
      },
      {
        label: 'Gamepad',
        value: 'gamepad' as const,
        disabled: getUnoccupiedGamepads().size === 0 && playerControls !== 'gamepad',
      },
    ],
    [getKeyboardPlayers, getUnoccupiedGamepads]
  );

  return (
    <BackToViewLayout backToView="MenuView">
      <InternalFlex
        direction="column"
        justify="center"
        align="center"
        style={{ height: '100vh', color: COLORS.FONT_COLOR_PRIMARY }}
      >
        <InternalText size="xl" weight="bold">
          Players View
        </InternalText>

        {Array.from(getActivePlayers()).map((player) => (
          <InternalFlex
            key={player.id}
            direction="row"
            justify="between"
            gap={'1rem'}
            style={{
              marginTop: '1rem',
              border: `1px solid ${COLORS.FONT_COLOR_DIMMED}`,
              padding: '5px',
            }}
          >
            <InternalText size="lg">{player.id}</InternalText>
            <InternalText size="lg">{player.name}</InternalText>
            <InternalText size="lg">
              Controls:
              <InternalSelect
                value={player.controls}
                options={getAvailableControls(player.controls)}
                onChange={(value) => handleChangePlayerControls(player, value)}
              />
            </InternalText>
            {player.id !== basePlayer.id && (
              <InternalButton onClick={() => handleRemovePlayer(player.id)} label={'X'} />
            )}
          </InternalFlex>
        ))}

        <InternalFlex>
          <InternalText>Enable Additional Players</InternalText>
          <InternalCheckbox
            checked={enableAdditionalPlayers}
            onChange={(checked) => setEnableAdditionalPlayers(checked)}
          />
        </InternalFlex>
      </InternalFlex>
    </BackToViewLayout>
  );
}
