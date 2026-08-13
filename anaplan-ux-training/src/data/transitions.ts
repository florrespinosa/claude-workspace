import { FPS } from "./scenes";
import type { MediaAsset } from "./scenes";

/** Scene-to-scene (major section change): ~0.7s crossfade. */
export const SCENE_TRANSITION_FRAMES = Math.round(0.7 * FPS);

/** Screenshot-to-screenshot within a scene: ~0.55s soft crossfade. */
const IMAGE_TO_IMAGE_FRAMES = Math.round(0.55 * FPS);

/** Any transition touching a video clip: ~0.3s (videos carry their own motion/energy). */
const VIDEO_INVOLVED_FRAMES = Math.round(0.3 * FPS);

/** Crossfade duration between two adjacent assets within the same scene. */
export function intraSceneTransitionFrames(a: MediaAsset, b: MediaAsset): number {
  return a.type === "image" && b.type === "image" ? IMAGE_TO_IMAGE_FRAMES : VIDEO_INVOLVED_FRAMES;
}
