import { COLORS } from 'renderer/constants';

import { BarSimple } from '../BarSimple/BarSimple';

export type StaminaBarProps = {
  progress: number;
};

export const StaminaBar = ({ progress }: StaminaBarProps) => {
  return <BarSimple fillColor={COLORS.GOLDEN} progress={progress} scale={1.5} short />;
};
