import {
  InternalButton,
  useKeyPress,
  useGamepadButtonPress,
  KEYBOARD_MAPPINGS,
  GAMEPAD_MAPPINGS,
  useViewsStore,
} from '@tgdf';

import * as views from '../views';

export type BackToViewLayoutProps = {
  backToView: keyof typeof views;
  children: React.ReactNode;
};

export function BackToViewLayout({ backToView, children }: BackToViewLayoutProps) {
  const { setView } = useViewsStore();

  // Listen for Escape key to go back
  useKeyPress(KEYBOARD_MAPPINGS.Escape, () => {
    setView(backToView);
  });

  // Listen for Start button to go back
  useGamepadButtonPress(GAMEPAD_MAPPINGS.START, () => {
    setView(backToView);
  });

  return (
    <>
      <InternalButton
        label="Back"
        onClick={() => setView(backToView)}
        style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1 }}
      />
      {children}
    </>
  );
}
