// Builds docs/ep41/EP41_Storyboard_v2.pdf (corrected storyboard) from the
// real VO timing. Usage: node scripts/ep41_storyboard.mjs
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");

const root = process.cwd();
const ts = fs.readFileSync("src/EP41/timing.ts", "utf8");
const LS = eval(ts.match(/LINE_STARTS = (\[[\s\S]*?\])/)[1]);
const DUR = +ts.match(/DURATION = (\d+)/)[1] / 30;
const lines = fs.readFileSync("public/ep41/script.txt", "utf8").split("\n").map((l) => l.trim()).filter(Boolean);
const fmt = (s) => `0:${String(Math.floor(s)).padStart(2, "0")}.${String(Math.round((s % 1) * 10)).slice(0, 1)}`;

// [beat, visual, camera, physics/biology]
const S = [
  ["B1 Hook", "Roulette wheel snaps to SUKUNA: one impulse, friction decay, 1-frame overshoot click, segment lights.", "Locked. One 6-frame ease-out push on the words, then frozen.", "Clicks fire only when a segment edge actually passes the pointer."],
  ["B1 Hook", "Extreme wide of the shrine on black water. Red range ring expands and stops dead at the frame edge; '200 m' label.", "Locked-off.", "Shockwave boundary, not a projectile: constant speed, hard stop (bass hit)."],
  ["B2 Verdict", "Shrine manifests out of the dark: bells swing, impact rings spread, Sukuna (true form) on the steps.", "One continuous crane-down, high angle to eye level, ease-in-out.", "Bells are pendulums: fixed period, ~8% decay per swing."],
  ["B2 Verdict", "Upper arm pair forms the domain seal at the chest (lower pair hangs), holds, releases; cursed-energy pulse ripples out.", "Low angle, slow drift, ends locked.", "4-6 frame anticipation, overshoot <= 3 frames; pulse travels at constant speed."],
  ["B3 Rule", "POV inside the domain: look left, look right, open darkness, faint boundary ahead. POV hands rise, then drop.", "POV head-turn ~90deg in ~1.2 s (human neck speed), breathing sway.", "Breathing ~12/min sets the sway; no random jitter."],
  ["B3 Rule", "A broken pillar you could hide behind gets a red X.", "POV, small push.", "Hiding doesn't help: the hit is sure-hit inside the range."],
  ["B3 Rule", "Facing the boundary shimmer far ahead: no wall anywhere.", "POV, slow push.", "Open barrier = no physical wall to break."],
  ["B4 Mechanic", "Side tracking of the runner (you) in panic form. HUD EXIT DISTANCE 200 m starts counting.", "Constant-speed tracking.", "Panic run, not athlete form."],
  ["B4 Mechanic", "Cuts manifest ON the ground around the runner: 1-frame flash, 2-frame hold, separation, debris falls straight down, water rings.", "Tracking continues; the world shakes, not the camera.", "Slashes don't travel; no wind inside the domain."],
  ["B4 Mechanic", "Cursed-energy silhouette raises a guard (deliberately too slow). Cleave lines appear on the forearms, then through; the figure breaks into embers.", "Constant-speed track; the camera does NOT flinch.", "Cleave adapts to the target's toughness and cursed energy. Kept non-gore: the silhouette is pure cursed energy."],
  ["B4 Mechanic", "A stone pillar is diced by Dismantle into an even grid of cubes that slide apart and fall.", "Locked wide so the dice read cleanly.", "Fixed-output cut for things without cursed energy = clean grid."],
  ["B5 Binding vow", "FREEZE mid-slash for 12 frames (desaturated, all SFX cut), then pull up into the map view; ring with GAP draws on.", "12-frame hold, then slow top-down pull-back. No shake.", "Explainer beat: absolute stability."],
  ["B5 Binding vow", "Cut-in: Sukuna's hand opens from the seal, fingers relaxing, held unnaturally still (only breath).", "Locked close-up.", "Stillness = menace."],
  ["B5 Binding vow", "Map: ring breathes outward 140 -> 200 m; 'ESCAPE ROUTE' at the gap; 'SURE-HIT RANGE'. HUD OPEN BARRIER -> RANGE EXPANDED.", "Locked top-down.", "Smooth ease-in-out scale; the gap never closes."],
  ["B5 Binding vow", "Map holds at 200 m; label punch.", "Locked top-down.", ""],
  ["B5 Binding vow", "Map: ring turned DOWN to 140 m; receipt stamps in: SHIBUYA 140 m.", "Locked top-down.", "Same dial, turned down by choice; no motive claimed."],
  ["B5 Binding vow", "Sukuna on the steps, smug; ring at 140 m on the water; '140 METERS'.", "Slow push.", ""],
  ["B6 Escape", "POV sprint toward the shimmer; arms pump in the lower corners. Live counter 200.", "Running POV: bob = step rate ~3.7 Hz, roll +-1.5deg, speed lines.", "One vertical bob per STEP (not 7.4 Hz)."],
  ["B6 Escape", "Dismantle cuts the terrain beside you, left then right. Counter -> 200.", "Running POV, FOV widens slightly.", "Slashes appear where the ground is; they don't chase."],
  ["B6 Escape", "Low front tracking: you sprint at camera, cuts land behind. Counter -> 100.", "Low tracking, constant speed.", ""],
  ["B6 Escape", "Your hand throws forward, reaching; gasp. Counter -> 50.", "Running POV.", "The gasp is physiological (HR 180+ bpm)."],
  ["B6 Escape", "The shimmer fills the frame. Counter -> 25.", "Bob steadies: the last push.", ""],
  ["B6 Escape", "A cut lands right beside you; red flash. Counter -> 10.", "Running POV, steadiest bob.", ""],
  ["B7 Loop", "You pass through the shimmer: white flash, then empty dark. Counter 0. STATUS: ESCAPED.", "Dead locked-off after the crossing.", ""],
  ["B7 Loop", "Exhausted: bent over, arms hanging, trembling hands, fast breathing. [0.45 s TRUE silence after the word]", "Dead locked-off.", "Post-sprint recovery posture; tremor = adrenaline + fatigue."],
  ["B7 Loop", "Reverse angle: far behind you a single bell, a second shrine fades up out of the black. NEW DOMAIN DETECTED.", "Locked reverse shot (no head-turn pan).", ""],
  ["B7 Loop", "The new shrine's mouth opens; its pulse rolls toward you.", "Slow 10% push-in in the final second only.", ""],
  ["B8 Punch", "Vessel form (Yuji's body) stands bored at the wheel's edge; Sukuna's segment still glows.", "Locked, slight push.", ""],
  ["B8 Punch", "Close on the vessel's half-lidded smirk.", "Locked, slight push.", ""],
  ["B8 Punch", "One finger taps the rim: 4-frame anticipation, 3-frame settle; wheel nudges and stops dead inside 1 s.", "Locked-off.", "Single impulse + exponential friction decay."],
  ["B8 Punch", "End card: SPIN AGAIN. NEXT CHARACTER: ?", "Locked, slow push.", ""],
];

