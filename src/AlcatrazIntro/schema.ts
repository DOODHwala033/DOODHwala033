import { z } from "zod";

export const alcatrazSchema = z.object({
  captionsFile: z.string(),
  showIce: z.boolean(),
});

export type AlcatrazProps = z.infer<typeof alcatrazSchema>;

export const alcatrazDefaults: AlcatrazProps = {
  captionsFile: "alcatraz/captions.json",
  showIce: true,
};
