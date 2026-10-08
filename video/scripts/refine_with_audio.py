"""
Refine ASR word timings against the actual audio.

Whisper's word timestamps are good *within* continuous speech but unreliable
around pauses: a word before a pause often has its end stretched across the
silence (e.g. "Anaplan" ending at 51.2s when the voice really stops at 50.3s),
and the words leading into it get shifted late with it. That shows up as
subtitles lagging the voice.

Fix: find the real speech "islands" (runs of voice separated by genuine silence)
in the waveform, assign every word to an island with a monotone DP that uses
(a) how close Whisper put the word to the island and (b) the script's own
punctuation (a sentence end almost always has a pause after it), then spread each
island's words across the island's *measured* start/end proportionally to
Whisper's relative word durations.
"""
import json
import wave
import numpy as np

WAV = "/home/user/v2_raw/audio16k.wav"
IN = "scripts/aligned_words_raw.json"
OUT = "scripts/aligned_words.json"

HOP_S = 0.010
WIN_S = 0.025
MIN_SILENCE = 0.20   # shorter dips are articulation (stop closures), not pauses
MIN_SPEECH = 0.07
LEAD = 0.02
TAIL = 0.03

SKIP_COST = 0.6
START_K = 0.6  # Whisper is reliable for the onset of the first word after a pause
PEN = {  # (cost if a pause boundary sits here, cost if no pause boundary here)
    "strong": (0.0, 1.5),
    "weak": (0.0, 0.12),
    "none": (0.7, 0.0),
}


def load_env():
    w = wave.open(WAV)
    sr = w.getframerate()
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    hop, win = int(HOP_S * sr), int(WIN_S * sr)
    n = 1 + (len(x) - win) // hop
    env = np.empty(n)
    for i in range(n):
        seg = x[i * hop : i * hop + win]
        env[i] = np.sqrt(np.mean(seg * seg) + 1e-12)
    db = 20 * np.log10(env + 1e-9)
    t = (np.arange(n) * hop + win / 2) / sr
    return t, db


def find_islands(t, db):
    floor = np.percentile(db, 5)
    ceil = np.percentile(db, 95)
    thr = max(floor + 9.0, -52.0)
    thr = min(thr, ceil - 25.0)
    sp = db > thr
    # close short silent gaps, drop short blips
    def runs(mask, val):
        out, start = [], None
        for i, m in enumerate(mask):
            if m == val and start is None:
                start = i
            if m != val and start is not None:
                out.append((start, i)); start = None
        if start is not None:
            out.append((start, len(mask)))
        return out
    min_sil = int(MIN_SILENCE / HOP_S)
    for a, b in runs(sp, False):
        if b - a < min_sil and a > 0 and b < len(sp):
            sp[a:b] = True
    min_sp = int(MIN_SPEECH / HOP_S)
    for a, b in runs(sp, True):
        if b - a < min_sp:
            sp[a:b] = False
    # breaths / mouth noise sit well below the voice: an island whose loudest
    # moment never gets near speech level is not a word
    peak_min = ceil - 24.0
    kept = []
    for a, b in runs(sp, True):
        if db[a:b].max() >= peak_min:
            kept.append((a, b))
    isl = [(t[a] - HOP_S / 2, t[b - 1] + HOP_S / 2) for a, b in kept]
    print(f"threshold {thr:.1f} dB (floor {floor:.1f}, ceil {ceil:.1f}) -> {len(isl)} speech islands")
    return isl


def punct_kind(text):
    s = text.rstrip()
    if s.endswith((".", "?", "!")):
        return "strong"
    if s.endswith((",", ":", ";", "—")):
        return "weak"
    return "none"


def main():
    raw = json.load(open(IN))
    # standalone dash tokens are punctuation, not words: fold into previous word
    words = []
    for text, seg, a, b in raw:
        if text.strip() in ("—", "–", "-") and words:
            words[-1][0] += " —"
            words[-1][3] = max(words[-1][3], b)
        else:
            words.append([text, seg, a, b])
    n = len(words)

    t, db = load_env()
    isl = find_islands(t, db)
    m = len(isl)
    S = np.array([s for s, e in isl])
    E = np.array([e for s, e in isl])

    A = np.array([w[2] for w in words])
    B = np.array([w[3] for w in words])
    # distance from each word's Whisper interval to each island (0 if overlapping)
    dist = np.maximum(0.0, np.maximum(S[None, :] - B[:, None], A[:, None] - E[None, :]))

    kinds = [punct_kind(w[0]) for w in words]
    INF = 1e18
    dp = np.full((n, m), INF)
    bp = np.full((n, m), -1, dtype=int)
    idx = np.arange(m)
    dp[0] = dist[0] + SKIP_COST * idx + START_K * np.minimum(np.abs(A[0] - S), 1.5)  # islands before the first word are skipped
    for j in range(1, n):
        pen_move, pen_stay = PEN[kinds[j - 1]][0], PEN[kinds[j - 1]][1]
        # transition from a strictly earlier island i' -> i: g[i'] + SKIP*(i-i'-1)
        g = dp[j - 1] - SKIP_COST * idx
        run_min = np.minimum.accumulate(g)
        run_arg = np.zeros(m, dtype=int)
        best = -INF
        cur_arg = 0
        for i in range(m):
            if g[i] < (g[cur_arg]):
                cur_arg = i
            run_arg[i] = cur_arg
        for i in range(m):
            stay = dp[j - 1][i] + pen_stay
            if i > 0:
                mv = run_min[i - 1] + SKIP_COST * (i - 1) + pen_move + START_K * min(abs(A[j] - S[i]), 1.5)
                mv_arg = run_arg[i - 1]
            else:
                mv, mv_arg = INF, -1
            if stay <= mv:
                dp[j][i] = stay + dist[j][i]
                bp[j][i] = i
            else:
                dp[j][i] = mv + dist[j][i]
                bp[j][i] = mv_arg
    final = dp[n - 1] + SKIP_COST * (m - 1 - idx)
    i = int(np.argmin(final))
    assign = [0] * n
    for j in range(n - 1, -1, -1):
        assign[j] = i
        i = bp[j][i] if j > 0 else i
    print("DP cost", final.min())

    # spread each island's words across its measured extent
    groups = {}
    for j, isl_i in enumerate(assign):
        groups.setdefault(isl_i, []).append(j)
    out = [None] * n
    for isl_i, js in groups.items():
        s, e = S[isl_i] - LEAD, E[isl_i] + TAIL
        wts = np.array([max(0.10, B[j] - A[j]) for j in js])
        cum = np.concatenate(([0], np.cumsum(wts))) / wts.sum()
        for k, j in enumerate(js):
            out[j] = [words[j][0], words[j][1], round(s + (e - s) * cum[k], 3), round(s + (e - s) * cum[k + 1], 3)]
    shifts = np.array([o[2] - words[j][2] for j, o in enumerate(out)])
    print(f"words {n}, islands used {len(groups)}/{m}; start shift vs Whisper: mean {shifts.mean():+.2f}s, "
          f"|mean| {np.abs(shifts).mean():.2f}s, max {np.abs(shifts).max():.2f}s")
    big = [(words[j][0], round(words[j][2], 2), out[j][2]) for j in range(n) if abs(shifts[j]) > 0.6]
    print(f"{len(big)} words moved by > 0.6s (sample):", big[:12])
    json.dump(out, open(OUT, "w"), indent=1)


if __name__ == "__main__":
    main()
