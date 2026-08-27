import json, re

segments = json.load(open("scripts/segments_timed.json"))

MAX_WORDS = 8

def split_clauses(text):
    # split on sentence-ending punctuation and em-dash/colon, keep punctuation
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
            # further split long clauses on commas
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
            # final pass: if any clause still too long, hard-split by words
    final = []
    for c in clauses:
        words = c.split(' ')
        if len(words) <= MAX_WORDS:
            final.append(c)
        else:
            for i in range(0, len(words), MAX_WORDS):
                final.append(' '.join(words[i:i+MAX_WORDS]))

    # merge pass: fold very short trailing fragments (<=2 words) into a neighbor
    merged = []
    for c in final:
        if merged and len(c.split(' ')) <= 2 and len((merged[-1] + ' ' + c).split(' ')) <= MAX_WORDS + 4:
            merged[-1] = merged[-1] + ' ' + c
        else:
            merged.append(c)
    # second pass: any remaining <=2 word clause (e.g. first item) merges forward
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

all_captions = []
for seg in segments:
    clauses = split_clauses(seg["text"])
    total_chars = sum(len(c) for c in clauses)
    start = seg["start"]
    end = seg["end"]
    dur = end - start
    t = start
    for c in clauses:
        share = len(c) / total_chars if total_chars else 1 / len(clauses)
        c_dur = dur * share
        c_start = t
        c_end = t + c_dur
        all_captions.append({"text": c, "start": round(c_start, 3), "end": round(c_end, 3), "segment": seg["id"]})
        t = c_end

json.dump(all_captions, open("scripts/captions_final.json", "w"), indent=2)
print(f"wrote {len(all_captions)} caption chunks to scripts/captions_final.json")
for c in all_captions:
    print(f'{c["start"]:7.2f} - {c["end"]:7.2f}  [{c["segment"]}]  {c["text"]}')
