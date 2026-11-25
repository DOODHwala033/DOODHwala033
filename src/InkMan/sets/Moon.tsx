import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

// The Moon set: grey cratered sphere (same radius as the Sun so shots can
// reuse the walkable-top framing) and a big blue Earth for the sky.
export const MOON_R = 6;

const rand = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const moonTexture = () => {
  const W = 2048;
  const H = 1024;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (g) {
    g.fillStyle = "#8E8C88";
    g.fillRect(0, 0, W, H);
    // dark "maria" patches
    for (let i = 0; i < 14; i++) {
      const x = rand(i) * W;
      const y = H * 0.25 + rand(i + 50) * H * 0.5;
      const r = 80 + rand(i + 90) * 220;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, "rgba(70,68,66,0.55)");
      grd.addColorStop(1, "rgba(70,68,66,0)");
      g.fillStyle = grd;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // fine speckle
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = `rgba(${rand(i + 7) > 0.5 ? "255,255,255" : "0,0,0"},${0.04 + rand(i + 3) * 0.06})`;
      g.fillRect(rand(i + 11) * W, rand(i + 13) * H, 2, 2);
    }
    // craters: dark floor, bright rim on the lit side, soft shadow on the other
    for (let i = 0; i < 520; i++) {
      const x = rand(i + 1000) * W;
      const y = H * 0.12 + rand(i + 2000) * H * 0.76;
      const r = 4 + Math.pow(rand(i + 3000), 3) * 70;
      g.fillStyle = "rgba(60,58,56,0.55)";
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "rgba(205,203,198,0.75)";
      g.lineWidth = Math.max(1.5, r * 0.18);
      g.beginPath();
      g.arc(x, y, r, Math.PI * 0.9, Math.PI * 1.9);
      g.stroke();
      g.strokeStyle = "rgba(40,38,36,0.6)";
      g.beginPath();
      g.arc(x, y, r, Math.PI * 1.95, Math.PI * 2.85);
      g.stroke();
    }
  }
  const t = new CanvasTexture(c);
  t.wrapS = RepeatWrapping;
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

let moonCache: CanvasTexture | null = null;
const getMoon = () => {
  if (!moonCache) moonCache = moonTexture();
  return moonCache;
};

const earthTexture = () => {
  const W = 1024;
  const H = 512;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (g) {
    g.fillStyle = "#1E5BC8";
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) {
      const x = rand(i + 400) * W;
      const y = H * 0.18 + rand(i + 500) * H * 0.64;
      g.fillStyle = rand(i + 600) > 0.35 ? "#3E9A47" : "#B59A5E";
      g.beginPath();
      g.ellipse(
        x,
        y,
        30 + rand(i + 700) * 90,
        18 + rand(i + 800) * 60,
        rand(i) * 3,
        0,
        Math.PI * 2,
      );
      g.fill();
    }
    g.fillStyle = "#F2F5F8";
    g.fillRect(0, 0, W, 28);
    g.fillRect(0, H - 28, W, 28);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = "rgba(255,255,255,0.55)";
      g.beginPath();
      g.ellipse(
        rand(i + 900) * W,
        rand(i + 950) * H,
        40 + rand(i) * 70,
        6 + rand(i + 1) * 10,
        0,
        0,
        Math.PI * 2,
      );
      g.fill();
    }
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
};

let earthCache: CanvasTexture | null = null;
const getEarth = () => {
  if (!earthCache) earthCache = earthTexture();
  return earthCache;
};

// Hard, single sun light from the side, like real lunar photos.
export const MoonLights: React.FC = () => (
  <>
    <ambientLight intensity={0.18} />
    <hemisphereLight args={["#9FB4E8", "#1A1A1A", 0.35]} />
    <directionalLight position={[-7, 5, 6]} intensity={3.2} color="#FFF8EC" />
    {/* neutral fill so characters keep their colours */}
    <directionalLight position={[3, 3, 6]} intensity={0.9} color="#FFFFFF" />
  </>
);

export const MoonSet: React.FC<{ spin?: number }> = ({ spin = 0 }) => {
  const tex = getMoon();
  return (
    <mesh rotation={[0, spin, Math.PI / 2]}>
      <sphereGeometry args={[MOON_R, 140, 100]} />
      <meshStandardMaterial
        map={tex}
        bumpMap={tex}
        bumpScale={2.2}
        roughness={0.95}
      />
    </mesh>
  );
};

export const BigEarth: React.FC<{
  position: [number, number, number];
  r: number;
  spin?: number;
}> = ({ position, r, spin = 0 }) => (
  <group position={position}>
    <mesh rotation={[0.2, spin, 0.1]}>
      <sphereGeometry args={[r, 64, 48]} />
      <meshStandardMaterial
        map={getEarth()}
        emissive="#0E2A66"
        emissiveIntensity={0.35}
        roughness={0.6}
      />
    </mesh>
    <mesh scale={1.04}>
      <sphereGeometry args={[r, 48, 32]} />
      <meshBasicMaterial
        color="#6FB4FF"
        transparent
        opacity={0.16}
        depthWrite={false}
        side={1}
      />
    </mesh>
  </group>
);
