import React, { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import type { SceneDef } from "../data/scenes";
import { SceneBackground } from "./SceneBackground";
import { FramedMedia } from "./FramedMedia";
import { Captions } from "./Captions";
import { estimateCaptions } from "../captions/estimate";

export const Scene: React.FC<{
  scene: SceneDef;
  durationSec: number;
  /** scene-1 and scene-10b are already branded intro/outro cards from the
   * source deck — don't add a redundant topic badge on top of them. */
  bookend?: boolean;
  hasVoiceover?: boolean;
}> = ({ scene, durationSec, bookend, hasVoiceover }) => {
  const { fps } = useVideoConfig();

  const captions = useMemo(() => estimateCaptions(scene.narration, durationSec), [scene.narration, durationSec]);

  let cursorFrame = 0;

  return (
    <AbsoluteFill>
      <SceneBackground />
      {hasVoiceover && <Audio src={staticFile(`voiceover/${scene.id}.mp3`)} />}

      {scene.assets.map((asset, index) => {
        const assetDurationFrames = Math.round(asset.durationSec * fps);
        const from = cursorFrame;
        cursorFrame += assetDurationFrames;
        return (
          <Sequence key={asset.file} from={from} durationInFrames={assetDurationFrames} layout="none">
            <FramedMedia asset={asset} assetIndex={index} />
          </Sequence>
        );
      })}

      {!bookend && <TopicBadge title={scene.title} />}
      <Captions captions={captions} />
    </AbsoluteFill>
  );
};

const TopicBadge: React.FC<{ title: string }> = ({ title }) => {
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "flex-start" }}>
      {/* Scrim so the badge stays legible over busy screenshot content */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, rgba(4,14,28,0.38) 0%, rgba(4,14,28,0) 22%)",
          height: 220,
        }}
      />
      <div
        style={{
          margin: "56px 0 0 64px",
          padding: "10px 24px",
          borderRadius: 999,
          backgroundColor: "rgba(10, 34, 64, 0.78)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 8px 20px rgba(4,16,36,0.25)",
        }}
      >
        <span
          style={{
            fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
            fontWeight: 600,
            fontSize: 26,
            letterSpacing: 0.4,
            color: "#EAF6FC",
          }}
        >
          {title}
        </span>
      </div>
    </AbsoluteFill>
  );
};
