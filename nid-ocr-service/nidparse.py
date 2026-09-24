# -*- coding: utf-8 -*-
"""
Field extraction for Bangladesh NID cards, from OCR output.

Pure functions: nothing here imports EasyOCR, so the parser can be unit-tested on the
raw boxes an OCR engine returns without loading a model. `app.py` feeds it real boxes;
`test_nidparse.py` feeds it synthetic ones modelled on real cards.

Why this exists as its own module
---------------------------------
The previous parser flattened everything the OCR read into one string and ran regexes
over it. That fails on real cards in three specific ways, all seen on a genuine smart
card photographed sideways:

* The NID number was assembled from any 3-4 digit groups anywhere in the text, and 17
  and 13 digits were tried before 10. On a modern smart card (10 digits, printed
  "421 296 4672") a fabricated longer combination — the birth year "2000" glued to
  "421 296" — beat the real number.
* The date of birth was the first date-like thing anywhere. Smart cards print the DOB
  twice (once in the field, once inside the ghost watermark), and old cards carry other
  dates, so "first" is a coin toss.
* The English name kept every word left on the "Name" line, so a line that had merged
  with the next label came out as "ABDUR RAHMAN MAY".

The OCR engine tells us where every piece of text is and how sure it is. This parser
uses that: every field is looked for next to its printed label first, a number is
never stitched together across lines, dates and numbers are validated against each
other, and each field comes back with a confidence the form can act on.
"""
import datetime
import difflib
import re
from typing import Dict, List, Optional, Tuple

# ---------------------------------------------------------------------------
# Text normalisation
# ---------------------------------------------------------------------------

# EasyOCR with the Bangla model happily emits Bangla numerals for the printed digits.
_BN_DIGITS = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")

# Characters OCR commonly confuses for digits, applied only to tokens that are already
# mostly digits — never to words, where "O" and "I" are letters.
_DIGIT_CONFUSIONS = str.maketrans({
    "O": "0", "o": "0", "Q": "0", "D": "0",
    "I": "1", "l": "1", "|": "1", "!": "1",
    "Z": "2", "z": "2",
    "S": "5", "s": "5",
    "B": "8",
    "G": "6",
})

_MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}
_MONTH_NAMES = ["january", "february", "march", "april", "may", "june", "july",
                "august", "september", "october", "november", "december"]
_BN_MONTHS = {
    "জানুয়ারি": 1, "জানুয়ারী": 1, "ফেব্রুয়ারি": 2, "ফেব্রুয়ারী": 2, "মার্চ": 3,
    "এপ্রিল": 4, "মে": 5, "জুন": 6, "জুলাই": 7, "আগস্ট": 8, "সেপ্টেম্বর": 9,
    "অক্টোবর": 10, "নভেম্বর": 11, "ডিসেম্বর": 12,
}

_BANGLA = re.compile(r"[ঀ-৿]")
_LATIN_OR_DIGIT = re.compile(r"[A-Za-z0-9]")

# Printed on the card around the fields; never part of a name.
_HEADER_WORDS = {
    "national", "id", "card", "bangladesh", "government", "govt", "republic",
    "peoples", "people", "people's", "identity", "of", "the", "and", "for",
    "date", "birth", "dob", "nid", "no", "number", "pin", "blood", "group",
    "name", "issue", "issued", "expiry", "expires", "signature", "father",
    "mother", "spouse", "husband", "wife",
}
_BN_HEADER_WORDS = ["গণপ্রজাতন্ত্রী", "বাংলাদেশ", "সরকার", "জাতীয়", "পরিচয়", "পত্র",
                    "পরিচয়পত্র", "জন্ম", "তারিখ", "রক্তের", "গ্রুপ"]
_BN_RELATION_WORDS = ["পিতা", "মাতা", "স্বামী", "স্ত্রী"]


def normalise(text: str) -> str:
    """Bangla numerals to ASCII, whitespace collapsed."""
    return re.sub(r"\s+", " ", (text or "").translate(_BN_DIGITS)).strip()


def digitish(token: str) -> str:
    """Repair OCR letter-for-digit confusions in a token that is mostly digits."""
    core = token.strip(" .,:;")
    if not core:
        return token
    digits = sum(ch.isdigit() for ch in core)
    if digits / len(core) < 0.6:
        return token
    return core.translate(_DIGIT_CONFUSIONS)


