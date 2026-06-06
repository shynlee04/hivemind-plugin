/**
 * Tests for SessionTree component (SC-04 Wave 2c).
 *
 * RED phase: write tests FIRST, they must fail because SessionTree
 * doesn't exist yet.
 *
 * Per 04-SPEC.md:
 *   - UR-SC04-02: Tree displays parent→child hierarchy via indentation
 *   - UR-SC04-07: Lazy-load children on expand (not on mount)
 *   - SR-SC04-03: Per-row error if children fetch fails
 *
 * Per 04-PATTERNS.md (Section 2.1 — Recursive tree component pattern):
 *   - Component is recursive: each node renders its own SessionRow + children
 *   - State lives internally in a per-node record
 *   - On chevron click: if not loaded, call childLoader; if loaded, toggle
 *
 * Per 04-CONTEXT.md GA-4: lazy-load on expand (not eager).
 *
 * The component is testable in isolation via the `childLoader` prop
 * (public seam per universal-rules.md §6.3). No pluginClient coupling
 * inside the component.
 *
 * @see ../../src/components/session-tree.tsx
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-SPEC.md
 */

import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SessionTree } from "@components/session-tree"
import type { SessionSummary } from "@lib/types"

const baseSession: SessionSummary = {
  id: "ses-1",
  description: "Main session",
  status: "active",
  createdAt: Date.now() - 60000,
  updatedAt: Date.now() - 30000,
  depth: 0,
  messageCount: 5,
  children: ["ses-2"],
}

const childSession: SessionSummary = {
  id: "ses-2",
  description: "Research subtask",
  status: "running",
  createdAt: Date.now() - 30000,
  updatedAt: Date.now() - 10000,
  depth: 1,
  messageCount: 3,
  // children: ["ses-3"] so the chevron renders on ses-2, enabling
  // the nested-expand test (test #9) to click and load grandchildren.
  children: ["ses-3"],
}

const childWithoutChildren: SessionSummary = {
  id: "ses-2",
  description: "Leaf session",
  status: "completed",
  createdAt: Date.now() - 30000,
  updatedAt: Date.now() - 10000,
  depth: 1,
  messageCount: 3,
  children: [],
}

