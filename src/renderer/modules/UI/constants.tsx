import { PlayerInputBinding } from '@tgdf';

import { COLORS } from 'renderer/constants';
import { PlayerActionType } from 'renderer/types';
import bannerBg from 'renderer/assets/svg/banner.svg?url';
import { Icon, IconProps } from 'UI/components/Icon/Icon';
import ornament from 'renderer/assets/svg/ornament.svg?url';
import logoShort from 'renderer/assets/svg/logo-short.svg?url';
import arrowRight from 'renderer/assets/svg/arrow-right.svg?url';
import scrollArrow from 'renderer/assets/svg/scroll-arrow.svg?url';
import scrollThumb from 'renderer/assets/svg/scroll-thumb.svg?url';
import barSimpleFrame from 'renderer/assets/svg/bar-simple.svg?url';
import squarePanelBg from 'renderer/assets/svg/square-panel.svg?url';
import ornamentShort from 'renderer/assets/svg/ornament-short.svg?url';
import barOrnamentFrame from 'renderer/assets/svg/bar-ornament.svg?url';
import inputActiveBg from 'renderer/assets/svg/input-active-bg.svg?url';
import buttonActiveBg from 'renderer/assets/svg/button-active-bg.svg?url';
import inputInactiveBg from 'renderer/assets/svg/input-inactive-bg.svg?url';
import buttonInactiveBg from 'renderer/assets/svg/button-inactive-bg.svg?url';
import dropdownActiveBg from 'renderer/assets/svg/dropdown-active-bg.svg?url';
import scalablePanelTop from 'renderer/assets/svg/scalable-panel-top.svg?url';
import barSimpleShortFrame from 'renderer/assets/svg/bar-simple-short.svg?url';
import scalablePanelLeft from 'renderer/assets/svg/scalable-panel-left.svg?url';
import dropdownInactiveBg from 'renderer/assets/svg/dropdown-inactive-bg.svg?url';
import scalablePanelRight from 'renderer/assets/svg/scalable-panel-right.svg?url';
import barOrnamentShortFrame from 'renderer/assets/svg/bar-ornament-short.svg?url';
import smallPanelActiveBg from 'renderer/assets/svg/small-panel-active-bg.svg?url';
import scalablePanelBottom from 'renderer/assets/svg/scalable-panel-bottom.svg?url';
import scalablePanelTopLeft from 'renderer/assets/svg/scalable-panel-top-left.svg?url';
import smallPanelInactiveBg from 'renderer/assets/svg/small-panel-inactive-bg.svg?url';
import scalablePanelTopRight from 'renderer/assets/svg/scalable-panel-top-right.svg?url';
import scalablePanelBottomLeft from 'renderer/assets/svg/scalable-panel-bottom-left.svg?url';
import scalablePanelBottomRight from 'renderer/assets/svg/scalable-panel-bottom-right.svg?url';

// These are referenced only via CSS `background-image: url(...)` in styled-components
// (Button, Dropdown, BarOrnament, BarSimple, PanelScalable, Scrollbar), so the browser
// doesn't fetch them until the owning component first paints, which shows up as a pop-in
// on first mount. preloadUiAssets() warms the cache ahead of time to remove that gap.
export const UI_IMAGE_URLS = {
  arrowRight,
  bannerBg,
  barOrnamentFrame,
  barOrnamentShortFrame,
  barSimpleFrame,
  barSimpleShortFrame,
  buttonActiveBg,
  buttonInactiveBg,
  dropdownActiveBg,
  dropdownInactiveBg,
  inputActiveBg,
  inputInactiveBg,
  scalablePanelBottom,
  scalablePanelBottomLeft,
  scalablePanelBottomRight,
  scalablePanelLeft,
  scalablePanelRight,
  scalablePanelTop,
  scalablePanelTopLeft,
  scalablePanelTopRight,
  scrollArrow,
  scrollThumb,
  smallPanelActiveBg,
  smallPanelInactiveBg,
  squarePanelBg,
  logoShort,
  ornament,
  ornamentShort,
} as const;

export const FONT_SIZES = {
  sm: { fontSize: 12, lineHeight: 1 },
  md: { fontSize: 18, lineHeight: 1 },
  lg: { fontSize: 24, lineHeight: 1 },
  xl: { fontSize: 32, lineHeight: 1 },
  xxl: { fontSize: 48, lineHeight: 1 },
} as const;

const DEFAULT_HINT_ICON_PROPS: Partial<IconProps> = {
  color: COLORS.FONT_COLOR_HIGHLIGHT,
  scale: 1.3,
};

export const PLAYER_ACTION_TO_ICON_MAPPING: Record<
  PlayerInputBinding['type'],
  Partial<Record<PlayerActionType, React.ReactNode>>
> = {
  keyboard: {
    [PlayerActionType.ACTION_UP]: <Icon icon="arrowUp" {...DEFAULT_HINT_ICON_PROPS} />,
    [PlayerActionType.ACTION_DOWN]: <Icon icon="arrowDown" {...DEFAULT_HINT_ICON_PROPS} />,
    [PlayerActionType.ACTION_LEFT]: <Icon icon="arrowLeft" {...DEFAULT_HINT_ICON_PROPS} />,
    [PlayerActionType.ACTION_RIGHT]: <Icon icon="arrowRight" {...DEFAULT_HINT_ICON_PROPS} />,
  },
  gamepad: {
    [PlayerActionType.ACTION_UP]: 'Y',
    [PlayerActionType.ACTION_DOWN]: 'A',
    [PlayerActionType.ACTION_LEFT]: 'X',
    [PlayerActionType.ACTION_RIGHT]: 'B',
  },
};