def _only_digits(s: str) -> str:
    return re.sub(r"\D", "", s)


# ---------------------------------------------------------------------------
# Items and lines
# ---------------------------------------------------------------------------

def items_from_easyocr(results) -> List[dict]:
    """EasyOCR `readtext(detail=1)` output → items with a centre, height and confidence."""
    items = []
    for box, text, conf in results:
        xs = [float(p[0]) for p in box]
        ys = [float(p[1]) for p in box]
        text = normalise(text)
        if not text:
            continue
        items.append({
            "text": text,
            "conf": float(conf),
            "cx": sum(xs) / 4.0, "cy": sum(ys) / 4.0,
            "x0": min(xs), "x1": max(xs), "y0": min(ys), "y1": max(ys),
            "h": max(ys) - min(ys), "w": max(xs) - min(xs),
        })
    return items


def items_from_lines(lines: List[str]) -> List[dict]:
    """
    Build items from plain text lines, one item per whitespace-separated token.

    For testing the parser against an engine that returns only joined lines (the
    currently deployed service does): geometry is synthetic — the row is the line
    index, the column is the character offset — and confidence is unknown.
    """
    items = []
    for row, line in enumerate(lines):
        col = 0
        for tok in normalise(line).split(" "):
            if tok:
                items.append({
                    "text": tok, "conf": None,
                    "cx": (col + len(tok) / 2.0) * 10.0, "cy": row * 100.0,
                    "x0": col * 10.0, "x1": (col + len(tok)) * 10.0,
                    "y0": row * 100.0 - 5, "y1": row * 100.0 + 5, "h": 10.0, "w": len(tok) * 10.0,
                })
            col += len(tok) + 1
    return items


def group_lines(items: List[dict]) -> List[List[dict]]:
    """Reading-order lines: top to bottom, then left to right within a line."""
    ordered = sorted(items, key=lambda it: (it["cy"], it["cx"]))
    lines: List[List[dict]] = []
    for it in ordered:
        if lines:
            last = lines[-1]
            ref_cy = sum(x["cy"] for x in last) / len(last)
            ref_h = sum(x["h"] for x in last) / len(last)
            if abs(it["cy"] - ref_cy) <= 0.6 * max(ref_h, it["h"], 1e-6):
                last.append(it)
                continue
        lines.append([it])
    for ln in lines:
        ln.sort(key=lambda it: it["cx"])
    return lines


def line_text(line: List[dict]) -> str:
    return " ".join(it["text"] for it in line)


def _mean_conf(items: List[dict]) -> Optional[float]:
    confs = [it["conf"] for it in items if it.get("conf") is not None]
    return round(sum(confs) / len(confs), 3) if confs else None


# ---------------------------------------------------------------------------
# Labels
# ---------------------------------------------------------------------------

def _alpha(s: str) -> str:
    return re.sub(r"[^a-z]", "", s.lower())


def _fuzzy(a: str, b: str, cutoff: float) -> bool:
    return a == b or difflib.SequenceMatcher(None, a, b).ratio() >= cutoff


