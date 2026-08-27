"""
Procedurally generate an upbeat, corporate electronic background music bed.
No external samples used (all synthesized) -> no licensing concerns.
Style: modern corporate-tech / synthwave-lite. 128 BPM, in A minor.
Output: 24-bit-ish float -> 16-bit PCM WAV, stereo, 44.1kHz, ~245s (looped/arranged).
"""
import numpy as np
import wave
import struct

SR = 44100
BPM = 128
BEAT = 60.0 / BPM
BAR = BEAT * 4
TOTAL_SECONDS = 248.0  # a bit longer than narration (239.3s) so we can trim

rng = np.random.default_rng(7)

def t_axis(dur):
    return np.arange(int(dur * SR)) / SR

def sine(freq, dur, phase=0.0):
    t = t_axis(dur)
    return np.sin(2 * np.pi * freq * t + phase)

def saw(freq, dur):
    t = t_axis(dur)
    return 2 * (t * freq - np.floor(0.5 + t * freq))

def square(freq, dur, duty=0.5):
    t = t_axis(dur)
    frac = (t * freq) % 1.0
    return np.where(frac < duty, 1.0, -1.0)

def env_ad(n, attack, decay, sustain_level=0.0):
    a = max(1, int(attack * SR))
    d = max(1, int(decay * SR))
    env = np.ones(n)
    a = min(a, n)
    env[:a] = np.linspace(0, 1, a)
    rest = n - a
    d = min(d, rest)
    if d > 0:
        env[a:a+d] = np.linspace(1, sustain_level, d)
    if a + d < n:
        env[a+d:] = sustain_level
    return env

def lowpass(sig, cutoff_hz, resonance_mix=0.0):
    # simple one-pole low pass IIR
    dt = 1.0 / SR
    rc = 1.0 / (2 * np.pi * cutoff_hz)
    alpha = dt / (rc + dt)
    out = np.zeros_like(sig)
    prev = 0.0
    for i in range(len(sig)):
        prev = prev + alpha * (sig[i] - prev)
        out[i] = prev
    return out

def fast_lowpass(sig, cutoff_hz):
    # vectorized approx via numpy cumulative filtering using FFT (fast, stable)
    n = len(sig)
    if n == 0:
        return sig
    freqs = np.fft.rfftfreq(n, 1 / SR)
    spec = np.fft.rfft(sig)
    filt = 1.0 / (1.0 + (freqs / cutoff_hz) ** 2)
    return np.fft.irfft(spec * filt, n)

def kick(dur=0.28):
    n = int(dur * SR)
    t = np.arange(n) / SR
    freq = 150 * np.exp(-t * 28) + 45
    phase = 2 * np.pi * np.cumsum(freq) / SR
    body = np.sin(phase)
    amp = np.exp(-t * 16)
    click = (rng.standard_normal(n) * np.exp(-t * 400)) * 0.25
    return (body * amp + click) * 0.95

def clap(dur=0.18):
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    noise = fast_lowpass(noise, 4500)
    env = np.exp(-t * 30) + 0.4 * np.exp(-((t - 0.02) ** 2) / (2 * 0.0008))
    return noise * env * 0.5

def hihat(dur=0.06, open_hat=False):
    n = int(dur * (3.0 if open_hat else 1.0) * SR)
    noise = rng.standard_normal(n)
    noise = noise - fast_lowpass(noise, 6000)  # high-pass-ish
    t = np.arange(n) / SR
    decay = 6 if open_hat else 40
    env = np.exp(-t * decay)
    return noise * env * (0.22 if open_hat else 0.28)

def pad_chord(freqs, dur):
    n = int(dur * SR)
    out = np.zeros(n)
    t = np.arange(n) / SR
    for f in freqs:
        out += 0.5 * saw(f, dur)[:n] + 0.3 * sine(f * 2, dur)[:n]
    out = fast_lowpass(out, 1800)
    env = env_ad(n, attack=dur * 0.35, decay=dur * 0.4, sustain_level=0.75)
    fade = np.ones(n)
    tail = int(0.15 * SR)
    if tail < n:
        fade[-tail:] = np.linspace(1, 0, tail)
    return out * env * fade / max(1, len(freqs)) * 1.4

def pluck(freq, dur):
    n = int(dur * SR)
    sig = square(freq, dur)[:n] * 0.6 + saw(freq * 1.005, dur)[:n] * 0.4
    env = np.exp(-np.arange(n) / SR * 9)
    return sig * env

