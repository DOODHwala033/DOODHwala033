import { useCurrentFrame, useVideoConfig } from "remotion";
import { Pose, idlePose } from "../BaseCharacter";
import { FaceState } from "../face";
import { Gojo, Makima } from "./cast";
import type { Vec3 } from "./fx";
import { GroundShadow } from "./stage";

export const G: Vec3 = [-1.3, 0, 0];
export const M: Vec3 = [1.3, 0, 0];
// eye height of every character (all share the base body)
export const EYE = 1.64;

export type ShotProps = { len: number };

export const useS = (len: number) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  return { f, t: f / fps, k: f / len, fps, w: width, h: height };
};

export const idle = (t: number, o: Pose = {}): Pose => ({
  ...idlePose(t),
  ...o,
});

export const walkPose = (t: number, speed = 6): Pose => {
  const s = Math.sin(t * speed);
  return {
    thighL: s * 0.5,
    thighR: -s * 0.5,
    kneeL: Math.max(0, -s) * 0.7,
    kneeR: Math.max(0, s) * 0.7,
    armL: { x: -s * 0.4 },
    armR: { x: s * 0.4 },
  };
};

// The face-off: Gojo (left) and Makima (right) looking at each other.
export const Duel: React.FC<{
  t: number;
  gPose?: Pose;
  mPose?: Pose;
  gFace?: FaceState;
  mFace?: FaceState;
  blindfold?: boolean;
  gYaw?: number;
  mYaw?: number;
  gPos?: Vec3;
  mPos?: Vec3;
}> = ({
  t,
  gPose,
  mPose,
  gFace,
  mFace,
  blindfold = true,
  gYaw = Math.PI / 2,
  mYaw = -Math.PI / 2,
  gPos = G,
  mPos = M,
}) => (
  <>
    <GroundShadow position={gPos} />
    <GroundShadow position={mPos} />
    <group position={gPos} rotation={[0, gYaw, 0]}>
      <Gojo pose={gPose ?? idle(t)} face={gFace} blindfold={blindfold} />
    </group>
    <group position={mPos} rotation={[0, mYaw, 0]}>
      <Makima pose={mPose ?? idle(t + 1.3)} face={mFace} />
    </group>
  </>
);
