import styled from 'styled-components';

import { UI_BACKGROUND_IMAGE_URLS } from 'UI';

export type OrnamentProps = {
  short?: boolean;
};

export const Ornament = ({ short = false }: OrnamentProps) => {
  return <Wrapper $short={short} />;
};

const Wrapper = styled.div<{ $short: boolean }>`
  height: 30px;
  width: ${({ $short }) => ($short ? '156px' : '462px')};
  background-image: ${({ $short }) =>
    $short
      ? `url(${UI_BACKGROUND_IMAGE_URLS.ornamentShort})`
      : `url(${UI_BACKGROUND_IMAGE_URLS.ornament})`};
  image-rendering: pixelated;
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center;
`;
