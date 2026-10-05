import { InternalFlex } from '@tgdf';
import styled from 'styled-components';

import { COLORS } from 'renderer/constants';
import { useSaveFiles } from 'renderer/hooks/useSaveFiles';
import { MenuSubviewLayout, PanelScalable, ScrollableWrapper } from 'UI';

import { LoadGameItem } from './LoadGameItem';

export const LoadGameView = () => {
  const { saveFiles, reload } = useSaveFiles();

  return (
    <MenuSubviewLayout title="Load game">
      <Wrapper color={COLORS.BG_COLOR_HIGHLIGHTED}>
        <ScrollableWrapper>
          <ItemsWrapper direction="column" gap={15}>
            {saveFiles.map((item) => (
              <LoadGameItem key={item.id} run={item} onDeleted={reload} />
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
  max-height: 65vh;

  > .panel-scalable-content {
    height: 100%;
    padding-inline: 25px;
    padding-block: 0px;
  }

  .scrollable-track-vertical {
    position: relative;
    margin-left: -2px;
    left: 12px;
    padding-block: 20px;
  }
`;

const ItemsWrapper = styled(InternalFlex)`
  margin-block: 25px;
`;
