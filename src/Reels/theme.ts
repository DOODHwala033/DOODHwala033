export type Theme = {
  bg: string;
  glow: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  highlight: string;
};

export const THEMES: Record<"gittrend" | "aitool", Theme> = {
  // GitHub-dark look for repo showcases
  gittrend: {
    bg: "#0D1117",
    glow: "rgba(63, 185, 80, 0.28)",
    card: "#161B22",
    border: "#30363D",
    text: "#E6EDF3",
    muted: "#8B949E",
    accent: "#3FB950",
    highlight: "#3FB950",
  },
  // Neon purple look for AI tool explainers
  aitool: {
    bg: "#0B0716",
    glow: "rgba(139, 92, 246, 0.4)",
    card: "#17112B",
    border: "#3B2E66",
    text: "#F5F3FF",
    muted: "#A79FC4",
    accent: "#8B5CF6",
    highlight: "#FFD60A",
  },
};

export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178C6",
  JavaScript: "#F1E05A",
  Python: "#3572A5",
  Rust: "#DEA584",
  Go: "#00ADD8",
  "C++": "#F34B7D",
  C: "#555555",
  Java: "#B07219",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  Ruby: "#701516",
  Shell: "#89E051",
  Jupyter: "#DA5B0B",
};

export const formatCount = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k` : `${Math.round(n)}`;
