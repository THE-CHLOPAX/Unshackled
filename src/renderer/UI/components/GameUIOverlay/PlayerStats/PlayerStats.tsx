import { PlayerStatistics } from 'renderer/types';

export type PlayerStatsProps = PlayerStatistics;

export function PlayerStats({ currentHealthPoints }: PlayerStatsProps) {
  return <div>Player Stats Component: HP - {currentHealthPoints}</div>;
}
