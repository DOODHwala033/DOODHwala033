import { AbsoluteFill, interpolate } from "remotion";
import type { Vec3 } from "../InkMan/ep/fx";
import { push } from "../InkMan/ep/stage";
import { HAND, keys, overlap } from "../InkMan/motion";
import { Glow } from "../WheelBattle2/fx";
import {
  Beerus,
  BEERUS_FACE,
  Buu,
  Chopsticks,
  Ghost,
  Goku,
  Phone,
  RamenBowl,
  Satan,
  SATAN_FACE,
  Viewer,
} from "./cast";
import {
  add,
  C,
  CHAIR,
  faceTo,
  FEAST,
  HEAD_S,
  HEAD_V,
  live,
  SAT5,
  seg,
  ShotProps,
  sm,
  useShot,
  VIE5,
} from "./common";
import {
  BlackIn,
  EndCard3,
  FreezeFx,
  Lightbulb,
  MemoryTag,
  SplitDivider,
  Stamp,
  ZoomLines,
} from "./hud";
import { P } from "./poses";
import {
  BanquetTable,
  Boulder,
  Chair,
  Cloche,
  Feast,
  Look,
  LOOKS,
  mixLook,
  Planet,
  spinAngle,
  Stage3,
  Wheel,
} from "./world";

const TAU = Math.PI * 2;

// ======================= B4 THE BACKUP PLAN =======================
const SAT4: Vec3 = [0.2, 0, 1.5];
const VIE4: Vec3 = [1.45, 0, 2.0];
const BEE4: Vec3 = [0, 0, -7];
// approx head of Satan in the phone crouch
const CROUCH_HEAD: Vec3 = [0.2, 1.33, 1.73];

const BoulderSet: React.FC<{ t: number; beerus?: boolean }> = ({
  t,
  beerus = true,
}) => (
  <>
    <Boulder position={[0, 0, 0]} s={1.15} />
    {beerus ? (
      <group position={BEE4} rotation={[0, 0, 0]}>
        <Beerus pose={live(t, P.behind)} face={BEERUS_FACE.bored} />
      </group>
    ) : null}
  </>
);

// phone call UI (2D) after the whip-pan onto the screen
const CallScreen: React.FC<{ k: number; f: number }> = ({ k, f }) => {
  if (k <= 0) return null;
  const s = interpolate(k, [0, 1], [1.25, 1]);
  return (
    <AbsoluteFill
      style={{ background: `rgba(6,10,24,${0.85 * Math.min(1, k * 3)})` }}
    >
      <div
        style={{
          position: "absolute",
          left: 190,
          top: 330,
          width: 700,
          height: 1180,
          borderRadius: 80,
          background: "#14161C",
          border: "14px solid #2A2E38",
          transform: `scale(${s})`,
          boxShadow: "0 0 120px rgba(102,227,255,0.55)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 24,
            borderRadius: 60,
            background: "linear-gradient(#66E3FF,#2AA8D8)",
          }}
        />
        {[0, 1, 2].map((i) => {
          const r = 120 + ((f * 6 + i * 70) % 210);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 350 - r,
                top: 520 - r,
                width: r * 2,
                height: r * 2,
                borderRadius: r,
                border: "8px solid rgba(255,255,255,0.6)",
                opacity: 1 - (r - 120) / 210,
              }}
            />
          );
        })}
        <div
          style={{
            position: "absolute",
            left: 230,
            top: 400,
            width: 240,
            height: 240,
            borderRadius: 120,
            background: "#F25C19",
            border: "10px solid #fff",
          }}
        >
          <svg viewBox="0 0 100 100" width={220} height={220}>
            {[
              [50, 8],
              [24, 20],
              [76, 20],
              [12, 42],
              [88, 42],
            ].map(([x, y], i) => (
              <polygon
                key={i}
                points={`${x},${y} ${50 + (x - 50) * 0.3 - 9},50 ${50 + (x - 50) * 0.3 + 9},50`}
                fill="#0E0E12"
              />
            ))}
            <circle cx={50} cy={62} r={24} fill="#D9966C" />
          </svg>
        </div>
        <div
          style={{
            position: "absolute",
            top: 700,
            width: "100%",
            textAlign: "center",
            fontFamily: "Anton",
            fontSize: 110,
            color: "#0A1A2A",
          }}
        >
          GOKU
        </div>
        <div
          style={{
            position: "absolute",
            top: 840,
            width: "100%",
            textAlign: "center",
            fontFamily: "Montserrat",
            fontWeight: 800,
            fontSize: 44,
            color: "#0A1A2A",
            letterSpacing: 4,
          }}
        >
          CALLING{".".repeat(1 + (Math.floor(f / 8) % 3))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 4.1 Satan (dusty, cape crooked) frantically pulls out the oversized phone;
// 1 s push-in, whip-pan to the screen. Ring.
export const S41: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k, fps } = useShot(len);
  const pose = overlap(
    (ff) =>
      keys(ff, [
        {
          f: 0,
          pose: live(ff / fps, {
            ...P.phoneCrouch,
            armR: { x: -0.35, z: 0.2, elbow: -1.3, ...HAND.claw },
          }),
        },
        { f: 0.3 * len, pose: live(ff / fps, P.phoneCrouch) },
      ]),
    f,
  );
  const w = sm(seg(k, 0.66, 0.76));
  const base = push(
    C(add(CROUCH_HEAD, [0.5, 0.1, 2.6]), add(CROUCH_HEAD, [0, -0.2, 0]), 40),
    C(add(CROUCH_HEAD, [0.3, 0.05, 1.3]), add(CROUCH_HEAD, [0, -0.05, 0]), 40),
    seg(k, 0, 0.5),
  );
  const cam = { ...base, t: add(base.t, [-0.9 * w, 0.1 * w, 0]) };
  return (
    <AbsoluteFill>
      <Stage3
        cam={cam}
        t={t}
        look={LOOKS.boulder}
        set="wasteland"
        filter={
          w > 0 && w < 1 ? `blur(${Math.sin(w * Math.PI) * 14}px)` : undefined
        }
      >
        <BoulderSet t={t} />
        <group position={SAT4}>
          <Satan
            pose={pose}
            face={SATAN_FACE.salesman}
            dusty
            cape={[0.05, 0.25, -0.1]}
            capeSway={0.25}
            sweat={1}
            t={t}
            handR={<Phone s={2.2} />}
          />
        </group>
      </Stage3>
      <CallScreen k={seg(k, 0.72, 0.82)} f={f} />
    </AbsoluteFill>
  );
};

