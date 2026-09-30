import { useEffect } from 'react';
import styled from 'styled-components';
import { useDebounceWithQueueing, useDebouncedCallback } from '@tgdf';

import { Text, BarOrnament } from 'UI';
import { COLORS, GRADIENTS } from 'renderer/constants';

export type LoadingViewProps = {
  progress: number;
  onComplete: () => void;
};

/**
 * LoadingView is missing from the views batched export on purpose.
 * It's not meant to be used via the ViewManager, but rather rendered
 * explicitly with props.
 */
export function LoadingView({ progress, onComplete }: LoadingViewProps) {
  const progressDebounced = useDebounceWithQueueing(progress, 500);
  const onCompleteDebounced = useDebouncedCallback(onComplete, 500);

  useEffect(() => {
    if (progressDebounced === 1) onCompleteDebounced();
  }, [progressDebounced]);

  return (
    <Wrapper>
      <Text size="xl">Loading...</Text>
      <BarOrnament progress={progressDebounced} fillColor={COLORS.SOFT_FAWN} />
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  width: 100vw;
  height: 100vh;
  background: ${GRADIENTS.BACKGROUND};
`;
