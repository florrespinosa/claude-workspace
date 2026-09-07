"""
Extract the audio's actual rhythm (syllable-nucleus timestamps) so caption
timing can be driven by how the narration was actually spoken, not by a
character-count proxy. This is what "sincronizado con el ritmo del audio"
requires: character/word counting alone can't capture that some words are
drawled and others clipped -- only the acoustic signal itself can.

Method: short-time RMS energy envelope -> smooth -> peak-pick. Each peak is
an approximate syllable nucleus (the acoustic core of a spoken syllable).
"""
import wave
import numpy as np
from scipy.signal import find_peaks

SR_HOP_S = 0.010  # 10ms hop
WIN_S = 0.030  # 30ms analysis window


def load_pcm(path):
    with wave.open(path, "rb") as wf:
        sr = wf.getframerate()
        n = wf.getnframes()
        raw = wf.readframes(n)
        data = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768.0
    return data, sr


def energy_envelope(samples, sr):
    hop = max(1, int(SR_HOP_S * sr))
    win = max(1, int(WIN_S * sr))
    n_frames = 1 + (len(samples) - win) // hop
    env = np.empty(n_frames)
    for i in range(n_frames):
        seg = samples[i * hop : i * hop + win]
        env[i] = np.sqrt(np.mean(seg.astype(np.float64) ** 2) + 1e-12)
    times = (np.arange(n_frames) * hop + win / 2) / sr
    return times, env


def find_syllable_peaks(wav_path, min_distance_s=0.11, prominence_ratio=0.10):
    samples, sr = load_pcm(wav_path)
    times, env = energy_envelope(samples, sr)

    # smooth: syllables are ~150-250ms apart, smoothing over ~60ms merges
    # sub-glottal-pulse noise without merging separate syllables
    smooth_win = max(1, int(0.06 / SR_HOP_S))
    kernel = np.ones(smooth_win) / smooth_win
    env_smooth = np.convolve(env, kernel, mode="same")

    env_db = 20 * np.log10(env_smooth + 1e-9)
    floor = np.percentile(env_db, 15)
    ceil = np.percentile(env_db, 95)
    dynamic_range = max(1.0, ceil - floor)

    min_distance_frames = max(1, int(min_distance_s / SR_HOP_S))
    prominence = dynamic_range * prominence_ratio

    peak_idx, _ = find_peaks(
        env_db,
        distance=min_distance_frames,
        prominence=prominence,
        height=floor + dynamic_range * 0.12,
    )
    peak_times = times[peak_idx]
    return peak_times


def estimate_syllables(word):
    w = "".join(ch for ch in word.lower() if ch.isalpha())
    if not w:
        return 1
    vowels = "aeiouy"
    count = 0
    prev_vowel = False
    for ch in w:
        is_vowel = ch in vowels
        if is_vowel and not prev_vowel:
            count += 1
        prev_vowel = is_vowel
    if w.endswith("e") and not w.endswith(("le", "ue")) and count > 1:
        count -= 1
    if w.endswith("le") and len(w) > 2 and w[-3] not in vowels:
        count += 1
    return max(1, count)


def text_syllables(text):
    words = [w for w in text.replace("—", " ").split() if w.strip(",.;:!?\"'()")]
    return sum(estimate_syllables(w) for w in words) or 1


if __name__ == "__main__":
    import sys

    peaks = find_syllable_peaks("public/audio.wav")
    print(f"found {len(peaks)} syllable-nucleus peaks over the narration")
    print(f"avg peak spacing: {np.mean(np.diff(peaks)):.3f}s "
          f"({len(peaks) / peaks[-1]:.2f} syll/s overall)")