// 4.2 split-screen: TOP Goku cross-legged eating a huge ramen bowl in warm
// daylight (subtle 5deg orbit); BOTTOM Satan on the phone, hopeful.
export const S42: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k } = useShot(len);
  const slurp = (Math.sin(t * 7) + 1) / 2;
  const a = 0.35 + 0.087 * k;
  const camTop = C(
    [Math.sin(a) * 2.6, 1.2, Math.cos(a) * 2.6],
    [0, 0.98, 0],
    40,
  );
  const camBot = push(
    C(add(CROUCH_HEAD, [0.35, 0.02, 1.0]), add(CROUCH_HEAD, [0, -0.04, 0]), 34),
    C(add(CROUCH_HEAD, [0.3, 0.02, 0.85]), add(CROUCH_HEAD, [0, -0.04, 0]), 34),
    k,
  );
  const gokuPose = live(t, {
    ...P.gokuEat,
    armR: { ...P.gokuEat.armR, elbow: -2.0 - slurp * 0.2 },
  });
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 960,
        }}
      >
        <Stage3
          cam={camTop}
          t={t}
          look={LOOKS.lunch}
          set="lunch"
          w={1080}
          h={960}
        >
          <group position={[0, -0.69, 0]}>
            <Goku pose={gokuPose} chew={slurp} handR={<Chopsticks />} />
          </group>
          <group position={[0.02, 0.32, 0.46]}>
            <RamenBowl s={1.6} slurp={slurp} />
          </group>
        </Stage3>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 960,
          width: 1080,
          height: 960,
        }}
      >
        <Stage3
          cam={camBot}
          t={t}
          look={LOOKS.boulder}
          set="wasteland"
          w={1080}
          h={960}
        >
          <BoulderSet t={t} beerus={false} />
          <group position={SAT4}>
            <Satan
              pose={live(t, P.phoneCrouch)}
              face={
                f < 0.4 * len
                  ? SATAN_FACE.salesman
                  : { ...SATAN_FACE.proud, mouth: "smile" }
              }
              dusty
              cape={[0.05, 0.25, -0.1]}
              handR={<Phone s={2.2} />}
              sweat={0.6}
              t={t}
            />
          </group>
        </Stage3>
      </div>
      <SplitDivider y={960} color="#F25C19" />
    </AbsoluteFill>
  );
};

