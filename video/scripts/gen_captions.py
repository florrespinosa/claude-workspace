import json

words = json.load(open("scripts/aligned_words.json"))  # [text, segment_id, start, end]

MAX_WORDS = 7
SENTENCE_END = (".", "!", "?")
CLAUSE_END = (",", ":", "—")


def ends_with_any(text, suffixes):
    return any(text.rstrip().endswith(s) for s in suffixes)


def build_chunks(words):
    chunks = []
    cur = []
    for w in words:
        cur.append(w)
        text, seg_id, start, end = w
        is_sentence_end = ends_with_any(text, SENTENCE_END)
        is_clause_end = ends_with_any(text, CLAUSE_END)
        if is_sentence_end or len(cur) >= MAX_WORDS or (is_clause_end and len(cur) >= 4):
            chunks.append(cur)
            cur = []
    if cur:
        chunks.append(cur)
    return chunks


raw_chunks = build_chunks(words)

captions = []
for chunk in raw_chunks:
    seg_id = chunk[0][1]
    text = " ".join(w[0] for w in chunk)
    start = chunk[0][2]
    end = chunk[-1][3]
    word_data = [{"text": w[0], "start": round(w[2], 3), "end": round(w[3], 3)} for w in chunk]
    captions.append({
        "text": text,
        "start": round(start, 3),
        "end": round(end, 3),
        "segment": seg_id,
        "words": word_data,
    })

# extend each caption's display end to the next caption's start (within the
# same scene) so the line doesn't flicker off before the next one is ready --
# purely a display concern, the karaoke word timings above stay real/ASR-exact
for i in range(len(captions) - 1):
    if captions[i]["segment"] == captions[i + 1]["segment"]:
        captions[i]["end"] = captions[i + 1]["start"]

MIN_DUR = 0.7


def merge_short(captions):
    result = []
    for c in captions:
        if (
            result
            and result[-1]["segment"] == c["segment"]
            and (c["end"] - c["start"]) < MIN_DUR
        ):
            result[-1]["text"] += " " + c["text"]
            result[-1]["end"] = c["end"]
            result[-1]["words"] += c["words"]
        elif (
            result
            and result[-1]["segment"] == c["segment"]
            and (result[-1]["end"] - result[-1]["start"]) < MIN_DUR
            and result[-1]["end"] == c["start"]
        ):
            c["text"] = result[-1]["text"] + " " + c["text"]
            c["start"] = result[-1]["start"]
            c["words"] = result[-1]["words"] + c["words"]
            result[-1] = c
        else:
            result.append(dict(c))
    return result


captions = merge_short(captions)

json.dump(captions, open("scripts/captions_final.json", "w"), indent=2)
print(f"wrote {len(captions)} caption chunks (real ASR word timing) to scripts/captions_final.json")
for c in captions:
    print(f'{c["start"]:7.2f} - {c["end"]:7.2f}  [{c["segment"]}]  {c["text"]}')
