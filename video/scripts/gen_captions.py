import json, re
import numpy as np
from audio_rhythm import text_syllables

segments = json.load(open("scripts/segments_timed.json"))
gap_data = json.load(open("scripts/silence_gaps.json"))
all_mids = gap_data["mids"]

MAX_WORDS = 6
SNAP_MAX_DIST = 2.5  # seconds; only trust a real pause as a calibration anchor if it's this close to where the syllable-timed estimate predicted a boundary


def split_clauses(text):
    parts = re.split(r'(?<=[.!?])\s+|(?<=—)\s+|(?<=:)\s+', text)
    clauses = []
    for p in parts:
        p = p.strip()
        if not p:
            continue
        words = p.split(' ')
        if len(words) <= MAX_WORDS:
            clauses.append(p)
        else:
            sub = re.split(r'(?<=,)\s+', p)
            buf = []
            for s in sub:
                buf_words = ' '.join(buf).split(' ') if buf else []
                s_words = s.split(' ')
                if buf and len(buf_words) + len(s_words) > MAX_WORDS:
                    clauses.append(' '.join(buf))
                    buf = [s]
                else:
                    buf.append(s)
            if buf:
                clauses.append(' '.join(buf))
    final = []
    for c in clauses:
        words = c.split(' ')
        if len(words) <= MAX_WORDS:
            final.append(c)
        else:
            for i in range(0, len(words), MAX_WORDS):
                final.append(' '.join(words[i:i+MAX_WORDS]))

    merged = []
    for c in final:
        if merged and len(c.split(' ')) <= 2 and len((merged[-1] + ' ' + c).split(' ')) <= MAX_WORDS + 4:
            merged[-1] = merged[-1] + ' ' + c
        else:
            merged.append(c)
    result = []
    i = 0
    while i < len(merged):
        c = merged[i]
        if len(c.split(' ')) <= 2 and i + 1 < len(merged):
            result.append(c + ' ' + merged[i + 1])
            i += 2
        else:
            result.append(c)
            i += 1
    return result


def optimal_monotonic_match(boundaries, gaps, max_dist):
    """Match each interior boundary to at most one real pause, preserving
    order, minimizing total |boundary - pause| distance -- via DP, not
    greedy nearest-neighbor.

    A greedy "first boundary claims the nearest gap" approach lets an
    earlier boundary steal a pause that actually belongs to a later,
    closer-matching boundary (verified bug: at ~54s a comma-boundary with a
    2.11s-away pause grabbed the gap that a 1.36s-away sentence-boundary at
    ~55s needed, forcing that one to fall back to flat interpolation and
    land audibly late). This DP considers all valid order-preserving
    matchings and picks the globally cheapest one.
    """
    n, m = len(boundaries), len(gaps)
    # dp[i][j] = min cost using boundaries[:i], gaps[:j]
    dp = [[0.0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        dp[i][0] = dp[i - 1][0] + max_dist  # every boundary left unmatched
    for j in range(1, m + 1):
        dp[0][j] = dp[0][j - 1]  # unused gaps are free to skip
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            skip_gap = dp[i][j - 1]
            leave_unmatched = dp[i - 1][j] + max_dist
            dist = abs(boundaries[i - 1] - gaps[j - 1])
            match = dp[i - 1][j - 1] + dist if dist <= max_dist else float("inf")
            dp[i][j] = min(skip_gap, leave_unmatched, match)

    # backtrack to recover which boundary matched which gap
    matches = {}
    i, j = n, m
    while i > 0 and j > 0:
        dist = abs(boundaries[i - 1] - gaps[j - 1])
        match_cost = dp[i - 1][j - 1] + dist if dist <= max_dist else float("inf")
        if abs(dp[i][j] - match_cost) < 1e-9:
            matches[i - 1] = gaps[j - 1]
            i -= 1
            j -= 1
        elif abs(dp[i][j] - (dp[i][j - 1])) < 1e-9:
            j -= 1
        else:
            i -= 1
    return matches


def snap_boundaries_to_pauses(flat_boundaries, scene_start, scene_end, mids):
    """Piecewise-linear-warp syllable-timed boundary estimates onto real
    detected silences wherever one is close by, so timing error can't
    accumulate across a long scene."""
    internal_gaps = sorted(
        m for m in mids if scene_start + 0.05 < m < scene_end - 0.05
    )
    interior = flat_boundaries[1:-1]
    matches = optimal_monotonic_match(interior, internal_gaps, SNAP_MAX_DIST)

    anchors_x = [flat_boundaries[0]]
    anchors_y = [scene_start]
    for local_i in sorted(matches):
        anchors_x.append(interior[local_i])
        anchors_y.append(matches[local_i])
    anchors_x.append(flat_boundaries[-1])
    anchors_y.append(scene_end)

    corrected = np.interp(flat_boundaries, anchors_x, anchors_y)
    return corrected.tolist()


all_captions = []
for seg in segments:
    clauses = split_clauses(seg["text"])
    # syllable count is a far better proxy for spoken duration than raw
    # character count -- it's literally a measure of the audio's rhythm,
    # which is what needs to drive this timing per the user's request
    syl_counts = [text_syllables(c) for c in clauses]
    total_syl = sum(syl_counts) or 1
    start = seg["start"]
    end = seg["end"]
    dur = end - start

    flat_boundaries = [start]
    t = start
    for s in syl_counts:
        share = s / total_syl
        t = t + dur * share
        flat_boundaries.append(t)
    flat_boundaries[-1] = end

    corrected = snap_boundaries_to_pauses(flat_boundaries, start, end, all_mids)

    for i, c in enumerate(clauses):
        all_captions.append({
            "text": c,
            "start": round(corrected[i], 3),
            "end": round(corrected[i + 1], 3),
            "segment": seg["id"],
        })

MIN_DUR = 0.9  # seconds; fold unreadably-short captions into a neighbor


def merge_short_captions(captions):
    result = []
    for c in captions:
        if (
            result
            and result[-1]["segment"] == c["segment"]
            and (c["end"] - c["start"]) < MIN_DUR
        ):
            result[-1]["text"] = result[-1]["text"] + " " + c["text"]
            result[-1]["end"] = c["end"]
        elif (
            result
            and result[-1]["segment"] == c["segment"]
            and (result[-1]["end"] - result[-1]["start"]) < MIN_DUR
            and result[-1]["end"] == c["start"]
        ):
            c["text"] = result[-1]["text"] + " " + c["text"]
            c["start"] = result[-1]["start"]
            result[-1] = c
        else:
            result.append(dict(c))
    return result


all_captions = merge_short_captions(all_captions)

json.dump(all_captions, open("scripts/captions_final.json", "w"), indent=2)
print(f"wrote {len(all_captions)} caption chunks to scripts/captions_final.json")
for c in all_captions:
    print(f'{c["start"]:7.2f} - {c["end"]:7.2f}  [{c["segment"]}]  {c["text"]}')

boundary_times = sorted(set([c["start"] for c in all_captions] + [c["end"] for c in all_captions]))
residuals = []
for t in boundary_times:
    nearest = min(all_mids, key=lambda m: abs(m - t))
    residuals.append(abs(nearest - t))
residuals.sort()
print(f"\nboundary/pause residuals: max={residuals[-1]:.2f}s  p90={residuals[int(0.9*len(residuals))]:.2f}s  median={residuals[len(residuals)//2]:.2f}s")
