import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import type { MediaAsset } from "../data/scenes";
import { WIDTH, HEIGHT } from "../data/scenes";

/** Crossfade in/out per asset — short cut, no zoom/pan (~0.27s at 30fps). */
const FADE_FRAMES = 8;

/** Corporate light-blue/cyan tint used to wash the blurred background layer. */
const TINT_OVERLAY = "linear-gradient(160deg, rgba(15,64,120,0.38), rgba(56,167,197,0.30))";

function fadeOpacity(frame: number, durationInFrames: number) {
  return interpolate(
    frame,
    [0, FADE_FRAMES, Math.max(durationInFrames - FADE_FRAMES, FADE_FRAMES + 1), durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
}

/** Fit `width x height` inside `boxW x boxH` preserving aspect ratio (contain, no crop). */
function fitContain(width: number, height: number, boxW: number, boxH: number) {
  const scale = Math.min(boxW / width, boxH / height);
  return { width: width * scale, height: height * scale };
}

export const FramedMedia: React.FC<{ asset: MediaAsset; assetIndex: number }> = ({ asset }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durationInFrames = Math.round(asset.durationSec * fps);
  const opacity = fadeOpacity(frame, durationInFrames);

  const src = staticFile(`media/${asset.file}`);
  const isVideo = asset.type === "video";
  const trimBefore = Math.round((asset.trimBeforeSec ?? 0) * fps);
  const trimAfter = Math.round((asset.trimAfterSec ?? asset.durationSec) * fps);

  if (!asset.blurBg) {
    // Fits well: displayed as large as possible with the FULL aspect ratio
    // preserved (contain, never cropped/stretched) directly on the
    // scene's corporate background.
    const fitted = fitContain(asset.width, asset.height, WIDTH, HEIGHT);
    return (
      <AbsoluteFill style={{ opacity, justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: fitted.width, height: fitted.height }}>
          {isVideo ? (
            <Video
              src={src}
              trimBefore={trimBefore}
              trimAfter={trimAfter}
              muted
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <Img src={src} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          )}
        </div>
      </AbsoluteFill>
    );
  }

  // Small/narrow crop: sharp, fully untouched foreground (contain-fit) over
  // a blurred, tinted, scaled-up duplicate of the SAME asset as background.
  const fitted = fitContain(asset.width, asset.height, WIDTH * 0.86, HEIGHT * 0.82);

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* Blurred background duplicate — background layer only, never the foreground */}
      <AbsoluteFill style={{ transform: "scale(1.35)", filter: "blur(70px) saturate(1.15)" }}>
        {isVideo ? (
          <Video
            src={src}
            trimBefore={trimBefore}
            trimAfter={trimAfter}
            muted
            style={{ width: WIDTH, height: HEIGHT, objectFit: "cover" }}
          />
        ) : (
          <Img src={src} style={{ width: WIDTH, height: HEIGHT, objectFit: "cover" }} />
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: TINT_OVERLAY }} />

      {/* Sharp foreground, centered, fully preserved aspect ratio, never blurred */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            width: fitted.width,
            height: fitted.height,
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 24px 60px rgba(4,16,36,0.45)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          {isVideo ? (
            <Video
              src={src}
              trimBefore={trimBefore}
              trimAfter={trimAfter}
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
