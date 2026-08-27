import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { captions } from "../data/captions";
import { colors } from "../theme";

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const active = captions.find((c) => t >= c.start && t < c.end);
  if (!active) return null;

  const durFrames = (active.end - active.start) * fps;
  const localFrame = (t - active.start) * fps;
  const fadeIn = interpolate(localFrame, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    localFrame,
    [durFrames - 6, durFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const opacity = Math.min(fadeIn, fadeOut);
  const rise = interpolate(fadeIn, [0, 1], [10, 0]);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 95,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${rise}px)`,
          maxWidth: "78%",
          background: "rgba(8,26,51,0.82)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderLeft: `5px solid ${colors.orange}`,
          borderRadius: 14,
          padding: "16px 34px",
          boxShadow: "0 12px 34px rgba(0,0,0,0.4)",
          backdropFilter: "blur(4px)",
        }}
      >
        <span
          style={{
            color: colors.white,
            fontWeight: 600,
            fontSize: 34,
            lineHeight: 1.28,
            textAlign: "center",
            display: "block",
            textShadow: "0 2px 8px rgba(0,0,0,0.35)",
          }}
        >
          {active.text}
        </span>
      </div>
    </div>
  );
};