// 4.3 Viewer insert: betrayed, slow 0.5 s zoom-in. Sad trombone.
export const S43: React.FC<ShotProps> = ({ len }) => {
  const { f, t } = useShot(len);
  const head = add(VIE4, [0, HEAD_V, 0]);
  const z = sm(seg(f, 0, 15));
  return (
    <Stage3
      cam={push(
        C(add(head, [-0.2, -0.25, 2.2]), add(head, [0, -0.3, 0]), 40),
        C(add(head, [-0.15, -0.15, 1.35]), add(head, [0, -0.15, 0]), 40),
        z,
      )}
      t={t}
      look={LOOKS.boulder}
      set="wasteland"
      overlay={<ZoomLines opacity={0.18} />}
    >
      <BoulderSet t={t} beerus={false} />
      <group position={VIE4} rotation={[0, -0.2, 0]}>
        <Viewer
          pose={live(t, { ...P.betrayed, headRoll: -0.15 })}
          sweat={1}
          excl={seg(f, 0.3 * len, 0.3 * len + 5)}
          t={t}
        />
      </group>
    </Stage3>
  );
};

// 4.4 wide comedy frame: Satan holds the phone away, his smile slowly
// disappears; the camera drifts past both toward Beerus, waiting.
export const S44: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useShot(len);
  const cam = push(
    C([1.5, 1.5, 5.4], [0.6, 1.25, 1.6], 42),
    C([0.45, 2.95, 0.4], [0, 1.75, -7], 40),
    seg(k, 0.25, 1),
  );
  const face =
    k < 0.25
      ? { ...SATAN_FACE.proud, mouth: "smile" as const }
      : k < 0.5
        ? { ...SATAN_FACE.salesman, mouth: "line" as const }
        : SATAN_FACE.terror;
  return (
    <Stage3 cam={cam} t={t} look={LOOKS.boulder} set="wasteland">
      <BoulderSet t={t} />
      <group position={SAT4} rotation={[0, 0.2, 0]}>
        <Satan
          pose={live(t, P.phoneAway)}
          face={face}
          dusty
          cape={[0.05, 0.25, -0.1]}
          handR={<Phone s={2.2} />}
          sweat={k}
          t={t}
        />
      </group>
      <group position={VIE4} rotation={[0, -0.5, 0]}>
        <Viewer pose={live(t, P.nervous)} sweat={1} t={t} />
      </group>
    </Stage3>
  );
};

// ======================= B5 SATAN'S REAL WEAPON =======================

// the locked banquet set (B5 -> B6)
const Banquet: React.FC<{
  t: number;
  beerusPose?: React.ComponentProps<typeof Beerus>["pose"];
  beerusFace?: React.ComponentProps<typeof Beerus>["face"];
  lift?: number;
  steam?: number;
  noBeerus?: boolean;
}> = ({ t, beerusPose, beerusFace, lift = 1, steam = 1, noBeerus }) => (
  <>
    <BanquetTable />
    <Chair position={CHAIR} />
    {noBeerus ? null : (
      <group position={[CHAIR[0], -0.5, CHAIR[2]]}>
        <Beerus
          pose={
            beerusPose ??
            live(t, { ...P.seated, ...{ thighL: -1.5, thighR: -1.5 } })
          }
          face={beerusFace ?? BEERUS_FACE.bored}
        />
      </group>
    )}
    <Cloche position={FEAST} lift={lift} />
    <Feast position={add(FEAST, [0, 0.03, 0])} t={t} steam={steam * lift} />
    <pointLight
      position={add(FEAST, [0, 0.35, 0.2])}
      intensity={6 * lift}
      distance={4}
      color="#FFB74D"
    />
  </>
);
const seatedReach = (t: number, r: number) =>
  live(t, {
    ...P.seated,
    lean: 0.05 + r * 0.2,
    armR: { x: -1.2 - r * 0.35, z: 0.05, elbow: -0.5 + r * 0.4, ...HAND.open },
  });
const seatedEat = (t: number, bite: number) =>
  live(t, {
    ...P.seated,
    armR: {
      x: -1.25 - bite * 0.4,
      z: 0.15,
      elbow: -0.9 - bite * 1.2,
      ...HAND.claw,
    },
    headPitch: 0.05 - bite * 0.08,
  });

