import styled from 'styled-components';

import { UI_IMAGE_URLS } from '../../constants';

export type OrnamentProps = {
  short?: boolean;
  className?: string;
};

export const Ornament = ({ short = false, className }: OrnamentProps) => {
  return <Wrapper $short={short} className={className} />;
};

const Wrapper = styled.div<{ $short: boolean }>`
  height: 30px;
  width: ${({ $short }) => ($short ? '156px' : '462px')};
  background-image: ${({ $short }) =>
    $short ? `url(${UI_IMAGE_URLS.ornamentShort})` : `url(${UI_IMAGE_URLS.ornament})`};
  image-rendering: pixelated;
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center;
`;
