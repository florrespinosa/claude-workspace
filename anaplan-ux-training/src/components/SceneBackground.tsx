import React from "react";
import { AbsoluteFill } from "remotion";

/** Soft corporate light-blue / cyan gradient used behind every scene. */
export const SceneBackground: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(120% 120% at 15% 10%, #eef6fb 0%, #dbeef7 32%, #bfe1ee 62%, #a9d3e3 100%)",
      }}
    />
  );
};
