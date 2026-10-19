#!/usr/bin/env bash
# Installs the Open Higgsfield AI web studio (optional — kie.py needs only Python).  bash install.sh [dir]
set -e
DIR="${1:-$HOME/open-higgsfield-ai}"
[ -d "$DIR/.git" ] || git clone --depth 1 https://github.com/Autom8AI/Open-Higgsfield-AI.git "$DIR"
cd "$DIR" && ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm install --no-audit --no-fund >/dev/null && npx vite build >/dev/null
echo "Open Higgsfield AI installed in $DIR — run: cd $DIR && npx vite --host  (then open http://localhost:5173, paste your kie.ai key in Settings)"
