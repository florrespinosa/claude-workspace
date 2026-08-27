import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../theme";

export const Callout: React.FC<{
  start: number;
  end: number;
  text: string;
  icon?: string;
  side?: "left" | "right";
}> = ({ start, end, text, icon = "✓", side = "right" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < start || t > end) return null;

  const local = (t - start) * fps;
  const dur = (end - start) * fps;
  const fadeIn = interpolate(local, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(local, [dur - 8, dur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(fadeIn, fadeOut);
  const slide = interpolate(fadeIn, [0, 1], [side === "right" ? 26 : -26, 0]);

  return (
    <div
      style={{
        position: "absolute",
        top: 150,
        [side]: 70,
        opacity,
        transform: `translateX(${slide}px)`,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: `linear-gradient(135deg, ${colors.orange}, #ff8a3d)`,
        borderRadius: 999,
        padding: "12px 24px 12px 18px",
        boxShadow: "0 14px 30px rgba(0,0,0,0.35)",
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 999,
          background: "rgba(255,255,255,0.28)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          color: colors.white,
          fontWeight: 800,
        }}
      >
        {icon}
      </div>
      <span
        style={{
          color: colors.white,
          fontWeight: 800,
          fontSize: 22,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </div>
  );
};
