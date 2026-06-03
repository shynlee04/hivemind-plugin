import { describe, it, expect, vi, beforeEach } from "vitest"
import React from "react"

// ── Types ──

interface DashboardShellProps {
  panels: Array<{ id: string; label: string }>
  defaultPanel?: string
}

// ── Scaffold tests ──

describe("dashboard-shell", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe("4-panel grid", () => {
    it("should render 4 grid cells", () => {
      const panels = [
        { id: "sessions", label: "Session Explorer" },
        { id: "delegation", label: "Delegation Dashboard" },
        { id: "mems", label: "MEMS Browser" },
        { id: "control", label: "Control Panel" },
      ]

      // RED: will fail until dashboard-shell.tsx provides DashboardShell
      const { container } = render(<DashboardShell panels={panels} />)
      const cells = container.querySelectorAll('[data-panel]')
      expect(cells.length).toBe(4)
    })

    it("should render all 4 panel stubs by name", () => {
      const panels = [
        { id: "sessions", label: "Session Explorer" },
        { id: "delegation", label: "Delegation Dashboard" },
        { id: "mems", label: "MEMS Browser" },
        { id: "control", label: "Control Panel" },
      ]

      const { container } = render(<DashboardShell panels={panels} />)
      for (const panel of panels) {
        const el = container.querySelector(`[data-panel-id="${panel.id}"]`)
        expect(el).toBeTruthy()
      }
    })
  })

  describe("tab navigation", () => {
    it("should activate panel on tab click", () => {
      const panels = [
        { id: "sessions", label: "Session Explorer" },
        { id: "delegation", label: "Delegation Dashboard" },
      ]

      const { container } = render(<DashboardShell panels={panels} />)
      const tab = container.querySelector('[data-tab="delegation"]')

      if (tab) {
        const click = new MouseEvent("click", { bubbles: true })
        tab.dispatchEvent(click)
      }

      const activePanel = container.querySelector('[data-panel-id="delegation"][data-active="true"]')
      expect(activePanel).toBeTruthy()
    })

    it("should hide non-selected panels without unmounting", () => {
      const panels = [
        { id: "sessions", label: "Session Explorer" },
        { id: "delegation", label: "Delegation Dashboard" },
      ]

      const { container } = render(<DashboardShell panels={panels} defaultPanel="sessions" />)
      const allPanels = container.querySelectorAll("[data-panel]")
      expect(allPanels.length).toBe(2)
    })
  })

  describe("SSE connection indicator", () => {
    it("should show connection status indicator", () => {
      const panels = [{ id: "sessions", label: "Session Explorer" }]

      const { container } = render(<DashboardShell panels={panels} />)
      const indicator = container.querySelector("[data-sse-status]")
      expect(indicator).toBeTruthy()
    })
  })

  describe("not available state", () => {
    it("should show waiting message when plugin unreachable", () => {
      const panels = [{ id: "sessions", label: "Session Explorer" }]

      const { container } = render(<DashboardShell panels={panels} pluginAvailable={false} />)
      const msg = container.querySelector("[data-not-available]")
      expect(msg).toBeTruthy()
    })
  })
})

// ── Minimal React test helpers ──

function render(element: React.ReactElement): { container: HTMLElement } {
  // RED scaffold: will fail until testing-library is configured
  throw new Error("NOT_IMPLEMENTED: render must be provided by @testing-library/react")
}

// Stub component reference for type checking
function DashboardShell(_props: DashboardShellProps): React.ReactElement | null {
  // RED scaffold: will fail until dashboard-shell.tsx provides DashboardShell
  throw new Error("NOT_IMPLEMENTED: DashboardShell must be provided by dashboard-shell.tsx")
}
