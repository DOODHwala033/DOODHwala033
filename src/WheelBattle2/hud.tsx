import "@fontsource/anton/400.css";
import "@fontsource/montserrat/800.css";
import { ThreeCanvas } from "@remotion/three";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Pose } from "../InkMan/BaseCharacter";
import { CamRig2 } from "../InkMan/ep/stage";

const PAPER = "#FFF4E6";

export const Chips: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  if (f < at) return null;
  const s = spring({ frame: f - at, fps, config: { damping: 14 } });
  const chip = (txt: string, bg: string) => (
    <div
      style={{
        fontFamily: "Montserrat",
        fontWeight: 800,
        fontSize: 30,
        color: "#fff",
        background: bg,
        padding: "6px 18px",
        borderRadius: 10,
        boxShadow: "0 6px 0 rgba(0,0,0,0.35)",
      }}
    >
      {txt}
    </div>
  );
  return (
    <div
      style={{
        position: "absolute",
        top: 250,
        width,
        display: "flex",
        justifyContent: "center",
        gap: 18,
        transform: `scale(${0.7 + 0.3 * s})`,
        opacity: s,
      }}
    >
      {chip("PROTECTOR: YAMCHA", "#E8731C")}
      {chip("HUNTER: MAHORAGA", "#8E1B26")}
    </div>
  );
};

// ADAPTATION progress (editorial readability graphic, not a canon measurement)
export const AdaptBar: React.FC<{ value: number }> = ({ value }) => {
  const { width } = useVideoConfig();
  const v = Math.round(Math.max(0, Math.min(100, value)));
  return (
    <div
      style={{
        position: "absolute",
        top: 250,
        left: 0,
        width,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
        style={{
          fontFamily: "Anton",
          fontSize: 54,
          color: PAPER,
          WebkitTextStroke: "3px #000",
          letterSpacing: 2,
        }}
      >
        ADAPTATION {v}%
      </div>
      <div
        style={{
          width: 640,
          height: 30,
          borderRadius: 15,
          background: "rgba(20,10,8,0.75)",
          border: "3px solid #FFD45A",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${v}%`,
            height: "100%",
            background: "linear-gradient(90deg,#FFB830,#FFE68A)",
          }}
        />
      </div>
      <div
        style={{
          fontFamily: "Montserrat",
          fontWeight: 800,
          fontSize: 18,
          color: "rgba(255,244,230,0.8)",
        }}
      >
        editorial indicator · not a canon measurement
      </div>
    </div>
  );
};

// Heartbeat ring pulsing around the frame edge (+ a pulse line by the label)
export const Heartbeat: React.FC<{ bpm: number; strength?: number }> = ({
  bpm,
  strength = 1,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ph = ((f / fps) * bpm) / 60;
  const beat =
    Math.exp(-((ph % 1) * 9)) + 0.6 * Math.exp(-(((ph + 0.72) % 1) * 9));
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        boxShadow: `inset 0 0 ${120 + beat * 120}px rgba(220,20,30,${(0.25 + beat * 0.45) * strength})`,
      }}
    />
  );
};

// Small floating call window with a live 3D insert inside.
export const CallWindow: React.FC<{
  at: number;
  until: number;
  rejectAt: number;
  children: React.ReactNode;
  cam: {
    p: [number, number, number];
    t: [number, number, number];
    fov: number;
  };
}> = ({ at, until, rejectAt, children, cam }) => {
  const f = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  if (f < at || f > until) return null;
  const s = spring({ frame: f - at, fps, config: { damping: 13 } });
  const out = f > until - 8 ? interpolate(f, [until - 8, until], [1, 0]) : 1;
  const W = 520;
  const H = 640;
  return (
    <div
      style={{
        position: "absolute",
        left: width / 2 - W / 2,
        top: 360,
        width: W,
        height: H + 70,
        transform: `scale(${s * out})`,
        transformOrigin: "50% 100%",
      }}
    >
      <div
        style={{
          background: "#161820",
          border: "5px solid #2C4DA8",
          borderRadius: 26,
          overflow: "hidden",
          boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            fontFamily: "Montserrat",
            fontWeight: 800,
            fontSize: 26,
            color: "#fff",
            background: "#2C4DA8",
            padding: "8px 18px",
          }}
        >
          📞 CALLING: VEGETA
        </div>
        <div style={{ width: W, height: H, position: "relative" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(#6A7BC0,#2A2F55)",
            }}
          />
          <ThreeCanvas width={W} height={H}>
            <CamRig2 cam={cam} shake={0} t={0} />
            <hemisphereLight args={["#E8ECFF", "#30304A", 1.1]} />
            <directionalLight position={[2, 3, 4]} intensity={1.6} />
            {children}
          </ThreeCanvas>
          {f >= rejectAt ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  f < rejectAt + 2 ? "rgba(255,30,40,0.5)" : "transparent",
              }}
            >
              <div
                style={{
                  fontFamily: "Anton",
                  fontSize: 92,
                  color: "#FF2A3A",
                  border: "8px solid #FF2A3A",
                  borderRadius: 14,
                  padding: "4px 22px",
                  transform: `rotate(-12deg) scale(${spring({ frame: f - rejectAt, fps, config: { damping: 10, stiffness: 300 } }) * 1})`,
                  background: "rgba(0,0,0,0.25)",
                }}
              >
                REJECTED
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// Rounded comic flashback bubble with its own 3D insert.
export const FlashbackBubble: React.FC<{
  at: number;
  children: React.ReactNode;
  cam: {
    p: [number, number, number];
    t: [number, number, number];
    fov: number;
  };
  burstAt: number;
}> = ({ at, children, cam, burstAt }) => {
  const f = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  if (f < at) return null;
  const s = spring({ frame: f - at, fps, config: { damping: 12 } });
  const W = 700;
  const H = 560;
  const burst = f >= burstAt && f < burstAt + 10 ? 1 - (f - burstAt) / 10 : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: width / 2 - W / 2,
        top: 300,
        width: W,
        height: H,
        transform: `scale(${s})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 60,
          border: "8px solid #111",
          overflow: "hidden",
          background: "linear-gradient(#F7A777,#FFD6A8)",
          boxShadow: "0 16px 0 rgba(0,0,0,0.35)",
        }}
      >
        <ThreeCanvas width={W - 16} height={H - 16}>
          <CamRig2 cam={cam} shake={0} t={0} />
          <hemisphereLight args={["#FFE6CC", "#6A3420", 1.1]} />
          <directionalLight
            position={[-3, 4, 4]}
            intensity={1.6}
            color="#FFE2C8"
          />
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[30, 30]} />
            <meshStandardMaterial color="#C88A5C" />
          </mesh>
          {children}
        </ThreeCanvas>
        {burst > 0 ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle at 50% 55%, rgba(255,255,255,${burst}) 0%, rgba(255,240,120,${burst * 0.9}) 35%, rgba(255,200,60,0) 70%)`,
            }}
          />
        ) : null}
        {f >= burstAt && f < burstAt + 12 ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: H / 2 - 80,
              textAlign: "center",
              fontFamily: "Anton",
              fontSize: 110,
              color: "#fff",
              WebkitTextStroke: "6px #111",
            }}
          >
            POOF!
          </div>
        ) : null}
      </div>
      <div
        style={{
          position: "absolute",
          left: 30,
          top: -38,
          fontFamily: "Anton",
          fontSize: 40,
          color: "#fff",
          background: "#111",
          padding: "4px 16px",
          borderRadius: 12,
        }}
      >
        FLASHBACK
      </div>
    </div>
  );
};

export type { Pose };
