# NID OCR service

On-prem EasyOCR microservice that pre-fills name, NID number and date of birth from a
photo of a Bangladesh NID card. The portal's `/api/nid-ocr` route proxies to it; if it
is down the browser falls back to Tesseract (`src/lib/nid-ocr.ts`).

* `app.py` — HTTP service and orientation/rescue pipeline.
* `nidparse.py` — field extraction from OCR boxes. Pure Python, no model needed.
* `test_nidparse.py` — `python3 -m unittest -v` (runs anywhere, ~40 ms).
* `nid-ocr.service`, `setup.sh` — how it runs on the host.

## Where it runs

On the LXD **host** (`114.130.145.75`), not in a container, as `nid-ocr.service`,
bound to the bridge address `10.10.194.1:7002` so the `Services` container can reach
it and the public NIC cannot. The portal's `.env` in the container points at it with
`NID_OCR_SERVICE_URL=http://10.10.194.1:7002`.

## Deploy

```sh
scp -P 40001 app.py nidparse.py telcobright@114.130.145.75:/home/telcobright/nid-ocr-service/
ssh -p 40001 telcobright@114.130.145.75 'cd nid-ocr-service && ./venv/bin/python -m unittest -q && sudo systemctl restart nid-ocr && sleep 20 && curl -s http://10.10.194.1:7002/health'
```

A restart reloads the models (~1–2 GB). Check `free -m` first on that box: it runs
several VMs, MySQL and FreeSWITCH and has been seen with under 1.5 GB available.

## Try it on one image without touching the service

```sh
./venv/bin/python app.py --test /path/to/card.jpg
```

This loads a second copy of the models, so only do it when memory allows.

## Cost

An upright card is one recognition pass. A sideways or inverted card costs three extra
low-resolution passes plus one more full pass. A card whose number is not found costs
one more digits-only pass. Everything is CPU; expect a few seconds per pass.
