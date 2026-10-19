#!/usr/bin/env bash
# Adds the script-elements pipeline to an aiTrends 2D Studio install:  bash install.sh /path/to/aitrends-2d-studio
set -e
STUDIO="${1:-aitrends-2d-studio}"; KIT="$(cd "$(dirname "$0")/../kit" && pwd)"
[ -f "$STUDIO/render.mjs" ] || { echo "not a studio folder: $STUDIO"; exit 1; }
cp "$KIT/tools/elements.py" "$KIT/tools/element_sheet.mjs" "$STUDIO/tools/"
cp "$KIT/engine/elements.js" "$STUDIO/engine/"
python3 - "$STUDIO/engine/player.js" <<'PY'
import sys; p=sys.argv[1]; s=open(p).read()
if "autoElements" not in s:
    s=s.replace("import { captions } from './ui2d.js';","import { captions } from './ui2d.js';\nimport { registerElements, autoElements } from './elements.js';",1)
    s=s.replace("  const list = await (await fetch(`/__manifest`)).json();","  try { const el = await import(`${PROJ}/scenes/_elements.gen.js`); registerElements(el.ELEMENTS, el.MENTIONS); } catch {}   // script elements\n  const list = await (await fetch(`/__manifest`)).json();",1)
    s=s.replace("  applyGrade(W, H);","  if (E.cfg.elements?.auto) { mg.setTransform(E.PX, 0, 0, E.PX, 0, 0); autoElements(mg, t, E.cfg.elements); mg.setTransform(1, 0, 0, 1, 0, 0); }\n  applyGrade(W, H);",1)
    open(p,"w").write(s); print("player.js patched")
else: print("player.js already patched")
PY
(cd "$STUDIO" && npm install --no-audit --no-fund @iconify-json/fluent-emoji-flat@1.2.6 @iconify-json/game-icons@1.2.4 @iconify-json/tabler@1.2.42 >/dev/null)
echo "script-elements installed into $STUDIO"
