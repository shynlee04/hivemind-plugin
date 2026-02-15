/**
 * HiveMind Dashboard Design Tokens
 *
 * Defines neon color palette and visual constants for the TUI.
 *
 * TODO [US-032]: Eventually migrate this design system to OpenTUI themes when environment permits.
 */

export const COLORS = {
  // Neon Palette (US-050)
  neonGreen: "#00ff41",
  neonAmber: "#ffb000",
  neonBlue: "#00f0ff",
  neonPurple: "#bd00ff",
  neonPink: "#ff0055",
  neonRed: "#ff3333",

  // Backgrounds
  bgDark: "#0d0d0d",
  bgPanel: "#111111",
  bgInput: "#13131a",

  // Semantic mappings
  primary: "#00f0ff",   // neonBlue
  secondary: "#00ff41", // neonGreen
  warning: "#ffb000",   // neonAmber
  error: "#ff3333",     // neonRed
  info: "#bd00ff",      // neonPurple
  neutral: "#ffffff",
  dim: "gray",
  trace: "#ff0055",     // neonPink
} as const;

export const SPACING = {
  sm: 1,
  md: 2,
  lg: 3,
} as const;

export const BORDERS = {
  default: "round",
  bold: "bold",
} as const;

export const FONTS = {
  primary: "JetBrains Mono", // Conceptual
  scanline: true, // TODO: Implement scanline effect
} as const;
