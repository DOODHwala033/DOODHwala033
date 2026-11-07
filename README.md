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

## Claude plugin: cartoon-audio-short

This repo also ships a Claude Code plugin that makes vertical 2D animated cartoon shorts
(ideas → script → your voiceover → finished 1080x1920 MP4 with music and SFX).

- Plugin: `plugins/cartoon-audio-short/` (skill + code kit in `skills/cartoon-audio-short/`)
- Marketplace: `.claude-plugin/marketplace.json`
- Inside this repo the skill is also available directly via `.claude/skills/cartoon-audio-short`.

Install elsewhere:
```
/plugin marketplace add doodhwala033/doodhwala033
/plugin install cartoon-audio-short@doodhwala033
```
Then ask for "a cartoon short" (or run `/cartoon-audio-short`).