describe("SessionTree", () => {
  it("renders a single session as a tree with one row", () => {
    render(
      <SessionTree
        sessions={[baseSession]}
        childLoader={vi.fn().mockResolvedValue([])}
      />
    )
    expect(screen.getByText("Main session")).toBeInTheDocument()
    expect(screen.getByText("ses-1")).toBeInTheDocument()
  })

  it("renders multiple root sessions", () => {
    render(
      <SessionTree
        sessions={[
          baseSession,
          { ...baseSession, id: "ses-3", description: "Another root" },
        ]}
        childLoader={vi.fn().mockResolvedValue([])}
      />
    )
    expect(screen.getByText("Main session")).toBeInTheDocument()
    expect(screen.getByText("Another root")).toBeInTheDocument()
  })

  it("does not render children when parent is collapsed", () => {
    render(
      <SessionTree
        sessions={[baseSession]}
        childLoader={vi.fn().mockResolvedValue([childSession])}
      />
    )
    expect(screen.getByText("Main session")).toBeInTheDocument()
    // Children not loaded yet, not visible
    expect(screen.queryByText("Research subtask")).not.toBeInTheDocument()
  })

  it("calls childLoader when chevron is clicked (lazy-load on expand)", async () => {
    const childLoader = vi.fn().mockResolvedValue([childSession])
    render(<SessionTree sessions={[baseSession]} childLoader={childLoader} />)
    fireEvent.click(screen.getByTestId("expand-chevron-ses-1"))
    await waitFor(() => {
      expect(childLoader).toHaveBeenCalledWith("ses-1")
    })
  })

  it("renders children after expand (recursive tree)", async () => {
    const childLoader = vi.fn().mockResolvedValue([childSession])
    render(<SessionTree sessions={[baseSession]} childLoader={childLoader} />)
    fireEvent.click(screen.getByTestId("expand-chevron-ses-1"))
    await waitFor(() => {
      expect(screen.getByText("Research subtask")).toBeInTheDocument()
    })
  })

  it("applies depth-based indentation to children", async () => {
    const childLoader = vi.fn().mockResolvedValue([childSession])
    render(<SessionTree sessions={[baseSession]} childLoader={childLoader} />)
    fireEvent.click(screen.getByTestId("expand-chevron-ses-1"))
    await waitFor(() => {
      const childRow = screen.getByTestId("session-row-ses-2")
      // SessionRow applies paddingLeft = depth * 24 + 12
      // For depth 1: 1 * 24 + 12 = 36px
      expect(childRow).toHaveStyle({ paddingLeft: "36px" })
    })
  })

  it("shows loading indicator while children are being fetched", async () => {
    let resolveLoader!: (children: SessionSummary[]) => void
    const childLoader = vi.fn().mockImplementation(
      () =>
        new Promise<SessionSummary[]>((resolve) => {
          resolveLoader = resolve
        })
    )
    render(<SessionTree sessions={[baseSession]} childLoader={childLoader} />)
    fireEvent.click(screen.getByTestId("expand-chevron-ses-1"))
    // While promise is pending
    expect(
      screen.getByTestId("session-tree-loading-ses-1")
    ).toBeInTheDocument()
    // Resolve the promise
    resolveLoader([childSession])
    await waitFor(() => {
      expect(
        screen.queryByTestId("session-tree-loading-ses-1")
      ).not.toBeInTheDocument()
    })
  })

  it("shows error message when childLoader fails (per SR-SC04-03)", async () => {
    const childLoader = vi
      .fn()
      .mockRejectedValue(new Error("Failed to load children"))
    render(<SessionTree sessions={[baseSession]} childLoader={childLoader} />)
    fireEvent.click(screen.getByTestId("expand-chevron-ses-1"))
    await waitFor(() => {
      expect(screen.getByText(/failed to load children/i)).toBeInTheDocument()
    })
  })

  it("supports nested expand (grandchildren render with depth 2)", async () => {
    const grandChild: SessionSummary = {
      id: "ses-3",
      description: "Grandchild",
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      depth: 2,
      messageCount: 1,
      children: [],
    }
    const childLoader = vi
      .fn()
      .mockResolvedValueOnce([childSession]) // First call: load children of ses-1
      .mockResolvedValueOnce([grandChild]) // Second call: load children of ses-2
    render(<SessionTree sessions={[baseSession]} childLoader={childLoader} />)
    fireEvent.click(screen.getByTestId("expand-chevron-ses-1"))
    await waitFor(() =>
      expect(screen.getByText("Research subtask")).toBeInTheDocument()
    )
    fireEvent.click(screen.getByTestId("expand-chevron-ses-2"))
    await waitFor(() =>
      expect(screen.getByText("Grandchild")).toBeInTheDocument()
    )
    const grandChildRow = screen.getByTestId("session-row-ses-3")
    // SessionRow applies paddingLeft = depth * 24 + 12
    // For depth 2: 2 * 24 + 12 = 60px
    expect(grandChildRow).toHaveStyle({ paddingLeft: "60px" })
  })

  it("collapses children when chevron is clicked again", async () => {
    const childLoader = vi.fn().mockResolvedValue([childSession])
    render(<SessionTree sessions={[baseSession]} childLoader={childLoader} />)
    fireEvent.click(screen.getByTestId("expand-chevron-ses-1"))
    await waitFor(() =>
      expect(screen.getByText("Research subtask")).toBeInTheDocument()
    )
    // Click again to collapse (chevron now shows ▼)
    fireEvent.click(screen.getByTestId("expand-chevron-ses-1"))
    await waitFor(() => {
      expect(screen.queryByText("Research subtask")).not.toBeInTheDocument()
    })
  })
})