def labels_in(line: List[dict]) -> List[Tuple[str, int, int]]:
    """
    Every field label on this line, as (kind, label_start, value_start), left to right.

    kind is one of name / dob / nid / name_bn / dob_bn. A label may span several items
    ("Date", "of", "Birth"), so value_start is the index of the first item after the
    whole label. A line can carry more than one label when the OCR merges two printed
    rows, so callers cut each value at the next label's label_start.
    """
    n = len(line)
    texts = [it["text"] for it in line]
    found: List[Tuple[str, int, int]] = []
    taken = set()

    def claim(kind: str, i: int, j: int) -> None:
        if any(k in taken for k in range(i, j)):
            return
        taken.update(range(i, j))
        found.append((kind, i, j))

    for i, t in enumerate(texts):
        if "নাম" in t and not any(r in t for r in _BN_RELATION_WORDS):
            claim("name_bn", i, i + 1)
        elif "জন্ম" in t:
            j = i + 1
            if j < n and "তারিখ" in texts[j]:
                j += 1
            claim("dob_bn", i, j)

    for i in range(n):
        if i in taken:
            continue
        head = _alpha("".join(texts[i:i + 3]))
        if "birth" in head or head.startswith("dob") or _fuzzy(head, "dateofbirth", 0.8):
            j, consumed = i, ""
            while j < n:
                consumed += _alpha(texts[j])
                j += 1
                if "birth" in consumed or consumed.startswith("dob"):
                    break
            claim("dob", i, j)

    for i in range(n):
        if i in taken:
            continue
        a = _alpha(texts[i])
        nxt = _alpha(texts[i + 1]) if i + 1 < n else ""
        if a in ("nid", "nidno", "idno", "nidnumber", "nidn0") or _fuzzy(a, "nidno", 0.8) \
                or (a == "id" and nxt in ("no", "number", "n0")) \
                or (a == "national" and nxt == "id" and i + 2 < n and _alpha(texts[i + 2]) in ("no", "number", "n0")):
            j = i + 1
            # Consume the rest of the label ("No.", "Number") and bare punctuation such
            # as ":" — but never a digit-bearing item, which is the value itself.
            while j < n and (_alpha(texts[j]) in ("id", "no", "number", "n0")
                             or not re.search(r"[A-Za-z0-9\u0980-\u09ff]", texts[j])):
                j += 1
            claim("nid", i, j)

    for i in range(n):
        if i in taken:
            continue
        a = _alpha(texts[i])
        if len(a) >= 3 and _fuzzy(a, "name", 0.75):
            claim("name", i, i + 1)

    found.sort(key=lambda f: f[1])
    return found


def label_at(line: List[dict]) -> Tuple[Optional[str], int]:
    """The first label on the line, or (None, 0)."""
    labels = labels_in(line)
    return (labels[0][0], labels[0][2]) if labels else (None, 0)


def value_items(line: List[dict], labels: List[Tuple[str, int, int]], which: int) -> List[dict]:
    """Items that belong to label `which`: from its value_start up to the next label."""
    _, _, start = labels[which]
    end = labels[which + 1][1] if which + 1 < len(labels) else len(line)
    return line[start:end]


# ---------------------------------------------------------------------------
# NID number
# ---------------------------------------------------------------------------

_SMART_GROUPING = re.compile(r"^\d{3} ?\d{3} ?\d{4}$")
_NID_RUN = re.compile(r"(?<!\d)(\d(?:[\d ]{7,22})\d)(?!\d)")


def _nid_candidates_in(text: str, anchored: bool, same_line: bool) -> List[dict]:
    """
    Every plausible NID number in one line of text, with a score.

    Digits are only ever joined *within* the line. The previous parser combined 3-4
    digit groups from anywhere in the card text, which is how it manufactured numbers
    that were never printed.
    """
    fixed = " ".join(digitish(tok) for tok in text.split(" "))
    out = []
    for m in _NID_RUN.finditer(fixed):
        raw = m.group(1).strip()
        digits = _only_digits(raw)
        if len(digits) not in (10, 13, 17):
            continue
        score = 0.0
        if anchored:
            score += 4.0
        if same_line:
            score += 1.0
        if len(digits) == 10 and _SMART_GROUPING.match(raw):
            score += 2.0          # printed exactly as a smart card prints it
        if len(digits) in (13, 17) and " " not in raw:
            score += 1.0          # old cards print these unbroken
        if len(digits) == 17:
            year = int(digits[:4])
            if not (1900 <= year <= datetime.date.today().year):
                continue          # a 17-digit number always starts with the birth year
        # Modern smart cards are the common case now.
        score += {10: 0.3, 17: 0.2, 13: 0.1}[len(digits)]
        out.append({"digits": digits, "raw": raw, "score": score})
    return out


