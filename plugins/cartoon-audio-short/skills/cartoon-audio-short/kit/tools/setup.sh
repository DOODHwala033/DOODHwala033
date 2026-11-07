#!/usr/bin/env bash
# Creates a new short project:  bash <skill>/kit/tools/setup.sh <project_dir>
# Needs: node >= 22.6 (type stripping), python3 + numpy + Pillow, ffmpeg, Playwright Chromium.
# Uses the vendored three.js r160 and toon.ts in kit/vendor (no network). Falls back to npm / git if they are missing.
set -e
KIT="$(cd "$(dirname "$0")/.." && pwd)"; P="${1:?project dir}"
mkdir -p "$P/web/lib" "$P/work" "$P/stills" "$P/out"; P="$(cd "$P" && pwd)"
cp "$KIT"/engine/*.js "$KIT"/engine/index.html "$P/web/"
cp "$KIT"/example/soldier/story.js "$P/web/story.js"        # starting point: rewrite for the new story
cp "$KIT"/example/soldier/audio.py "$P/audio.py"            # starting point: rewrite the cue table
cp "$KIT"/tools/*.mjs "$KIT"/tools/*.py "$KIT"/tools/finish.sh "$P/"
TMP="$(mktemp -d)"
# three.js r160 (module build): vendored -> npm -> sparse git clone
if [ -f "$KIT/vendor/three.module.js" ]; then cp "$KIT/vendor/three.module.js" "$P/web/lib/"
else
  ( cd "$TMP" && npm pack three@0.160.0 >/dev/null 2>&1 && tar xzf three-0.160.0.tgz && cp package/build/three.module.js "$P/web/lib/" ) \
  || ( cd "$TMP" && git clone -q --depth 1 --filter=blob:none --sparse --branch r160 https://github.com/mrdoob/three.js _t3 && cd _t3 && git sparse-checkout set build && cp build/three.module.js "$P/web/lib/" )
fi
# toon base: the Pen / head / face library from mromidev/claude-animated-shorts (MIT), types stripped
TOON="$KIT/vendor/toon.ts"
if [ ! -f "$TOON" ]; then git clone -q --depth 1 https://github.com/mromidev/claude-animated-shorts "$TMP/_cas" && TOON="$TMP/_cas/templates/bridge/toon.ts"; fi
node --no-warnings -e "const m=require('node:module'),fs=require('fs');fs.writeFileSync(process.argv[2],m.stripTypeScriptTypes(fs.readFileSync(process.argv[1],'utf8'),{mode:'transform'}))" "$TOON" "$P/web/toonbase.js"
cat "$P/web/toonbase.js" "$P/web/roman.js" > "$P/web/toon.js"
rm -rf "$TMP"
# playwright: use a global install if there is one
mkdir -p "$P/node_modules"; [ -e "$P/node_modules/playwright" ] || ln -sf "$(npm root -g)/playwright" "$P/node_modules/playwright"
echo "ready: $P   (after editing cast code run: cat web/toonbase.js web/roman.js > web/toon.js)"
