#!/usr/bin/env node
// Regenerates src/data/durations.json.
// For each scene: if public/voiceover/<id>.mp3 exists, measure its real
// duration with ffprobe and use that. Otherwise fall back to the
// scene's `fallbackDurationSec` from src/data/scenes.ts.
//
// Run this after adding real ElevenLabs voiceover files, then re-render.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const { scenes } = await import(path.join(root, "src/data/scenes.ts"));

function ffprobeDuration(file) {
  const out = execFileSync("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "csv=p=0",
    file,
  ]).toString().trim();
  return parseFloat(out);
}

const durations = {};
const usedReal = [];
const usedFallback = [];

for (const scene of scenes) {
  const mp3Path = path.join(root, "public", "voiceover", `${scene.id}.mp3`);
  if (existsSync(mp3Path)) {
    const real = ffprobeDuration(mp3Path);
    durations[scene.id] = { durationSec: real, source: "elevenlabs-audio" };
    usedReal.push(scene.id);
  } else {
    durations[scene.id] = { durationSec: scene.fallbackDurationSec, source: "fallback-estimate" };
    usedFallback.push(scene.id);
  }
}

await writeFile(
  path.join(root, "src/data/durations.json"),
  JSON.stringify(durations, null, 2) + "\n",
);

console.log(`Wrote src/data/durations.json`);
console.log(`  Real audio:  ${usedReal.length ? usedReal.join(", ") : "(none)"}`);
console.log(`  Fallback:    ${usedFallback.length ? usedFallback.join(", ") : "(none)"}`);