// 5.1 slow push: Satan straightens his cape, adjusts his mustache; music turns
// suspiciously heroic; 0.5 s snap-zoom onto the returning smile.
export const S51: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k, fps } = useShot(len);
  const head = add(SAT5, [0, HEAD_S, 0]);
  const pose = overlap(
    (ff) =>
      keys(ff, [
        {
          f: 0,
          pose: live(ff / fps, {
            armL: { x: -0.9, z: 0.55, elbow: -2.0, ...HAND.claw },
            armR: { x: -0.2, z: 0.1, elbow: -0.4 },
          }),
        },
        { f: 0.3 * len, pose: live(ff / fps, P.mustache) },
        { f: 0.62 * len, pose: live(ff / fps, P.mustache) },
        { f: 0.74 * len, pose: live(ff / fps, P.selfPoint) },
      ]),
    f,
  );
  const base = push(
    C(add(head, [0.6, -0.45, 3.0]), add(head, [0, -0.45, 0]), 38),
    C(add(head, [0.5, -0.3, 2.2]), add(head, [0, -0.3, 0]), 38),
    seg(k, 0, 0.8),
  );
  const snap = sm(seg(k, 0.8, 0.9));
  const cam = {
    ...base,
    t: add(base.t, [0, 0.3 * snap, 0]),
    fov: 38 - 17 * snap,
  };
  const face =
    k < 0.3
      ? SATAN_FACE.salesman
      : k < 0.74
        ? SATAN_FACE.scheme
        : SATAN_FACE.proud;
  return (
    <Stage3 cam={cam} t={t} look={LOOKS.feast} set="wasteland">
      <Banquet t={t} lift={0} />
      <group position={SAT5} rotation={[0, 0.45, 0]}>
        <Satan
          pose={pose}
          face={face}
          cape={[0.12 + 0.1 * Math.max(0, 0.3 - k), 0.05, 0.05]}
          capeSway={Math.sin(t * 2) * 0.05}
        />
      </group>
    </Stage3>
  );
};

// 5.2 ECU Satan's eyes, mischievous sparkle; lightbulb pops above, ding.
export const S52: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k } = useShot(len);
  const yaw = 0.45;
  const dir: Vec3 = [Math.sin(yaw), 0, Math.cos(yaw)];
  const head = add(SAT5, [0, HEAD_S + 0.05, 0]);
  const cam = push(
    C(
      add(head, [dir[0] * 0.7, 0.02, dir[2] * 0.7]),
      add(head, [0, 0.0, 0]),
      30,
    ),
    C(
      add(head, [dir[0] * 0.6, 0.02, dir[2] * 0.6]),
      add(head, [0, 0.0, 0]),
      30,
    ),
    k,
  );
  const spark = seg(k, 0.5, 0.62) * (1 - seg(k, 0.66, 0.8));
  const side: Vec3 = [Math.cos(yaw), 0, -Math.sin(yaw)];
  return (
    <Stage3
      cam={cam}
      t={t}
      look={LOOKS.feast}
      set="wasteland"
      overlay={<Lightbulb at={Math.round(0.32 * len)} x={540} y={380} />}
    >
      <Banquet t={t} lift={0} />
      <group position={SAT5} rotation={[0, yaw, 0]}>
        <Satan
          pose={live(t, { headPitch: -0.05 })}
          face={f < 0.32 * len ? SATAN_FACE.salesman : SATAN_FACE.scheme}
        />
      </group>
      {spark > 0 ? (
        <Glow
          position={add(head, [
            dir[0] * 0.13 - side[0] * 0.05,
            0.02,
            dir[2] * 0.13 - side[2] * 0.05,
          ])}
          size={0.12 * spark}
          color="#FFFFFF"
          opacity={1}
        />
      ) : null}
    </Stage3>
  );
};

// 5.3 Satan bows theatrically, arm sweeping toward the spread (low-angle 2 s
// 20deg orbit); CU as the cloche lifts; then Beerus, interested.
export const S53: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k, fps } = useShot(len);
  const yaw = faceTo(SAT5, CHAIR);
  const talk = Math.floor(f / 4) % 2;
  if (k < 0.5) {
    // low-angle 20deg orbit in front-left of Satan; the table and Beerus
    // behind him
    const a = -0.78 + 0.35 * sm(seg(k, 0, 0.5));
    const cam = C(
      [SAT5[0] + Math.sin(a) * 2.6, 0.5, SAT5[2] + Math.cos(a) * 2.6],
      [SAT5[0] + 0.55, 1.05, SAT5[2] - 0.55],
      46,
    );
    const pose = overlap(
      (ff) =>
        keys(ff, [
          { f: 0, pose: live(ff / fps, P.selfPoint) },
          { f: 10, pose: live(ff / fps, P.bow) },
        ]),
      f,
    );
    return (
      <Stage3 cam={cam} t={t} look={LOOKS.feast} set="wasteland">
        <Banquet t={t} lift={0} />
        <group position={SAT5} rotation={[0, yaw, 0]}>
          <Satan
            pose={pose}
            face={talk ? SATAN_FACE.shout : SATAN_FACE.salesman}
            cape={[0.05, 0.05, 0.05]}
            sweat={0.7}
            t={t}
          />
        </group>
      </Stage3>
    );
  }
  if (k < 0.78) {
    const lift = sm(seg(k, 0.53, 0.68));
    const cam = push(
      C(add(FEAST, [-0.2, 0.45, 1.3]), add(FEAST, [0, 0.15, 0]), 36),
      C(add(FEAST, [-0.15, 0.4, 1.0]), add(FEAST, [0, 0.2, 0]), 36),
      seg(k, 0.5, 0.78),
    );
    return (
      <Stage3
        cam={cam}
        t={t}
        look={LOOKS.feast}
        set="wasteland"
        overlay={
          lift > 0.2 ? (
            <ZoomLines opacity={0.15 * lift} color="#FFE7A0" />
          ) : null
        }
      >
        <Banquet t={t} lift={lift} />
        <Glow
          position={add(FEAST, [0, 0.3, 0])}
          size={1.6 * lift}
          color="#FFB74D"
          opacity={0.5}
        />
      </Stage3>
    );
  }
  const head: Vec3 = [CHAIR[0], 1.47, CHAIR[2] + 0.12];
  return (
    <Stage3
      cam={push(
        C(add(head, [-0.1, -0.05, 1.1]), add(head, [0, -0.05, 0]), 32),
        C(add(head, [-0.1, -0.05, 0.95]), add(head, [0, -0.05, 0]), 32),
        seg(k, 0.78, 1),
      )}
      t={t}
      look={LOOKS.feast}
      set="wasteland"
    >
      <Banquet
        t={t}
        lift={1}
        beerusPose={live(t, { ...P.seated, lean: 0.2, headPitch: 0.05 })}
        beerusFace={BEERUS_FACE.interested}
      />
    </Stage3>
  );
};

