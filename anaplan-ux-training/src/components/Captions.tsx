import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { createTikTokStyleCaptions } from "@remotion/captions";
import type { Caption } from "@remotion/captions";

const SWITCH_CAPTIONS_EVERY_MS = 1600;

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
        paddingBottom: 96,
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          padding: "16px 32px",
          borderRadius: 14,
          backgroundColor: "rgba(9, 22, 41, 0.72)",
          backdropFilter: "blur(4px)",
          boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
            fontWeight: 600,
            fontSize: 40,
            lineHeight: 1.3,
            color: "#FFFFFF",
            textAlign: "center",
            letterSpacing: 0.2,
            whiteSpace: "pre-wrap",
          }}
        >
          {text}
        </p>
      </div>
    </AbsoluteFill>
  );
};
