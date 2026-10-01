import { useMemo } from 'react';
import styled from 'styled-components';
import { useViewsStore, InternalFlex, ipc } from '@tgdf';

import { GRADIENTS } from 'renderer/constants';
import { VersionLayout } from 'UI/layouts/VersionLayout';
import { Button, ButtonProps, Ornament, UI_IMAGE_URLS } from 'UI';
import { SidebarsLayout } from 'renderer/UI/layouts/SidebarsLayout';

export function MenuView() {
  const { setView } = useViewsStore();

  const buttonsData: ButtonProps[] = useMemo(
    () => [
      {
        label: 'Continue',
        onClick: () => setView('GameView'),
      },
      {
        label: 'New game',
        onClick: () => setView('NewGameView'),
      },
      {
        label: 'Load game',
        onClick: () => setView('LoadGameView'),
      },
      {
        label: 'Settings',
        onClick: () => setView('SettingsView'),
      },
      {
        label: 'Quit',
        onClick: () => {
          ipc.send('app-quit-request', undefined);
        },
      },
    ],
    []
  );

  return (
    <VersionLayout>
      <SidebarsLayout>
        <Wrapper>
          <LogoWrapper>
            <Logo />
            <Ornament />
          </LogoWrapper>
          <ButtonsWrapper direction="column" align="center" justify="center" gap={10}>
            {buttonsData.map(({ label, onClick }) => {
              return <Button key={label} label={label} onClick={onClick} />;
            })}
          </ButtonsWrapper>
        </Wrapper>
      </SidebarsLayout>
    </VersionLayout>
  );
}

const Wrapper = styled.div`
  width: 100%;
  height: 100vh;
  background: ${GRADIENTS.BACKGROUND};
`;

const ButtonsWrapper = styled(InternalFlex)`
  position: absolute;
  bottom: 22px;
  left: 22px;
`;

const Logo = styled.div`
  width: 538px;
  height: 102px;
  background-image: url(${UI_IMAGE_URLS.logoShort});
  image-rendering: pixelated;
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center;
`;

const LogoWrapper = styled.div`
  position: absolute;
  top: 31px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;
