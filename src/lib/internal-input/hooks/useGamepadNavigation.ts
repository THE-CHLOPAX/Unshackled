import { useEffect, useRef, useState } from 'react';
import { useGamepadStore, useGamepadIndicator, GAMEPAD_MAPPINGS } from '@tgdf';

export type NavigationItem = {
  id: string;
  onSelect: () => void;
  disabled?: boolean;
};

export type UseGamepadNavigationOptions = {
  items: NavigationItem[];
  enabled: boolean;
  onBackPress?: () => void;
  gamepadIndex?: number;
  loop?: boolean; // Whether to loop from last to first item
};

export function useGamepadNavigation({
  items,
  onBackPress,
  gamepadIndex = 0,
  enabled = true,
  loop = true,
}: UseGamepadNavigationOptions) {
  const { connectedGamepads } = useGamepadStore();
  const gamepad = connectedGamepads.get(gamepadIndex);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const previousIndicatorRef = useRef<number>(0);
  const itemsRef = useRef(items);

  // Update items ref on every render but don't trigger effects
  useEffect(() => {
    itemsRef.current = items;
  });

  // Get gamepad indicator (up/down movement)
  const { indicatorIndex } = useGamepadIndicator({ gamepadIndex });

  // Update selected index based on gamepad indicator
  useEffect(() => {
    if (!enabled || itemsRef.current.length === 0) {
      setSelectedIndex(null);
      return;
    }

    const validItems = itemsRef.current.filter((item) => !item.disabled);
    if (validItems.length === 0) return;

    // Detect direction change
    const direction = (indicatorIndex ?? 0) - previousIndicatorRef.current;
    previousIndicatorRef.current = indicatorIndex ?? 0;

    if (direction !== 0) {
      setSelectedIndex((prev) => {
        let newIndex = prev === null ? 0 : prev + direction;

        // Handle looping or clamping
        if (loop) {
          newIndex = ((newIndex % validItems.length) + validItems.length) % validItems.length;
        } else {
          newIndex = Math.max(0, Math.min(validItems.length - 1, newIndex));
        }

        // Skip disabled items
        while (validItems[newIndex]?.disabled && newIndex !== prev) {
          newIndex = newIndex + (direction > 0 ? 1 : -1);
          if (loop) {
            newIndex = ((newIndex % validItems.length) + validItems.length) % validItems.length;
          } else {
            newIndex = Math.max(0, Math.min(validItems.length - 1, newIndex));
          }
        }

        return newIndex;
      });
    }
  }, [indicatorIndex, enabled, loop]);

  // Handle A button press to select
  useEffect(() => {
    if (!enabled || !gamepad || itemsRef.current.length === 0 || selectedIndex === null) return;

    const validItems = itemsRef.current.filter((item) => !item.disabled);
    const selectedItem = validItems[selectedIndex];

    const cleanupAButton = gamepad.addButtonDownListener(GAMEPAD_MAPPINGS.A, () => {
      if (selectedItem && !selectedItem.disabled) {
        selectedItem.onSelect();
      }
    });

    return cleanupAButton;
  }, [enabled, gamepad, selectedIndex]);

  // Handle B button press separately (doesn't depend on selectedIndex)
  useEffect(() => {
    if (!enabled || !gamepad || !onBackPress) return;

    const cleanupBButton = gamepad.addButtonDownListener(GAMEPAD_MAPPINGS.B, () => {
      onBackPress();
    });

    return cleanupBButton;
  }, [enabled, gamepad, onBackPress]);

  return {
    selectedIndex,
    selectedId:
      selectedIndex === null ? null : items.filter((item) => !item.disabled)[selectedIndex]?.id,
    setSelectedIndex,
  };
}
