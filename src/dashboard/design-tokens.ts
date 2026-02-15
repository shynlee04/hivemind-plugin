/**
 * HiveMind Dashboard Design Tokens
 *
 * Defines colors, spacing, and other visual constants for the TUI.
 */

export const COLORS = {
  primary: "#00eeff",   // Cyan
  secondary: "green",
  warning: "yellow",
  error: "red",
  info: "blue",
  neutral: "white",
  dim: "gray",
  trace: "magenta",
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
  primary: "Space Grotesk", // Conceptual, as TUI fonts depend on terminal
} as const;
