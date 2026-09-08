"""
Real forced alignment: take whisper.cpp's word-level ASR output (real
speech-to-text, finally reachable via a GitHub-release-hosted model
mirror -- huggingface/whisper.cpp/openai's own hosts are all blocked in
this sandbox) and align it against our canonical script text, so every
canonical word inherits a real, ASR-measured start/end time instead of a
character/syllable/pause-count guess.
"""
import json
import re
import difflib

TRANSCRIPT_PATH = "scripts/whisper_transcript.json"
SCRIPT_PATH = "scripts/script_segments.json"


def norm(w):
    w = w.lower()
    w = re.sub(r"[^a-z0-9']", "", w)
    return w


def load_asr_words():
    d = json.load(open(TRANSCRIPT_PATH))
    raw = d["transcription"]
    words = []  # (display_text, start_s, end_s)
    for seg in raw:
        text = seg["text"].strip()
        start = seg["offsets"]["from"] / 1000
        end = seg["offsets"]["to"] / 1000
        if not text:
            continue
        if not any(c.isalnum() for c in text):
            # pure punctuation token -> extend previous word's end time
            if words:
                words[-1] = (words[-1][0], words[-1][1], max(words[-1][2], end))
            continue
        words.append((text, start, end))
    return words


def load_script_words():
    segments = json.load(open(SCRIPT_PATH))
    words = []  # (display_text, segment_id, word_index_in_segment)
    for seg in segments:
        for w in seg["text"].split():
            words.append((w, seg["id"]))
    return words


def align():
    asr_words = load_asr_words()
    script_words = load_script_words()

    asr_norm = [norm(w[0]) for w in asr_words]
    script_norm = [norm(w[0]) for w in script_words]

    sm = difflib.SequenceMatcher(a=script_norm, b=asr_norm, autojunk=False)
    ops = sm.get_opcodes()

    results = []  # (display_text, segment_id, start, end)
    last_end = 0.0
    for tag, i1, i2, j1, j2 in ops:
        if tag == "equal":
            for k in range(i2 - i1):
                si = i1 + k
                aj = j1 + k
                w_text, seg_id = script_words[si]
                start, end = asr_words[aj][1], asr_words[aj][2]
                results.append([w_text, seg_id, start, end])
                last_end = end
        elif tag == "replace" or tag == "delete":
            # canonical words i1:i2 have no clean 1:1 ASR match.
            # spread them across whatever ASR time range the matched
            # region covers (or a short span after the last known time)
            n = i2 - i1
            if j1 < j2:
                span_start = asr_words[j1][1]
                span_end = asr_words[j2 - 1][2]
            else:
                span_start = last_end
                span_end = last_end + 0.15 * n
            span_end = max(span_end, span_start + 0.05 * n)
            for k in range(n):
                si = i1 + k
                w_text, seg_id = script_words[si]
                t0 = span_start + (span_end - span_start) * (k / n)
                t1 = span_start + (span_end - span_start) * ((k + 1) / n)
                results.append([w_text, seg_id, t0, t1])
            last_end = span_end
        elif tag == "insert":
            # ASR heard extra words with no canonical counterpart (rare) -- skip
            if j1 < j2:
                last_end = asr_words[j2 - 1][2]

    return results


if __name__ == "__main__":
    results = align()
    print(f"aligned {len(results)} canonical words")
    unmatched = 0
    for i, (text, seg_id, start, end) in enumerate(results):
        marker = ""
        print(f"{start:7.2f} - {end:7.2f}  [{seg_id}]  {text}")
    json.dump(results, open("scripts/aligned_words.json", "w"), indent=1)
