# Instagram Reel templates

Two data-driven 9:16 reel templates, one per channel. Each reel is a list of
scenes in a JSON props file; the video length is the sum of the scene lengths.

| Composition | Channel style | Look |
| --- | --- | --- |
| `GitTrendReel` | Trending GitHub repo of the day | GitHub-dark, green accent, animated repo card with star counter |
| `AiToolReel` | AI tool explainer | Neon purple, tool reveal tile, yellow keyword captions |

### Scene types

- `hook`: big opening line, optional `kicker` pill
- `repo`: GitHub card (`owner`, `name`, `description`, `stars`, `forks`, `language`, `topics`)
- `tool`: AI tool reveal (`name`, `tagline`, optional `logo`, `url`, `price`)
- `media`: screenshot or screen recording with a slow push-in (`src`, `focus`, `zoom`)
- `bullets`: title plus checklist
- `cta`: closing line plus a "Follow @handle" button

Every scene takes `seconds` and an optional `caption`. Put the one word to
highlight in `*asterisks*`. Media paths point inside `public/` (for example
`reels/demo.mp4`) or are full URLs.

Top-level props: `theme` (`gittrend` or `aitool`), `handle`, `voiceover`,
`music`, `musicVolume`. Leave `voiceover` / `music` empty for silent output.

### Daily workflow

```console
# GitTrend: pull live repo data into reels/<owner>-<name>.json
npm run repo -- owner/name --handle @yourrepochannel
# edit the hook, captions and bullets, drop a demo clip into public/reels/, then:
npx remotion render GitTrendReel out/repo.mp4 --props=reels/<owner>-<name>.json

# AI tool: copy an existing JSON, edit it, render
npx remotion render AiToolReel out/tool.mp4 --props=reels/my-tool.json
```

Tip: record the voiceover first, then set each scene's `seconds` to match it.
Use `npm run dev` to tweak props live in Remotion Studio.

## Remotion basics

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
