import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const CREAM = "#F2E8D0";
const CREAM_SHADE = "#E2D5B6";
const INK = "#1B1A17";
const RED = "#E23B2E";

// Paper-cutout card: a big eye watching a minimalist laptop.
// The trackpad is the card's single red accent.
export const PaperCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 12, mass: 0.7 } });

  // Stop-motion "boil": a tiny new jitter every 3 frames
  const step = Math.floor(frame / 3);
  const jitter = (seed: string, amount: number) =>
    (random(`${seed}-${step}`) - 0.5) * amount;

  // Blink once, then the gaze drops to the laptop
  const blink = interpolate(frame, [38, 42, 46], [1, 0.08, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const gaze = spring({ frame: frame - 48, fps, config: { damping: 14 } });
  const lookX = interpolate(gaze, [0, 1], [-30, 0]);
  const lookY = interpolate(gaze, [0, 1], [-10, 52]);

  const sightLines = interpolate(frame, [52, 66], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <svg
        viewBox="0 0 1080 1920"
        width="100%"
        height="100%"
        style={{
          transform: `translateY(${(1 - enter) * 500}px) rotate(${(1 - enter) * -7 + jitter("rot", 0.8)}deg)`,
        }}
      >
        <defs>
          <filter id="cut" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.035"
              numOctaves="2"
              seed={step % 4}
            />
            <feDisplacementMap in="SourceGraphic" scale="7" />
            <feDropShadow dx="7" dy="10" stdDeviation="5" floodOpacity="0.35" />
          </filter>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" />
            <feColorMatrix
              values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0.45 0"
            />
          </filter>
          <clipPath id="eye-shape">
            <path d="M200 520 Q540 270 880 520 Q540 770 200 520 Z" />
          </clipPath>
          <clipPath id="card">
            <rect x="56" y="120" width="968" height="1180" rx="10" />
          </clipPath>
        </defs>

        {/* Stacked sheets behind the card */}
        <rect x="84" y="150" width="968" height="1180" rx="10" fill={CREAM_SHADE}
          transform="rotate(3 540 740)" filter="url(#cut)" />
        <rect x="70" y="136" width="968" height="1180" rx="10" fill="#EADFC3"
          transform="rotate(-2 540 740)" filter="url(#cut)" />

        {/* Front card */}
        <g filter="url(#cut)">
          <rect x="56" y="120" width="968" height="1180" rx="10" fill={CREAM} />
        </g>

        {/* Eye */}
        <g
          transform={`translate(${jitter("ex", 4)} ${jitter("ey", 4)})`}
          filter="url(#cut)"
        >
          <g transform={`translate(540 520) scale(1 ${blink}) translate(-540 -520)`}>
            <path d="M200 520 Q540 270 880 520 Q540 770 200 520 Z"
              fill="#FBF6EA" stroke={INK} strokeWidth="12" strokeLinejoin="round" />
            <g clipPath="url(#eye-shape)">
              <circle cx={540 + lookX} cy={520 + lookY} r="128" fill={CREAM_SHADE}
                stroke={INK} strokeWidth="10" />
              <circle cx={540 + lookX} cy={520 + lookY} r="58" fill={INK} />
              <circle cx={512 + lookX} cy={490 + lookY} r="18" fill="#FBF6EA" />
            </g>
          </g>
          {/* Lashes */}
          {[-3, -2, -1, 0, 1, 2, 3].map((i) => {
            const x = 540 + i * 90;
            const y = 520 - 250 * (1 - (i * i) / 16) * 0.75 * blink;
            return (
              <line key={i} x1={x} y1={y} x2={x + i * 14} y2={y - 60}
                stroke={INK} strokeWidth="11" strokeLinecap="round" />
            );
          })}
        </g>

        {/* Sight lines from eye to screen */}
        <g opacity={sightLines} stroke={INK} strokeWidth="7"
          strokeDasharray="4 22" strokeLinecap="round">
          <line x1="470" y1="660" x2="400" y2="850" />
          <line x1="610" y1="660" x2="680" y2="850" />
        </g>

        {/* Laptop */}
        <g
          transform={`translate(${jitter("lx", 4)} ${jitter("ly", 4)})`}
          filter="url(#cut)"
        >
          <rect x="290" y="860" width="500" height="300" rx="16"
            fill="#FBF6EA" stroke={INK} strokeWidth="12" />
          <rect x="322" y="892" width="436" height="236" rx="6" fill={CREAM_SHADE} />
          <g stroke={INK} strokeWidth="9" strokeLinecap="round">
            <line x1="360" y1="940" x2="560" y2="940" />
            <line x1="360" y1="990" x2="700" y2="990" />
            <line x1="360" y1="1040" x2="620" y2="1040" />
          </g>
          <path d="M240 1160 L840 1160 L900 1232 L180 1232 Z"
            fill="#FBF6EA" stroke={INK} strokeWidth="12" strokeLinejoin="round" />
          {/* The one red accent */}
          <path d="M465 1180 L615 1180 L628 1214 L452 1214 Z" fill={RED}
            stroke={INK} strokeWidth="6" strokeLinejoin="round" />
        </g>

        {/* Paper grain over everything on the card */}
        <rect x="56" y="120" width="968" height="1180" filter="url(#grain)"
          clipPath="url(#card)" style={{ mixBlendMode: "multiply" }} />
      </svg>
    </AbsoluteFill>
  );
};
