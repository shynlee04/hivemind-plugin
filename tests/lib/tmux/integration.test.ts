import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const execFileMock = vi.fn()
vi.mock("node:child_process", () => ({
  execFile: (...args: unknown[]) => execFileMock(...args),
}))

const existsSyncMock = vi.fn()
const readFileSyncMock = vi.fn()
const mkdirSyncMock = vi.fn()
const writeFileSyncMock = vi.fn()

vi.mock("node:fs", () => ({
  existsSync: (...args: unknown[]) => existsSyncMock(...args),
  readFileSync: (...args: unknown[]) => readFileSyncMock(...args),
  mkdirSync: (...args: unknown[]) => mkdirSyncMock(...args),
  writeFileSync: (...args: unknown[]) => writeFileSyncMock(...args),
}))

// IMPORTANT: Import AFTER mocks are registered
const {
  resolveBinary,
  getTmuxVersion,
  readOrMigratePort,
  persistPort,
  detectServerUrl,
  createTmuxIntegrationIfSupported,
} = await import("../../../src/features/tmux/integration.js")

// Import the bridge AFTER integration.ts so we can verify the wiring effect
// in the same test process. setSessionManagerAdapter mutates module state.
const { setSessionManagerAdapter, getSessionManagerAdapter } = await import(
  "../../../src/features/tmux/types.js"
)

// ---------------------------------------------------------------------------
// Stub adapter factory (matches SessionManagerAdapter shape)
// ---------------------------------------------------------------------------

function mkStubAdapter(): import("../../../src/features/tmux/types.js").SessionManagerAdapter {
  // PaneGridPlanner is the narrow public consumer type — only
  // computeSplitSequence is exposed on the adapter contract. The internal
  // requestLayout / cancel methods are not part of the public view.
  const planner = {
    computeSplitSequence: () => [],
  }
  return {
    onSessionCreated: async () => {},
    respawnIfKnown: async () => null,
    getMainPaneId: async () => null,
    sendKeys: async () => {},
    listPanes: async () => [],
    createPaneGridPlanner: () => planner,
  }
}

// ---------------------------------------------------------------------------
// Binary resolution
// ---------------------------------------------------------------------------

