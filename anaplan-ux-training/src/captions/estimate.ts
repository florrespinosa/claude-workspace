import type { Caption } from "@remotion/captions";

/**
 * Estimates word-level caption timing by distributing a scene's duration
 * across its words, weighted by word length (longer words get
 * proportionally more time — a reasonable approximation of natural speech).
 *
 * This is a PLACEHOLDER used until real ElevenLabs timestamps (or a
 * transcription pass) are available. Once real per-scene audio exists,
 * replace this with actual word-level timestamps from the TTS provider
 * for frame-accurate sync.
 */
export function estimateCaptions(
  narration: string,
  durationSec: number,
): Caption[] {
  const words = narration.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  // Weight = word length + a fixed cost per word (for the pause between words).
  const weights = words.map((w) => w.replace(/[^\w]/g, "").length + 2.5);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const totalMs = durationSec * 1000;
  let cursorMs = 0;
  const captions: Caption[] = [];

  for (let i = 0; i < words.length; i++) {
    const shareMs = (weights[i] / totalWeight) * totalMs;
    const startMs = cursorMs;
    const endMs = cursorMs + shareMs;
    captions.push({
      text: (i === 0 ? "" : " ") + words[i],
      startMs,
      endMs,
      timestampMs: null,
      confidence: null,
    });
    cursorMs = endMs;
  }

  return captions;
}
