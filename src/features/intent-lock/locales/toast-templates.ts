/**
 * Locale-keyed toast string templates for intent-lock gate (P27.2 T25).
 *
 * Each template map provides per-locale strings for the three toast types:
 * - `gateActive`: Fired when the gate activates for a new session (AC-40).
 * - `gateBlocked`: Fired when a tool is blocked by the gate (AC-41).
 * - `gateComplete`: Fired when the gate completes and unblocks (D-10).
 *
 * State names remain English (enum values) per T25 requirement.
 */

/**
 * Toast template map for a single locale.
 * Template variables: `{toolName}`, `{evidenceList}`, `{currentState}`.
 */
export interface ToastTemplates {
  gateActive: string
  gateBlocked: string
  gateComplete: string
}

/**
 * English toast templates (default).
 */
export const en: ToastTemplates = {
  gateActive: "Intent Lock Gate active — State {currentState}",
  gateBlocked: "Gate blocked {toolName} — needs: {evidenceList}",
  gateComplete: "Intent Lock Gate: COMPLETED — session unblocked",
}

/**
 * Vietnamese toast templates.
 */
export const vi: ToastTemplates = {
  gateActive: "Cổng Intent Lock đang hoạt động — Trạng thái {currentState}",
  gateBlocked: "Cổng đã chặn {toolName} — cần: {evidenceList}",
  gateComplete: "Cổng Intent Lock: HOÀN THÀNH — phiên đã được mở khóa",
}

/**
 * Load toast templates for a given locale code.
 * Falls back to English for unknown/unregistered locales.
 *
 * @param locale - Locale code (e.g., "en", "vi").
 * @returns The toast templates for the locale.
 */
export function loadToastTemplates(locale: string): ToastTemplates {
  if (locale === "vi") return vi
  return en
}