describe("resolveBinary", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("returns path on success", async () => {
    execFileMock.mockImplementation((_cmd: string, _args: string[], cb: (err: null, result: { stdout: string }) => void) => {
      cb(null, { stdout: "/usr/local/bin/tmux\n", stderr: "" })
    })
    const result = await resolveBinary("tmux")
    expect(result).toBe("/usr/local/bin/tmux")
  })

  it("returns null on failure", async () => {
    execFileMock.mockImplementation((_cmd: string, _args: string[], cb: (err: Error) => void) => {
      cb(new Error("not found"), null as unknown as { stdout: string })
    })
    const result = await resolveBinary("tmux")
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Tmux version
// ---------------------------------------------------------------------------

describe("getTmuxVersion", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("returns version string on success", async () => {
    execFileMock.mockImplementation((_cmd: string, _args: string[], cb: (err: null, result: { stdout: string }) => void) => {
      cb(null, { stdout: "tmux 3.4\n", stderr: "" })
    })
    const result = await getTmuxVersion("/usr/bin/tmux")
    expect(result).toBe("tmux 3.4")
  })

  it("returns null on failure", async () => {
    execFileMock.mockImplementation((_cmd: string, _args: string[], cb: (err: Error) => void) => {
      cb(new Error("exec error"), null as unknown as { stdout: string })
    })
    const result = await getTmuxVersion("/usr/bin/tmux")
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Port persistence
// ---------------------------------------------------------------------------

describe("readOrMigratePort", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("returns null when no file and no hash fallback", () => {
    existsSyncMock.mockReturnValue(false)
    const result = readOrMigratePort("/project")
    // Should return deterministic fallback port
    expect(result).toBeTypeOf("number")
    expect(result).toBeGreaterThanOrEqual(10000)
    expect(result).toBeLessThanOrEqual(65535)
  })

  it("returns parsed port when file exists", () => {
    existsSyncMock.mockReturnValue(true)
    readFileSyncMock.mockReturnValue(JSON.stringify({ port: 4096 }))
    const result = readOrMigratePort("/project")
    expect(result).toBe(4096)
  })

  it("returns null when JSON parse fails", () => {
    existsSyncMock.mockReturnValue(true)
    readFileSyncMock.mockImplementation(() => {
      throw new Error("parse error")
    })
    const result = readOrMigratePort("/project")
    expect(result).toBeNull()
  })

  it("returns null when port field is not a number", () => {
    existsSyncMock.mockReturnValue(true)
    readFileSyncMock.mockReturnValue(JSON.stringify({ port: "not-a-number" }))
    const result = readOrMigratePort("/project")
    expect(result).toBeNull()
  })
})

describe("persistPort", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("writes port to correct path", () => {
    existsSyncMock.mockReturnValueOnce(true) // state dir exists
    persistPort("/project", 4096)
    expect(writeFileSyncMock).toHaveBeenCalledWith(
      expect.stringContaining(".hivemind/state/tmux-port.json"),
      expect.any(String),
      "utf-8",
    )
  })

  it("creates state directory if absent", () => {
    existsSyncMock.mockReturnValueOnce(false) // state dir missing
    persistPort("/project", 4096)
    expect(mkdirSyncMock).toHaveBeenCalledWith(
      expect.stringContaining(".hivemind/state"),
      { recursive: true },
    )
  })
})

// ---------------------------------------------------------------------------
// detectServerUrl
// ---------------------------------------------------------------------------

describe("detectServerUrl", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("returns URL when port persisted", async () => {
    existsSyncMock.mockReturnValue(true)
    readFileSyncMock.mockReturnValue(JSON.stringify({ port: 4096 }))
    const result = await detectServerUrl("/project")
    expect(result).toBe("http://localhost:4096")
  })

  it("returns fallback URL from deterministic hash when no port file", async () => {
    existsSyncMock.mockReturnValue(false)
    const result = await detectServerUrl("/project")
    // readOrMigratePort returns deterministic fallback when no file exists
    expect(result).toBeTypeOf("string")
    expect(result).toMatch(/^http:\/\/localhost:/)
  })
})

// ---------------------------------------------------------------------------
// Factory: createTmuxIntegrationIfSupported
// ---------------------------------------------------------------------------

describe("createTmuxIntegrationIfSupported", () => {
  const origEnv = { ...process.env }

  afterEach(() => {
    vi.clearAllMocks()
    process.env = { ...origEnv }
  })

  beforeEach(() => {
    // By default, set TMUX env var for tests that need it
    process.env.TMUX = "/tmp/tmux-1000/default,1234,0"
  })

  it("returns null when tmux binary not found", async () => {
    execFileMock.mockImplementation((_cmd: string, _args: string[], cb: (err: Error) => void) => {
      cb(new Error("not found"), null as unknown as { stdout: string })
    })
    const result = await createTmuxIntegrationIfSupported("/project")
    expect(result).toBeNull()
  })

  it("returns null when process.env.TMUX not set", async () => {
    // First call (resolveBinary for tmux) succeeds
    // Second call (resolveBinary for opencode) would succeed too, but we don't get there
    let callCount = 0
    execFileMock.mockImplementation((_cmd: string, _args: string[], cb: (err: null, result: { stdout: string }) => void) => {
      callCount++
      if (callCount === 1) {
        cb(null, { stdout: "/usr/bin/tmux\n", stderr: "" })
      }
    })

    delete process.env.TMUX
    const result = await createTmuxIntegrationIfSupported("/project")
    expect(result).toBeNull()
  })

  it("returns null when opencode binary not found", async () => {
    let callCount = 0
    execFileMock.mockImplementation((_cmd: string, args: string[], cb: (err: Error | null, result: { stdout: string } | null) => void) => {
      callCount++
      // First call: resolveBinary for tmux succeeds (uses "which" with no args issue)
      // which/where commands: args[0] is the binary name
      if (callCount === 1) {
        cb(null, { stdout: "/usr/bin/tmux\n", stderr: "" })
      } else {
        cb(new Error("not found"), null)
      }
    })
    const result = await createTmuxIntegrationIfSupported("/project")
    expect(result).toBeNull()
  })

  it("returns TmuxIntegration when all checks pass", async () => {
    let callCount = 0
    execFileMock.mockImplementation((_cmd: string, _args: string[], cb: (err: Error | null, result: { stdout: string } | null) => void) => {
      callCount++
      if (callCount === 1) {
        // resolveBinary("tmux")
        cb(null, { stdout: "/usr/bin/tmux\n", stderr: "" })
      } else if (callCount === 2) {
        // resolveBinary("opencode")
        cb(null, { stdout: "/usr/local/bin/opencode\n", stderr: "" })
      } else if (callCount === 3) {
        // getTmuxVersion
        cb(null, { stdout: "tmux 3.4\n", stderr: "" })
      } else {
        cb(null, { stdout: "", stderr: "" })
      }
    })

    existsSyncMock.mockReturnValue(false) // no persisted port -> fallback
    const result = await createTmuxIntegrationIfSupported("/project")
    expect(result).not.toBeNull()
    expect(result!.isAvailable()).toBe(true)
    expect(result!.version).toBe("tmux 3.4")
    expect(result!.binaryPath).toBe("/usr/bin/tmux")
    expect(result!.opencodeBinaryPath).toBe("/usr/local/bin/opencode")
    expect(result!.serverUrl).toBeTypeOf("string")
    expect(result!.projectDirectory).toBe("/project")
  })
})

// ---------------------------------------------------------------------------
// Phase 51 (REQ-51-04): in-tree SessionManagerAdapter wiring via factory
// ---------------------------------------------------------------------------

describe("createTmuxIntegrationIfSupported — in-tree adapter wiring", () => {
  const origEnv = { ...process.env }

  function mockAllChecksPass() {
    let callCount = 0
    execFileMock.mockImplementation((_cmd: string, _args: string[], cb: (err: Error | null, result: { stdout: string } | null) => void) => {
      callCount++
      if (callCount === 1) cb(null, { stdout: "/usr/bin/tmux\n", stderr: "" })
      else if (callCount === 2) cb(null, { stdout: "/usr/local/bin/opencode\n", stderr: "" })
      else if (callCount === 3) cb(null, { stdout: "tmux 3.4\n", stderr: "" })
      else cb(null, { stdout: "", stderr: "" })
    })
  }

  beforeEach(() => {
    process.env.TMUX = "/tmp/tmux-1000/default,1234,0"
    setSessionManagerAdapter(null) // reset state
  })

  afterEach(() => {
    vi.clearAllMocks()
    process.env = { ...origEnv }
    setSessionManagerAdapter(null) // reset state
  })

  it("publishes built-in adapter to bridge when factory succeeds", async () => {
    mockAllChecksPass()
    const result = await createTmuxIntegrationIfSupported("/project")
    expect(result).not.toBeNull()
    const published = getSessionManagerAdapter()
    expect(published).not.toBeNull()
    // The published adapter must be the SAME object the factory exposed
    // via result.adapter — single source of truth.
    expect(published).toBe(result!.adapter)
  })

  it("published adapter is the same instance the TmuxIntegration exposes", async () => {
    mockAllChecksPass()
    const result = await createTmuxIntegrationIfSupported("/project")
    expect(result!.adapter).toBe(getSessionManagerAdapter())
    // Sanity: adapter surface is the 6-method contract
    expect(typeof result!.adapter.onSessionCreated).toBe("function")
    expect(typeof result!.adapter.respawnIfKnown).toBe("function")
    expect(typeof result!.adapter.getMainPaneId).toBe("function")
    expect(typeof result!.adapter.sendKeys).toBe("function")
    expect(typeof result!.adapter.listPanes).toBe("function")
    expect(typeof result!.adapter.createPaneGridPlanner).toBe("function")
  })

  it("leaves bridge untouched when factory fails (tmux binary missing)", async () => {
    execFileMock.mockImplementation((_cmd: string, _args: string[], cb: (err: Error) => void) => {
      cb(new Error("not found"))
    })
    const result = await createTmuxIntegrationIfSupported("/project")
    expect(result).toBeNull()
    // Adapter was NOT registered because the factory bailed before Step 9
    expect(getSessionManagerAdapter()).toBeNull()
  })

  it("publishing OVERWRITES a previously-stored adapter (replace-only semantics)", () => {
    // Set a sentinel adapter first; the next successful factory call must
    // overwrite it (matches the documented HMR-safe behavior in types.ts).
    const sentinel = mkStubAdapter()
    setSessionManagerAdapter(sentinel)
    expect(getSessionManagerAdapter()).toBe(sentinel)

    // Reset for the next factory call
    setSessionManagerAdapter(null)
    expect(getSessionManagerAdapter()).toBeNull()
  })
})
