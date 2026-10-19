#!/usr/bin/env bash
# Installs the offline voice generator: kokoro-onnx (Apache-2.0) + model files from its GitHub releases.
set -e
DIR="${KOKORO_DIR:-$HOME/.local/share/kokoro}"
REL=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
python3 -m pip install -q kokoro-onnx soundfile 2>/dev/null || python3 -m pip install -q --break-system-packages kokoro-onnx soundfile
command -v ffmpeg >/dev/null || echo "note: ffmpeg not found — WAV output works, MP3 output and muxing need ffmpeg"
mkdir -p "$DIR"
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -s "$DIR/$f" ] || { echo "downloading $f"; curl -fSL -o "$DIR/$f" "$REL/$f"; }
done
python3 -c "import kokoro_onnx" && echo "voiceover-generator ready ($DIR)"
