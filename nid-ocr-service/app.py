#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Self-hosted NID OCR microservice (EasyOCR, free, on-prem).

Reads a Bangladesh NID image — old laminated paper card or new smart card, front or
back, photographed at any angle — and returns the fields as JSON. EasyOCR's detector and
recogniser (Bangla + English) localise text in cluttered phone photos far better than
Tesseract; the field logic lives in `nidparse.py`, which is pure and unit-tested.

OCR is a pre-fill convenience only. The EC verify API remains the source of truth, and
the form lets the applicant correct every field. Images never leave this machine.

Endpoints:
  GET  /health -> {"status":"UP","loaded":bool}
  POST /ocr    -> multipart 'file' -> {ok, engine, orientation, lines, text,
                                        fields:{nameEn,nameBn,nidNumberRaw,dateOfBirth},
                                        confidence:{...}, how:{...}}
CLI:
  python app.py --test card.jpg   (runs the same pipeline once and prints the result)
"""
import io
import logging
import sys
import time

import numpy as np
from PIL import Image, ImageOps

import nidparse

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("nid-ocr")

# ---- EasyOCR reader, loaded once. It is ~1-2 GB of models; there is only ever one. ----
_reader = None


def get_reader():
    global _reader
    if _reader is None:
        import easyocr
        try:
            _reader = easyocr.Reader(["bn", "en"], gpu=False)
            log.info("EasyOCR reader ready (bn+en, CPU)")
        except Exception as e:  # pragma: no cover - environment dependent
            log.warning("bn+en reader failed (%s); falling back to en only", e)
            _reader = easyocr.Reader(["en"], gpu=False)
            log.info("EasyOCR reader ready (en, CPU)")
    return _reader


# Long side the full-resolution pass is scaled to. Card text at this size is roughly
# 300 dpi, which is where the recogniser is most accurate.
FULL_LONG_SIDE = 1600
# Long side for the orientation probe. A quarter of the pixels, so trying three extra
# rotations costs less than one full pass.
PROBE_LONG_SIDE = 800
# An upright card normally yields all three key fields from one pass. Below this the
# card is probably sideways or upside down, and the probe is worth its cost.
PROBE_IF_FEWER_THAN = 2


def load_image(raw: bytes) -> Image.Image:
    img = Image.open(io.BytesIO(raw))
    img = ImageOps.exif_transpose(img)  # honour camera rotation metadata
    img = img.convert("RGB")
    # Mild contrast stretch helps washed-out laminate; it does not touch sharp scans.
    return ImageOps.autocontrast(img, cutoff=1)


def scaled(img: Image.Image, long_side: int) -> np.ndarray:
    w, h = img.size
    longest = max(w, h)
    if longest != long_side:
        s = float(long_side) / longest
        img = img.resize((max(1, int(w * s)), max(1, int(h * s))), Image.LANCZOS)
    return np.array(img)


def read(reader, arr: np.ndarray, **kw):
    results = reader.readtext(arr, detail=1, paragraph=False, **kw)
    items = nidparse.items_from_easyocr(results)
    return items, nidparse.parse(items)


def recognise(reader, img: Image.Image) -> dict:
    """
    OCR the card in whichever orientation reads best.

    EXIF only fixes how the camera was held. A card lying sideways on the desk — the
    common failure — needs the page itself rotated. The upright case pays for a single
    pass; only when that finds fewer than two of the three key fields do we probe the
    other three rotations at low resolution and re-read the winner at full size.
    """
    t0 = time.time()
    items, parsed = read(reader, scaled(img, FULL_LONG_SIDE))
    best = {"rotation": 0, "items": items, "parsed": parsed,
            "score": nidparse.orientation_score(items, parsed)}
    probed = False

    if parsed["keyFieldsFound"] < PROBE_IF_FEWER_THAN:
        probed = True
        small = img.copy()
        small.thumbnail((PROBE_LONG_SIDE, PROBE_LONG_SIDE), Image.LANCZOS)
        probe_scores = {0: best["score"]}
        for rot in (90, 180, 270):
            p_items, p_parsed = read(reader, np.array(small.rotate(rot, expand=True)))
            probe_scores[rot] = nidparse.orientation_score(p_items, p_parsed)
        winner = max(probe_scores, key=probe_scores.get)
        log.info("orientation probe: %s -> %d", {k: round(v, 1) for k, v in probe_scores.items()}, winner)
        if winner != 0:
            items, parsed = read(reader, scaled(img.rotate(winner, expand=True), FULL_LONG_SIDE))
            best = {"rotation": winner, "items": items, "parsed": parsed,
                    "score": nidparse.orientation_score(items, parsed)}

    # The number is the field that matters most and the one glare hurts most. If it is
    # still missing, a pass restricted to digits and spaces reads faint numerals that a
    # mixed-alphabet pass mistakes for letters.
    rescued = False
    if not best["parsed"]["fields"]["nidNumberRaw"]:
        arr = scaled(img.rotate(best["rotation"], expand=True) if best["rotation"] else img, FULL_LONG_SIDE)
        d_items, _ = read(reader, arr, allowlist="0123456789 ")
        merged = best["items"] + d_items
        reparsed = nidparse.parse(merged)
        if reparsed["fields"]["nidNumberRaw"]:
            rescued = True
            best["items"], best["parsed"] = merged, reparsed

    out = dict(best["parsed"])
    out["orientation"] = best["rotation"]
    out["probed"] = probed
    out["digitsRescue"] = rescued
    out["elapsedMs"] = int((time.time() - t0) * 1000)
    return out


# ---------------------------------------------------------------------------
# HTTP
# ---------------------------------------------------------------------------

def build_app():
    from fastapi import FastAPI, File, UploadFile
    from fastapi.responses import JSONResponse

    api = FastAPI(title="NID OCR Service", version="2.0.0")

    @api.on_event("startup")
    def _warmup():
        import threading
        threading.Thread(target=get_reader, daemon=True).start()

    @api.get("/health")
    def health():
        return {"status": "UP", "service": "NID OCR", "loaded": _reader is not None}

    @api.post("/ocr")
    async def ocr(file: UploadFile = File(...)):
        try:
            raw = await file.read()
            if not raw:
                return JSONResponse({"ok": False, "error": "empty file"}, status_code=400)
            result = recognise(get_reader(), load_image(raw))
            fields = result["fields"]
            log.info("OCR done: rotation=%d probed=%s rescue=%s lines=%d fields=%s in %dms",
                     result["orientation"], result["probed"], result["digitsRescue"],
                     len(result["lines"]), {k: bool(v) for k, v in fields.items()}, result["elapsedMs"])
            return {
                "ok": True,
                "engine": "easyocr",
                "orientation": result["orientation"],
                "lines": result["lines"],
                "text": " ".join(result["lines"]),
                "fields": fields,
                "confidence": result["confidence"],
                "how": result["how"],
            }
        except Exception as e:  # pragma: no cover
            log.exception("OCR failed")
            return JSONResponse({"ok": False, "error": str(e)}, status_code=500)

    return api


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "--test":
        import json
        with open(sys.argv[2], "rb") as fh:
            res = recognise(get_reader(), load_image(fh.read()))
        print(json.dumps({k: res[k] for k in ("orientation", "probed", "digitsRescue", "elapsedMs",
                                                "fields", "confidence", "how")},
                         ensure_ascii=False, indent=2))
        for i, line in enumerate(res["lines"]):
            print("  L%02d %s" % (i, line))
        sys.exit(0)
    print("usage: python app.py --test <image>   (serve with: uvicorn app:app)")
    sys.exit(1)

app = build_app()
