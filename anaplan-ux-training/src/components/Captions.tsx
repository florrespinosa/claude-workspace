import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { createTikTokStyleCaptions } from "@remotion/captions";
import type { Caption } from "@remotion/captions";

// Shorter window keeps each caption page to a handful of words so it
// reliably fits on at most two lines.
const SWITCH_CAPTIONS_EVERY_MS = 1200;

export const Captions: React.FC<{ captions: Caption[] }> = ({ captions }) => {
  const { fps } = useVideoConfig();

  const { pages } = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions,
        combineTokensWithinMilliseconds: SWITCH_CAPTIONS_EVERY_MS,
      }),
    [captions],
  );

  return (
    <AbsoluteFill>
      {pages.map((page, index) => {
        const nextPage = pages[index + 1] ?? null;
        const startFrame = Math.round((page.startMs / 1000) * fps);
        const endFrame = Math.min(
          nextPage ? Math.round((nextPage.startMs / 1000) * fps) : Infinity,
          startFrame + Math.round((SWITCH_CAPTIONS_EVERY_MS / 1000) * fps),
        );
        const durationInFrames = endFrame - startFrame;

        if (durationInFrames <= 0) return null;

        return (
          <Sequence key={index} from={startFrame} durationInFrames={durationInFrames} layout="none">
            <CaptionBar text={page.text} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const CaptionBar: React.FC<{ text: string }> = ({ text }) => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 110,
      }}
    >
      <div
        style={{
          maxWidth: "70%",
          padding: "14px 30px",
          borderRadius: 14,
          backgroundColor: "rgba(9, 22, 41, 0.78)",
          backdropFilter: "blur(4px)",
          boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
            fontWeight: 600,
            fontSize: 36,
            lineHeight: 1.3,
            color: "#FFFFFF",
            textAlign: "center",
            letterSpacing: 0.2,
            whiteSpace: "pre-wrap",
            // Hard safety net: never render more than 2 lines.
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
          }}
        >
          {text}
        </p>
      </div>
    </AbsoluteFill>
  );
};
