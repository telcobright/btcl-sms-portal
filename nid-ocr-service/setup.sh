#!/usr/bin/env bash
# Set up the NID OCR microservice in a venv (CPU-only torch to keep it small/fast).
set -euo pipefail
APP_DIR="/home/telcobright/nid-ocr-service"
cd "$APP_DIR"

echo "[1/4] Creating venv..."
python3 -m venv venv
. venv/bin/activate
python -m ensurepip --upgrade
pip install --upgrade pip wheel

echo "[2/4] Installing CPU-only torch/torchvision..."
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

echo "[3/4] Installing EasyOCR + web deps..."
pip install easyocr fastapi "uvicorn[standard]" python-multipart opencv-python-headless pillow numpy

echo "[4/4] Pre-downloading EasyOCR models (bn+en)..."
python - <<'PY'
import easyocr
try:
    easyocr.Reader(["bn","en"], gpu=False)
    print("models ready: bn+en")
except Exception as e:
    print("bn+en failed:", e, "-> downloading en only")
    easyocr.Reader(["en"], gpu=False)
    print("models ready: en")
PY
echo "DONE."
