export function vec2toIndex(x: number, z: number, width: number): number {
  return z * width + x;
}