def find_nid(lines: List[List[dict]], dob: Optional[str]) -> Tuple[Optional[str], Optional[float], str]:
    candidates = []
    for idx, line in enumerate(lines):
        labels = labels_in(line)
        anchored_here = False
        for which, (kind, _, _) in enumerate(labels):
            if kind != "nid":
                continue
            anchored_here = True
            vals = value_items(line, labels, which)
            if vals:
                for c in _nid_candidates_in(line_text(vals), True, True):
                    c["items"] = vals
                    candidates.append(c)
            elif idx + 1 < len(lines):
                nxt = lines[idx + 1]
                for c in _nid_candidates_in(line_text(nxt), True, False):
                    c["items"] = nxt
                    candidates.append(c)
        if not anchored_here:
            for c in _nid_candidates_in(line_text(line), False, True):
                c["items"] = line
                candidates.append(c)

    if dob:
        year = dob[:4]
        ddmmyyyy = dob[8:10] + dob[5:7] + dob[:4]
        for c in candidates:
            d = c["digits"]
            if d == ddmmyyyy or d.endswith(ddmmyyyy):
                c["score"] -= 5.0     # that is the date, not the number
            if len(d) == 10 and d.startswith(year) and not c["score"] >= 4.0:
                c["score"] -= 3.0     # birth year stitched onto part of the number
            if len(d) == 17:
                c["score"] += 2.0 if d.startswith(year) else -2.0

    if not candidates:
        return None, None, "not_found"
    best = max(candidates, key=lambda c: c["score"])
    if best["score"] < 0:
        return None, None, "rejected"
    how = "label" if best["score"] >= 4.0 else "pattern"
    return best["digits"], _mean_conf(best["items"]), how


# ---------------------------------------------------------------------------
# Date of birth
# ---------------------------------------------------------------------------

def _month_from(word: str) -> Optional[int]:
    w = re.sub(r"[^a-z]", "", word.lower().replace("0", "o").replace("1", "l"))
    if len(w) < 3:
        return None
    if w[:3] in _MONTHS and (len(w) == 3 or any(name.startswith(w) for name in _MONTH_NAMES) or w == "sept"):
        return _MONTHS[w[:3]]
    # OCR mangling. A letter with the same shape and descender as the printed one is a
    # half-step ("Maj" for May, "Mav" for May); any other substitution is a full step. A
    # token is accepted only when exactly one month is within a step of it — "Maj" is one
    # half-step from May and a full step from Mar, so it is May; a token equally close to
    # two months is not guessed.
    if len(w) == 3:
        close = [m for m in _MONTHS if _month_distance(w, m) <= 0.5]
        if len(close) == 1:
            return _MONTHS[close[0]]
        return None
    for name in _MONTH_NAMES:
        if difflib.SequenceMatcher(None, w, name[:len(w)]).ratio() >= 0.8:
            return _MONTHS[name[:3]]
    return None


_HALF_STEP = {("y", "j"), ("y", "v"), ("i", "l"), ("o", "0"), ("u", "v"), ("n", "r"), ("c", "e")}


def _month_distance(a: str, b: str) -> float:
    d = 0.0
    for x, y in zip(a, b):
        if x == y:
            continue
        d += 0.5 if (x, y) in _HALF_STEP or (y, x) in _HALF_STEP else 1.0
    return d


def _valid(y: int, m: int, d: int) -> Optional[str]:
    try:
        date = datetime.date(y, m, d)
    except ValueError:
        return None
    today = datetime.date.today()
    if not (1900 <= y <= today.year) or date > today:
        return None
    return "%04d-%02d-%02d" % (y, m, d)


