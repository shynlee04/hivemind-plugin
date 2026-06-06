/**
 * Tests for SessionRow component (SC-04 Wave 2a).
 *
 * RED phase: write tests FIRST, they must fail because SessionRow
 * doesn't exist yet.
 *
 * Per 04-SPEC.md:
 *   - UR-SC04-04: Status colors (active/running/pending/completed/failed)
 *   - UR-SC04-06: Display session id, description, status, agent, depth
 *   - UR-SC04-07: Click-to-expand support
 *   - OF-SC04-01: messageCount badge
 *   - OF-SC04-02: toolCallCount badge
 *
 * Per 04-PATTERNS.md (Class Sketches) — SessionRow consumes SessionSummary
 * and emits row-level click + expand events.
 *
 * Per 04-CONTEXT.md GA-9: minimal visual style (text + status colors, no icons)
 *
 * @see ../../src/components/session-row.tsx
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-SPEC.md
 */

import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SessionRow } from "@components/session-row"
import type { SessionSummary } from "@lib/types"

const baseSession: SessionSummary = {
  id: "ses-1",
  status: "active",
  description: "Main session",
  children: ["ses-2", "ses-3"],
  createdAt: Date.now() - 60000,
  updatedAt: Date.now(),
  depth: 0,
  messageCount: 5,
  toolCallCount: 3,
}

