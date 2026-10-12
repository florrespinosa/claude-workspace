import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { colors } from "../theme";

// A screenshot that doesn't fill 16:9: sharp, undistorted card in the
// foreground over a blurred, darkened copy of itself. The slow zoom drifts
// toward `focus` (the highlighted element) so the eye lands where the
// narration is pointing.
export const ImageCardScene: React.FC<{
  src: string;
  localFrame: number;
  mountDur: number;
  widthPx: number;
  heightPx: number;
  focus?: { x: number; y: number }; // 0..1 inside the card
}> = ({ src, localFrame, mountDur, widthPx, heightPx, focus = { x: 0.5, y: 0.5 } }) => {
  const progress = Math.max(0, Math.min(1, localFrame / Math.max(1, mountDur)));
  const zoom = interpolate(progress, [0, 1], [1.0, 1.1]);
  const enter = interpolate(localFrame, [0, 14], [0.94, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const aspect = widthPx / heightPx;
  const maxW = 1920 * 0.86;
  const maxH = 740;
  let fitWidth = maxW;
  let fitHeight = maxW / aspect;
  if (fitHeight > maxH) {
    fitHeight = maxH;
    fitWidth = maxH * aspect;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: colors.navyDeep, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: "scale(1.35)", filter: "blur(38px) brightness(0.45) saturate(1.15)" }}>
        <Img src={staticFile(`assets/${src}`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 120 }}>
        <div
          style={{
            width: fitWidth,
            height: fitHeight,
            transform: `scale(${zoom * enter})`,
            transformOrigin: `${focus.x * 100}% ${focus.y * 100}%`,
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)",
            background: "#fff",
          }}
        >
          <Img src={staticFile(`assets/${src}`)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
