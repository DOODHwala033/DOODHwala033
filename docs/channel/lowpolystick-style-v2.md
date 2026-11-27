# Low Poly Stick · style study v2 and character design brief

## What was collected this time
- **Shorts list:** 37 Shorts with view counts (`lowpolystick-shorts.json`). Scraped with the browser, which loaded the channel list.
- **Top 5 (views):** Magnus Carlsen vs Meruem (2.8M), Sherlock vs Red John (2.7M), L vs Red John (2.4M), Gojo survives the Sun (2.4M), Sherlock vs Jeff the Killer (2.3M).
- **Limit:** individual video pages show the YouTube "not a bot" check, and the thumbnails came out mostly blank. So the visual rules below come from the frame-by-frame analysis we already have (`docs/inkman/polystick-style-analysis.md`), not a new frame study.

## Title and hook pattern
- **"Could [famous character] [beat/catch/survive] [another famous character or threat]?"** Almost every top Short uses it.
- The question asks the viewer to judge a matchup. That invites comments ("no, because...") and the reader keeps watching to see the verdict.
- Our Wheel Battle Part 2 title used "How Yamcha Actually Beats Mahoraga". The channel's version would be **"Could Yamcha Beat Mahoraga?"**. Test both.

## Visual style rules (from the analysis; still the target)
1. Smooth shading, **no outlines**, soft key light, a coloured **rim light** per set (blue for the cave, red for the shrine, warm for the desert), gentle bloom.
2. **Costume detail by colour blocking and decals**, not by mesh: belt, gloves, boots, emblem plane, seam lines.
3. **Faces with a full expression library**: sleepy half-lids, wide shock, dizzy spiral, grin, rage (red half-face + teeth), wink, smug.
4. **Hands with four fingers and a thumb**, in readable poses (relaxed, fist, point, hold).
5. **Camera:** a new angle every cut (never the same twice), 5–10% push on holds, ±15° orbit on reveals, shake for 3 frames on impact, foreground objects kept in frame.
6. **Pace:** about 1.4 s per shot. Our Part 2 averages about 2 s, so tighten the hook and the reactions.
7. **Decoration:** ゴゴゴ menace text on tension, sweat drop, anger vein, starburst on impact, ground cracks, dust, red hit tint, sparkle on reveals.

## Character design brief (applied to our characters)
| Area | Target | Current (our engine) | Next step |
|---|---|---|---|
| Face | Full expression set | Rage, teeth, smug, wide, spiral: working | Add wink and sleepy presets |
| Hands | 4 fingers + thumb, readable poses | Working (v2 hands) | Pose presets: point, hold-prop |
| Costume | Belt, emblem, gloves, seams | Flat colour + belt | Emblem plane, glove and seam decals |
| Lighting | Key + coloured rim + bloom per set | Rim light works; no bloom | Per-set rim colour presets |
| Hair | Shaped spikes with depth | Dark spikes, read as hair | Add a second tone for depth |
| Camera | Varied angle each cut | Working (camera library) | Add an orbit preset and a shake preset |
| Effects | ゴゴゴ, sweat, vein, starburst | ゴゴゴ now works (see test) | Add sweat drop and anger vein to the kit |

## Test result (`docs/channel/style-test-yamcha.png`)
- Rage face with teeth reads at phone size.
- The red rim light and the ゴゴゴ text give the channel's tension look.
- Problems: the costume is flat orange, the hands are still blocky at this camera distance, and the hair spikes look dark and uniform.
- Bug fixed on the way: the menace text was invisible on frame 0 because it fades in from zero opacity. It now starts visible.

## Next steps
1. Build the costume trim kit (emblem, glove and seam decals) and the bloom and rim presets.
2. Re-test the same still until the costume reads as detailed.
3. Use the question title format for Part 3: "Could Yamcha Beat Mahoraga?"