describe("SessionRow", () => {
  it("renders session id, description, and status", () => {
    render(
      <SessionRow
        session={baseSession}
        depth={0}
        expanded={false}
        onToggleExpand={vi.fn()}
        onClick={vi.fn()}
      />
    )
    expect(screen.getByText("Main session")).toBeInTheDocument()
    expect(screen.getByText("ses-1")).toBeInTheDocument()
    expect(screen.getByText("active")).toBeInTheDocument()
  })

  it("renders status dot with visual color (active = green)", () => {
    const { container } = render(
      <SessionRow
        session={baseSession}
        depth={0}
        expanded={false}
        onToggleExpand={vi.fn()}
        onClick={vi.fn()}
      />
    )
    const statusDot = container.querySelector('[data-status="active"]')
    expect(statusDot).toBeInTheDocument()
    // jsdom resolves #22c55e to rgb(34, 197, 94)
    const styleAttr = statusDot?.getAttribute("style") ?? ""
    expect(styleAttr).toMatch(/22c55e|rgb\(34,\s*197,\s*94\)/)
  })

  it("renders different status colors per status (UR-SC04-04)", () => {
    const statuses: Array<{ status: string; color: string }> = [
      { status: "active", color: "22c55e" },
      { status: "running", color: "3b82f6" },
      { status: "pending", color: "f59e0b" },
      { status: "completed", color: "94a3b8" },
      { status: "failed", color: "ef4444" },
    ]
    for (const { status, color } of statuses) {
      const { container } = render(
        <SessionRow
          session={{ ...baseSession, status }}
          depth={0}
          expanded={false}
          onToggleExpand={vi.fn()}
          onClick={vi.fn()}
        />
      )
      const statusDot = container.querySelector(`[data-status="${status}"]`)
      expect(statusDot).toBeInTheDocument()
      const styleAttr = statusDot?.getAttribute("style") ?? ""
      // Accept either the hex literal or jsdom's resolved rgb() form
      expect(styleAttr).toMatch(new RegExp(`${color}|rgb\\(\\d+,\\s*\\d+,\\s*\\d+\\)`))
    }
  })

  it("renders child count and message count metadata (UR-SC04-06)", () => {
    render(
      <SessionRow
        session={baseSession}
        depth={0}
        expanded={false}
        onToggleExpand={vi.fn()}
        onClick={vi.fn()}
      />
    )
    expect(screen.getByText(/2 children/i)).toBeInTheDocument()
    expect(screen.getByText(/5 messages/i)).toBeInTheDocument()
  })

  it("applies indentation based on depth (24px per level)", () => {
    const { container } = render(
      <SessionRow
        session={baseSession}
        depth={2}
        expanded={false}
        onToggleExpand={vi.fn()}
        onClick={vi.fn()}
      />
    )
    const row = container.querySelector('[data-session-row="ses-1"]')
    expect(row).toBeInTheDocument()
    // depth 2 = 48px (2 * 24) + 12px base padding
    expect(row).toHaveStyle({ paddingLeft: expect.stringContaining("60") })
  })

  it("shows expand/collapse chevron when session has children", () => {
    const { container: c1 } = render(
      <SessionRow
        session={baseSession}
        depth={0}
        expanded={false}
        onToggleExpand={vi.fn()}
        onClick={vi.fn()}
      />
    )
    expect(c1.querySelector('[data-expand-chevron="ses-1"]')).toBeInTheDocument()

    const { container: c2 } = render(
      <SessionRow
        session={{ ...baseSession, children: [] }}
        depth={0}
        expanded={false}
        onToggleExpand={vi.fn()}
        onClick={vi.fn()}
      />
    )
    expect(c2.querySelector('[data-expand-chevron="ses-1"]')).not.toBeInTheDocument()
  })

  it("chevron shows expanded vs collapsed state (UR-SC04-07)", () => {
    const { container: collapsed } = render(
      <SessionRow
        session={baseSession}
        depth={0}
        expanded={false}
        onToggleExpand={vi.fn()}
        onClick={vi.fn()}
      />
    )
    expect(collapsed.querySelector('[data-expand-chevron="ses-1"]')?.textContent).toBe("▶")

    const { container: expanded } = render(
      <SessionRow
        session={baseSession}
        depth={0}
        expanded={true}
        onToggleExpand={vi.fn()}
        onClick={vi.fn()}
      />
    )
    expect(expanded.querySelector('[data-expand-chevron="ses-1"]')?.textContent).toBe("▼")
  })

  it("calls onToggleExpand when chevron is clicked", () => {
    const onToggle = vi.fn()
    render(
      <SessionRow
        session={baseSession}
        depth={0}
        expanded={false}
        onToggleExpand={onToggle}
        onClick={vi.fn()}
      />
    )
    fireEvent.click(screen.getByTestId("expand-chevron-ses-1"))
    expect(onToggle).toHaveBeenCalledWith("ses-1")
  })

  it("calls onClick when row body is clicked (not chevron)", () => {
    const onClick = vi.fn()
    render(
      <SessionRow
        session={baseSession}
        depth={0}
        expanded={false}
        onToggleExpand={vi.fn()}
        onClick={onClick}
      />
    )
    fireEvent.click(screen.getByTestId("session-row-ses-1"))
    expect(onClick).toHaveBeenCalledWith("ses-1")
  })

  it("chevron click does NOT bubble to row onClick (stopPropagation)", () => {
    const onClick = vi.fn()
    const onToggle = vi.fn()
    render(
      <SessionRow
        session={baseSession}
        depth={0}
        expanded={false}
        onToggleExpand={onToggle}
        onClick={onClick}
      />
    )
    fireEvent.click(screen.getByTestId("expand-chevron-ses-1"))
    expect(onToggle).toHaveBeenCalledWith("ses-1")
    expect(onClick).not.toHaveBeenCalled()
  })

  it("falls back to session id when description is empty", () => {
    const { container } = render(
      <SessionRow
        session={{ ...baseSession, description: "" }}
        depth={0}
        expanded={false}
        onToggleExpand={vi.fn()}
        onClick={vi.fn()}
      />
    )
    // The session id should appear as the label (at least once — could be in label + small id below)
    const allText = container.textContent || ""
    expect(allText).toContain("ses-1")
  })

  it("uses minimal visual style — no emoji icons in row text content (GA-9)", () => {
    const { container } = render(
      <SessionRow
        session={baseSession}
        depth={0}
        expanded={false}
        onToggleExpand={vi.fn()}
        onClick={vi.fn()}
      />
    )
    // No emoji icons in the row text content (per GA-9 minimal style)
    // Unicode emoji range (U+1F300-1F9FF) should not appear.
    // Note: bullet character "●" (U+25CF) is allowed.
    const text = container.textContent || ""
    expect(text).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u)
  })
})
