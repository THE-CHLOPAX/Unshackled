import type { CSSProperties, FC, SVGProps } from 'react';

import styled from 'styled-components';

import ArrowUp from '../../../assets/svg/arrow-up.svg';
import ArrowDown from '../../../assets/svg/arrow-down.svg';
import ArrowLeft from '../../../assets/svg/arrow-left.svg';
import ArrowRight from '../../../assets/svg/arrow-right.svg';

const DEFAULT_SCALE = 3;

type IconDefinition = {
  component: FC<SVGProps<SVGSVGElement>>;
  width: number;
  height: number;
};

export const ICONS = {
  arrowUp: { component: ArrowUp, width: 7, height: 10 },
  arrowDown: { component: ArrowDown, width: 7, height: 10 },
  arrowLeft: { component: ArrowLeft, width: 10, height: 7 },
  arrowRight: { component: ArrowRight, width: 10, height: 7 },
} as const satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof ICONS;

export type IconProps = {
  icon: IconName;
  color?: string;
  scale?: number;
  className?: string;
  style?: CSSProperties;
};

export const Icon = ({ icon, color, scale = DEFAULT_SCALE, className, style }: IconProps) => {
  const { component: Svg, width, height } = ICONS[icon];

  return (
    <Wrapper className={className} style={style} $color={color}>
      <Svg width={width * scale} height={height * scale} viewBox={`0 0 ${width} ${height}`} />
    </Wrapper>
  );
};

const Wrapper = styled.span<{ $color?: string }>`
  display: inline-flex;
  line-height: 0;

  svg {
    shape-rendering: crispEdges;
  }

  ${({ $color }) =>
    $color &&
    `
    svg [fill]:not([fill='none']) {
      fill: ${$color};
    }

    svg [stroke]:not([stroke='none']) {
      stroke: ${$color};
    }
  `}
`;
