import { z } from "zod";

// Files are paths inside public/. Leave voiceFile empty for a captions-only
// cut; add the voiceover later and re-time captions with `npm run transcribe`.
export const deepDiveSchema = z.object({
  voiceFile: z.string(),
  musicFile: z.string(),
  musicVolume: z.number().min(0).max(1),
  captionsFile: z.string(),
});

export type DeepDiveProps = z.infer<typeof deepDiveSchema>;

export const deepDiveDefaults: DeepDiveProps = {
  voiceFile: "",
  musicFile: "motion3d/music.mp3",
  musicVolume: 0.35,
  captionsFile: "deepdive/gum-captions.json",
};
