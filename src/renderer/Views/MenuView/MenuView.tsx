import { useState } from 'react';
import { InternalFlex } from '@tgdf';
import styled from 'styled-components';

import { GRADIENTS } from 'renderer/constants';
import { VersionLayout } from 'UI/layouts/VersionLayout';
import { useSaveFilesStore } from 'Store/useSaveFilesStore';
import { Button, Ornament, UI_IMAGE_URLS, withUIClick } from 'UI';
import { useReloadSaveFiles } from 'renderer/hooks/useReloadSaveFiles';

import { LoadingView } from '../LoadingView';
import { useButtonsData } from './useButtonsData';

export type MenuViewProps = {
  reloadSaveFiles?: boolean;
};

export function MenuView({ reloadSaveFiles = false }: MenuViewProps) {
  const saveFiles = useSaveFilesStore((state) => state.saveFiles);
  const buttonsData = useButtonsData(saveFiles);
  const saveFilesReloaded = useReloadSaveFiles(reloadSaveFiles);
  const [loadingFinished, setLoadingFinished] = useState(!reloadSaveFiles);

  return loadingFinished ? (
    <VersionLayout>
      <Wrapper>
        <LogoWrapper>
          <Logo />
          <Ornament />
        </LogoWrapper>
        <ButtonsWrapper direction="column" align="center" justify="center" gap={10}>
          {buttonsData.map(({ label, onClick, disabled }) => {
            return (
              <Button
                key={label}
                label={label}
                onClick={onClick && withUIClick(onClick)}
                disabled={disabled}
              />
            );
          })}
        </ButtonsWrapper>
      </Wrapper>
    </VersionLayout>
  ) : (
    <LoadingView progress={saveFilesReloaded ? 1 : 0} onComplete={() => setLoadingFinished(true)} />
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
