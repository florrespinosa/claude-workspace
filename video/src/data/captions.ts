import raw from "./captions.json";

export type CaptionWord = {
  text: string;
  start: number;
  end: number;
};

export type CaptionChunk = {
  text: string;
  start: number;
  end: number;
  segment: string;
  words: CaptionWord[];
};

export const captions: CaptionChunk[] = raw as CaptionChunk[];
