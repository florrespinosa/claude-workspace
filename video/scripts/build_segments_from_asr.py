import json
import subprocess

words = json.load(open("scripts/aligned_words.json"))
script = {s["id"]: s for s in json.load(open("scripts/script_segments.json"))}

MAX_RATE = 3.2  # beyond this a clip is trimmed (shows only its first part) instead of sped up further
TAIL_SECONDS = 3.2


def probe(path):
    out = subprocess.check_output([
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height,duration",
        "-of", "json", path,
    ])
    s = json.loads(out)["streams"][0]
    return int(s["width"]), int(s["height"]), float(s["duration"])


order = []
first_start = {}
last_end = {}
texts = {}
for text, seg_id, start, end in words:
    if seg_id not in first_start:
        order.append(seg_id)
        first_start[seg_id] = start
        texts[seg_id] = []
    last_end[seg_id] = max(last_end.get(seg_id, end), end)
    texts[seg_id].append(text)

TOTAL = last_end[order[-1]] + TAIL_SECONDS

out = []
for i, seg_id in enumerate(order):
    start = 0.0 if i == 0 else first_start[seg_id]
    end = TOTAL if i == len(order) - 1 else first_start[order[i + 1]]
    visual = script[seg_id]["visual"]
    entry = {
        "id": seg_id,
        "visual": visual,
        "text": " ".join(texts[seg_id]),
        "start": round(start, 3),
        "end": round(end, 3),
        "duration": round(end - start, 3),
    }
    if visual.endswith(".mp4"):
        w, h, orig = probe(f"public/assets/{visual}")
        rate = orig / (end - start)
        entry.update({
            "width": w,
            "height": h,
            "origDuration": round(orig, 3),
            "playbackRate": round(min(rate, MAX_RATE), 4),
            "trimmed": rate > MAX_RATE,
        })
    out.append(entry)

json.dump(out, open("scripts/segments_timed.json", "w"), indent=2)
for e in out:
    extra = ""
    if "playbackRate" in e:
        extra = f" rate={e['playbackRate']:.3f}" + (" TRIMMED" if e["trimmed"] else "")
        extra += f" (orig {e['origDuration']:.1f}s)"
    print(f"{e['id']:12s} start={e['start']:7.2f} end={e['end']:7.2f} dur={e['duration']:6.2f}{extra}")

# closing-scene cues: when each tagline phrase starts being spoken, relative
# to the scene start, so the on-screen reveal follows the narration exactly
closing_start = first_start["closing"]
cw = [(t, s) for t, sid, s, e in words if sid == "closing"]
cues = []
phrase_starts = {"Keyrus": "Keyrus AI.", "All": None, "One": "One platform.", "This": "This is only the Beginning."}
cues_out = []
i = 0
while i < len(cw):
    t, s = cw[i]
    if t.startswith("All") and i + 1 < len(cw):
        nxt = cw[i + 1][0].lower()
        if nxt.startswith("your"):
            who = cw[i + 2][0] if i + 2 < len(cw) else ""
            label = "All your " + who.strip(".").lower() + "."
            cues_out.append({"text": label, "start": round(s - closing_start, 3)})
    if t.startswith("One") and i + 1 < len(cw) and cw[i + 1][0].lower().startswith("platform"):
        cues_out.append({"text": "One platform.", "start": round(s - closing_start, 3)})
    if t.startswith("This") and i + 1 < len(cw) and cw[i + 1][0].lower().startswith("is"):
        cues_out.append({"text": "This is only the beginning.", "start": round(s - closing_start, 3)})
    i += 1
json.dump(cues_out, open("scripts/closing_cues.json", "w"), indent=2)
print("closing cues:", cues_out)
