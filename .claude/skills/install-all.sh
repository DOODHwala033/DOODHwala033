#!/usr/bin/env bash
# Installs every skill in this folder for all sessions on this machine (~/.claude/skills) and fetches their tools.
#   bash .claude/skills/install-all.sh            (run from the repo root, or put it in the cloud environment's setup script)
set -e
SRC="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$HOME/.claude/skills"
for d in "$SRC"/*/; do n=$(basename "$d"); rm -rf "$HOME/.claude/skills/$n"; cp -r "$d" "$HOME/.claude/skills/$n"; echo "skill: $n"; done
# voiceover-generator: Kokoro TTS (pip + ~350 MB model from GitHub releases)
bash "$HOME/.claude/skills/voiceover-generator/scripts/install.sh" || echo "voiceover-generator: install failed (check network)"
echo "Done. open-higgsfield needs KIE_API_KEY and network access to api.kie.ai; script-elements installs into an aiTrends studio with its own install.sh."
