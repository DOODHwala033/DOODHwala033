# Remotion video

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

## 3D animation stack

3D videos use one stack: **Three.js** (through `@remotion/three` + React Three Fiber) for the scene, **Remotion** for captions (`@remotion/captions`) and audio (`@remotion/media`). `src/Motion3D/` is the starter. Copy it for each new 3D video. See `CLAUDE.md` for the rules.

- Swap the music: drop a file in `public/motion3d/` and set `audioFile` in the Studio props panel.
- Captions from a voiceover: `npm run transcribe -- public/motion3d/voiceover.mp3`, then set `captionsFile` to `motion3d/voiceover.json`.
- Render: `npx remotion render Motion3D out/motion3d.mp4` (add `--gl=swangle` on machines without a GPU).

## Commands

**Install Dependencies**

```console
npm install
```

**Start Preview**

```console
npm run dev
```

**Render video**

```console
npx remotion render
```

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
