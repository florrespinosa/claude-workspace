import "./index.css";
import { Composition } from "remotion";
import { MainVideo, calculateMetadata } from "./MainVideo";
import { WIDTH, HEIGHT, FPS } from "./data/scenes";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AnaplanUxTraining"
        component={MainVideo}
        durationInFrames={30 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