// 5.4 warm flashback inserts (<= 3.5 s): Satan and Majin Buu, friends; match
// cut on the presenting gesture back to the two-shot (Satan nervously
// smiling, Beerus reaching for the food).
const FLASH_END = 0.62;
export const S54: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useShot(len);
  if (k < FLASH_END) {
    const sub = k < 0.31 ? 0 : 1;
    const SB: Vec3 = [-0.55, 0.12, 0];
    const BB: Vec3 = [0.75, 0.12, -0.1];
    const cam =
      sub === 0
        ? push(
            C([0.2, 1.5, 4.6], [0.1, 1.2, 0], 40),
            C([0.1, 1.45, 4.0], [0.1, 1.2, 0], 40),
            seg(k, 0, 0.31),
          )
        : push(
            C([1.6, 1.3, 2.6], [0.1, 1.15, 0], 40),
            C([1.3, 1.3, 2.3], [0.1, 1.15, 0], 40),
            seg(k, 0.31, FLASH_END),
          );
    const satanPose =
      sub === 0
        ? live(t, {
            ...P.victory,
            armR: { x: -0.6, z: 1.6, elbow: -0.3, ...HAND.open },
          })
        : live(t, {
            armR: { x: -1.35, z: 0.2, elbow: -0.3, ...HAND.open },
            headPitch: -0.1,
          });
    const buuPose =
      sub === 0
        ? live(t, {
            armL: { x: -2.6, z: 0.4, elbow: -0.3, ...HAND.open },
            armR: { x: 0, z: 0.3 },
          })
        : live(t, { armL: { x: -1.3, z: 0.1, elbow: -0.4, ...HAND.open } });
    return (
      <Stage3
        cam={cam}
        t={t}
        look={LOOKS.memory}
        set="lunch"
        filter="sepia(0.35) saturate(1.2) brightness(1.04)"
        overlay={
          <>
            <AbsoluteFill
              style={{
                background:
                  "radial-gradient(ellipse at 50% 45%, rgba(255,240,210,0) 45%, rgba(255,226,170,0.75) 100%)",
              }}
            />
            <MemoryTag text="FRIENDSHIP > FIGHTING" />
          </>
        }
      >
        <group position={SB} rotation={[0, sub === 0 ? 0.15 : 0.9, 0]}>
          <Satan pose={satanPose} face={SATAN_FACE.smug} />
        </group>
        <group position={BB} rotation={[0, sub === 0 ? -0.15 : -1.0, 0]}>
          <Buu pose={buuPose} />
        </group>
        {sub === 1 ? (
          <group position={[0.1, 1.08, -0.03]}>
            <Feast position={[0, 0, 0]} t={t} s={0.6} steam={0} />
          </group>
        ) : null}
      </Stage3>
    );
  }
  const kk = seg(k, FLASH_END, 1);
  const yaw = faceTo(SAT5, CHAIR);
  return (
    <Stage3
      cam={push(
        // over Beerus's shoulder: his reaching hand in the foreground, Satan's
        // nervous smile across the table
        C([2.25, 1.85, -1.78], [-0.6, 1.3, 0.45], 42),
        C([2.12, 1.82, -1.64], [-0.6, 1.32, 0.45], 42),
        kk,
      )}
      t={t}
      look={LOOKS.feast}
      set="wasteland"
    >
      <Banquet
        t={t}
        lift={1}
        beerusPose={seatedReach(t, sm(kk * 1.4))}
        beerusFace={BEERUS_FACE.interested}
      />
      <group position={SAT5} rotation={[0, yaw, 0]}>
        <Satan
          pose={live(t, {
            armR: { x: -1.35, z: 0.25, elbow: -0.3, ...HAND.open },
          })}
          face={SATAN_FACE.salesman}
          sweat={1}
          t={t}
        />
      </group>
    </Stage3>
  );
};

