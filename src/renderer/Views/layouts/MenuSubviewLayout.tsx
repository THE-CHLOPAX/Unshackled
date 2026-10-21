import type { MenuViewProps } from 'Views/MenuView/MenuView';

import { InternalFlex } from '@tgdf';
import styled from 'styled-components';

import { Text } from 'UI/components/Text/Text';
import { COLORS, GRADIENTS } from 'renderer/constants';
import { Ornament } from 'UI/components/Ornament/Ornament';
import { VersionLayout } from 'Views/layouts/VersionLayout';
import { BackToViewLayout } from 'Views/layouts/BackToViewLayout';

export const MenuSubviewLayout = ({
  children,
  title,
  backToMenuProps,
}: {
  children: React.ReactNode;
  title: string;
  backToMenuProps?: MenuViewProps;
}) => {
  return (
    <VersionLayout>
      <BackToViewLayout backToView="MenuView" backToViewProps={backToMenuProps}>
        <Wrapper direction="column" justify="center" align="center">
          <Header direction="column" justify="center" align="center" gap={20}>
            <Text size="xxl" color={COLORS.FONT_COLOR_HIGHLIGHT}>
              {title}
            </Text>
            <Ornament />
          </Header>
          <Content>{children}</Content>
        </Wrapper>
      </BackToViewLayout>
    </VersionLayout>
  );
};

const Header = styled(InternalFlex)`
  margin-bottom: 49px;
`;

const Wrapper = styled(InternalFlex)`
  width: 100vw;
  height: 100vh;
  background: ${GRADIENTS.BACKGROUND};
`;

const Content = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  min-height: 0;
`;
