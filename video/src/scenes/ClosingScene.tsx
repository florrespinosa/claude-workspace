import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { colors } from "../theme";
import { headlineFont } from "../components/loadFonts";

const Chip: React.FC<{ label: string; delay: number; localFrame: number }> = ({
  label,
  delay,
  localFrame,
}) => {
  const p = interpolate(localFrame, [delay, delay + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [16, 0])}px)`,
        background: "rgba(255,255,255,0.08)",
        border: `1px solid ${colors.blue}66`,
        borderRadius: 999,
        padding: "10px 28px",
        color: colors.white,
        fontWeight: 700,
        fontSize: 24,
        letterSpacing: 1.5,
      }}
    >
      {label}
    </div>
  );
};

export const ClosingScene: React.FC<{ localFrame: number }> = ({
  localFrame,
}) => {
  const titleStart = 108; // ~3.6s in, matched to "...Anaplan Model Knowledge" line
  const titleP = interpolate(localFrame, [titleStart, titleStart + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const outro = interpolate(localFrame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#020817" }}>
      <Img
        src={staticFile("assets/CLOSING SLIDE.png")}
        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(2,8,23,0.15) 0%, rgba(2,8,23,0.55) 78%, rgba(2,8,23,0.85) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 260,
        }}
      >
        <div
          style={{
            opacity: outro,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 26,
          }}
        >
          <div style={{ display: "flex", gap: 16 }}>
            <Chip label="EXPLAIN" delay={0} localFrame={localFrame} />
            <Chip label="TEST" delay={10} localFrame={localFrame} />
            <Chip label="DOCUMENT" delay={20} localFrame={localFrame} />
          </div>
          <div
            style={{
              opacity: titleP,
              transform: `scale(${interpolate(titleP, [0, 1], [0.94, 1])})`,
              fontFamily: headlineFont,
              fontWeight: 800,
              fontSize: 56,
              color: colors.white,
              textAlign: "center",
              textShadow: "0 10px 40px rgba(0,0,0,0.5)",
            }}
          >
            One agent.{" "}
            <span style={{ color: colors.orange }}>Anaplan Model Knowledge.</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