// 5.5 Viewer insert: cautiously hopeful lean, slight push-in.
export const S55: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useShot(len);
  const head = add(VIE5, [0, HEAD_V, 0]);
  return (
    <Stage3
      cam={push(
        C(add(head, [-0.3, -0.15, 1.6]), add(head, [0.1, -0.2, 0]), 38),
        C(add(head, [-0.25, -0.12, 1.25]), add(head, [0.1, -0.18, 0]), 38),
        k,
      )}
      t={t}
      look={LOOKS.feast}
      set="wasteland"
    >
      <Banquet t={t} beerusPose={seatedEat(t, (Math.sin(t * 4) + 1) / 2)} />
      <group position={VIE5} rotation={[0, 0.6, 0]}>
        <Viewer pose={live(t, P.hopeful)} sweat={0.6} t={t} />
      </group>
    </Stage3>
  );
};

// ======================= B6 THE VERDICT =======================
const lookB6 = (m: number): Look => mixLook(LOOKS.feast, LOOKS.menace, m);
const PlateProp: React.FC = () => (
  <group position={[0, 0.02, 0]}>
    <mesh>
      <cylinderGeometry args={[0.2, 0.15, 0.025, 28]} />
      <meshPhysicalMaterial color="#F4F4F4" roughness={0.2} clearcoat={1} />
    </mesh>
    <mesh position={[0, 0.02, 0]}>
      <torusGeometry args={[0.17, 0.008, 6, 28]} />
      <meshStandardMaterial color="#E0A82A" metalness={0.7} />
    </mesh>
  </group>
);

// 6.1 wide banquet: Beerus eats; Satan watches, wiping sweat, champion smile
// bolted on. Slow 3 s dolly-in.
export const S61: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useShot(len);
  const bite = (Math.sin(t * 3.2) + 1) / 2;
  return (
    <Stage3
      cam={push(
        C([0.1, 2.3, 9.0], [0.15, 1.0, -0.4], 46),
        C([0.12, 2.05, 7.2], [0.15, 1.05, -0.4], 46),
        k,
      )}
      t={t}
      look={lookB6(0.25)}
      set="wasteland"
    >
      <Banquet
        t={t}
        beerusPose={seatedEat(t, bite)}
        beerusFace={bite > 0.6 ? BEERUS_FACE.chew : BEERUS_FACE.bored}
      />
      <group position={SAT5} rotation={[0, faceTo(SAT5, CHAIR) - 0.4, 0]}>
        <Satan
          pose={live(t, P.wipe)}
          face={{ ...SATAN_FACE.salesman, look: [8, 0] }}
          sweat={1}
          t={t}
        />
      </group>
      <group position={VIE5} rotation={[0, 0.8, 0]}>
        <Viewer pose={live(t, P.nervous)} sweat={0.6} t={t} />
      </group>
    </Stage3>
  );
};

// 6.2 ECU Beerus chewing thoughtfully -> small nod; tiny push-in in the pause
// before he speaks. Culinary bliss with the threat underneath.
export const S62: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useShot(len);
  const head: Vec3 = [CHAIR[0], 1.47, CHAIR[2] + 0.06];
  const nod = Math.sin(seg(k, 0.28, 0.42) * Math.PI) * 0.18;
  const chew = k < 0.42 ? (Math.sin(t * 9) + 1) / 2 : 0;
  const face =
    k < 0.42
      ? {
          ...BEERUS_FACE.bliss,
          mouth: chew > 0.5 ? ("o" as const) : ("smile" as const),
        }
      : { ...BEERUS_FACE.bored, lid: 0.4, browTilt: -0.22, blush: 0.3 };
  return (
    <Stage3
      cam={push(
        C(add(head, [0.12, -0.05, 1.0]), add(head, [0, -0.02, 0]), 30),
        C(add(head, [0.1, -0.04, 0.82]), add(head, [0, -0.02, 0]), 30),
        seg(k, 0.3, 0.5),
      )}
      t={t}
      look={lookB6(0.4)}
      set="wasteland"
    >
      <Banquet
        t={t}
        beerusPose={live(t, { ...P.seated, headPitch: 0.06 + nod })}
        beerusFace={face}
      />
    </Stage3>
  );
};

