export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export type MediaAsset = {
  /** File name inside public/media */
  file: string;
  type: "image" | "video";
  /** Natural pixel dimensions of the source asset */
  width: number;
  height: number;
  /**
   * Small/narrow crops that cannot naturally fill 1920x1080 without
   * distortion or heavy cropping get a blurred, tinted duplicate of
   * themselves as a full-screen background (per spec).
   */
  blurBg: boolean;
  /** How long this asset is shown on screen, in seconds. */
  durationSec: number;
  /** For videos: seconds to trim from the start. */
  trimBeforeSec?: number;
  /** For videos: seconds to trim from the end (absolute end point, not amount removed). */
  trimAfterSec?: number;
};

export type SceneDef = {
  id: string;
  title: string;
  narration: string;
  /**
   * Fallback duration in seconds, used until real ElevenLabs voiceover
   * audio is available in public/voiceover/<id>.mp3. Once that file
   * exists, `scripts/sync-durations.mjs` measures its real duration and
   * this value is overridden in src/data/durations.json.
   */
  fallbackDurationSec: number;
  assets: MediaAsset[];
};

export const scenes: SceneDef[] = [
  {
    id: "scene-1",
    title: "Intro",
    narration:
      "Welcome to the Anaplan User Experience training. You'll learn how to navigate dashboards, grids, and the key features you'll use every day.",
    fallbackDurationSec: 10,
    assets: [
      {
        file: "scene-1.png",
        type: "image",
        width: 1197,
        height: 679,
        blurBg: false,
        durationSec: 10,
      },
    ],
  },
  {
    id: "scene-2",
    title: "Home Screen",
    narration:
      "When you log in, you land on the Home screen: there you'll see the Models, Pages, and Apps you have access to. Use the arrows to expand each section.",
    fallbackDurationSec: 12,
    assets: [
      { file: "scene-2-1.png", type: "image", width: 1873, height: 876, blurBg: false, durationSec: 1.6 },
      { file: "scene-2-2.png", type: "image", width: 1900, height: 879, blurBg: false, durationSec: 1.6 },
      {
        file: "scene-2-3.mp4",
        type: "video",
        width: 1920,
        height: 1080,
        blurBg: false,
        durationSec: 2.8,
        trimBeforeSec: 0,
        trimAfterSec: 2.8,
      },
      {
        file: "scene-2-4.mp4",
        type: "video",
        width: 1920,
        height: 1080,
        blurBg: false,
        durationSec: 2.8,
        trimBeforeSec: 0,
        trimAfterSec: 2.8,
      },
      {
        file: "scene-2-5.mp4",
        type: "video",
        width: 1920,
        height: 1080,
        blurBg: false,
        durationSec: 2.0,
        trimBeforeSec: 0,
        trimAfterSec: 2.0,
      },
      { file: "scene-2-6.png", type: "image", width: 1890, height: 879, blurBg: false, durationSec: 1.2 },
    ],
  },
  {
    id: "scene-4",
    title: "Grid Toolbar — In Depth",
    narration:
      "When you hover over a grid, a more complete toolbar appears. Zero suppression hides rows or columns that are blank or zero, for a cleaner view. Find lets you quickly locate a line without scrolling through everything. Filter narrows down the data based on a condition, for example showing only one cost center. Show and Hide let you choose which columns or rows to display, and the info icon gives you context about that grid. Maximize expands the grid to fill the whole page, and from the three-dot menu you can Export in the format you need.",
    fallbackDurationSec: 38,
    assets: [
      { file: "scene-4-2.png", type: "image", width: 793, height: 286, blurBg: true, durationSec: 6.33 },
      { file: "scene-4-3.png", type: "image", width: 379, height: 225, blurBg: true, durationSec: 6.33 },
      { file: "scene-4-4.png", type: "image", width: 724, height: 197, blurBg: true, durationSec: 6.33 },
      { file: "scene-4-5.png", type: "image", width: 1174, height: 446, blurBg: true, durationSec: 6.33 },
      { file: "scene-4-6.png", type: "image", width: 922, height: 382, blurBg: true, durationSec: 6.34 },
      { file: "scene-4-7.png", type: "image", width: 937, height: 286, blurBg: true, durationSec: 6.34 },
    ],
  },
  {
    id: "scene-5",
    title: "Editable Cells and Data Entry — In Depth",
    narration:
      "We use colors to highlight cells — for example, mandatory fields, optional fields, and variances in values. Check the page's legend to see what each color means; it's there to make input and visualization easier. You can pivot the grid and sort by row or column. To copy values quickly, right click and use Copy Across or Copy Down, and remember the shortcuts: Ctrl+C and Ctrl+V to copy and paste, and Ctrl+Z to undo.",
    fallbackDurationSec: 34,
    assets: [
      { file: "scene-5-1.png", type: "image", width: 549, height: 607, blurBg: true, durationSec: 8 },
      {
        file: "scene-5-2.mp4",
        type: "video",
        width: 946,
        height: 806,
        blurBg: true,
        durationSec: 7.5,
        trimBeforeSec: 0,
        trimAfterSec: 7.5,
      },
      { file: "scene-5-2-1.png", type: "image", width: 604, height: 346, blurBg: true, durationSec: 9.5 },
      { file: "scene-5-2-2.png", type: "image", width: 594, height: 365, blurBg: true, durationSec: 9 },
    ],
  },
  {
    id: "scene-6",
    title: "Quick Tip: Refresh",
    narration:
      "When a workflow action is run, changes can take a few seconds to show up. If that happens, just refresh the page using the Refresh icon, and the data should appear updated.",
    fallbackDurationSec: 25,
    assets: [
      { file: "scene-6-1.png", type: "image", width: 2100, height: 748, blurBg: true, durationSec: 12.5 },
      { file: "scene-6-2.png", type: "image", width: 1089, height: 472, blurBg: true, durationSec: 12.5 },
    ],
  },
  {
    id: "scene-7",
    title: "Insights Panel",
    narration:
      "Another useful tool is the Insights panel, which opens by clicking the icon in the upper right corner of the page. There you'll find processes, tables, and navigation buttons — a great place to discover extra functionality on that page.",
    fallbackDurationSec: 20,
    assets: [
      {
        file: "scene-7-1.mp4",
        type: "video",
        width: 1910,
        height: 828,
        blurBg: false,
        durationSec: 20,
        trimBeforeSec: 0,
        trimAfterSec: 20,
      },
    ],
  },
  {
    id: "scene-8",
    title: "Column Width and Quick Filter",
    narration:
      "To adjust a column's width, click and drag between the headers. To apply a filter, click the Filter icon, choose the column, the condition, and the value, then click Apply.",
    fallbackDurationSec: 15,
    assets: [
      {
        file: "scene-8-1.mp4",
        type: "video",
        width: 1894,
        height: 874,
        blurBg: false,
        durationSec: 4.8,
        trimBeforeSec: 0,
        trimAfterSec: 4.8,
      },
      { file: "scene-8-2.png", type: "image", width: 849, height: 567, blurBg: true, durationSec: 3.4 },
      { file: "scene-8-3.png", type: "image", width: 1024, height: 670, blurBg: true, durationSec: 3.4 },
      { file: "scene-8-4.png", type: "image", width: 988, height: 810, blurBg: true, durationSec: 3.4 },
    ],
  },
  {
    id: "scene-9",
    title: "Search and Drill Down, with Formula View",
    narration:
      "To search for a value, use the magnifying glass in the toolbar, or maximize the grid to get the full search bar. If you need to explore the detail behind a number, right-click the cell and select Drill Down, or just press F8. This also lets you view the formula behind that cell and where each value comes from.",
    fallbackDurationSec: 22,
    assets: [
      { file: "scene-9-1.png", type: "image", width: 1888, height: 877, blurBg: false, durationSec: 5.5 },
      { file: "scene-9-2.png", type: "image", width: 1899, height: 868, blurBg: false, durationSec: 5.5 },
      { file: "scene-9-3.png", type: "image", width: 523, height: 577, blurBg: true, durationSec: 5.5 },
      { file: "scene-9-4.png", type: "image", width: 1368, height: 871, blurBg: false, durationSec: 5.5 },
    ],
  },
  {
    id: "scene-10a",
    title: "Freeze/Unfreeze",
    narration:
      "Finally, you can freeze rows or columns so they stay in place while scrolling: right-click the header and select Freeze; to release them, select Unfreeze.",
    fallbackDurationSec: 11.9,
    assets: [
      {
        file: "scene-10-1.mp4",
        type: "video",
        width: 1902,
        height: 828,
        blurBg: false,
        durationSec: 11.9,
        trimBeforeSec: 0,
        trimAfterSec: 11.9,
      },
    ],
  },
  {
    id: "scene-10b",
    title: "Closing",
    narration:
      "With that, you now have the essential tools to navigate the Anaplan UX with confidence. Time to practice!",
    fallbackDurationSec: 9.6,
    assets: [
      { file: "scene-10-2.png", type: "image", width: 1918, height: 1078, blurBg: false, durationSec: 9.6 },
    ],
  },
];
