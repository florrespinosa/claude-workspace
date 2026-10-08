import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { colors } from "../theme";
import { headlineFont } from "../components/loadFonts";
import cuesRaw from "../data/closing_cues.json";

type Cue = { text: string; start: number };
const cues = cuesRaw as Cue[];

const FPS = 30;
const CELESTE = "#62D3FF";

const pop = (frame: number, startSec: number) =>
  interpolate(frame, [startSec * FPS, startSec * FPS + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const Chip: React.FC<{ label: string; frame: number; startSec: number }> = ({
  label,
  frame,
  startSec,
}) => {
  const p = pop(frame, startSec);
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [16, 0])}px)`,
        background: "rgba(255,255,255,0.08)",
        border: `1px solid ${CELESTE}88`,
        borderRadius: 999,
        padding: "10px 28px",
        color: colors.white,
        fontWeight: 700,
        fontSize: 26,
        letterSpacing: 0.5,
      }}
    >
      {label}
    </div>
  );
};

// `frame` is relative to the scene's real start (the narration's first
// closing word), so the reveals follow the measured speech timing
export const ClosingScene: React.FC<{ frame: number }> = ({ frame }) => {
  const chipCues = cues.filter((c) => !c.text.startsWith("This"));
  const finalCue = cues.find((c) => c.text.startsWith("This"));
  const finalStart = finalCue ? finalCue.start : 999;
  const finalP = pop(frame, finalStart);

  const bgIn = interpolate(frame, [-9, 8], [0, 1], {
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
            "linear-gradient(180deg, rgba(2,8,23,0.12) 0%, rgba(2,8,23,0.5) 72%, rgba(2,8,23,0.85) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 235,
        }}
      >
        <div
          style={{
            opacity: bgIn,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 26,
          }}
        >
          <div style={{ display: "flex", gap: 16 }}>
            {chipCues.map((c) => (
              <Chip key={c.text} label={c.text} frame={frame} startSec={c.start} />
            ))}
          </div>
          <div
            style={{
              opacity: finalP,
              transform: `scale(${interpolate(finalP, [0, 1], [0.94, 1])})`,
              fontFamily: headlineFont,
              fontWeight: 800,
              fontSize: 58,
              color: colors.white,
              textAlign: "center",
              textShadow: "0 10px 40px rgba(0,0,0,0.5)",
            }}
          >
            This is only the{" "}
            <span style={{ color: CELESTE }}>beginning.</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
