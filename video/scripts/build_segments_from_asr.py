import json

words = json.load(open("scripts/aligned_words.json"))
video_durations = {
    "MK - 1.mp4": 7.2333,
    "VIDEO 1 KT.mp4": 17.399967,
    "VIDEO 1 TEST SCRIPTS.mp4": 31.4333,
    "VIDEO 2 KT.mp4": 35.2,
    "VIDEO 2 TEST SCRIPTS.mp4": 22.466633,
    "VIDEO QUERY.mp4": 59.2,
}
visuals = {
    "slide1": "SLIDE 1.jpg",
    "slide2": "SLIDE 2.jpg",
    "slide3": "SLIDE 3.jpg",
    "slide4": "SLIDE 4.jpg",
    "mk1": "MK - 1.mp4",
    "video1_test": "VIDEO 1 TEST SCRIPTS.mp4",
    "video2_test": "VIDEO 2 TEST SCRIPTS.mp4",
    "video_query": "VIDEO QUERY.mp4",
    "video1_kt": "VIDEO 1 KT.mp4",
    "video2_kt": "VIDEO 2 KT.mp4",
    "slide5": "SLIDE 5.jpg",
    "closing": "CLOSING SLIDE.png",
}

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

TAIL_SECONDS = 3.2
TOTAL = last_end[order[-1]] + TAIL_SECONDS

out = []
for i, seg_id in enumerate(order):
    start = 0.0 if i == 0 else first_start[order[i]]
    end = TOTAL if i == len(order) - 1 else first_start[order[i + 1]]
    entry = {
        "id": seg_id,
        "visual": visuals[seg_id],
        "text": " ".join(texts[seg_id]),
        "start": round(start, 3),
        "end": round(end, 3),
        "duration": round(end - start, 3),
    }
    if visuals[seg_id] in video_durations:
        orig = video_durations[visuals[seg_id]]
        entry["origDuration"] = orig
        entry["playbackRate"] = round(orig / (end - start), 4)
    out.append(entry)

json.dump(out, open("scripts/segments_timed.json", "w"), indent=2)
for e in out:
    extra = f" rate={e['playbackRate']:.3f}" if "playbackRate" in e else ""
    print(f"{e['id']:15s} start={e['start']:7.2f} end={e['end']:7.2f} dur={e['duration']:6.2f}{extra}")
