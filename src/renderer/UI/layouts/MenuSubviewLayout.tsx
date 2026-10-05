import { InternalFlex } from '@tgdf';
import styled from 'styled-components';

import { COLORS, GRADIENTS } from 'renderer/constants';

import { Text } from '../components/Text/Text';
import { VersionLayout } from '../layouts/VersionLayout';
import { Ornament } from '../components/Ornament/Ornament';
import { BackToViewLayout } from '../layouts/BackToViewLayout';

export const MenuSubviewLayout = ({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) => {
  return (
    <VersionLayout>
      <BackToViewLayout backToView="MenuView">
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