def bass_note(freq, dur):
    n = int(dur * SR)
    sig = saw(freq, dur)[:n]
    sig = fast_lowpass(sig, 400)
    env = env_ad(n, attack=0.01, decay=dur * 0.2, sustain_level=0.85)
    tail = int(0.03 * SR)
    if tail < n:
        env[-tail:] *= np.linspace(1, 0, tail)
    return sig * env * 1.1

def mix_at(buf, sig, start_time):
    start = int(start_time * SR)
    end = start + len(sig)
    if end > len(buf):
        sig = sig[: len(buf) - start]
        end = len(buf)
    if start < len(buf) and len(sig) > 0:
        buf[start:end] += sig

n_total = int(TOTAL_SECONDS * SR)
master = np.zeros(n_total)

# A minor scale-ish, corporate-tech vibe
root = 55.0  # A1
bass_pattern_deg = [0, 0, 3, 5, 0, 0, 5, 3]  # scale degrees over 2 bars (8 beats)
scale = [0, 2, 3, 5, 7, 8, 10]  # natural minor semitone offsets

def deg_to_freq(deg, octave_shift=0):
    semitone = scale[deg % len(scale)] + 12 * (deg // len(scale))
    return root * (2 ** ((semitone + 12 * octave_shift) / 12))

chord_degrees = [0, 3, 5, 4]  # i, iv, VI-ish, v (bar chords, 4 bars loop)
pad_freqs_list = [
    [deg_to_freq(d, 1), deg_to_freq(d + 2, 1), deg_to_freq(d + 4, 1)] for d in chord_degrees
]

n_bars = int(TOTAL_SECONDS / BAR) + 1

for bar in range(n_bars):
    bar_time = bar * BAR
    section = bar // 4  # every 4 bars = a "section"
    intro = bar < 4          # first 4 bars: sparse intro
    build = 4 <= bar < 8      # bars 4-8: add drums
    full = bar >= 8           # bars 8+: full groove

    chord = pad_freqs_list[bar % 4]

    # Pad on every bar (constant bed), softer in intro
    pad_level = 0.5 if intro else 0.75
    p = pad_chord(chord, BAR * 0.98) * pad_level
    mix_at(master, p, bar_time)

    # Bass line - starts at bar 2
    if bar >= 2:
        for i, deg in enumerate(bass_pattern_deg):
            bt = bar_time + i * BEAT / 2
            f = deg_to_freq(chord_degrees[bar % 4] + (deg - chord_degrees[bar % 4] if False else deg))
            f = deg_to_freq(deg)
            note = bass_note(f, BEAT / 2 * 0.92)
            mix_at(master, note * 0.8, bt)

    # Drums - build in gradually
    if build or full:
        # four-on-the-floor kick
        for i in range(4):
            mix_at(master, kick(), bar_time + i * BEAT)
        # clap on 2 and 4
        mix_at(master, clap(), bar_time + BEAT * 1)
        mix_at(master, clap(), bar_time + BEAT * 3)
    if full:
        # 8th-note hihats, occasional open hat
        for i in range(8):
            open_h = (i % 4 == 3)
            mix_at(master, hihat(open_hat=open_h), bar_time + i * BEAT / 2)

    # Melodic pluck arpeggio - only in full sections, every other bar
    if full and (bar % 2 == 0):
        arp_degs = [0, 2, 4, 2]
        for i, d in enumerate(arp_degs):
            f = deg_to_freq(chord_degrees[bar % 4] + d, 2)
            note = pluck(f, BEAT * 0.9)
            mix_at(master, note * 0.35, bar_time + i * BEAT)

# Overall fades
fade_in = int(2.0 * SR)
master[:fade_in] *= np.linspace(0, 1, fade_in)
fade_out = int(3.0 * SR)
master[-fade_out:] *= np.linspace(1, 0, fade_out)

# Gentle master lowpass to soften digital harshness + normalize
master = fast_lowpass(master, 9000)
peak = np.max(np.abs(master))
if peak > 0:
    master = master / peak * 0.9

stereo = np.stack([master, master * 0.98], axis=1)
# subtle stereo widening via slight delay on right channel
delay_samples = 12
right = np.concatenate([np.zeros(delay_samples), stereo[:-delay_samples, 1]])
stereo[:, 1] = right

pcm = np.clip(stereo, -1, 1)
pcm16 = (pcm * 32767).astype(np.int16)

out_path = "/home/user/claude-workspace/video/public/music.wav"
with wave.open(out_path, "w") as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(SR)
    wf.writeframes(pcm16.tobytes())

print("Wrote", out_path, "duration", len(master) / SR, "s")
