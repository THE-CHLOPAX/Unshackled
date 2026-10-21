import type { ReactNode } from 'react';
import type { PlayerInputBinding } from '@tgdf';

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';

import { PlayerActionType } from 'renderer/types';
import { ViewerContext, ViewerContextMockValue } from 'UI/contexts/ViewerContext';
import { HintBillboard, HintBillboardHint } from 'UI/components/HintBilboard/HintBillboard';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

vi.mock('UI/components/Icon/Icon', () => ({
  Icon: ({ icon }: { icon: string }) => <span data-testid="icon" data-icon={icon} />,
}));

function withViewer(ui: ReactNode, inputType: PlayerInputBinding['type']) {
  return (
    <ViewerContext.Provider value={{ ...ViewerContextMockValue, inputType }}>
      {ui}
    </ViewerContext.Provider>
  );
}

function renderWithViewer(ui: ReactNode, inputType: PlayerInputBinding['type'] = 'keyboard') {
  return render(withViewer(ui, inputType));
}

function getIconSlot(label: string, container: HTMLElement = document.body): HTMLElement {
  const labelElement = within(container).getByText(label);
  const iconSlot = labelElement.parentElement?.firstElementChild;
  if (!(iconSlot instanceof HTMLElement)) throw new Error(`No icon slot for hint "${label}"`);
  return iconSlot;
}

function getRenderedIconName(label: string, container?: HTMLElement): string | null {
  return (
    within(getIconSlot(label, container)).queryByTestId('icon')?.getAttribute('data-icon') ?? null
  );
}

describe('HintBillboard', () => {
  describe('title', () => {
    it('renders the title framed with dashes when provided', () => {
      renderWithViewer(<HintBillboard title="Dungeon door" hints={[]} />);

      expect(screen.getByText('- Dungeon door -')).toBeTruthy();
    });

    it('renders no title when it is not provided', () => {
      renderWithViewer(<HintBillboard hints={[{ icon: 'A', label: 'Open' }]} />);

      expect(screen.queryByText(/^- .* -$/)).toBeNull();
    });
  });

  describe('hints', () => {
    it('renders every hint label in the given order', () => {
      renderWithViewer(
        <HintBillboard
          hints={[
            { icon: 'A', label: 'Open' },
            { icon: 'X', label: 'Lock' },
            { icon: 'B', label: 'Kick' },
          ]}
        />
      );

      const labels = screen.getAllByText(/^(Open|Lock|Kick)$/).map((label) => label.textContent);
      expect(labels).toEqual(['Open', 'Lock', 'Kick']);
    });

    it('renders nothing but the wrapper when there are no hints and no title', () => {
      const { container } = renderWithViewer(<HintBillboard hints={[]} />);

      expect(container.textContent).toBe('');
    });
  });

  describe('action icons', () => {
    it.each([
      [PlayerActionType.ACTION_UP, 'arrowUp'],
      [PlayerActionType.ACTION_DOWN, 'arrowDown'],
      [PlayerActionType.ACTION_LEFT, 'arrowLeft'],
      [PlayerActionType.ACTION_RIGHT, 'arrowRight'],
    ])('shows the arrow icon for %s to a keyboard viewer', (actionType, iconName) => {
      renderWithViewer(<HintBillboard hints={[{ actionType, label: 'Use' }]} />, 'keyboard');

      expect(getRenderedIconName('Use')).toBe(iconName);
    });

    it.each([
      [PlayerActionType.ACTION_UP, 'Y'],
      [PlayerActionType.ACTION_DOWN, 'A'],
      [PlayerActionType.ACTION_LEFT, 'X'],
      [PlayerActionType.ACTION_RIGHT, 'B'],
    ])('shows the %s button letter to a gamepad viewer', (actionType, letter) => {
      renderWithViewer(<HintBillboard hints={[{ actionType, label: 'Use' }]} />, 'gamepad');

      expect(getIconSlot('Use').textContent).toBe(letter);
      expect(getRenderedIconName('Use')).toBeNull();
    });

    it('shows different icons for the same hints to viewers with different input types', () => {
      const hints: HintBillboardHint[] = [
        { actionType: PlayerActionType.ACTION_UP, label: 'Open' },
      ];

      render(
        <>
          <div data-testid="keyboard-viewer">
            {withViewer(<HintBillboard hints={hints} />, 'keyboard')}
          </div>
          <div data-testid="gamepad-viewer">
            {withViewer(<HintBillboard hints={hints} />, 'gamepad')}
          </div>
        </>
      );

      const keyboardViewer = screen.getByTestId('keyboard-viewer');
      const gamepadViewer = screen.getByTestId('gamepad-viewer');
      expect(getRenderedIconName('Open', keyboardViewer)).toBe('arrowUp');
      expect(getIconSlot('Open', gamepadViewer).textContent).toBe('Y');
    });

    it('updates the icon when the viewer input type changes', () => {
      const hints: HintBillboardHint[] = [
        { actionType: PlayerActionType.ACTION_UP, label: 'Open' },
      ];
      const { rerender } = renderWithViewer(<HintBillboard hints={hints} />, 'keyboard');

      rerender(withViewer(<HintBillboard hints={hints} />, 'gamepad'));

      expect(getIconSlot('Open').textContent).toBe('Y');
    });
  });

  describe('explicit icons', () => {
    it('renders an explicit text icon as is', () => {
      renderWithViewer(<HintBillboard hints={[{ icon: 'X', label: 'Lock' }]} />);

      expect(getIconSlot('Lock').textContent).toBe('X');
    });

    it('renders an explicit numeric icon as text', () => {
      renderWithViewer(<HintBillboard hints={[{ icon: 3, label: 'Charges' }]} />);

      expect(getIconSlot('Charges').textContent).toBe('3');
    });

    it('renders an explicit element icon as is', () => {
      renderWithViewer(
        <HintBillboard hints={[{ icon: <i data-testid="custom-icon" />, label: 'Inspect' }]} />
      );

      expect(within(getIconSlot('Inspect')).getByTestId('custom-icon')).toBeTruthy();
    });

    it('prefers the explicit icon over the action icon', () => {
      renderWithViewer(
        <HintBillboard
          hints={[{ icon: 'Z', actionType: PlayerActionType.ACTION_UP, label: 'Open' }]}
        />,
        'gamepad'
      );

      expect(getIconSlot('Open').textContent).toBe('Z');
    });

    it('falls back to a dash when the hint has neither an icon nor an action', () => {
      renderWithViewer(<HintBillboard hints={[{ label: 'Wait' }]} />);

      expect(getIconSlot('Wait').textContent).toBe('-');
    });

    it.each(['keyboard', 'gamepad'] as const)(
      'falls back to a dash for a %s viewer when the action has no mapped icon',
      (inputType) => {
        renderWithViewer(
          <HintBillboard hints={[{ actionType: PlayerActionType.ACTION_FOCUS, label: 'Focus' }]} />,
          inputType
        );

        expect(getIconSlot('Focus').textContent).toBe('-');
        expect(getRenderedIconName('Focus')).toBeNull();
      }
    );
  });

  describe('viewer context', () => {
    it('throws when rendered outside of a ViewerContext provider', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<HintBillboard hints={[]} />)).toThrow(/ViewerContext/);

      consoleErrorSpy.mockRestore();
    });
  });
});
