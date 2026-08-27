import { Composition } from "remotion";
import "./index.css";
import { MainComposition } from "./MainComposition";
import { FPS, TOTAL_FRAMES } from "./data/segments";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AnaplanTrainingVideo"
        component={MainComposition}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
