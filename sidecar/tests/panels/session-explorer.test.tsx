/**
 * Tests for the SC-04 Session Explorer Panel (composed).
 *
 * RED phase (per 04-PLAN.md Wave 3 Task 6):
 * Write tests FIRST. They must FAIL because the current implementation
 * is a hardcoded 50-line stub at `src/panels/session-explorer/index.tsx`
 * (with hardcoded `ses_1`, `ses_2`, `ses_3`).
 *
 * Per 04-SPEC.md:
 *   - UR-SC04-01: Display all active sessions within 2s of dashboard load
 *   - UR-SC04-05: Search/filter sessions (substring match, 150ms debounce)
 *   - UR-SC04-08: Empty state when zero active sessions
 *   - UR-SC04-10: Graceful degradation when plugin server unreachable
 *   - UR-SC04-11 (CRITICAL): Real data from plugin server, NO hardcoded stubs
 *   - SR-SC04-01: "Plugin server not available" banner + Retry button
 *   - OF-SC04-02: Last Updated timestamp
 *   - ER-SC04-01/02: SSE-driven refresh (delegated to useSessions hook)
 *
 * Per 04-CONTEXT.md:
 *   - D-SC04-01: Composes useSessions() + SessionFilter + SessionTree
 *   - D-SC04-02: State via useSessions (read) + pluginServer refresh (write)
 *   - D-SC04-03: SSE subscription via useSse (handled inside useSessions)
 *   - GA-3: 150ms debounce in PANEL (not in SessionFilter)
 *   - GA-10: ?session_filter= URL persistence
 *
 * Per 04-PATTERNS.md Section 1: Reuse useSse + pluginClient + ErrorBoundary
 *   + Suspense (useSearchParams compatibility).
 *
 * @see ../../src/panels/session-explorer/index.tsx
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-SPEC.md
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-CONTEXT.md
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-PLAN.md (Wave 3, Task 6)
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

// Hoisted mocks for module-level replacement
const mocks = vi.hoisted(() => ({
  getSessions: vi.fn(),
  getSessionChildren: vi.fn(),
  useSse: vi.fn(),
}))

// Mock plugin-client — replaces the real getPluginClient
// The panel + useSessions both go through this. We control getSessions
// and getSessionChildren for state-shape tests.
vi.mock("../../src/lib/plugin-client", () => ({
  getPluginClient: () => ({
    getSessions: mocks.getSessions,
    getSessionChildren: mocks.getSessionChildren,
  }),
}))

// Mock useSse — useSessions invokes it internally. Returning a connected
// shape here means the hook will treat SSE as available without opening
// a real EventSource in jsdom.
vi.mock("../../src/lib/use-sse", () => ({
  useSse: mocks.useSse,
}))

// Mock next/navigation — the panel uses useSearchParams/useRouter/usePathname
// for URL-persisted filter state (per 04-CONTEXT.md GA-10). jsdom has no
// router, so we provide in-memory stubs.
const routerMocks = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
  push: vi.fn(),
  replace: vi.fn(),
}))
vi.mock("next/navigation", () => ({
  useSearchParams: () => routerMocks.searchParams,
  useRouter: () => ({ push: routerMocks.push, replace: routerMocks.replace }),
  usePathname: () => "/",
}))

// Default useSse mock: connected, no event, no-op reconnect
function setupDefaultSseMock(): void {
  mocks.useSse.mockReturnValue({
    connected: true,
    lastEvent: null,
    reconnect: vi.fn(),
  })
}

const sampleSessionMain = {
  id: "ses-main",
  description: "Main session",
  status: "active",
  createdAt: Date.now() - 60000,
  updatedAt: Date.now() - 30000,
  depth: 0,
  messageCount: 5,
  children: ["ses-research"],
}

const sampleSessionResearch = {
  id: "ses-research",
  description: "Research",
  status: "running",
  createdAt: Date.now() - 30000,
  updatedAt: Date.now() - 10000,
  depth: 1,
  messageCount: 3,
  children: [],
}

const sampleSessions = [sampleSessionMain, sampleSessionResearch]

describe("SessionExplorerPanel (composed panel, Wave 3)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset URL search params to empty
    routerMocks.searchParams = new URLSearchParams()
    setupDefaultSseMock()
    // Default: no children (lazy-load returns empty)
    mocks.getSessionChildren.mockResolvedValue({ children: [] })
  })

  it("calls pluginClient.getSessions on mount (real data path, per UR-SC04-11)", async () => {
    mocks.getSessions.mockResolvedValue({ sessions: sampleSessions })

    const { SessionExplorerPanel } = await import(
      "../../src/panels/session-explorer"
    )
    render(<SessionExplorerPanel />)

    await waitFor(() => {
      expect(mocks.getSessions).toHaveBeenCalled()
    })
  })

  it("renders sessions loaded from plugin server (NOT hardcoded ses_1/2/3 stubs)", async () => {
    mocks.getSessions.mockResolvedValue({ sessions: sampleSessions })

    const { SessionExplorerPanel } = await import(
      "../../src/panels/session-explorer"
    )
    render(<SessionExplorerPanel />)

    // Real session descriptions from the sample
    await waitFor(() => {
      expect(screen.getByText("Main session")).toBeInTheDocument()
    })
    expect(screen.getByText("Research")).toBeInTheDocument()
    // CRITICAL (per UR-SC04-11): the old stub had `ses_1`, `ses_2`, `ses_3`
    // as visible text labels. After this fix, no such text appears.
    expect(screen.queryByText("ses_1")).not.toBeInTheDocument()
    expect(screen.queryByText("ses_2")).not.toBeInTheDocument()
    expect(screen.queryByText("ses_3")).not.toBeInTheDocument()
  })

  it("shows loading state initially (before first fetch resolves)", async () => {
    // Never-resolving promise to keep the panel in its initial loading state
    mocks.getSessions.mockReturnValue(new Promise(() => {}))

    const { SessionExplorerPanel } = await import(
      "../../src/panels/session-explorer"
    )
    render(<SessionExplorerPanel />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it("shows empty state when no sessions exist (per UR-SC04-08 + GA-6)", async () => {
    mocks.getSessions.mockResolvedValue({ sessions: [] })

    const { SessionExplorerPanel } = await import(
      "../../src/panels/session-explorer"
    )
    render(<SessionExplorerPanel />)

    await waitFor(() => {
      expect(screen.getByText(/no active sessions/i)).toBeInTheDocument()
    })
  })

  it("shows error banner with Retry button when plugin server is unreachable (per SR-SC04-01)", async () => {
    mocks.getSessions.mockRejectedValue(new Error("Network error"))

    const { SessionExplorerPanel } = await import(
      "../../src/panels/session-explorer"
    )
    render(<SessionExplorerPanel />)

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument()
  })

  it("renders SessionFilter component (per UR-SC04-05)", async () => {
    mocks.getSessions.mockResolvedValue({ sessions: sampleSessions })

    const { SessionExplorerPanel } = await import(
      "../../src/panels/session-explorer"
    )
    render(<SessionExplorerPanel />)

    await waitFor(() => {
      expect(
        screen.getByTestId("session-filter-input")
      ).toBeInTheDocument()
    })
  })

  it("filter input narrows down displayed sessions", async () => {
    mocks.getSessions.mockResolvedValue({ sessions: sampleSessions })

    const { SessionExplorerPanel } = await import(
      "../../src/panels/session-explorer"
    )
    render(<SessionExplorerPanel />)

    await waitFor(() => {
      expect(screen.getByText("Main session")).toBeInTheDocument()
    })

    const input = screen.getByTestId("session-filter-input")
    fireEvent.change(input, { target: { value: "Research" } })

    // After filter, "Main session" should not be visible
    await waitFor(() => {
      expect(screen.queryByText("Main session")).not.toBeInTheDocument()
    })
    // "Research" should still be visible
    expect(screen.getByText("Research")).toBeInTheDocument()
  })

  it("displays Last Updated timestamp (per OF-SC04-02)", async () => {
    mocks.getSessions.mockResolvedValue({ sessions: sampleSessions })

    const { SessionExplorerPanel } = await import(
      "../../src/panels/session-explorer"
    )
    render(<SessionExplorerPanel />)

    await waitFor(() => {
      expect(screen.getByText(/last updated/i)).toBeInTheDocument()
    })
  })

  it("Retry button calls refresh() to re-fetch sessions", async () => {
    mocks.getSessions
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({ sessions: sampleSessions })

    const { SessionExplorerPanel } = await import(
      "../../src/panels/session-explorer"
    )
    render(<SessionExplorerPanel />)

    // Wait for error state to appear
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })

    // Click Retry
    const retryButton = screen.getByRole("button", { name: /retry/i })
    fireEvent.click(retryButton)

    // After retry, real sessions should render
    await waitFor(() => {
      expect(screen.getByText("Main session")).toBeInTheDocument()
    })
    // getSessions should have been called twice (initial fail + retry)
    expect(mocks.getSessions).toHaveBeenCalledTimes(2)
  })
})
