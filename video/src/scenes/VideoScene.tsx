import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  staticFile,
} from "remotion";
import { colors } from "../theme";

export const VideoScene: React.FC<{
  src: string;
  localFrame: number;
  mountDur: number;
  playbackRate: number;
  widthPx: number;
  heightPx: number;
  label?: string;
}> = ({ src, localFrame, mountDur, playbackRate, widthPx, heightPx, label }) => {
  const progress = Math.max(0, Math.min(1, localFrame / Math.max(1, mountDur)));

  // gentle continuous zoom on the sharp foreground video ("smooth zoom to focus")
  const zoom = interpolate(progress, [0, 1], [1.0, 1.045]);

  // quick punch-in reveal when the scene mounts
  const enter = interpolate(localFrame, [0, 14], [0.94, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const aspect = widthPx / heightPx;
  const outputAspect = 1920 / 1080;

  // fit the sharp screenshot as large as possible, preserving its aspect ratio
  let fitWidth: number;
  let fitHeight: number;
  const maxW = 1920 * 0.86;
  const maxH = 1080 * 0.72;
  if (maxW / aspect <= maxH) {
    fitWidth = maxW;
    fitHeight = maxW / aspect;
  } else {
    fitHeight = maxH;
    fitWidth = maxH * aspect;
  }

  const labelOpacity = interpolate(localFrame, [4, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.navyDeep, overflow: "hidden" }}>
      {/* blurred, darkened, enlarged copy fills the whole frame as ambient backdrop */}
      <AbsoluteFill
        style={{
          transform: "scale(1.35)",
          filter: "blur(38px) brightness(0.45) saturate(1.15)",
        }}
      >
        <OffthreadVideo
          src={staticFile(`assets/${src}`)}
          playbackRate={playbackRate}
          muted
          style={{ width: "100%", height: "100%", objectFit: outputAspect < aspect ? "cover" : "cover" }}
        />
      </AbsoluteFill>

      {/* subtle vignette for polish */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* sharp, fully-visible foreground screenshot, centered, never cropped or distorted */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: fitWidth,
            height: fitHeight,
            transform: `scale(${zoom * enter})`,
            borderRadius: 14,
            overflow: "hidden",
            boxShadow:
              "0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)",
            background: "#fff",
          }}
        >
          <OffthreadVideo
            src={staticFile(`assets/${src}`)}
            playbackRate={playbackRate}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
      </AbsoluteFill>

      {label ? (
        <div
          style={{
            position: "absolute",
            top: 56,
            left: 64,
            opacity: labelOpacity,
            transform: `translateY(${interpolate(labelOpacity, [0, 1], [10, 0])}px)`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(11,37,69,0.72)",
            border: `1px solid ${colors.blue}55`,
            borderRadius: 999,
            padding: "10px 22px",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: 999,
              background: colors.orange,
              boxShadow: `0 0 10px ${colors.orange}`,
            }}
          />
          <span
            style={{
              color: colors.white,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: 0.3,
            }}
          >
            {label}
          </span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
