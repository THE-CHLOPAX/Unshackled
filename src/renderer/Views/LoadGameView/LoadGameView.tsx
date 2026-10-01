import { InternalFlex } from '@tgdf';
import styled from 'styled-components';

import { COLORS } from 'renderer/constants';
import { RunIdentifier } from 'renderer/types';
import { MenuSubviewLayout, PanelScalable, ScrollableWrapper } from 'UI';

import { LoadGameItem } from './LoadGameItem';

const MOCK_LOAD_GAME_ITEMS: RunIdentifier[] = [
  {
    version: 1,
    name: 'New game',
    id: 'mock-id',
    completedLevelIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    players: [
      {
        name: 'Player 1',
        id: 'mock-player-id',
        class: 'monk',
      },
      {
        name: 'Player 1',
        id: 'mock-player-id2',
        class: 'monk',
      },
      {
        name: 'Player 1',
        id: 'mock-player-id3',
        class: 'monk',
      },
      {
        name: 'Player 1',
        id: 'mock-player-id5',
        class: 'monk',
      },
    ],
    progress: {
      biomeId: 'dungeon',
      levelIndex: 0,
    },
  },
  {
    version: 1,
    name: 'New game',
    id: 'mock-id',
    completedLevelIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    players: [
      {
        name: 'Player 1',
        id: 'mock-player-id',
        class: 'monk',
      },
      {
        name: 'Player 1',
        id: 'mock-player-id2',
        class: 'monk',
      },
      {
        name: 'Player 1',
        id: 'mock-player-id3',
        class: 'monk',
      },
      {
        name: 'Player 1',
        id: 'mock-player-id5',
        class: 'monk',
      },
    ],
    progress: {
      biomeId: 'dungeon',
      levelIndex: 0,
    },
  },
  {
    version: 1,
    name: 'New game',
    id: 'mock-id',
    completedLevelIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    players: [
      {
        name: 'Player 1',
        id: 'mock-player-id',
        class: 'monk',
      },
      {
        name: 'Player 1',
        id: 'mock-player-id2',
        class: 'monk',
      },
      {
        name: 'Player 1',
        id: 'mock-player-id3',
        class: 'monk',
      },
      {
        name: 'Player 1',
        id: 'mock-player-id5',
        class: 'monk',
      },
    ],
    progress: {
      biomeId: 'dungeon',
      levelIndex: 0,
    },
  },
  {
    version: 1,
    name: 'New game',
    id: 'mock-id',
    completedLevelIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    players: [
      {
        name: 'Player 1',
        id: 'mock-player-id',
        class: 'monk',
      },
      {
        name: 'Player 1',
        id: 'mock-player-id2',
        class: 'monk',
      },
      {
        name: 'Player 1',
        id: 'mock-player-id3',
        class: 'monk',
      },
      {
        name: 'Player 1',
        id: 'mock-player-id5',
        class: 'monk',
      },
    ],
    progress: {
      biomeId: 'dungeon',
      levelIndex: 0,
    },
  },
  {
    version: 1,
    name: 'New game',
    id: 'mock-id',
    completedLevelIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    players: [
      {
        name: 'Player 1',
        id: 'mock-player-id',
        class: 'monk',
      },
      {
        name: 'Player 1',
        id: 'mock-player-id2',
        class: 'monk',
      },
      {
        name: 'Player 1',
        id: 'mock-player-id3',
        class: 'monk',
      },
      {
        name: 'Player 1',
        id: 'mock-player-id5',
        class: 'monk',
      },
    ],
    progress: {
      biomeId: 'dungeon',
      levelIndex: 0,
    },
  },
];

export const LoadGameView = () => {
  return (
    <MenuSubviewLayout title="Load game">
      <Wrapper color={COLORS.BG_COLOR_HIGHLIGHTED}>
        <ScrollableWrapper>
          <ItemsWrapper direction="column" gap={15}>
            {MOCK_LOAD_GAME_ITEMS.map((item) => (
              <LoadGameItem {...item} key={item.id} />
            ))}
          </ItemsWrapper>
        </ScrollableWrapper>
      </Wrapper>
    </MenuSubviewLayout>
  );
};

const Wrapper = styled(PanelScalable)`
  position: relative;
  width: 602px;
  height: 100%;

  > .panel-scalable-content {
    height: 100%;
    padding-block: 0px;
  }

  .scrollable-track-vertical {
    position: relative;
    margin-left: -2px;
    left: 8px;
    padding-block: 15px;
  }
`;

const ItemsWrapper = styled(InternalFlex)`
  margin-block: px;
`;
