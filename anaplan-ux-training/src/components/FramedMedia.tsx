import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Video } from "@remotion/media";
import type { MediaAsset } from "../data/scenes";
import { WIDTH, HEIGHT } from "../data/scenes";

const FADE_FRAMES = 6;

/** Corporate light-blue/cyan tint used to wash the blurred background layer. */
const TINT_OVERLAY = "linear-gradient(160deg, rgba(15,64,120,0.38), rgba(56,167,197,0.30))";

function kenBurnsTransform(frame: number, durationInFrames: number, panDirection: "x" | "y", intensity = 1) {
  const progress = interpolate(frame, [0, Math.max(durationInFrames, 1)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });
  const scale = 1 + 0.06 * intensity * progress;
  const panPct = 1.4 * intensity * progress;
  const translateX = panDirection === "x" ? -panPct : 0;
  const translateY = panDirection === "y" ? -panPct : 0;
  return `scale(${scale}) translate(${translateX}%, ${translateY}%)`;
}

function fadeOpacity(frame: number, durationInFrames: number) {
  return interpolate(
    frame,
    [0, FADE_FRAMES, Math.max(durationInFrames - FADE_FRAMES, FADE_FRAMES + 1), durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
}

/** Fit `width x height` inside `boxW x boxH` preserving aspect ratio (contain). */
function fitContain(width: number, height: number, boxW: number, boxH: number) {
  const scale = Math.min(boxW / width, boxH / height);
  return { width: width * scale, height: height * scale };
}

export const FramedMedia: React.FC<{ asset: MediaAsset; assetIndex: number }> = ({ asset, assetIndex }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durationInFrames = Math.round(asset.durationSec * fps);
  const panDirection = assetIndex % 2 === 0 ? "x" : "y";
  const opacity = fadeOpacity(frame, durationInFrames);

  const src = staticFile(`media/${asset.file}`);
  const isVideo = asset.type === "video";

  if (!asset.blurBg) {
    // Fits well: full-bleed cover fit directly on the scene's corporate background.
    return (
      <AbsoluteFill style={{ opacity }}>
        <AbsoluteFill
          style={{
            transform: kenBurnsTransform(frame, durationInFrames, panDirection, 0.7),
            transformOrigin: "center center",
          }}
        >
          {isVideo ? (
            <Video
              src={src}
              trimBefore={Math.round((asset.trimBeforeSec ?? 0) * fps)}
              trimAfter={Math.round((asset.trimAfterSec ?? asset.durationSec) * fps)}
              muted
              style={{ width: WIDTH, height: HEIGHT, objectFit: "cover" }}
            />
          ) : (
            <Img src={src} style={{ width: WIDTH, height: HEIGHT, objectFit: "cover" }} />
          )}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  // Small/narrow crop: sharp foreground (contain-fit) over a blurred,
  // tinted, scaled-up duplicate of the same asset as background.
  const fitted = fitContain(asset.width, asset.height, WIDTH * 0.86, HEIGHT * 0.82);

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* Blurred background duplicate */}
      <AbsoluteFill
        style={{
          transform: `scale(1.35) ${kenBurnsTransform(frame, durationInFrames, panDirection, 1)}`,
          transformOrigin: "center center",
          filter: "blur(70px) saturate(1.15)",
        }}
      >
        {isVideo ? (
          <Video
            src={src}
            trimBefore={Math.round((asset.trimBeforeSec ?? 0) * fps)}
            trimAfter={Math.round((asset.trimAfterSec ?? asset.durationSec) * fps)}
            muted
            style={{ width: WIDTH, height: HEIGHT, objectFit: "cover" }}
          />
        ) : (
          <Img src={src} style={{ width: WIDTH, height: HEIGHT, objectFit: "cover" }} />
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: TINT_OVERLAY }} />

      {/* Sharp foreground, centered, fully preserved aspect ratio */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            width: fitted.width,
            height: fitted.height,
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 24px 60px rgba(4,16,36,0.45)",
            border: "1px solid rgba(255,255,255,0.18)",
            transform: kenBurnsTransform(frame, durationInFrames, panDirection, 0.5),
            transformOrigin: "center center",
          }}
        >
          {isVideo ? (
            <Video
              src={src}
              trimBefore={Math.round((asset.trimBeforeSec ?? 0) * fps)}
              trimAfter={Math.round((asset.trimAfterSec ?? asset.durationSec) * fps)}
              muted
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <Img src={src} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
