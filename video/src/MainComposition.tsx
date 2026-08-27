import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { segments, toFrame, TOTAL_FRAMES } from "./data/segments";
import { SlideScene } from "./scenes/SlideScene";
import { VideoScene } from "./scenes/VideoScene";
import { ClosingScene } from "./scenes/ClosingScene";
import { Captions } from "./components/Captions";
import { Callout } from "./components/Callout";
import { crossfadeOpacity, OVERLAP } from "./components/crossfade";
import { bodyFont } from "./components/loadFonts";

const videoDims: Record<string, { w: number; h: number }> = {
  "MK - 1.mp4": { w: 1346, h: 574 },
  "VIDEO 1 KT.mp4": { w: 1350, h: 634 },
  "VIDEO 1 TEST SCRIPTS.mp4": { w: 1346, h: 634 },
  "VIDEO 2 KT.mp4": { w: 1906, h: 856 },
  "VIDEO 2 TEST SCRIPTS.mp4": { w: 1360, h: 616 },
  "VIDEO QUERY.mp4": { w: 1352, h: 634 },
};

const videoLabels: Record<string, string> = {
  mk1: "GETTING STARTED",
  video1_test: "DEMO · TEST SCRIPT GENERATION",
  video2_test: "DEMO · TEST SCRIPT GENERATION",
  video_query: "DEMO · BACKEND STRUCTURE QUERY",
  video1_kt: "DEMO · KNOWLEDGE TRANSFER DOC",
  video2_kt: "DEMO · KNOWLEDGE TRANSFER DOC",
};

const MusicBed: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, fps * 2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - fps * 2.5, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  // narration is present through virtually the whole runtime, so the bed
  // stays low and constant underneath it (voice always louder than music)
  const baseVolume = 0.22;
  return (
    <Audio
      src={staticFile("music.wav")}
      volume={Math.min(fadeIn, fadeOut) * baseVolume}
    />
  );
};

export const MainComposition: React.FC = () => {
  const { durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000", fontFamily: bodyFont }}>
      <Audio src={staticFile("audio.wav")} volume={1} />
      <MusicBed />

      {segments.map((seg, i) => {
        const from = toFrame(seg.start);
        const dur = toFrame(seg.end) - from;
        const isVideo = seg.visual.endsWith(".mp4");
        const prevIsVideo = i > 0 && segments[i - 1].visual.endsWith(".mp4");
        const nextIsVideo =
          i < segments.length - 1 && segments[i + 1].visual.endsWith(".mp4");

        // crossfade between a slide and its neighbor reads as an intentional
        // dissolve; crossfading between two unrelated screen recordings just
        // ghosts two different UIs on top of each other, so cut hard there
        const leftOverlap = isVideo && prevIsVideo ? 0 : OVERLAP;
        const rightOverlap = isVideo && nextIsVideo ? 0 : OVERLAP;

        const mountFrom = Math.max(0, from - leftOverlap);
        const mountEnd = Math.min(TOTAL_FRAMES, from + dur + rightOverlap);
        const mountDur = mountEnd - mountFrom;

        return (
          <Sequence key={seg.id} from={mountFrom} durationInFrames={mountDur}>
            <SceneLayer
              seg={seg}
              mountDur={mountDur}
              index={i}
              leftOverlap={leftOverlap}
              rightOverlap={rightOverlap}
            />
          </Sequence>
        );
      })}

      <Captions />

      {/* key-moment callouts, timed to the exact caption windows they reinforce */}
      <Callout start={110.21} end={113.5} text="6 mandatory files" icon="6" />
      <Callout start={144.7} end={147.4} text="Downloadable Excel" icon="⇩" />
      <Callout start={190.1} end={193.3} text="Word document" icon="W" />

      {/* global intro / outro */}
      <IntroOutroFade durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};

const SceneLayer: React.FC<{
  seg: (typeof segments)[number];
  mountDur: number;
  index: number;
  leftOverlap: number;
  rightOverlap: number;
}> = ({ seg, mountDur, index, leftOverlap, rightOverlap }) => {
  const frame = useCurrentFrame();
  const opacity = crossfadeOpacity(frame, mountDur, leftOverlap, rightOverlap);

  const isVideo = seg.visual.endsWith(".mp4");
  const isClosing = seg.id === "closing";

  return (
    <AbsoluteFill style={{ opacity }}>
      {isClosing ? (
        <ClosingScene localFrame={frame} />
      ) : isVideo ? (
        <VideoScene
          src={seg.visual}
          localFrame={frame}
          mountDur={mountDur}
          playbackRate={seg.playbackRate ?? 1}
          widthPx={videoDims[seg.visual]?.w ?? 1600}
          heightPx={videoDims[seg.visual]?.h ?? 900}
          label={videoLabels[seg.id]}
        />
      ) : (
        <SlideScene
          src={seg.visual}
          localFrame={frame}
          mountDur={mountDur}
          direction={index % 2 === 0 ? 1 : -1}
        />
      )}
    </AbsoluteFill>
  );
};

const IntroOutroFade: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const introOpacity = interpolate(frame, [0, 18], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outroOpacity = interpolate(
    frame,
    [durationInFrames - 40, durationInFrames - 1],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <>
      <AbsoluteFill
        style={{ backgroundColor: "#000", opacity: introOpacity, pointerEvents: "none" }}
      />
      <AbsoluteFill
        style={{ backgroundColor: "#000", opacity: outroOpacity, pointerEvents: "none" }}
      />
    </>
  );
};
