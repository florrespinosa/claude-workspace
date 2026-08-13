#!/usr/bin/env node
// Exports an SRT subtitle file for the full timeline, using the same
// caption grouping logic (createTikTokStyleCaptions) and per-scene timing
// (durations.json) as the on-screen captions in the video itself, so the
// two stay in lockstep. Re-run after real ElevenLabs audio + durations
// are in place for frame-accurate subtitle timing.

import { writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createTikTokStyleCaptions } from "@remotion/captions";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const { scenes } = await import(path.join(root, "src/data/scenes.ts"));
const { estimateCaptions } = await import(path.join(root, "src/captions/estimate.ts"));
const durations = JSON.parse(await readFile(path.join(root, "src/data/durations.json"), "utf8"));

const TRANSITION_SEC = 8 / 30; // must match MainVideo.tsx TRANSITION_FRAMES / FPS
const SWITCH_CAPTIONS_EVERY_MS = 1200; // must match Captions.tsx

function srtTimestamp(ms) {
  const totalMs = Math.max(0, Math.round(ms));
  const h = Math.floor(totalMs / 3600000);
  const m = Math.floor((totalMs % 3600000) / 60000);
  const s = Math.floor((totalMs % 60000) / 1000);
  const msRem = totalMs % 1000;
  const pad = (n, len = 2) => String(n).padStart(len, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(msRem, 3)}`;
}

let cursorSec = 0;
let index = 1;
const lines = [];

for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex++) {
  const scene = scenes[sceneIndex];
  const durationSec = durations[scene.id]?.durationSec ?? scene.fallbackDurationSec;
  // Cap the local end bound so a scene's last cue never runs into the next
  // scene's crossfade overlap (avoids two overlapping SRT cues at cuts).
  const isLast = sceneIndex === scenes.length - 1;
  const localEndMs = (isLast ? durationSec : durationSec - TRANSITION_SEC) * 1000;

  const captions = estimateCaptions(scene.narration, durationSec);
  const { pages } = createTikTokStyleCaptions({
    captions,
    combineTokensWithinMilliseconds: SWITCH_CAPTIONS_EVERY_MS,
  });

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const next = pages[i + 1] ?? null;
    const localStart = page.startMs;
    const localEnd = Math.min(next ? next.startMs : localEndMs, page.startMs + SWITCH_CAPTIONS_EVERY_MS, localEndMs);
    if (localEnd <= localStart) continue;
    const startMs = cursorSec * 1000 + localStart;
    const endMs = cursorSec * 1000 + localEnd;
    lines.push(`${index}\n${srtTimestamp(startMs)} --> ${srtTimestamp(endMs)}\n${page.text.trim()}\n`);
    index++;
  }

  cursorSec += durationSec - TRANSITION_SEC;
}

const outPath = path.join(root, "out", "anaplan-ux-training.srt");
await writeFile(outPath, lines.join("\n"));
console.log(`Wrote ${outPath} (${index - 1} cues)`);
console.log("NOTE: timing is ESTIMATED (word-length proportional) until real ElevenLabs audio + durations.json exist.");
