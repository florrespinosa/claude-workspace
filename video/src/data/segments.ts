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

// small tail after narration ends, for a clean hold + fade on the closing slide
export const TAIL_SECONDS = 3.2;

export const TOTAL_SECONDS =
  segments[segments.length - 1].end + TAIL_SECONDS;

export const TOTAL_FRAMES = toFrame(TOTAL_SECONDS);