// 6.3 pull-back + upward crane: Earth revealed safe behind them; Satan holds
// a plate up like a trophy.
export const S63: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useShot(len);
  const head = add(SAT5, [0, HEAD_S, 0]);
  const cam = push(
    C(add(head, [0.7, -0.2, 1.9]), add(head, [0, 0.1, 0]), 40),
    C([0.5, 3.8, 7.6], [0, 4.6, -10], 46),
    sm(seg(k, 0.05, 0.9)),
  );
  return (
    <Stage3 cam={cam} t={t} look={lookB6(0.12)} set="wasteland" fogFar={260}>
      <Planet position={[-2.5, 11.5, -46]} r={5} spin={t * 0.08} />
      <Banquet
        t={t}
        beerusPose={seatedEat(t, (Math.sin(t * 3) + 1) / 2)}
        beerusFace={BEERUS_FACE.chew}
      />
      <group position={SAT5} rotation={[0, 0.35, 0]}>
        <Satan
          pose={live(t, P.trophy)}
          face={SATAN_FACE.smug}
          handR={<PlateProp />}
          capeSway={Math.sin(t * 2) * 0.08}
        />
      </group>
      <group position={VIE5} rotation={[0, 0.6, 0]}>
        <Viewer pose={live(t, { ...P.hopeful, headPitch: -0.2 })} t={t} />
      </group>
    </Stage3>
  );
};

// 6.4 Viewer insert: relieved but confused. Record scratch.
export const S64: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k } = useShot(len);
  const head = add(VIE5, [0, HEAD_V, 0]);
  return (
    <Stage3
      cam={push(
        C(add(head, [-0.35, -0.1, 1.4]), add(head, [0, -0.15, 0]), 38),
        C(add(head, [-0.3, -0.1, 1.2]), add(head, [0, -0.15, 0]), 38),
        k,
      )}
      t={t}
      look={lookB6(0.2)}
      set="wasteland"
    >
      <Banquet t={t} />
      <group position={VIE5} rotation={[0, 0.5, 0]}>
        <Viewer
          pose={live(t, { ...P.betrayed, headRoll: 0.28, shrug: 0.9 })}
          sweat={0.7}
          excl={seg(f, 2, 6) * 0.9}
          t={t}
        />
      </group>
    </Stage3>
  );
};

// 6.5 freeze-frame on Satan's proud victory pose (low angle, 20deg orbit into
// the freeze) -> smash-cut to Beerus, unimpressed. FORFEIT stamp.
export const S65: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k, fps } = useShot(len);
  const fz = Math.round(0.4 * len);
  if (k < 0.55) {
    const fe = Math.min(f, fz);
    const te = fe / fps;
    const c = add(SAT5, [0, 1.15, 0]);
    const a = 0.1 + 0.35 * sm(fe / fz);
    const cam = C(
      [c[0] + Math.sin(a) * 2.7, 0.45, c[2] + Math.cos(a) * 2.7],
      add(c, [0, 0.25, 0]),
      46,
    );
    const pose = overlap(
      (ff) =>
        keys(ff, [
          { f: 0, pose: live(ff / fps, P.trophy) },
          { f: 9, pose: live(ff / fps, P.victory) },
        ]),
      fe,
    );
    return (
      <Stage3
        cam={cam}
        t={te}
        look={lookB6(0.3)}
        set="wasteland"
        filter={f >= fz ? "saturate(0.8) contrast(1.1)" : undefined}
        overlay={<FreezeFx at={fz} />}
      >
        <Banquet t={te} />
        <group position={SAT5} rotation={[0, 0.4, 0]}>
          <Satan
            pose={pose}
            face={SATAN_FACE.smug}
            cape={[0.3, 0.12, 0.1]}
            capeSway={0.1}
          />
        </group>
      </Stage3>
    );
  }
  const head: Vec3 = [CHAIR[0], 1.47, CHAIR[2] + 0.06];
  const kk = seg(k, 0.55, 1);
  return (
    <Stage3
      cam={push(
        C(add(head, [0.25, -0.3, 1.9]), add(head, [0, -0.25, 0]), 34),
        C(add(head, [0.22, -0.28, 1.65]), add(head, [0, -0.25, 0]), 34),
        kk,
      )}
      t={t}
      look={lookB6(0.5)}
      set="wasteland"
      overlay={
        <Stamp
          text="WINNER: SATAN"
          sub="BY FORFEIT"
          at={Math.round(0.6 * len)}
          y={980}
          rot={-10}
          size={104}
        />
      }
    >
      <Banquet
        t={t}
        beerusPose={live(t, { ...P.seated, headPitch: 0.12, headYaw: -0.15 })}
        beerusFace={BEERUS_FACE.bored}
      />
    </Stage3>
  );
};

