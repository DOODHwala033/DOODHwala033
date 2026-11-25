#!/usr/bin/env bash
# One-time setup for motion_probe.py (reference-video camera/motion analysis):  bash setup_motion.sh
# Creates ~/.venvs/motion with opencv-python-headless + numpy + pillow (PyPI only; no browser, no network access to video sites).
set -e
VENV="${MOTION_VENV:-$HOME/.venvs/motion}"; mkdir -p "$(dirname "$VENV")"
[ -x "$VENV/bin/python" ] || python3 -m venv "$VENV"
"$VENV/bin/pip" install -q --upgrade pip
"$VENV/bin/pip" install -q opencv-python-headless numpy pillow
command -v ffmpeg >/dev/null && command -v ffprobe >/dev/null || echo "note: ffmpeg + ffprobe are required"
"$VENV/bin/python" -c "import cv2; print('motion probe ready:', '$VENV/bin/python', 'opencv', cv2.__version__)"