const FIXES = [
  ["Timing", "Beat 1 put 10 words in 0:00-0:02 (impossible at speaking pace).", "All 31 shots re-timed from the real VO word timestamps (cuts land 3 frames before each line)."],
  ["Script consistency", "'Two hundred meters' (B1) vs 'nearly two hundred' (B5).", "B5 now says 'all the way to two hundred meters': 200 m is the maximum, stated once and consistently."],
  ["Physics", "Sprint bob '~3.7 steps/s -> 7.4 Hz'.", "Vertical bob = step frequency (~3.7 Hz), one oscillation per step."],
  ["Physics", "'~2.4 m per stride' at top speed.", "2.4 m is an elite STEP (stride ~ 4.8 m). Motion timing uses step length; a panicked adult's is shorter."],
  ["Point of view", "B6 'the slashes are NOT chasing him'.", "Second person throughout: 'chasing you'."],
  ["Camera logic", "B7: 'ZERO movement' camera, yet the shrine appears 'behind you' and 'before the head turns'.", "Split into a locked forward shot and a locked reverse angle; no head-turn pan."],
  ["Character", "B2 'raises both hands' while Sukuna has four arms.", "Upper pair forms the seal; lower pair hangs (secondary motion)."],
  ["Lore precision", "'Distance to the edge is the only defence.'", "'...for someone with no domain or barrier technique'; canon counters (Simple Domain, Domain Amplification) exist."],
  ["Audio", "'Freeze-frame cut of ALL sound for 12 frames' would clip the VO line that starts in that window.", "All SFX and music cut for 12 frames; the VO is kept."],
  ["Voice", "Kokoro am_michael + atempo 1.18 (time-stretch artifacts); repo's main voice is ElevenLabs.", "ElevenLabs was out of credits for this take, so Kokoro am_michael at native speed 1.12 (no atempo) was used. Word captions come from Kokoro's own timestamps."],
  ["Safety", "Cleave severing a body could breach YouTube violence guidance.", "The target is a pure cursed-energy silhouette that breaks into embers: no gore."],
  ["Paperwork", "Sign-off 'verified Nov 27, 2026' is dated in the future.", "Re-dated to the build date."],
  ["Style", "Spec asked for a realistic build; the creator then chose the InkMan low-poly style.", "Built in the InkMan style (same as Gojo vs Makima), keeping the storyboard's palette, HUD, physics and camera rules."],
];

