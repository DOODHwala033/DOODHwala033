import { MutableRefObject, useLayoutEffect, useMemo } from "react";
import { Mesh } from "three";
import { POV, SUKUNA, SUKUNA_ARMS, YUJI, silhouetteMaterial } from "./looks";
import {
  BoneOffsets,
  HumanLook,
  Layer,
  Target,
  merge,
  poseRig,
  useClips,
  useHuman,
  useSource,
} from "./rig";

export type Look = "sukuna" | "yuji" | "pov" | "sil";

const SIL: HumanLook = {
  hide: [
    "Wolf3D_Headwear",
    "Wolf3D_Beard",
    "EyeLeft",
    "EyeRight",
    "Wolf3D_Teeth",
  ],
};
const NONE: HumanLook = { hide: ["__"] };
const RPM_LOOKS: Record<Look, HumanLook> = {
  sukuna: SUKUNA,
  yuji: YUJI,
  pov: POV,
  sil: SIL,
};

export const Actor: React.FC<{
  look: Look;
  id: string;
  layers: Layer[];
  offsets?: BoneOffsets;
  // Sukuna's lower arm pair (added on top of `offsets`)
  lower?: BoneOffsets;
  morphs?: Record<string, number>;
  position?: [number, number, number];
  rotationY?: number;
  scale?: number;
  dissolve?: number;
  rigRef?: MutableRefObject<Target | null>;
}> = ({
  look,
  id,
  layers,
  offsets = {},
  lower = {},
  morphs = {},
  position = [0, 0, 0],
  rotationY = 0,
  scale = 1,
  dissolve = 0,
  rigRef,
}) => {
  const suk = look === "sukuna";
  const clips = useClips();
  const src = useSource(`${look}-${id}`);
  const rig = useHuman(RPM_LOOKS[look], `${look}-${id}`);
  const arms = useHuman(suk ? SUKUNA_ARMS : NONE, `${look}-${id}-arms`);
  const dis = useMemo(() => ({ value: 0 }), []);
  useMemo(() => {
    if (look !== "sil" || !rig) return;
    rig.root.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh) silhouetteMaterial(m, dis);
    });
  }, [look, rig, dis]);
  dis.value = dissolve;
  useLayoutEffect(() => {
    if (!rig || !src || !clips) return;
    poseRig(rig, src, clips, layers, offsets, morphs);
    if (suk && arms) poseRig(arms, src, clips, layers, merge(offsets, lower));
    if (rigRef) rigRef.current = rig;
  });
  if (!rig) return null;
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <primitive object={rig.root} />
      {suk && arms ? (
        <group position={[0, -0.15, -0.03]}>
          <primitive object={arms.root} />
        </group>
      ) : null}
    </group>
  );
};
