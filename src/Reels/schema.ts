import { z } from "zod";

// A reel is a list of scenes played back to back. Each scene can carry a
// kinetic caption: wrap the one keyword to highlight in *asterisks*.
// Media paths are inside public/ (e.g. "reels/demo.mp4") or full URLs.

const focusPoint = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

const base = {
  seconds: z.number().positive(),
  caption: z.string().optional(),
};

const hookScene = z.object({
  type: z.literal("hook"),
  ...base,
  text: z.string(),
  kicker: z.string().optional(),
});

const repoScene = z.object({
  type: z.literal("repo"),
  ...base,
  owner: z.string(),
  name: z.string(),
  description: z.string(),
  stars: z.number(),
  forks: z.number(),
  language: z.string().optional(),
  topics: z.array(z.string()),
});

const toolScene = z.object({
  type: z.literal("tool"),
  ...base,
  name: z.string(),
  tagline: z.string(),
  logo: z.string().optional(),
  url: z.string().optional(),
  price: z.string().optional(),
});

const mediaScene = z.object({
  type: z.literal("media"),
  ...base,
  src: z.string(),
  label: z.string(),
  focus: focusPoint,
  zoom: z.number().min(1).max(3),
});

const bulletsScene = z.object({
  type: z.literal("bullets"),
  ...base,
  title: z.string(),
  items: z.array(z.string()),
});

const ctaScene = z.object({
  type: z.literal("cta"),
  ...base,
  text: z.string(),
  subtext: z.string().optional(),
});

export const sceneSchema = z.discriminatedUnion("type", [
  hookScene,
  repoScene,
  toolScene,
  mediaScene,
  bulletsScene,
  ctaScene,
]);

export const reelSchema = z.object({
  theme: z.enum(["gittrend", "aitool"]),
  handle: z.string(),
  voiceover: z.string(),
  music: z.string(),
  musicVolume: z.number().min(0).max(1),
  scenes: z.array(sceneSchema),
});

export type Scene = z.infer<typeof sceneSchema>;
export type ReelProps = z.infer<typeof reelSchema>;
