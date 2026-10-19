import { SceneNotesProps } from "./SceneNotes";

// Episode 01 of the channel, rebuilt in the template. The demo clip is cut
// from that upload; drop new clips into public/clips/ (not committed).
export const sceneNotesDefaults: SceneNotesProps = {
  clip: "clips/demo-scene.mp4",
  clipStart: 0,
  clipSeconds: 8,
  clipAspect: 2.4,
  clipVolume: 1,
  impacts: [2.0, 3.2, 5.0, 7.0],
  episode: 1,
  headline: "Nowhere to go.\nNo time to react.",
  subline: "The room is already chaos.\nThen the creature strikes.",
  footer: "The reaction says everything.",
  reaction: "shocked",
  reactionLabel: "WHAT?!",
  reactionAt: 5.0,
  channelName: "SCENE ADDICT",
  tagline: "Just one more scene.",
  dp: "brand/dp.png",
  accent: "#FF2E88",
  // The demo clip already has the channel watermark burned in
  watermark: false,
  reactionVideo: "",
  reactionVideoAspect: 1,
  reactionVideoVolume: 0,
};
