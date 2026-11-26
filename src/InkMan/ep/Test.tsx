import { z } from "zod";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Gojo, Makima, Civilian } from "./cast";
import { ContractChain, ContractSeal, FlyingCar, InfoStream } from "./fx";
import { Cam, EpStage, GroundShadow } from "./stage";

export const epTestSchema = z.object({
  view: z.enum(["wide", "makima", "gojo", "eyes", "chains", "void", "hands"]),
});

export const EpTest: React.FC<z.infer<typeof epTestSchema>> = ({ view }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const G: [number, number, number] = [-1.3, 0, 0];
  const M: [number, number, number] = [1.3, 0, 0];
  const faceCam = (x: number, ry = 0): Cam => ({
    p: [x + 0.25, 1.78, 1.0],
    t: [x, 1.78 + ry, 0],
    fov: 32,
  });
  if (view === "void")
    return (
      <EpStage
        cam={{ p: [0, 1.5, 5.2], t: [0, 1.3, 0], fov: 42 }}
        t={t}
        bg="void"
        voidGlow={0.4}
      >
        <group position={[0, 0.2, 0]}>
          <Makima pose={{ headPitch: 0.08 }} />
        </group>
        <InfoStream target={[0, 1.8, 0.2]} t={t} />
        <ContractSeal position={[0, 0.02, 0]} r={1.6} t={t} glow={1} flat />
      </EpStage>
    );
  if (view === "chains")
    return (
      <EpStage cam={{ p: [0, 1.8, 8.5], t: [0, 1.3, 0], fov: 45 }} t={t} rain>
        <GroundShadow position={[0, 0, 0]} />
        <Makima />
        {[-6, -3.5, 3.5, 6].map((x, i) => (
          <group key={i}>
            <group position={[x, 0, -3 - i * 0.8]}>
              <Civilian i={i} />
            </group>
            <ContractChain
              a={[0, 1.3, 0.1]}
              b={[x, 1.3, -3 - i * 0.8]}
              pulse={(t * 0.6 + i * 0.2) % 1}
            />
          </group>
        ))}
        <ContractSeal position={[0, 0.03, 0]} r={1.5} t={t} glow={0.8} flat />
      </EpStage>
    );
  if (view === "makima")
    return (
      <EpStage cam={faceCam(0)} t={t} rain>
        <Makima />
      </EpStage>
    );
  if (view === "gojo")
    return (
      <EpStage cam={faceCam(0)} t={t} rain>
        <Gojo />
      </EpStage>
    );
  if (view === "eyes")
    return (
      <EpStage
        cam={{ p: [0.06, 1.64, 0.62], t: [0, 1.64, 0], fov: 22 }}
        t={t}
        bg="void"
        voidGlow={0.3}
      >
        <Gojo blindfold={false} />
      </EpStage>
    );
  if (view === "hands")
    return (
      <EpStage cam={{ p: [0.2, 1.1, 1.4], t: [0, 1.0, 0], fov: 38 }} t={t}>
        <Gojo pose={{ armL: { curl: 0.1 }, armR: { curl: 0.95 } }} />
      </EpStage>
    );
  return (
    <EpStage cam={{ p: [0, 1.7, 8.8], t: [0, 1.2, 0], fov: 44 }} t={t} rain>
      <GroundShadow position={G} />
      <GroundShadow position={M} />
      <group position={G} rotation={[0, Math.PI / 2, 0]}>
        <Gojo />
      </group>
      <group position={M} rotation={[0, -Math.PI / 2, 0]}>
        <Makima />
      </group>
      <FlyingCar position={[5, 2, 0]} />
    </EpStage>
  );
};
