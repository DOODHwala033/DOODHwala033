# NIGHTMARE SPIN 3D: CHUREL vs LA LLORONA (three.js)

The Remotion/flat-2D reel (`src/NightmareSpin`) rebuilt as a real 3D animation: same Roman-Hindi script, same ElevenLabs "Kashyap" voice-over and mix (`public/nspin/mix.wav`), same captions and wheel labels.

What is simulated (all deterministic, stepped at 1/30 s; the renderer replays from frame 0 whenever a worker starts mid-timeline):
- `physics.js`: wind field with gusts and a `calm` switch (the air and water stop together at "Paani tham jaata hai"), springs, verlet **hair strands** (flat ribbons), verlet **cloth** (skirts, the sari drape), **dangling hands/feet** tied to the body, collision against head/torso/legs.
- `chars.js`: humanoid rigs with spring-damped spine and head, two-bone IK arms and legs, planted-foot gait, hovering feet for Churel (turned **backward**, toes mark the direction), hands with five jointed fingers (curl, splay, tremor), breathing, shoulder sobs.
- `main.js`: rippling water shader (ripple rings from steps, La Llorona's rise and Churel's wake, still water on cue), displaced riverbank, bare trees and reeds swaying with the wind, fog sheets and air motes carried by the same wind, the spin wheel with a flapper that clicks over the pegs; toon shading + ink lines + depth of field (see the cartoon kit).
- `story.js`: the whole choreography as functions of time, from the VO timing in `data.js`.

Run: copy three.js r160 from the cartoon kit into `web/lib/`, then
`node render.mjs frames "0-1919" 1 0.94` (split into ranges for parallel workers; `CHROME=<chrome-headless-shell>` if Playwright's own build is missing) and mux with `public/nspin/mix.wav`:
`ffmpeg -framerate 30 -i frames/f%04d.jpg -i mix.wav -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a aac -shortest out.mp4`.
