import styled from 'styled-components';

import { COLORS } from 'renderer/constants';
import { PlayerStatistics } from 'renderer/types';

import { Text } from '../../Text/Text';
import { SquarePanel } from '../../SquarePanel/SquarePanel';
import { BarAnimated } from '../../BarAnimated/BarAnimated';
import { useRecentProgressChange } from '../../BarAnimated/useRecentProgressChange';

const SCALE = 3;
const BAR_NATIVE_HEIGHT = 6;
const BAR_NATIVE_OVERLAP = 1;
const BAR_PITCH = (BAR_NATIVE_HEIGHT - BAR_NATIVE_OVERLAP) * SCALE;

/* const PLACEHOLDER_STAMINA_POINTS = 100;
const PLACEHOLDER_MANA_POINTS = 100; */

export type PlayerStatsProps = PlayerStatistics;

type StatBarProps = {
  label: string;
  current: number;
  max: number;
  fillColor: string;
};

export function PlayerStats({ name, currentHealthPoints, maxHealthPoints }: PlayerStatsProps) {
  const stats: StatBarProps[] = [
    {
      label: 'HP',
      current: currentHealthPoints,
      max: maxHealthPoints,
      fillColor: COLORS.RED,
    },
    /* {
      label: 'SP',
      current: PLACEHOLDER_STAMINA_POINTS,
      max: PLACEHOLDER_STAMINA_POINTS,
      fillColor: COLORS.GOLDEN,
    },
    {
      label: 'MP',
      current: PLACEHOLDER_MANA_POINTS,
      max: PLACEHOLDER_MANA_POINTS,
      fillColor: COLORS.BLUE,
    }, */
  ];

  return (
    <Wrapper>
      <SquarePanel scale={SCALE} />
      <Details>
        <Name size="xl" color={COLORS.FONT_COLOR_HIGHLIGHT} nowrap>
          {name}
        </Name>
        <BarsRow>
          <Bars>
            {stats.map((stat) => (
              <StatBar key={stat.label} {...stat} />
            ))}
          </Bars>
          <Labels>
            {stats.map(({ label, current, max }) => (
              <LabelRow key={label}>
                <Text color={COLORS.FONT_COLOR_DIMMED} nowrap>
                  {label}
                </Text>
                <Text nowrap>
                  &nbsp;
                  {Math.round(current)}/{max}
                </Text>
              </LabelRow>
            ))}
          </Labels>
        </BarsRow>
      </Details>
    </Wrapper>
  );
}

function StatBar({ current, max, fillColor }: StatBarProps) {
  const progress = max > 0 ? current / max : 0;
  const { recentChange, recentChangeFading } = useRecentProgressChange(progress);

  return (
    <StackedBar
      progress={progress}
      fillColor={fillColor}
      recentChange={recentChange}
      recentChangeFading={recentChangeFading}
      scale={SCALE}
    />
  );
}

const Wrapper = styled.div`
  display: flex;
  align-items: flex-end;
`;

const Details = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${2 * SCALE}px;
  padding-bottom: ${3 * SCALE}px;
`;

const Name = styled(Text)`
  padding-left: ${4 * SCALE}px;
`;

const BarsRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${3 * SCALE}px;
`;

const Bars = styled.div`
  display: flex;
  flex-direction: column;
`;

const StackedBar = styled(BarAnimated)`
  & + & {
    margin-top: ${-BAR_NATIVE_OVERLAP * SCALE}px;
  }
`;

const Labels = styled.div`
  display: grid;
  grid-auto-rows: ${BAR_PITCH}px;
  align-items: center;
`;

const LabelRow = styled.div`
  display: grid;
  grid-template-columns: ${8 * SCALE}px auto;
  align-items: center;
`;
