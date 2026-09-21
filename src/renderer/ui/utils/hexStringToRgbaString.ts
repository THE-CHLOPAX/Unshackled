import { assert } from '@tgdf';

const HEX_COLOR_PATTERN = /^#?([a-f\d]{3}|[a-f\d]{6})$/i;

export function hexStringToRgbaString(hex: string, alpha: number): string {
  const match = HEX_COLOR_PATTERN.exec(hex);
  assert(match, `Invalid hex color: "${hex}"`);

  const digits = match[1];
  const fullDigits = digits.length === 3 ? digits.replace(/(.)/g, '$1$1') : digits;

  const r = parseInt(fullDigits.slice(0, 2), 16);
  const g = parseInt(fullDigits.slice(2, 4), 16);
  const b = parseInt(fullDigits.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
