import { ReelProps } from "./schema";

// Example content so both templates preview out of the box.
// Numbers here are placeholders: run `npm run repo -- owner/name` for real ones.

export const gitTrendDefaults: ReelProps = {
  theme: "gittrend",
  handle: "@yourrepochannel",
  voiceover: "",
  music: "",
  musicVolume: 0.15,
  scenes: [
    {
      type: "hook",
      seconds: 2.5,
      kicker: "GitHub Trending",
      text: "Stop paying for *video* editors",
    },
    {
      type: "repo",
      seconds: 4,
      caption: "This repo is *blowing* up",
      owner: "remotion-dev",
      name: "remotion",
      description: "Make videos programmatically with React.",
      stars: 25000,
      forks: 1500,
      language: "TypeScript",
      topics: ["react", "video", "javascript", "animation"],
    },
    {
      type: "media",
      seconds: 3.5,
      caption: "Write code, get *video*",
      src: "recordings/receipts.jpg",
      label: "repo demo / README screenshot",
      focus: { x: 50, y: 40 },
      zoom: 1.25,
    },
    {
      type: "bullets",
      seconds: 4,
      title: "Why devs love it",
      items: ["Videos as React components", "Render to MP4 locally", "Free for individuals"],
    },
    {
      type: "cta",
      seconds: 2.5,
      text: "Link in bio 🔗",
      subtext: "A new trending repo every day",
    },
  ],
};

export const aiToolDefaults: ReelProps = {
  theme: "aitool",
  handle: "@youraichannel",
  voiceover: "",
  music: "",
  musicVolume: 0.15,
  scenes: [
    {
      type: "hook",
      seconds: 2.5,
      kicker: "AI Tool of the Day",
      text: "This AI does your *taxes* in seconds",
    },
    {
      type: "tool",
      seconds: 3.5,
      caption: "Meet *ExampleAI*",
      name: "ExampleAI",
      tagline: "Scan receipts. Get a filed invoice.",
      url: "example.ai",
      price: "Free tier",
    },
    {
      type: "media",
      seconds: 3,
      caption: "Drop in your *receipts*",
      src: "recordings/receipts.jpg",
      label: "step 1 screen recording",
      focus: { x: 50, y: 50 },
      zoom: 1.3,
    },
    {
      type: "media",
      seconds: 3,
      caption: "Get a clean *invoice*",
      src: "recordings/tax-invoice.jpg",
      label: "step 2 screen recording",
      focus: { x: 30, y: 15 },
      zoom: 1.4,
    },
    {
      type: "cta",
      seconds: 2.5,
      text: "Save this for later 📌",
      subtext: "Comment “AI” for the link",
    },
  ],
};
