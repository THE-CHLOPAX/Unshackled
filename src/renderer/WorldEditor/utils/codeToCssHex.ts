export const codeToCssHex = (code: number): string =>
  `#${(code & 0xffffff).toString(16).padStart(6, '0')}`;
