import React from "react";
import { CalculateMetadataFunction } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { scenes, FPS, WIDTH, HEIGHT } from "./data/scenes";
import durationsJson from "./data/durations.json";
import { Scene } from "./components/Scene";

// Short clean crossfade only (~0.27s at 30fps) — no zoom/wipe/slide transitions.
const TRANSITION_FRAMES = 8;

type Durations = Record<string, { durationSec: number; source: string }>;
const durations = durationsJson as Durations;

export type MainVideoProps = Record<string, unknown>;

function getSceneDurationSec(id: string, fallbackDurationSec: number): number {
  return durations[id]?.durationSec ?? fallbackDurationSec;
}

export const calculateMetadata: CalculateMetadataFunction<MainVideoProps> = async () => {
  const sceneDurationsFrames = scenes.map((scene) =>
    Math.round(getSceneDurationSec(scene.id, scene.fallbackDurationSec) * FPS),
  );
  const totalTransitions = (scenes.length - 1) * TRANSITION_FRAMES;
  const durationInFrames = sceneDurationsFrames.reduce((sum, d) => sum + d, 0) - totalTransitions;

  return {
    durationInFrames: Math.max(durationInFrames, FPS),
    fps: FPS,
    width: WIDTH,
    height: HEIGHT,
  };
};

export const MainVideo: React.FC<MainVideoProps> = () => {
  return (
    <TransitionSeries>
      {scenes.map((scene, index) => {
        const durationSec = getSceneDurationSec(scene.id, scene.fallbackDurationSec);
        const durationInFrames = Math.round(durationSec * FPS);
        const bookend = scene.id === "scene-1" || scene.id === "scene-10b";
        const hasVoiceover = durations[scene.id]?.source === "elevenlabs-audio";

        return (
          <React.Fragment key={scene.id}>
            <TransitionSeries.Sequence durationInFrames={durationInFrames} name={scene.id}>
              <Scene scene={scene} durationSec={durationSec} bookend={bookend} hasVoiceover={hasVoiceover} />
            </TransitionSeries.Sequence>
            {index < scenes.length - 1 && (
              <TransitionSeries.Transition
                presentation={fade()}
                timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
              />
            )}
          </React.Fragment>
        );
      })}
    </TransitionSeries>
  );
};
