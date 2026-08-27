import json, re

segments = json.load(open("scripts/script_segments.json"))
gaps = json.load(open("scripts/silence_gaps.json"))
mids = gaps["mids"]
TOTAL = 239.307750

def wc(s):
    return len(re.findall(r"[A-Za-z0-9']+", s))

counts = [wc(s["text"]) for s in segments]
total_words = sum(counts)
cum = 0
targets = []  # target boundary time BEFORE each segment (start time)
for c in counts:
    targets.append(cum / total_words * TOTAL)
    cum += c
targets.append(TOTAL)  # end of last segment

# snap each internal boundary (targets[1:-1], i.e. between segments) to nearest gap mid,
# enforcing strict monotonic increase so two boundaries never collapse onto the same pause
snapped = [0.0]
last_idx = -1
for i in range(1, len(segments)):
    t = targets[i]
    candidates = [(idx, m) for idx, m in enumerate(mids) if idx > last_idx]
    best_idx, best_mid = min(candidates, key=lambda x: abs(x[1] - t))
    last_idx = best_idx
    snapped.append(best_mid)
snapped.append(TOTAL)

for i, s in enumerate(segments):
    start = snapped[i]
    end = snapped[i+1]
    print(f"{s['id']:15s} words={counts[i]:4d} target_start={targets[i]:7.2f} snapped_start={start:7.2f} end={end:7.2f} dur={end-start:6.2f}")

video_durations = {
    "MK - 1.mp4": 7.2333,
    "VIDEO 1 KT.mp4": 17.399967,
    "VIDEO 1 TEST SCRIPTS.mp4": 31.4333,
    "VIDEO 2 KT.mp4": 35.2,
    "VIDEO 2 TEST SCRIPTS.mp4": 22.466633,
    "VIDEO QUERY.mp4": 59.2,
}

out = []
for i, s in enumerate(segments):
    start = round(snapped[i], 3)
    end = round(snapped[i+1], 3)
    dur = end - start
    entry = {"id": s["id"], "visual": s["visual"], "text": s["text"], "start": start, "end": end, "duration": round(dur, 3)}
    if s["visual"] in video_durations:
        orig = video_durations[s["visual"]]
        entry["origDuration"] = orig
        entry["playbackRate"] = round(orig / dur, 4)
    out.append(entry)
json.dump(out, open("scripts/segments_timed.json","w"), indent=2)
print("wrote scripts/segments_timed.json")
for e in out:
    if "playbackRate" in e:
        print(f"{e['id']:15s} orig={e['origDuration']:6.2f} target={e['duration']:6.2f} rate={e['playbackRate']:.3f}")
