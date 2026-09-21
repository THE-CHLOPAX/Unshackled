import styled from 'styled-components';

import { COLORS } from 'renderer/constants';

import { Text } from '../Text/Text';
import { UI_BACKGROUND_IMAGE_URLS } from '../../constants';

const SCALE = 3;

const NATIVE_WIDTH = 212;
const NATIVE_HEIGHT = 36;

export type BannerProps = {
  label: string;
  className?: string;
};

export const Banner = ({ label, className }: BannerProps) => (
  <Wrapper className={className}>
    <Text size="xxl" color={COLORS.FONT_COLOR_HIGHLIGHT}>
      {label}
    </Text>
  </Wrapper>
);

const Wrapper = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${NATIVE_WIDTH * SCALE}px;
  height: ${NATIVE_HEIGHT * SCALE}px;
  background-image: url(${UI_BACKGROUND_IMAGE_URLS.bannerBg});
  background-repeat: no-repeat;
  background-size: 100% 100%;
  image-rendering: pixelated;
`;
