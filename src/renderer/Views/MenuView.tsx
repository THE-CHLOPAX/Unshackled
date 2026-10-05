import { useMemo } from 'react';
import styled from 'styled-components';
import { useViewsStore, InternalFlex, ipc, isDev } from '@tgdf';

import { GRADIENTS } from 'renderer/constants';
import { VersionLayout } from 'UI/layouts/VersionLayout';
import { useRunStore } from 'renderer/Store/useRunStore';
import { useSaveFiles } from 'renderer/hooks/useSaveFiles';
import { Button, ButtonProps, Ornament, UI_IMAGE_URLS } from 'UI';

export function MenuView() {
  const { setView } = useViewsStore();
  const { saveFiles, loading } = useSaveFiles();
  const { setCurrentRun } = useRunStore();

  const buttonsData: ButtonProps[] = useMemo(() => {
    const buttons = [
      {
        label: 'New game',
        onClick: () => setView('NewGameView'),
      },
      {
        label: 'Load game',
        onClick: () => setView('LoadGameView'),
        disabled: saveFiles.length === 0,
      },
      {
        label: 'Settings',
        onClick: () => setView('SettingsView'),
      },
      ...(isDev
        ? [
            {
              label: 'Components',
              onClick: () => setView('ComponentsView'),
            },
            {
              label: 'Test',
              onClick: () => setView('TestView'),
            },
            {
              label: 'World editor',
              onClick: () => setView('WorldEditorView'),
            },
          ]
        : []),
      {
        label: 'Quit',
        onClick: () => {
          ipc.send('app-quit-request', undefined);
        },
      },
    ];

    if (saveFiles.length > 0) {
      buttons.unshift({
        label: 'Continue',
        onClick: () => {
          setCurrentRun(saveFiles[0]);
          setView('GameView');
        },
      });
    }

    return buttons;
  }, [saveFiles, setView, setCurrentRun]);

  return (
    <VersionLayout>
      <Wrapper>
        <LogoWrapper>
          <Logo />
          <Ornament />
        </LogoWrapper>
        <ButtonsWrapper direction="column" align="center" justify="center" gap={10}>
          {!loading &&
            buttonsData.map(({ label, onClick, disabled }) => {
              return <Button key={label} label={label} onClick={onClick} disabled={disabled} />;
            })}
        </ButtonsWrapper>
      </Wrapper>
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