// 6.6 ECU Beerus: eyes narrow, a faint destruction aura rises (brow only, he
// stays bored); fast zoom OUT to the Viewer's horrified face (soul leaving
// body); the wheel spins toward camera; cut to black.
export const S66: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k } = useShot(len);
  const head: Vec3 = [CHAIR[0], 1.47, CHAIR[2] + 0.06];
  if (k < 0.55) {
    const aura = sm(seg(k, 0.1, 0.5));
    return (
      <Stage3
        cam={push(
          C(add(head, [0.08, -0.03, 0.85]), add(head, [0, 0.0, 0]), 30),
          C(add(head, [0.06, -0.02, 0.7]), add(head, [0, 0.01, 0]), 30),
          k / 0.55,
        )}
        t={t}
        look={LOOKS.menace}
        set="wasteland"
      >
        <Banquet
          t={t}
          steam={0}
          beerusPose={live(t, { ...P.seated, headPitch: 0.1 })}
          beerusFace={k < 0.15 ? BEERUS_FACE.bored : BEERUS_FACE.threat}
        />
        <pointLight
          position={add(head, [0, -0.25, 0.5])}
          intensity={3 * aura}
          distance={2}
          color="#FF9E00"
        />
        {Array.from({ length: 16 }, (_, i) => {
          const u = (t * 0.7 + i / 16) % 1;
          const a = (i / 16) * Math.PI * 2;
          return (
            <Glow
              key={i}
              position={add(head, [
                Math.cos(a) * 0.38,
                -0.7 + u * 1.3,
                Math.sin(a) * 0.25 - 0.15,
              ])}
              size={0.25 + u * 0.3}
              color={i % 2 ? "#9A3CFF" : "#D0204A"}
              opacity={0.55 * aura * Math.sin(u * Math.PI)}
            />
          );
        })}
      </Stage3>
    );
  }
  if (k < 0.83) {
    const kk = seg(k, 0.55, 0.83);
    const vh = add(VIE5, [0, HEAD_V, 0]);
    const z = sm(seg(kk, 0, 0.45));
    return (
      <Stage3
        cam={push(
          C(add(vh, [-0.4, -0.05, 0.75]), add(vh, [0, -0.05, 0]), 34),
          C(add(vh, [-1.3, 0.35, 3.4]), add(vh, [0.8, -0.3, -1]), 44),
          z,
        )}
        t={t}
        look={LOOKS.menace}
        set="wasteland"
        overlay={<ZoomLines opacity={0.35 * (1 - z * 0.5)} color="#FFB0C0" />}
      >
        <Banquet t={t} steam={0} beerusFace={BEERUS_FACE.threat} />
        <group position={VIE5} rotation={[0, 0.6, 0]}>
          <Viewer pose={live(t, P.soul)} sweat={1} t={t} tremble={1} />
        </group>
        <Ghost
          k={sm(seg(kk, 0.15, 1))}
          position={add(VIE5, [0, HEAD_V + 0.1, 0])}
        />
      </Stage3>
    );
  }
  const kk = seg(k, 0.83, 1);
  return (
    <Stage3
      cam={C([0, 0, 7], [0, 0, 0], 40)}
      t={t}
      look={LOOKS.menace}
      set="none"
      stars={0.6}
      overlay={<BlackIn at={Math.round(0.97 * len)} len={3} />}
    >
      <group position={[0, 0, -14 + 18.5 * sm(kk)]}>
        <Wheel angle={spinAngle(t, 0, 3, 0, TAU * 3) + f * 0.4} />
      </group>
    </Stage3>
  );
};

// 6.7 END CARD over the cosmic wheel plate: one line, bold, nothing else.
export const S67: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useShot(len);
  return (
    <Stage3
      cam={push(
        C([0, 0.4, 5.8], [0, 0.55, 0], 40),
        C([0, 0.45, 8.2], [0, 0.6, 0], 40),
        k,
      )}
      t={t}
      look={LOOKS.cosmic}
      set="none"
      stars={1}
      overlay={<EndCard3 at={3} />}
    >
      <group position={[0, -1.6, 0]} rotation={[-0.12, 0, 0]}>
        <Wheel angle={t * 0.35} />
      </group>
      {Array.from({ length: 18 }, (_, i) => {
        const u = (t * 0.3 + i / 18) % 1;
        const a = i * 2.4;
        return (
          <Glow
            key={i}
            position={[
              Math.cos(a) * (2.6 + u),
              -1.6 + Math.sin(a) * (2.6 + u),
              0.5,
            ]}
            size={0.18}
            color="#FFD026"
            opacity={Math.sin(u * Math.PI)}
          />
        );
      })}
    </Stage3>
  );
};
