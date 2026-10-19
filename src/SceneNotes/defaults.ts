import { SceneNotesProps } from "./SceneNotes";

// Episode 01 of the channel, rebuilt in the template. The demo clip is cut
// from that upload; drop new clips into public/clips/ (not committed).
export const sceneNotesDefaults: SceneNotesProps = {
  clip: "clips/demo-scene.mp4",
  clipStart: 0,
  clipSeconds: 8,
  clipAspect: 2.4,
  clipVolume: 1,
  impacts: [0.4, 5.2, 6.4],
  episode: 1,
  headline: "Nowhere to go.\nNo time to react.",
  subline: "The room is already chaos.\nThen the creature strikes.",
  footer: "The reaction says everything.",
  reaction: "shocked",
  reactionLabel: "WHAT?!",
  reactionAt: 5.1,
  channelName: "SCENE ADDICT",
  tagline: "Just one more scene.",
  dp: "brand/dp.png",
  accent: "#FF2E88",
};
