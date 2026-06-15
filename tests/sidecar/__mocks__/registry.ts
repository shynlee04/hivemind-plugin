/**
 * Standalone mock factory for SidecarDependencyRegistry (SC-01 surface).
 *
 * This mock is deliberately independent of `src/sidecar/**` so it can be
 * used in W0 (TDD red) before the SC-02 source files exist. Test sites
 * cast the returned `registry` value to `SidecarDependencyRegistry` via
 * `as unknown as SidecarDependencyRegistry`.
 *
 * SC-02 contract (verified from src/sidecar/server/registry.ts):
 *  - 6 public setters: setDelegationManager | setSessionTracker |
 *    setOpenCodeClient | setTrajectory | setPressure | setConfigSubscriber
 *  - 6 public getters: getDelegationManager | getSessionTracker |
 *    getOpenCodeClient | getTrajectory | getPressure | getConfigSubscriber
 *  - isReady(): boolean — true when the 3 core deps are wired
 *  - All setters/getters are guarded with [Hivemind] prefix on errors
 *  - Fields are private (#) so duck-typing is required for the mock
 *
 * Returns a bundle of vi.fn()-backed setters/getters plus stand-in
 * dependency instances. Test code can assert call counts and
 * customise return values per-test via the `vi.fn()` API.
 */
import { vi } from "vitest"

// --- Minimal re-declared interfaces (avoid circular src imports) ---

export type MockOpenCodeClient = {
  session: {
    prompt: ReturnType<typeof vi.fn>
  }
}

export type MockDelegationManager = {
  chain: ReturnType<typeof vi.fn>
  dispatch: ReturnType<typeof vi.fn>
  abort: ReturnType<typeof vi.fn>
  list: ReturnType<typeof vi.fn>
}

export type MockSessionTracker = {
  list: ReturnType<typeof vi.fn>
  get: ReturnType<typeof vi.fn>
  isLoaded: ReturnType<typeof vi.fn>
}

export type MockTrajectory = {
  inspect: ReturnType<typeof vi.fn>
  attach: ReturnType<typeof vi.fn>
  checkpoint: ReturnType<typeof vi.fn>
}

export type MockPressure = {
  classify: ReturnType<typeof vi.fn>
  detect: ReturnType<typeof vi.fn>
  inspect_tool_catalog: ReturnType<typeof vi.fn>
}

export type MockConfigSubscriber = {
  subscribe: ReturnType<typeof vi.fn>
  unsubscribe: ReturnType<typeof vi.fn>
  get: ReturnType<typeof vi.fn>
}

/**
 * Duck-typed stand-in for SC-01's `SidecarDependencyRegistry`.
 * SC-01 uses `#private` field syntax, so we declare the public
 * surface only and cast at test sites.
 */
export type MockRegistrySurface = {
  setDelegationManager: ReturnType<typeof vi.fn>
  setSessionTracker: ReturnType<typeof vi.fn>
  setOpenCodeClient: ReturnType<typeof vi.fn>
  setTrajectory: ReturnType<typeof vi.fn>
  setPressure: ReturnType<typeof vi.fn>
  setConfigSubscriber: ReturnType<typeof vi.fn>
  getDelegationManager: ReturnType<typeof vi.fn>
  getSessionTracker: ReturnType<typeof vi.fn>
  getOpenCodeClient: ReturnType<typeof vi.fn>
  getTrajectory: ReturnType<typeof vi.fn>
  getPressure: ReturnType<typeof vi.fn>
  getConfigSubscriber: ReturnType<typeof vi.fn>
  isReady: ReturnType<typeof vi.fn>
  delegationManager: MockDelegationManager
  sessionTracker: MockSessionTracker
  client: MockOpenCodeClient
  trajectory: MockTrajectory
  pressure: MockPressure
  configSubscriber: MockConfigSubscriber
}

export type MockRegistryBundle = {
  registry: MockRegistrySurface
  delegationManager: MockDelegationManager
  sessionTracker: MockSessionTracker
  client: MockOpenCodeClient
  trajectory: MockTrajectory
  pressure: MockPressure
  configSubscriber: MockConfigSubscriber
}

/**
 * Build a fresh mock registry bundle. Each call returns independent
 * vi.fn() instances so tests do not share state.
 */
export function createMockRegistry(): MockRegistryBundle {
  const delegationManager: MockDelegationManager = {
    chain: vi.fn().mockResolvedValue([]),
    dispatch: vi.fn().mockResolvedValue({ delegationId: "mock-delegation-1" }),
    abort: vi.fn().mockResolvedValue({ aborted: true }),
    list: vi.fn().mockResolvedValue([]),
  }

  const sessionTracker: MockSessionTracker = {
    list: vi.fn().mockReturnValue(new Map()),
    get: vi.fn().mockReturnValue(undefined),
    isLoaded: vi.fn().mockReturnValue(true),
  }

  const client: MockOpenCodeClient = {
    session: {
      prompt: vi.fn().mockResolvedValue({ info: { id: "mock-session-1" } }),
    },
  }

  const trajectory: MockTrajectory = {
    inspect: vi.fn().mockResolvedValue({ events: [] }),
    attach: vi.fn().mockResolvedValue(undefined),
    checkpoint: vi.fn().mockResolvedValue(undefined),
  }

  const pressure: MockPressure = {
    classify: vi.fn().mockReturnValue({ tier: 0 }),
    detect: vi.fn().mockReturnValue({ isControlPlane: true }),
    inspect_tool_catalog: vi.fn().mockReturnValue([]),
  }

  const configSubscriber: MockConfigSubscriber = {
    subscribe: vi.fn().mockReturnValue(() => {}),
    unsubscribe: vi.fn(),
    get: vi.fn().mockReturnValue({}),
  }

  const registry: MockRegistrySurface = {
    setDelegationManager: vi.fn(),
    setSessionTracker: vi.fn(),
    setOpenCodeClient: vi.fn(),
    setTrajectory: vi.fn(),
    setPressure: vi.fn(),
    setConfigSubscriber: vi.fn(),
    getDelegationManager: vi.fn(() => delegationManager),
    getSessionTracker: vi.fn(() => sessionTracker),
    getOpenCodeClient: vi.fn(() => client),
    getTrajectory: vi.fn(() => trajectory),
    getPressure: vi.fn(() => pressure),
    getConfigSubscriber: vi.fn(() => configSubscriber),
    isReady: vi.fn(() => true),
    // Direct getter-matching properties for use when cast as any
    // (matches real SidecarDependencyRegistry getter accessor names):
    delegationManager,
    sessionTracker,
    client,
    trajectory,
    pressure,
    configSubscriber,
  }

  return {
    registry,
    delegationManager,
    sessionTracker,
    client,
    trajectory,
    pressure,
    configSubscriber,
  }
}
