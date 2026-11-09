/**
 * konnevo olive theme constants for places where CSS classes are not enough
 * (inline styles, canvas, charts, confetti, toasts). Only approved hex values.
 */
export const BRAND = {
  softWhite: "#E8E9DF",
  sage: "#A9B887",
  deepOlive: "#2E3D28",
  ink: "#111111", // text only
} as const;

export const DERIVED = {
  paper: "#F3F4EC",
  sage200: "#D7E0C1",
  moss: "#6E8A4F",
  mossDark: "#4F6B3A",
  olive700: "#3C4F34",
  olive900: "#1F2A1B",
  lineLight: "#CED1C5",
  linePaper: "#D7DAD1",
  lineDark: "#485542",
} as const;

export const STATUS = {
  brick: "#A63A28",
  brickGlow: "#B3442F",
  brickTint: "#F0D5CE",
  brickText: "#7A2A1B",
  amberTint: "#EBDDB0",
  amberText: "#7A4E0E",
  dismissed: "#D6D8C9",
  success: "#4F6B3A",
} as const;

/** Glows for the swipe card and the knob. Use with box-shadow or the .glow-* classes. */
export const GLOW = {
  skip: { color: "#B3442F", alpha: 0.45, card: "0 0 48px 6px rgba(179, 68, 47, 0.45)" },
  match: {
    color: "#A9B887",
    alpha: 0.6,
    edge: "#6E8A4F",
    card: "0 0 0 2px #6E8A4F, 0 0 48px 6px rgba(169, 184, 135, 0.6)",
  },
} as const;

/** Slide knob track, skip end to match end. */
export const KNOB_TRACK = {
  stops: ["#A63A28", "#8B9384", "#A9B887", "#6E8A4F"] as const,
  /** The skip end stays flat brick for the first third so the SKIP label keeps 4.5:1. */
  gradient: "linear-gradient(to right, #A63A28 0%, #A63A28 30%, #8B9384 50%, #A9B887 70%, #6E8A4F 100%)",
} as const;

export const PROGRESS_BAR = {
  stops: ["#A9B887", "#6E8A4F"] as const,
  gradient: "linear-gradient(to right, #A9B887, #6E8A4F)",
} as const;

/** Confetti on the dark match popup. Never #2E3D28 here. */
export const CONFETTI_COLORS = ["#A9B887", "#E8E9DF", "#6E8A4F", "#D7E0C1", "#F3F4EC"] as const;

export const SHIMMER = {
  light: { from: "#DFE1D2", to: "#EEF0E4" },
  dark: { from: "#3C4F34", to: "#4A6040" },
} as const;

export const OVERLAY = { color: "#1F2A1B", alpha: 0.55, blur: "6px" } as const;

/** Toast colours. Text is soft white on all of them. */
export const TOAST = {
  success: { bg: "#4F6B3A", text: "#E8E9DF" },
  error: { bg: "#A63A28", text: "#E8E9DF" },
  neutral: { bg: "#2E3D28", text: "#E8E9DF" },
} as const;

/** Status badge colours. */
export const BADGE = {
  registered: { bg: "#D7E0C1", text: "#2E3D28" },
  attended: { bg: "#2E3D28", text: "#E8E9DF" },
  waiting: { bg: "#EBDDB0", text: "#7A4E0E" },
  reportOpen: { bg: "#F0D5CE", text: "#7A2A1B" },
  reportReviewing: { bg: "#EBDDB0", text: "#7A4E0E" },
  reportResolved: { bg: "#D7E0C1", text: "#2E3D28" },
  reportDismissed: { bg: "#D6D8C9", text: "#2E3D28" },
} as const;

/** Buttons, links, inputs, focus rings. */
export const CONTROLS = {
  primaryOnLight: { bg: "#2E3D28", text: "#E8E9DF", hoverBg: "#3C4F34" },
  secondary: { bg: "#A9B887", text: "#111111", hoverBg: "#D7E0C1", hoverText: "#2E3D28" },
  primaryOnDark: { bg: "#A9B887", text: "#2E3D28" },
  destructive: { bg: "#A63A28", text: "#E8E9DF" },
  link: { onLight: "#4F6B3A", onDark: "#A9B887" },
  focusRing: { onLight: "#4F6B3A", onDark: "#A9B887" },
  input: { bg: "#F3F4EC", border: "#6E8A4F", text: "#111111" },
  bar: { bg: "#2E3D28", text: "#E8E9DF", activeUnderline: "#A9B887" },
  logoTile: { bg: "#A9B887", letter: "#2E3D28" },
} as const;

/** Chart colours for /core (replaces the blue). Lines and bars keep 3:1 or more on paper; sage is fill only. */
export const CHART = {
  olive: "#2E3D28",
  mossDark: "#4F6B3A",
  moss: "#6E8A4F",
  sage: "#A9B887",
  sage200: "#D7E0C1",
  amber: "#7A4E0E",
  brick: "#A63A28",
  neutral: "#485542",
  grid: "#CED1C5",
  axisText: "#3C4F34",
  text: "#111111",
  surface: "#F3F4EC",
  empty: "#E8E9DF",
  series: ["#2E3D28", "#6E8A4F", "#7A4E0E"] as const,
} as const;
