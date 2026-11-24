#!/usr/bin/env bash
# One-time setup of the local Kokoro voice (free, CPU, ~120 MB):  bash setup_voice.sh
# Creates ~/.venvs/kokoro with kokoro-onnx and downloads the int8 model + voices to ~/.cache/kokoro-onnx
# (GitHub release assets; no Hugging Face access needed). Re-running is safe.
set -e
VENV="${KOKORO_VENV:-$HOME/.venvs/kokoro}"; CACHE="${KOKORO_CACHE:-$HOME/.cache/kokoro-onnx}"
BASE="https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0"
mkdir -p "$CACHE" "$(dirname "$VENV")"
[ -x "$VENV/bin/python" ] || python3 -m venv "$VENV"
"$VENV/bin/pip" install -q --upgrade pip
"$VENV/bin/pip" install -q kokoro-onnx soundfile numpy
for f in kokoro-v1.0.int8.onnx voices-v1.0.bin; do [ -s "$CACHE/$f" ] || curl -sSL --fail -m 900 -o "$CACHE/$f" "$BASE/$f"; done
command -v ffmpeg >/dev/null || echo "note: ffmpeg is needed for voice.mp3"
"$VENV/bin/python" -c "from kokoro_onnx import Kokoro; Kokoro('$CACHE/kokoro-v1.0.int8.onnx','$CACHE/voices-v1.0.bin'); print('kokoro ready:', '$VENV/bin/python')"
