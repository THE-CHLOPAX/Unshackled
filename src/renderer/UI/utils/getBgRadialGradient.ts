import { hexStringToRgbaString } from './hexStringToRgbaString';

export function getRadialGradient(color: string): string {
  return `radial-gradient(
    ellipse closest-side,
    ${hexStringToRgbaString(color, 0.5)} 50%,
    ${hexStringToRgbaString(color, 0.2)} 80%,
    ${hexStringToRgbaString(color, 0)} 100%
  )`;
}
