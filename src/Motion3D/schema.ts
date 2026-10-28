import { zColor } from "@remotion/zod-types";
import { z } from "zod";

// Files are paths inside public/ (e.g. "motion3d/voiceover.mp3").
// Leave audioFile or captionsFile empty to render without them.
export const motion3DSchema = z.object({
  audioFile: z.string(),
  audioVolume: z.number().min(0).max(1),
  captionsFile: z.string(),
  objectColor: zColor(),
  backgroundColor: zColor(),
});

export type Motion3DProps = z.infer<typeof motion3DSchema>;

export const motion3DDefaults: Motion3DProps = {
  audioFile: "motion3d/music.mp3",
  audioVolume: 0.6,
  captionsFile: "motion3d/captions.json",
  objectColor: "#4A9EFF",
  backgroundColor: "#05060A",
};
