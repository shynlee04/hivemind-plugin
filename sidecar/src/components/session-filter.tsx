/**
 * SessionFilter component — debounced search input for the Session Explorer Panel.
 *
 * Per 04-PLAN.md Wave 2 Task 5 (SC-04 EXECUTION):
 *   - Controlled search input for filtering sessions
 *   - Placeholder text: "Search sessions by name, id, or status..."
 *   - Clear button (visible when value is non-empty)
 *   - 13px font, 1px border, focus state with blue border
 *   - 24px+ row height, light gray background, consistent with session-row.tsx
 *
 * Per 04-SPEC.md (UR-SC04-05): filter response SHALL be < 200ms for up to
 * 1000 sessions (substring match on id/description/status/agent). Filtering
 * logic itself lives in the parent (Wave 3 panel composition), not here.
 *
 * Per 04-CONTEXT.md GA-3: 150ms debounce at the PANEL layer, not in this
 * component. The component is a pure controlled input — every keystroke
 * fires onChange immediately. Wave 3 (session-explorer panel composition)
 * wraps the onChange callback in useDeferredValue + 150ms setTimeout.
 *
 * Why this design (pure, no internal debounce):
 *   - Easier to test (no fake timers needed; every keystroke is observable)
 *   - Debounce semantics are application-specific (Wave 3 may want
 *     to debounce the URL write separately from the filter apply)
 *   - Component is reusable for non-search use cases (e.g., a future
 *     "Jump to session id" box)
 *
 * Per 04-PATTERNS.md (Class Sketches 4.4): the data-testid seams are
 * `session-filter-input` and `session-filter-clear`. CSS variables from
 * dashboard-shell.tsx are reused for visual consistency.
 *
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-SPEC.md (UR-SC04-05)
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-CONTEXT.md (GA-3)
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-PATTERNS.md (Class Sketches 4.4)
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-PLAN.md (Task 5)
 *
 * @module sidecar/components/session-filter
 */

"use client"

import React from "react"

/** Default placeholder text (per 04-PLAN.md T2b.2). */
const DEFAULT_PLACEHOLDER = "Search sessions by name, id, or status..."

/** Search icon glyph used as a visual hint (decorative only). */
const SEARCH_GLYPH = "🔍"

/** ARIA label for the clear button. */
const CLEAR_ARIA_LABEL = "Clear filter"

export interface SessionFilterProps {
  /**
   * Current filter value (controlled).
   * The component reflects this value in the input on every render.
   * Pass `""` for empty filter.
   */
  value: string
  /**
   * Callback fired on every keystroke. NOT debounced.
   *
   * Debouncing (per 04-CONTEXT.md GA-3) is the parent's responsibility:
   * Wave 3 (session-explorer panel) wraps this in useDeferredValue +
   * 150ms setTimeout.
   */
  onChange: (value: string) => void
  /**
   * Optional placeholder override.
   * @default "Search sessions by name, id, or status..."
   */
  placeholder?: string
}

/**
 * Renders a search input for filtering sessions in the Session Explorer Panel.
 *
 * The component is a pure controlled input:
 *   - `value` reflects the current filter (controlled)
 *   - `onChange` fires on every keystroke (no internal debounce)
 *   - A clear button is shown when value is non-empty
 *
 * Layout: [search icon] [text input] [clear button (when non-empty)]
 *
 * Public seam (per universal-rules.md §6.3):
 *   - Props: value, onChange, placeholder
 *   - DOM hooks: data-testid="session-filter-input", data-testid="session-filter-clear"
 *   - Events: onChange(value) on every keystroke; clear button → onChange("")
 *
 * Visual style matches the dashboard shell aesthetic (inline styles,
 * 13px font, 1px border, focus ring in blue).
 */
export function SessionFilter({
  value,
  onChange,
  placeholder = DEFAULT_PLACEHOLDER,
}: SessionFilterProps): React.ReactElement {
  return (
    <div
      data-session-filter="true"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 12px",
        borderBottom: "1px solid #e2e8f0",
        background: "#f8fafc",
      }}
    >
      {/* Search icon (decorative — aria-hidden) */}
      <span
        style={{
          color: "#94a3b8",
          fontSize: "13px",
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {SEARCH_GLYPH}
      </span>

      {/* Text input (controlled) */}
      <input
        data-testid="session-filter-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: "6px 8px",
          fontSize: "13px",
          color: "#334155",
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: "4px",
          outline: "none",
          minWidth: 0,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#3b82f6"
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#cbd5e1"
        }}
      />

      {/* Clear button (only when value is non-empty) */}
      {value && (
        <button
          data-testid="session-filter-clear"
          type="button"
          onClick={() => onChange("")}
          aria-label={CLEAR_ARIA_LABEL}
          style={{
            padding: "4px 8px",
            fontSize: "12px",
            color: "#64748b",
            background: "transparent",
            border: "1px solid #cbd5e1",
            borderRadius: "4px",
            cursor: "pointer",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f1f5f9"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent"
          }}
        >
          Clear
        </button>
      )}
    </div>
  )
}
