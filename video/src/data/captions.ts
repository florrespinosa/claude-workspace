import raw from "./captions.json";

export type CaptionChunk = {
  text: string;
  start: number;
  end: number;
  segment: string;
};

export const captions: CaptionChunk[] = raw as CaptionChunk[];
