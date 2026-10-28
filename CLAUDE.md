# Project rules

## 3D animation stack (always use this — one stack, no alternatives)

Every 3D animation in this repo is a Remotion composition built with:

| Job | Tool | Package |
| --- | --- | --- |
| 3D scenes | Three.js via React Three Fiber, inside `<ThreeCanvas>` | `three`, `@react-three/fiber`, `@remotion/three` |
| Captions | `Caption[]` JSON + `createTikTokStyleCaptions()` | `@remotion/captions` |
| Transcribing voiceovers into captions | Whisper.cpp (`npm run transcribe -- <file>`) | `@remotion/install-whisper-cpp` |
| Audio (music, voiceover, SFX) | `<Audio>` | `@remotion/media` |

Do not bring in other 3D engines (Babylon, Spline, raw WebGL), other caption
libraries, or a separate video editor. Start new 3D videos by copying
`src/Motion3D/` (scene, captions and audio already wired) and registering the
new composition in `src/Root.tsx`.

## Rules for Three.js inside Remotion

- Wrap all 3D content in `<ThreeCanvas width={width} height={height}>` from `@remotion/three`, with lighting.
- Drive every animation from `useCurrentFrame()` (plus `interpolate()` / `spring()`).
- Never use `useFrame()` from `@react-three/fiber`, `THREE.Clock`, or self-animating shaders/models. They run on wall-clock time and flicker in renders.
- Any `<Sequence>` inside `<ThreeCanvas>` must have `layout="none"`.
- Put captions and other 2D overlays outside the `<ThreeCanvas>`, layered on top in an `<AbsoluteFill>`.

## Assets

- Put audio, captions JSON, models and textures in `public/` and load them with `staticFile()`.
- One captions JSON per voiceover, e.g. `public/motion3d/voiceover.mp3` → `public/motion3d/voiceover.json`.

## Checks and rendering

- `npm run lint` (eslint + tsc) must pass.
- Preview: `npm run dev`. Render: `npx remotion render <CompositionId> out/<name>.mp4`.
- On a machine without a GPU (CI, cloud containers), add `--gl=swangle`.