def _dates_in(text: str) -> List[str]:
    """Every valid date in a line, ISO formatted, in order of appearance."""
    found = []
    t = " ".join(digitish(tok) if re.search(r"\d", tok) else tok for tok in text.split(" "))
    # 17 May 2000 / 17May2000 / 17-May-2000 / 17 Sept, 2000
    for m in re.finditer(r"(\d{1,2})\s*[-/. ]?\s*([A-Za-z]{3,9})\.?,?\s*[-/. ]?\s*(\d{4})", t):
        mon = _month_from(m.group(2))
        if mon:
            v = _valid(int(m.group(3)), mon, int(m.group(1)))
            if v:
                found.append(v)
    # May 17, 2000
    for m in re.finditer(r"([A-Za-z]{3,9})\.?\s*(\d{1,2}),?\s*(\d{4})", t):
        mon = _month_from(m.group(1))
        if mon:
            v = _valid(int(m.group(3)), mon, int(m.group(2)))
            if v:
                found.append(v)
    # 17/05/2000, 17-05-2000
    for m in re.finditer(r"(?<!\d)(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?!\d)", t):
        v = _valid(int(m.group(3)), int(m.group(2)), int(m.group(1)))
        if v:
            found.append(v)
    # 2000-05-17
    for m in re.finditer(r"(?<!\d)(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?!\d)", t):
        v = _valid(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        if v:
            found.append(v)
    # Bangla month names: ১৭ মে ২০০০ (digits already ASCII after normalise)
    for name, mon in _BN_MONTHS.items():
        for m in re.finditer(r"(\d{1,2})\s*" + re.escape(name) + r"\s*(\d{4})", t):
            v = _valid(int(m.group(2)), mon, int(m.group(1)))
            if v:
                found.append(v)
    return found


def find_dob(lines: List[List[dict]], nid: Optional[str]) -> Tuple[Optional[str], Optional[float], str]:
    heights = [it["h"] for ln in lines for it in ln]
    median_h = sorted(heights)[len(heights) // 2] if heights else 0
    candidates = []
    for idx, line in enumerate(lines):
        labels = labels_in(line)
        regions = []
        for which, (kind, _, _) in enumerate(labels):
            if kind not in ("dob", "dob_bn"):
                continue
            vals = value_items(line, labels, which)
            if vals:
                regions.append((vals, 4.0))
            elif idx + 1 < len(lines):
                regions.append((lines[idx + 1], 3.0))
        regions.append((line, 0.0))
        for items, bonus in regions:
            for v in _dates_in(line_text(items)):
                score = bonus
                # The ghost watermark repeats the date in tiny type; the field is full size.
                small = median_h and (sum(it["h"] for it in items) / len(items)) < 0.6 * median_h
                if small:
                    score -= 1.0
                candidates.append({"value": v, "score": score, "items": items})
    if nid and len(nid) == 17:
        for c in candidates:
            c["score"] += 2.0 if c["value"].startswith(nid[:4]) else -2.0
    if not candidates:
        return None, None, "not_found"
    # Same date found more than once is agreement, not a tie.
    by_value: Dict[str, dict] = {}
    for c in candidates:
        cur = by_value.get(c["value"])
        if cur is None or c["score"] > cur["score"]:
            by_value[c["value"]] = dict(c)
        else:
            cur["score"] += 0.5
    best = max(by_value.values(), key=lambda c: c["score"])
    how = "label" if best["score"] >= 3.0 else "pattern"

    # Smart cards print the date a second time inside the ghost watermark. That copy is
    # usually too mangled to parse as a date, but its year survives. If that year is a
    # digit-confusion away from the year we chose ("2008" beside "2000"), the two reads
    # disagree and there is no way to tell which is right. An empty field is better than a
    # silently wrong date of birth on an identity record, so nothing is filled in.
    chosen_year = best["value"][:4]
    for line in lines:
        text = line_text(line)
        if _dates_in(text):
            continue  # a full date; that is a candidate, not a stray year
        for tok in re.findall(r"(?<!\d)(?:19|20)\d{2}(?!\d)", " ".join(digitish(t) for t in text.split(" "))):
            if tok != chosen_year and _confusable_year(tok, chosen_year):
                return None, None, "disputed"
    return best["value"], _mean_conf(best["items"]), how


_CONFUSABLE_DIGITS = {("0", "8"), ("3", "8"), ("6", "8"), ("1", "7"), ("5", "6"), ("0", "6"), ("2", "7"), ("9", "0")}


def _confusable_year(a: str, b: str) -> bool:
    """True when the two years differ in exactly one digit and that pair is one OCR mixes up."""
    diffs = [(x, y) for x, y in zip(a, b) if x != y]
    return len(diffs) == 1 and (diffs[0] in _CONFUSABLE_DIGITS or diffs[0][::-1] in _CONFUSABLE_DIGITS)


# ---------------------------------------------------------------------------
# Names
# ---------------------------------------------------------------------------

_NAME_TOKEN = re.compile(r"^[A-Za-z][A-Za-z.'\-]*$")


def _name_words(items: List[dict]) -> List[str]:
    """Words of a name, stopping at the first thing that is clearly not part of it."""
    words = []
    # A box often holds several words ("HUMAYUN AHMED"), so split each one.
    tokens = [tok for it in items for tok in it["text"].split(" ")]
    for tok in tokens:
        tok = tok.strip(" ,;:")
        if not tok:
            continue
        if _BANGLA.search(tok) or re.search(r"\d", tok) or _month_from(tok):
            break
        core = tok.replace(".", "").lower()
        if core in _HEADER_WORDS:
            break
        if not _NAME_TOKEN.match(tok) or len(core) < 2:
            continue
        words.append(tok.upper())
    return words


def find_name_en(lines: List[List[dict]]) -> Tuple[Optional[str], Optional[float], str]:
    for idx, line in enumerate(lines):
        labels = labels_in(line)
        for which, (kind, _, _) in enumerate(labels):
            if kind != "name":
                continue
            vals = value_items(line, labels, which)
            for items in (vals, lines[idx + 1] if (not vals and idx + 1 < len(lines)) else []):
                words = _name_words(items)
                if words:
                    return " ".join(words), _mean_conf(items), "label"
    # No label read: the line with the most name-like uppercase words, not a header.
    best, best_n = None, 0
    for line in lines:
        text = line_text(line)
        if _BANGLA.search(text) or re.search(r"\d", text):
            continue
        lowered = {re.sub(r"[^a-z]", "", w.lower()) for w in text.split(" ")}
        if lowered & {"republic", "card", "government", "bangladesh", "national"}:
            continue
        words = _name_words(line)
        if len(words) >= 2 and len(words) > best_n and all(w == w.upper() for w in text.split(" ")):
            best, best_n = (" ".join(words), _mean_conf(line)), len(words)
    if best:
        return best[0], best[1], "pattern"
    return None, None, "not_found"


def _bangla_words(text: str) -> List[str]:
    out = []
    for tok in text.split(" "):
        tok = tok.strip(" :।,-")
        if len(_BANGLA.findall(tok)) >= 2 and not any(h in tok for h in _BN_HEADER_WORDS + _BN_RELATION_WORDS):
            out.append(tok)
    return out


def find_name_bn(lines: List[List[dict]]) -> Tuple[Optional[str], Optional[float], str]:
    for idx, line in enumerate(lines):
        labels = labels_in(line)
        for which, (kind, _, _) in enumerate(labels):
            if kind != "name_bn":
                continue
            vals = value_items(line, labels, which)
            for items in (vals, lines[idx + 1] if (not vals and idx + 1 < len(lines)) else []):
                words = _bangla_words(line_text(items))
                if words:
                    return " ".join(words), _mean_conf(items), "label"
    for line in lines:
        text = line_text(line)
        if any(r in text for r in _BN_RELATION_WORDS):
            continue
        words = _bangla_words(text)
        if len(words) >= 2:
            return " ".join(words), _mean_conf(line), "pattern"
    return None, None, "not_found"


# ---------------------------------------------------------------------------
# Whole card
# ---------------------------------------------------------------------------

KEY_FIELDS = ("nameEn", "nidNumberRaw", "dateOfBirth")


def parse(items: List[dict]) -> dict:
    lines = group_lines(items)
    # Each of these is used to check the other, so do a first pass, then refine.
    dob, dob_conf, dob_how = find_dob(lines, None)
    nid, nid_conf, nid_how = find_nid(lines, dob)
    dob, dob_conf, dob_how = find_dob(lines, nid)
    name, name_conf, name_how = find_name_en(lines)
    name_bn, name_bn_conf, name_bn_how = find_name_bn(lines)
    fields = {"nameEn": name, "nameBn": name_bn, "nidNumberRaw": nid, "dateOfBirth": dob}
    return {
        "fields": fields,
        "confidence": {"nameEn": name_conf, "nameBn": name_bn_conf,
                       "nidNumberRaw": nid_conf, "dateOfBirth": dob_conf},
        "how": {"nameEn": name_how, "nameBn": name_bn_how, "nidNumberRaw": nid_how, "dateOfBirth": dob_how},
        "lines": [line_text(ln) for ln in lines],
        "keyFieldsFound": sum(1 for k in KEY_FIELDS if fields[k]),
    }


def orientation_score(items: List[dict], parsed: dict) -> float:
    """
    How much this reading looks like an upright card.

    Fields found dominate; readable Latin/digit text weighted by confidence breaks ties,
    so a sideways read that finds nothing but still recognises some letters loses to
    the orientation that finds the labels.
    """
    mass = 0.0
    for it in items:
        n = len(_LATIN_OR_DIGIT.findall(it["text"]))
        mass += n * (it["conf"] if it.get("conf") is not None else 0.5)
    return parsed["keyFieldsFound"] * 10.0 + mass / 100.0
