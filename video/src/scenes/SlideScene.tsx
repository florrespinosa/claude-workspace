import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";

export const SlideScene: React.FC<{
  src: string;
  localFrame: number;
  mountDur: number;
  direction?: 1 | -1;
}> = ({ src, localFrame, mountDur, direction = 1 }) => {
  const progress = Math.max(0, Math.min(1, localFrame / Math.max(1, mountDur)));
  const scale = interpolate(progress, [0, 1], [1.0, 1.07]);
  const panX = interpolate(progress, [0, 1], [0, direction * -18]);
  const panY = interpolate(progress, [0, 1], [0, direction * 10]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B2545", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale}) translate(${panX}px, ${panY}px)`,
          transformOrigin: "center center",
        }}
      >
        <Img
          src={staticFile(`assets/${src}`)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
