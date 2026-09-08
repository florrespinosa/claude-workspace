import raw from "./segments.json";

export type Segment = {
  id: string;
  visual: string;
  text: string;
  start: number;
  end: number;
  duration: number;
  origDuration?: number;
  playbackRate?: number;
};

export const segments: Segment[] = raw as Segment[];

export const FPS = 30;

export const toFrame = (seconds: number) => Math.round(seconds * FPS);

// the tail after narration ends (for a clean hold + fade on the closing
// slide) is already baked into the last segment's `end` by
// build_segments_from_asr.py -- don't add it again here
export const TOTAL_SECONDS = segments[segments.length - 1].end;

export const TOTAL_FRAMES = toFrame(TOTAL_SECONDS);
