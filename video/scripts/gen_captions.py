import json, re
import numpy as np

segments = json.load(open("scripts/segments_timed.json"))
gap_data = json.load(open("scripts/silence_gaps.json"))
all_mids = gap_data["mids"]

MAX_WORDS = 8
SNAP_MAX_DIST = 3.0  # seconds; only trust a real pause as a calibration anchor if it's this close to where char-count math predicted a boundary

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


def snap_boundaries_to_pauses(flat_boundaries, scene_start, scene_end, mids):
    """Piecewise-linear-warp interior boundary estimates onto real detected
    silences, so timing error can't accumulate across a long scene — every
    caption cut gets corrected against the nearest actual pause instead of
    drifting further from the audio the longer the scene runs."""
    internal_gaps = sorted(
        m for m in mids if scene_start + 0.05 < m < scene_end - 0.05
    )

    snapped = []  # (boundary_index, real_time)
    last_gap_idx = -1
    for bi in range(1, len(flat_boundaries) - 1):
        target = flat_boundaries[bi]
        candidates = [(gi, g) for gi, g in enumerate(internal_gaps) if gi > last_gap_idx]
        if not candidates:
            break
        gi, g = min(candidates, key=lambda x: abs(x[1] - target))
        if abs(g - target) <= SNAP_MAX_DIST:
            snapped.append((bi, g))
            last_gap_idx = gi

    anchors_x = [flat_boundaries[0]] + [flat_boundaries[bi] for bi, _ in snapped] + [flat_boundaries[-1]]
    anchors_y = [scene_start] + [t for _, t in snapped] + [scene_end]
    corrected = np.interp(flat_boundaries, anchors_x, anchors_y)
    return corrected.tolist()


all_captions = []
for seg in segments:
    clauses = split_clauses(seg["text"])
    total_chars = sum(len(c) for c in clauses)
    start = seg["start"]
    end = seg["end"]
    dur = end - start

    flat_boundaries = [start]
    t = start
    for c in clauses:
        share = len(c) / total_chars if total_chars else 1 / len(clauses)
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

MIN_DUR = 0.9  # seconds; a snapped-to-a-real-pause boundary can still land
# awkwardly close to its neighbor and produce an unreadably short caption —
# fold those into an adjacent caption in the same scene rather than flash them


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
            # the previous caption itself was too short (e.g. the very first
            # in a scene) — fold it forward into this one instead
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
