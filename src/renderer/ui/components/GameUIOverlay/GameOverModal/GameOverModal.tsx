import { useViewsStore } from '@tgdf';
import styled from 'styled-components';
import { useEffect, useState } from 'react';

import { COLORS } from 'renderer/constants';
import { GameEventsEmitter } from 'renderer/types';
import { Banner, PanelScalable, Button, Text } from 'UI';
import { hexStringToRgbaString } from 'renderer/ui/utils/hexStringToRgbaString';

export type GameOverModalProps = {
  emitter: GameEventsEmitter;
};

export const GameOverModal = ({ emitter }: GameOverModalProps) => {
  const { setView } = useViewsStore();

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleGameOver = () => {
      setIsVisible(true);
    };
    emitter.once('game-over', handleGameOver);

    return () => {
      emitter.off('game-over', handleGameOver);
    };
  }, [emitter]);

  return !isVisible ? null : (
    <Wrapper>
      <BannerSection>
        <BannerStyled label="GAME OVER" />
        <Disclaimer>
          <DisclaimerContent>
            <Text size="md" color={COLORS.FONT_COLOR_DIMMED}>
              All players are dead
            </Text>
          </DisclaimerContent>
        </Disclaimer>
      </BannerSection>
      <ButtonsSection>
        <ButtonsWrapper>
          <Button label="Restart" />
          <Button label="Menu" onClick={() => setView('MenuView')} />
        </ButtonsWrapper>
      </ButtonsSection>
    </Wrapper>
  );
};

const BannerSection = styled.div`
  position: relative;
  margin-top: 120px;
`;

const BannerStyled = styled(Banner)`
  z-index: 1;
`;

const ButtonsSection = styled(PanelScalable)`
  margin-bottom: 60px;
`;

const Disclaimer = styled(PanelScalable)`
  position: absolute;
  z-index: 0;
  bottom: 0;
  left: 50%;
  transform: translate(-50%, 40%);
`;

const DisclaimerContent = styled.div`
  padding-top: 50px;
`;

const ButtonsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 5px 20px;
`;

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  background: ${hexStringToRgbaString(COLORS.BG_COLOR, 0.75)};
`;
