import { interpolate } from "remotion";

export const OVERLAP = 9; // frames of crossfade blend on each side of a cut

export const crossfadeOpacity = (
  localFrame: number,
  mountDur: number,
  leftOverlap: number = OVERLAP,
  rightOverlap: number = OVERLAP,
) => {
  const left = Math.max(leftOverlap, 1);
  const right = Math.max(rightOverlap, 1);
  return interpolate(
    localFrame,
    [0, left, mountDur - right, mountDur],
    [leftOverlap === 0 ? 1 : 0, 1, 1, rightOverlap === 0 ? 1 : 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
};
