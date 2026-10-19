// Builds props for a GitTrendReel from a live GitHub repo.
//
//   npm run repo -- owner/name [--handle @you]
//
// Writes reels/<owner>-<name>.json. Edit the hook, captions and bullets,
// then render with:
//   npx remotion render GitTrendReel out/<owner>-<name>.mp4 --props=reels/<owner>-<name>.json
//
// Set GITHUB_TOKEN to avoid the 60 requests/hour anonymous limit.

import { mkdirSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const slug = args.find((a) => /^[\w.-]+\/[\w.-]+$/.test(a));
const handleIdx = args.indexOf("--handle");
const handle = handleIdx >= 0 ? args[handleIdx + 1] : "@yourrepochannel";

if (!slug) {
  console.error("Usage: npm run repo -- owner/name [--handle @you]");
  process.exit(1);
}

const headers = { Accept: "application/vnd.github+json" };
if (process.env.GITHUB_TOKEN) {
  headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

const res = await fetch(`https://api.github.com/repos/${slug}`, { headers });
if (!res.ok) {
  console.error(`GitHub API ${res.status}: ${await res.text()}`);
  process.exit(1);
}
const repo = await res.json();

const props = {
  theme: "gittrend",
  handle,
  voiceover: "",
  music: "",
  musicVolume: 0.15,
  scenes: [
    {
      type: "hook",
      seconds: 2.5,
      kicker: "GitHub Trending",
      text: "EDIT ME: a *bold* hook",
    },
    {
      type: "repo",
      seconds: 4,
      caption: "This repo is *blowing* up",
      owner: repo.owner.login,
      name: repo.name,
      description: repo.description ?? "",
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language ?? undefined,
      topics: repo.topics ?? [],
    },
    {
      type: "media",
      seconds: 3.5,
      caption: "Here's what it *does*",
      src: repo.owner.avatar_url,
      label: "replace with a demo GIF/MP4 or README screenshot in public/reels/",
      focus: { x: 50, y: 50 },
      zoom: 1.2,
    },
    {
      type: "bullets",
      seconds: 4,
      title: "Why it's worth a look",
      items: ["EDIT ME: feature one", "EDIT ME: feature two", "EDIT ME: feature three"],
    },
    {
      type: "cta",
      seconds: 2.5,
      text: "Link in bio 🔗",
      subtext: `github.com/${repo.full_name}`,
    },
  ],
};

mkdirSync("reels", { recursive: true });
const file = `reels/${repo.owner.login}-${repo.name}.json`;
writeFileSync(file, JSON.stringify(props, null, 2) + "\n");
console.log(`Wrote ${file} (★ ${repo.stargazers_count})`);
