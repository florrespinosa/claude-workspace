import React from "react";
import { AbsoluteFill, Img, staticFile, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import type { MediaAsset } from "../data/scenes";
import { WIDTH, HEIGHT } from "../data/scenes";

// Crossfades between assets are handled by the wrapping <TransitionSeries>
// in Scene.tsx (see src/data/transitions.ts for the exact durations) — this
// component always renders at full opacity.

/** Corporate light-blue/cyan tint used to wash the blurred background layer. */
const TINT_OVERLAY = "linear-gradient(160deg, rgba(15,64,120,0.38), rgba(56,167,197,0.30))";

/** Fit `width x height` inside `boxW x boxH` preserving aspect ratio (contain, no crop). */
function fitContain(width: number, height: number, boxW: number, boxH: number) {
  const scale = Math.min(boxW / width, boxH / height);
  return { width: width * scale, height: height * scale };
}

export const FramedMedia: React.FC<{ asset: MediaAsset; assetIndex: number }> = ({ asset }) => {
  const { fps } = useVideoConfig();
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
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
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
    <AbsoluteFill>
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
