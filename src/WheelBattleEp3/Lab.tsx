import { z } from "zod";
import { useCurrentFrame } from "remotion";
import { alive, over } from "../InkMan/motion";
import { P } from "./poses";
import { Phone } from "./cast";
import {
  Beerus,
  BEERUS_FACE,
  Buu,
  Goku,
  Satan,
  SATAN_FACE,
  Viewer,
} from "./cast";
import { LOOKS, Stage3 } from "./world";

export const ep3LabSchema = z.object({ view: z.string() });

const VIEWS: Record<
  string,
  { p: [number, number, number]; t: [number, number, number]; fov: number }
> = {
  line: { p: [0, 1.5, 7.6], t: [0, 1.05, 0], fov: 42 },
  satan: { p: [-1.6, 1.75, 1.6], t: [-1.6, 1.6, 0], fov: 30 },
  beerus: { p: [0, 2.15, 1.7], t: [0, 2.0, 0], fov: 30 },
  side: { p: [6.5, 1.4, 2.5], t: [0, 1.1, 0], fov: 40 },
  viewer: { p: [-0.8, 1.4, 3.6], t: [-0.8, 1.05, 1.2], fov: 34 },
  back: { p: [0, 1.6, -6.5], t: [0, 1.1, 0], fov: 42 },
  goku: { p: [1.6, 1.7, 1.6], t: [1.6, 1.55, 0], fov: 30 },
};

const SHEET: [string, "s" | "b" | "v"][] = [
  ["flex", "s"],
  ["selfPoint", "s"],
  ["ready", "s"],
  ["launch", "s"],
  ["bow", "s"],
  ["mustache", "s"],
  ["trophy", "s"],
  ["behind", "b"],
  ["flick", "b"],
  ["soul", "v"],
  ["float", "b"],
  ["betrayed", "v"],
];
const PoseSheet: React.FC<{ t: number; row: number }> = ({ t, row }) => (
  <Stage3
    cam={{ p: [0, 1.1, 15.5], t: [0, 1.0, 0], fov: 32 }}
    t={t}
    look={LOOKS.hero}
    set="none"
  >
    {SHEET.slice(row * 2, row * 2 + 2).map(([name, who], i) => {
      const pose = over(alive(t), P[name as keyof typeof P]);
      return (
        <group
          key={name}
          position={[-1.15 + i * 2.3, 0, 0]}
          rotation={[0, i % 2 ? -0.5 : 0.3, 0]}
        >
          {who === "s" ? (
            <Satan
              pose={pose}
              face={SATAN_FACE.proud}
              handR={name.startsWith("phone") ? <Phone s={2} /> : null}
            />
          ) : null}
          {who === "b" ? <Beerus pose={pose} /> : null}
          {who === "v" ? <Viewer pose={pose} sweat={1} t={t} /> : null}
        </group>
      );
    })}
  </Stage3>
);

export const Ep3Lab: React.FC<z.infer<typeof ep3LabSchema>> = ({ view }) => {
  const f = useCurrentFrame();
  const t = f / 30;
  if (view.startsWith("poses"))
    return <PoseSheet t={t} row={Number(view.slice(5))} />;
  const v = VIEWS[view] ?? VIEWS.line;
  const face = (view === "beerus" ? f % 2 : 0) as number;
  return (
    <Stage3 cam={v} t={t} look={LOOKS.arcade} set="wasteland">
      <group position={[-1.6, 0, 0]}>
        <Satan pose={alive(t, { headPitch: -0.25 })} face={SATAN_FACE.smug} />
      </group>
      <group position={[0, 0, 0]}>
        <Beerus
          pose={alive(t, { headPitch: 0.12 })}
          face={face ? BEERUS_FACE.threat : BEERUS_FACE.bored}
        />
      </group>
      <group position={[-0.8, 0, 1.2]}>
        <Viewer pose={alive(t)} sweat={1} excl={1} t={t} />
      </group>
      <group position={[1.6, 0, 0]}>
        <Goku pose={alive(t)} chew={1} />
      </group>
      <group position={[3.4, 0, -0.4]}>
        <Buu pose={alive(t)} />
      </group>
    </Stage3>
  );
};