const img = (p) => "data:image/" + (p.endsWith(".jpg") ? "jpeg" : "png") + ";base64," + fs.readFileSync(p).toString("base64");
const font = (p) => "file://" + path.join(root, "node_modules", p);

const rows = S.map((s, i) => {
  const t0 = LS[i];
  const t1 = i + 1 < LS.length ? LS[i + 1] : DUR;
  return `<tr><td class="n">S${String(i + 1).padStart(2, "0")}</td><td class="tm">${fmt(t0)}<br>${fmt(t1)}</td><td><b>${s[0]}</b><div class="vo">"${lines[i]}"</div></td><td>${s[1]}</td><td>${s[2]}</td><td class="ph">${s[3]}</td></tr>`;
}).join("");

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Anton;src:url(${font("@fontsource/anton/files/anton-latin-400-normal.woff2")})}
@font-face{font-family:Montserrat;font-weight:400;src:url(${font("@fontsource/montserrat/files/montserrat-latin-400-normal.woff2")})}
@font-face{font-family:Montserrat;font-weight:800;src:url(${font("@fontsource/montserrat/files/montserrat-latin-800-normal.woff2")})}
@page{size:A4;margin:14mm 12mm}
body{font-family:Montserrat;font-size:9.4pt;color:#1c1c1f;line-height:1.38}
h1{font-family:Anton;font-size:30pt;line-height:1.05;margin:0}h1 span{color:#9F1C25}
h2{font-family:Anton;font-size:15pt;border-bottom:2px solid #9F1C25;padding-bottom:3px;margin:18px 0 8px;letter-spacing:.5px}
.sub{color:#555;margin:6px 0 12px}
.spec{background:#151619;color:#ddd;border-radius:10px;padding:10px 14px;display:grid;grid-template-columns:110px 1fr;gap:5px 12px}
.spec b{color:#fff}
table{width:100%;border-collapse:collapse;font-size:8.2pt}
th{background:#151619;color:#fff;font-weight:800;text-align:left;padding:5px}
td{border-bottom:1px solid #ddd;padding:5px;vertical-align:top}
tr{page-break-inside:avoid}
.n{font-family:Anton;font-size:11pt;color:#9F1C25}.tm{white-space:nowrap;color:#666}.vo{color:#9F1C25;font-style:italic;margin-top:2px}.ph{color:#555}
.fix td:first-child{font-weight:800;white-space:nowrap}
.refs{display:flex;gap:10px}.refs img{height:190px;border-radius:8px}
.cap{font-size:8pt;color:#555}
.note{border:1px dashed #9F1C25;border-radius:8px;padding:8px 12px}
</style></head><body>
<h1>EP41 · POWER ROULETTE 001<br>THE 200-METER <span>DEATH ZONE</span> — v2</h1>
<div class="sub">InkRush · Character: <b>Ryomen Sukuna</b> · Power: Domain Expansion — Malevolent Shrine · second-person survival explainer · Runtime <b>${DUR.toFixed(1)} s</b> · VO 146 words · corrected and rebuilt ${new Date().toISOString().slice(0, 10)}</div>
<div class="spec">
<b>Format</b><span>1080×1920 · 30 fps · H.264 · 31 shots, one per VO line (avg ${(DUR / 31).toFixed(1)} s per shot)</span>
<b>Style</b><span>InkMan low-poly 3D (same engine as Gojo vs Makima): one base body re-skinned, face decals, neon/void grade, effects kit, yellow word captions</span>
<b>Palette</b><span>Void #101114 · accent red #9F1C25 · paper #D5D7D4 · ghost grey #C0C0BE</span>
<b>Type</b><span>Anton (HUD, numbers, end card) + Montserrat ExtraBold (status line); captions: house yellow word captions</span>
<b>VO</b><span>Kokoro am_michael, speed 1.12 (no atempo); 0.45 s true silence after "Silence." · master −14.8 LUFS, true peak ≤ −1.0 dB · drone 0.12 · SFX 0.5</span>
<b>Cast</b><span>Sukuna true form (bare torso + tattoo bands, cream robe + black obi, pink hair, marks, four eyes, lower arm pair) · Sukuna in Yuji's vessel (black uniform, red hood, gold buttons) · you (runner + POV arms) · cursed-energy silhouette</span>
<b>HUD</b><span>Persistent top pill POWER ROULETTE · MALEVOLENT SHRINE + per-beat status line · live EXIT DISTANCE counter (S08–S11 static, S18–S24 live 200 → 0)</span>
</div>

<h2>WHAT WAS RECTIFIED (v1 → v2)</h2>
<table class="fix"><tr><th>Area</th><th>Issue in v1</th><th>Fix in v2</th></tr>
${FIXES.map((f) => `<tr><td>${f[0]}</td><td>${f[1]}</td><td>${f[2]}</td></tr>`).join("")}</table>

<h2>CORRECTED VO SCRIPT</h2>
<div class="note">${fs.readFileSync("public/ep41/vo.txt", "utf8").trim().split("\n").map((l) => `<p style="margin:4px 0">${l}</p>`).join("")}</div>

<h2>REFERENCES (build only; never pasted into the video)</h2>
<div class="refs"><img src="${img("docs/ep41/ref-sukuna-heian.png")}"><img src="${img("docs/ep41/ref-sukuna-vessel.png")}"><img src="${img("docs/ep41/ref-shrine.png")}"></div>
<div class="cap">Heian-form turnaround · vessel form · shrine environment (keep the structure: skulls, bells, horns, water; simplified toward the anime design).</div>

<h2>SHOT LIST (timed from the real VO)</h2>
<table><tr><th>#</th><th>Time</th><th>Beat / VO</th><th>Visual</th><th>Camera</th><th>Physics · notes</th></tr>${rows}</table>

<h2>GLOBAL RULES (kept from v1)</h2>
<ul>
<li><b>Two camera states:</b> LOCKED (rule, diagram, verdict) and POV-HANDHELD (survival). Never mixed inside one shot.</li>
<li><b>Handheld = breathing,</b> not noise. One move per shot, cubic ease. Hits shake the world, not the camera.</li>
<li><b>Weight first:</b> 4–6 frame anticipation, overshoot ≤ 3 frames; Sukuna never hurries, the slashes are the fast thing.</li>
<li><b>Slashes don't travel:</b> 1-frame flash → 2-frame hold → separation. Debris falls straight down (no wind). Water ripples only from impacts.</li>
<li><b>Wheel = impulse + friction:</b> starts fast, decays exponentially, stops dead.</li>
<li><b>Safe zones:</b> HUD inside the top 8%, captions in the lower third, hero subject centre-weighted.</li>
</ul>

<h2>AUDIO MAP</h2>
<ul>
<li>Wheel clicks fire per segment edge crossing (S01) · range-ring stop = bass hit (S02) · pendulum-timed bells (S03, single bell S26).</li>
<li>Boundary shimmer hum (S05–S07, S18–S24) · slash = bright flash tick + low "thock", never a sword whoosh.</li>
<li>Freeze (S12): all SFX and music cut for 12 frames, VO kept · sprint footfalls at 3.7 Hz with breaths every second step, gasp at "fifty".</li>
<li>Drone bed 0.12 under the VO, drops OUT for Beat 7 and returns under the end card · true silence after the crossing until the bell.</li>
</ul>

<h2>AS BUILT (frames from this render)</h2>
<img src="${img("docs/ep41/asbuilt-frames.jpg")}" style="width:100%;border-radius:8px">

<h2>PINNED COMMENT (post within 10 minutes)</h2>
<div class="note">Sukuna gave you an escape route… but that same choice let Malevolent Shrine reach 200 metres. Weakness or genius upgrade? Spin again — who should the wheel pick next? 👇</div>

<h2>RECEIPTS</h2>
<ul>
<li><b>200 m</b>: Malevolent Shrine's maximum effective radius (JJK manga ch. 119; anime S2E17).</li>
<li><b>140 m</b>: the radius Sukuna deliberately used in Shibuya (ch. 119). Only the narrowing is stated; no motive is claimed.</li>
<li><b>Open barrier + escape route via binding vow</b> enlarges the sure-hit range (ch. 119).</li>
<li><b>Cleave</b> adjusts to the target's cursed energy and toughness; <b>Dismantle</b> is the default slash; inside the domain both hit continuously (ch. 119).</li>
<li><b>Sprint numbers</b> (19.19 s 200 m WR, ~3.7–4.5 steps/s, ~0.09 s ground contact, 180+ bpm) are real physiology used only for motion timing.</li>
<li><b>HUD countdown</b> is a labelled POV simulation built on the 200 m maximum, not a claim that the anime shows a measured run.</li>
</ul>
</body></html>`;

fs.writeFileSync("docs/ep41/EP41_Storyboard_v2.html", html);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("file://" + path.join(root, "docs/ep41/EP41_Storyboard_v2.html"));
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: "docs/ep41/EP41_Storyboard_v2.pdf", format: "A4", printBackground: true, margin: { top: "14mm", bottom: "14mm", left: "12mm", right: "12mm" } });
await browser.close();
console.log("wrote docs/ep41/EP41_Storyboard_v2.pdf");
