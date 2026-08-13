import React, { useMemo } from "react";
import { AbsoluteFill, Audio, staticFile, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import type { SceneDef } from "../data/scenes";
import { intraSceneTransitionFrames } from "../data/transitions";
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

  // Soft crossfades between assets (via TransitionSeries) overlap adjacent
  // sequences, which shortens the total shown time. Pad the last asset by
  // that overlap so the inner timeline still fills the scene's full
  // allotted duration exactly.
  const assetFrames = scene.assets.map((a) => Math.round(a.durationSec * fps));
  const transitionFrames = scene.assets.slice(1).map((_, i) => intraSceneTransitionFrames(scene.assets[i], scene.assets[i + 1]));
  const totalOverlap = transitionFrames.reduce((s, f) => s + f, 0);
  if (assetFrames.length > 0) {
    assetFrames[assetFrames.length - 1] += totalOverlap;
  }

  return (
    <AbsoluteFill>
      <SceneBackground />
      {hasVoiceover && <Audio src={staticFile(`voiceover/${scene.id}.mp3`)} />}

      <TransitionSeries>
        {scene.assets.map((asset, index) => (
          <React.Fragment key={asset.file}>
            <TransitionSeries.Sequence durationInFrames={assetFrames[index]}>
              <FramedMedia asset={asset} assetIndex={index} />
            </TransitionSeries.Sequence>
            {index < scene.assets.length - 1 && (
              <TransitionSeries.Transition
                presentation={fade()}
                timing={linearTiming({ durationInFrames: transitionFrames[index] })}
              />
            )}
          </React.Fragment>
        ))}
      </TransitionSeries>

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
