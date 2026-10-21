import styled from 'styled-components';

import { Text } from 'UI/components/Text/Text';
import { PlayerStatistics } from 'renderer/types';
import { COLORS, GRADIENTS } from 'renderer/constants';
import { usePlayerStats } from '3D/hooks/usePlayerStats';
import { Player } from '3D/classes/gameObjects/players/Player';
import { SquarePanel } from 'UI/components/SquarePanel/SquarePanel';
import { BarAnimated } from 'UI/components/BarAnimated/BarAnimated';
import { useRecentProgressChange } from 'UI/components/BarAnimated/useRecentProgressChange';

const SCALE = 3;
const BAR_NATIVE_HEIGHT = 6;
const BAR_NATIVE_OVERLAP = 1;
const BAR_PITCH = (BAR_NATIVE_HEIGHT - BAR_NATIVE_OVERLAP) * SCALE;

export type PlayerStatsProps = {
  player: Player;
};

export function PlayerStats({ player }: PlayerStatsProps) {
  const playerStatistics = usePlayerStats({ player });

  return playerStatistics && <PlayerStatsComponent {...playerStatistics} />;
}

function PlayerStatsComponent({
  name,
  currentHealthPoints,
  maxHealthPoints,
  currentLongTermStamina,
  maxLongTermStamina,
}: PlayerStatistics) {
  const stats: StatBarProps[] = [
    {
      label: 'HP',
      current: currentHealthPoints,
      max: maxHealthPoints,
      fillColor: COLORS.RED,
    },
    {
      label: 'SP',
      current: currentLongTermStamina,
      max: maxLongTermStamina,
      fillColor: COLORS.GOLDEN,
      recentChangeColor: COLORS.SOFT_FAWN,
    },
  ];

  return (
    <Wrapper>
      <SquarePanel scale={SCALE}>{<MockFill />}</SquarePanel>
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
                  {current}/{max}
                </Text>
              </LabelRow>
            ))}
          </Labels>
        </BarsRow>
      </Details>
    </Wrapper>
  );
}

type StatBarProps = {
  label: string;
  current: number;
  max: number;
  fillColor: string;
  recentChangeColor?: string;
};

function StatBar({ current, max, fillColor, recentChangeColor }: StatBarProps) {
  const progress = max > 0 ? current / max : 0;
  const { recentChange, recentChangeFading } = useRecentProgressChange(progress);

  return (
    <StackedBar
      progress={progress}
      fillColor={fillColor}
      recentChange={recentChange}
      recentChangeFading={recentChangeFading}
      recentChangeColor={recentChangeColor}
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
const MockFill = styled.div`
  width: 100%;
  height: 100%;
  background: ${GRADIENTS.BACKGROUND};
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
