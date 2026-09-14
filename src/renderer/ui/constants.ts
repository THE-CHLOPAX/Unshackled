import scrollArrow from '../assets/svg/scroll-arrow.svg?url';
import scrollThumb from '../assets/svg/scroll-thumb.svg?url';
import barSimpleFrame from '../assets/svg/bar-simple.svg?url';
import barOrnamentFrame from '../assets/svg/bar-ornament.svg?url';
import buttonActiveBg from '../assets/svg/button-active-bg.svg?url';
import buttonInactiveBg from '../assets/svg/button-inactive-bg.svg?url';
import dropdownActiveBg from '../assets/svg/dropdown-active-bg.svg?url';
import scalablePanelTop from '../assets/svg/scalable-panel-top.svg?url';
import scalablePanelLeft from '../assets/svg/scalable-panel-left.svg?url';
import dropdownInactiveBg from '../assets/svg/dropdown-inactive-bg.svg?url';
import scalablePanelRight from '../assets/svg/scalable-panel-right.svg?url';
import scalablePanelBottom from '../assets/svg/scalable-panel-bottom.svg?url';
import scalablePanelTopLeft from '../assets/svg/scalable-panel-top-left.svg?url';
import scalablePanelTopRight from '../assets/svg/scalable-panel-top-right.svg?url';
import scalablePanelBottomLeft from '../assets/svg/scalable-panel-bottom-left.svg?url';
import scalablePanelBottomRight from '../assets/svg/scalable-panel-bottom-right.svg?url';

// These are referenced only via CSS `background-image: url(...)` in styled-components
// (Button, Dropdown, BarOrnament, BarSimple, PanelScalable, Scrollbar), so the browser
// doesn't fetch them until the owning component first paints, which shows up as a pop-in
// on first mount. preloadUiAssets() warms the cache ahead of time to remove that gap.
export const UI_BACKGROUND_IMAGE_URLS = {
  barOrnamentFrame,
  barSimpleFrame,
  buttonActiveBg,
  buttonInactiveBg,
  dropdownActiveBg,
  dropdownInactiveBg,
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
} as const;
