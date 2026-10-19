---
name: script-elements
description: Find every object/element a video script mentions (fire, phone, mammoth, money, rocket…) and generate a matching code-drawn 2D vector asset for each, in parallel with the story breakdown, so shots can draw them and they automatically pop in on the spoken word. Use whenever making or upgrading a 2D/stick-figure video (aiTrends 2D Studio, stickman series), or when the user asks for "elements", "props", "icons", "objects from the script", "make it more engaging/interactive", "pop-ups when I say X".
---

# Script elements → 2D vector assets

Every element is real vector code (Canvas Path2D), not an image: it scales to 4K, recolours with the style, takes rim light, animates. Sources (open source, npm): **Microsoft Fluent Emoji Flat** (MIT, ~1,500 colour objects), **Game-Icons.net** (CC BY 3.0, ~4,100 silhouettes), **Tabler** (MIT, ~6,000 line icons). Credits are written to `ELEMENT_CREDITS.md` per project — keep CC BY attribution in the video description when game-icons are used.

## Install (once per studio)
`bash <skill-dir>/scripts/install.sh <path>/aitrends-2d-studio` — copies `tools/elements.py`, `tools/element_sheet.mjs`, `engine/elements.js`, patches `engine/player.js`, installs the icon packs. Safe to re-run (re-run after updating the studio kit).

## Workflow — run it in parallel with the story
As soon as the script/timeline exists (after `parse_script.py` / `transcribe.py`), and **while** writing `story/bible.md` and `shots.json`:
1. **Find elements** (you, from the script): every concrete noun, object, symbol, number-thing or idea that can be shown. 8–20 per minute. For abstract words pick a visual stand-in (willpower → flexed-biceps, freedom → dove, money/collecting → money-bag, time → hourglass, idea → light-bulb, danger → warning, love → red-heart, growth → chart-increasing, upgrade → gem-stone).
   Write `projects/<slug>/story/elements.in.json`:
   `[{"name":"fire","words":["fire","fire's"],"query":["fire"],"mode":"color","auto":true}, ...]`
   - `words`: spoken forms that trigger the pop-in (plural/possessive are matched automatically)
   - `query`: icon names to try, best first (Fluent/emoji names like `mobile-phone`, `money-bag`, `rocket`, `crescent-moon`; game-icons names like `campfire`, `caveman`, `mammoth`)
   - `mode`: `color` (default, engaging), `silhouette` (matches stick figures, with rim light), `line`
   - `auto:false` = available to shots but no automatic pop-in
2. Start the generator **in the background** right away and keep writing the story:
   `python tools/elements.py --project projects/<slug> --sfx` (add `--auto` to also catch exact object names you missed). It prints each element → icon and the times it is spoken; `no icon found` = try other `query` names or draw it by hand.
3. Preview: `node tools/element_sheet.mjs --project projects/<slug>` → open `build/elements_sheet.png` (colour / silhouette / line per element). Swap any bad pick by editing `query` and re-running.

## Use in the video
- **Automatic pop-ins** (engagement layer): in `config.json` set `"elements": {"auto": true, "hold": 1.4}` (options: `size`, `mode`, `glow`, `only: [names]`, `perElement`). Each element pops (outBack + bob) in a glowing badge in the upper safe area at the moment its word is spoken; `--sfx` added matching `pop` cues to `shots.json`. Turn off for a shot with `"elements": false` on that shot (e.g. title card, a shot that already shows the object big).
- **Inside shots** (props, inserts, diagrams, thought bubbles, data cards):
  ```js
  import { drawElement, popElement } from '/engine/elements.js';
  drawElement(g, 'rock', x, GY - 80, 160, { mode: 'silhouette', rim: { color: M.rim, dir: [0, -1] }, shadow: true });
  popElement(g, t, 'money-bag', x, y, 140, { at: wordTime('collecting', info.shot.start) - info.shot.start, glow: true });
  ```
  Ideas that make videos feel interactive: thought bubble with the element when a character thinks of it; element flying from a hand into a pile; three elements stacking for a list; an element cracking/shaking on "lost/broken"; a blueprint (`mode:'blueprint'`) version in explainer segments.
- Draw by hand (sets/*.js) anything that must be a story prop the characters physically handle, so it matches the set exactly; use elements for emphasis, symbols, inserts and graphics.

## QC
Contact sheet after enabling: badges must not cover faces or captions (they sit in the upper third), ≤ 2 on screen, the right element on the right word, and not every single noun — the narration's key 1–2 nouns per sentence.
