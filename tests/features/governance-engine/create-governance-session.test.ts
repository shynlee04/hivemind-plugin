/**
 * Unit tests for createGovernanceSessionTool factory.
 *
 * Verifies naming service title format, root session creation (no parentID),
 * coordinator dispatch, config reader integration, and fallback to sendPrompt.
 *
 * Mock strategy: Mock all external dependencies (SDK calls, child_process,
 * tool-response helpers) so tests run in isolation.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mock external dependencies ---

vi.mock("@opencode-ai/plugin", () => {
  const schemaString = () => ({
    describe: () => schemaString(),
    optional: () => ({
      describe: () => ({}),
    }),
  })

  return {
    tool: Object.assign(
      vi.fn((config: unknown) => config),
      {
        schema: {
          string: schemaString,
        },
      },
    ),
  }
})

// Mock session-api functions used by the tool
const mockCreateSession = vi.fn()
const mockSendPrompt = vi.fn()
const mockShowTuiToast = vi.fn()
const mockGetSessionID = vi.fn()

vi.mock("../../../src/shared/session-api.js", () => ({
  createSession: mockCreateSession,
  sendPrompt: mockSendPrompt,
  showTuiToast: mockShowTuiToast,
  getSessionID: mockGetSessionID,
}))

// Mock node:child_process for git commit
const mockExecSync = vi.fn()
// execFile is wrapped in a Promise in the source, so mock must invoke callback
const mockExecFile = vi.fn(
  (_cmd: string, _args: string[], _opts: unknown, callback: (err: unknown, result: { stdout: string; stderr: string }) => void) => {
    callback(null, { stdout: "", stderr: "" })
  },
)

vi.mock("node:child_process", () => ({
  execSync: mockExecSync,
  execFile: mockExecFile,
}))

// Mock Zod's prettifyError for error rendering
vi.mock("zod", async () => {
  const actual = await vi.importActual("zod")
  return {
    ...actual,
    default: actual,
    prettifyError: vi.fn(() => "validation error"),
  }
})

// --- Test suite ---

describe("createGovernanceSessionTool", () => {
  function createMockClient() {
    return {
      session: {
        create: vi.fn(),
        prompt: vi.fn(),
        get: vi.fn(),
      },
      app: { log: vi.fn() },
    } as any
  }

  const defaultContext = { sessionID: "ses_parent_123", directory: "/tmp/test" }

  beforeEach(() => {
    vi.clearAllMocks()
    // Default mocks: happy path
    mockCreateSession.mockResolvedValue({ id: "ses_gov_456", title: "hm/governance/root/gsd-auditor/audit-v2@0" })
    mockGetSessionID.mockReturnValue("ses_gov_456")
    mockSendPrompt.mockResolvedValue({ info: { id: "msg_1" }, parts: [] })
    mockShowTuiToast.mockResolvedValue(undefined)
    mockExecSync.mockReturnValue("")
    // mockExecFile uses the callback-based implementation defined in the mock factory above
  })

  // -----------------------------------------------------------------------
  // Existing tests (updated for new title format)
  // -----------------------------------------------------------------------

  it("should create tool with correct description, args schema, and execute function", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    expect(toolDef).toHaveProperty("description")
    expect(typeof toolDef.description).toBe("string")
    expect(toolDef).toHaveProperty("args")
    expect(toolDef.args).toHaveProperty("agent")
    expect(toolDef.args).toHaveProperty("brief")
    expect(toolDef.args).toHaveProperty("title")
    expect(toolDef).toHaveProperty("execute")
    expect(typeof toolDef.execute).toBe("function")
  })

  it("should generate title in naming service format", async () => {
    const { createGovernanceSessionTool, generateSessionTitle } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    await toolDef.execute(
      { agent: "gsd-auditor", brief: "audit phase 23", title: "audit-phase23" },
      defaultContext,
    )

    // Verify createSession was called with naming service format title
    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: expect.stringMatching(/^hm\/governance\/root\//),
      }),
    )
  })

  it("should use default purpose from brief when title is omitted", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    await toolDef.execute(
      { agent: "gsd-auditor", brief: "Review X" },
      defaultContext,
    )

    // Title should use naming service format (agent resolved by config reader)
    // Template expansion wraps the brief, so title reflects expanded content
    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: expect.stringMatching(/^hm\/governance\/root\/[^/]+\/.+@0$/),
      }),
    )
  })

  it("should call sendPrompt with expanded brief when no coordinator", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    await toolDef.execute(
      { agent: "gsd-auditor", brief: "Review all auth modules for security compliance" },
      defaultContext,
    )

    expect(mockCreateSession).toHaveBeenCalled()
    // SR-05: Brief is expanded with governance template from config
    expect(mockSendPrompt).toHaveBeenCalledWith(
      expect.anything(),
      "ses_gov_456",
      expect.objectContaining({
        parts: expect.arrayContaining([
          expect.objectContaining({
            type: "text",
            text: expect.stringContaining("Review all auth modules for security compliance"),
          }),
        ]),
      }),
    )
  })

  it("should call showTuiToast with success variant", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    await toolDef.execute(
      { agent: "gsd-auditor", brief: "audit phase 23 notifications", title: "audit" },
      defaultContext,
    )

    expect(mockShowTuiToast).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringMatching(/hm\/governance\/root\/.*audit/),
      "success",
    )
  })

  it("should return { sessionID, title } object", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    const result = await toolDef.execute(
      { agent: "gsd-researcher", brief: "Analyze dependencies" },
      defaultContext,
    )

    const parsed = JSON.parse(result)
    expect(parsed).toHaveProperty("kind", "success")
    expect(parsed).toHaveProperty(["data", "sessionID"], "ses_gov_456")
    expect(parsed).toHaveProperty(["data", "title"])
  })

  it("should return error on invalid input", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    const result = await toolDef.execute({}, defaultContext)
    const parsed = JSON.parse(result)
    expect(parsed.kind).toBe("error")
    expect(parsed.message).toContain("Invalid governance session input")
  })

  it("should handle SDK failure gracefully", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    mockCreateSession.mockRejectedValue(new Error("SDK temporarily unavailable"))

    const result = await toolDef.execute(
      { agent: "gsd-auditor", brief: "Review X" },
      defaultContext,
    )

    const parsed = JSON.parse(result)
    expect(parsed.kind).toBe("error")
    expect(parsed.message).toContain("Failed to create governance session")
  })

  it("should handle missing session ID gracefully", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    mockCreateSession.mockResolvedValue({})
    mockGetSessionID.mockReturnValue(undefined)

    const result = await toolDef.execute(
      { agent: "gsd-auditor", brief: "Review X" },
      defaultContext,
    )

    const parsed = JSON.parse(result)
    expect(parsed.kind).toBe("error")
    expect(parsed.message).toContain("no session ID was returned")
  })

  it("should tolerate git commit failure gracefully", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    mockExecSync.mockImplementation(() => {
      throw new Error("git error")
    })

    const result = await toolDef.execute(
      { agent: "gsd-auditor", brief: "Review X", title: "test" },
      defaultContext,
    )

    const parsed = JSON.parse(result)
    expect(parsed.kind).toBe("success")
    expect(parsed).toHaveProperty(["data", "sessionID"], "ses_gov_456")
  })

  it("should tolerate toast failure gracefully", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    mockShowTuiToast.mockRejectedValue(new Error("toast failed"))

    const result = await toolDef.execute(
      { agent: "gsd-auditor", brief: "Review X", title: "test" },
      defaultContext,
    )

    const parsed = JSON.parse(result)
    expect(parsed.kind).toBe("success")
    expect(parsed).toHaveProperty(["data", "sessionID"], "ses_gov_456")
  })

  // -----------------------------------------------------------------------
  // NEW: Coordinator dispatch tests (Plan 06b)
  // -----------------------------------------------------------------------

  it("should create root session without parentID", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const mockCoordinator = { dispatch: vi.fn().mockResolvedValue(undefined) }
    const toolDef = createGovernanceSessionTool(client, mockCoordinator)

    await toolDef.execute(
      { agent: "gsd-auditor", brief: "audit phase 23", title: "audit-phase23" },
      defaultContext,
    )

    // Must NOT contain parentID (root session)
    const callArg = mockCreateSession.mock.calls[0][1]
    expect(callArg).not.toHaveProperty("parentID")
  })

  it("should dispatch agent via coordinator when provided", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const mockCoordinator = { dispatch: vi.fn().mockResolvedValue(undefined) }
    const toolDef = createGovernanceSessionTool(client, mockCoordinator)

    await toolDef.execute(
      { agent: "gsd-auditor", brief: "audit phase 23", title: "audit-phase23" },
      defaultContext,
    )

    expect(mockCoordinator.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        agent: expect.any(String),
        parentSessionId: "ses_gov_456",
        surface: "governance-dispatch",
      }),
    )
  })

  it("should fall back to sendPrompt when coordinator is not provided", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    await toolDef.execute(
      { agent: "gsd-auditor", brief: "audit phase 23", title: "audit-phase23" },
      defaultContext,
    )

    // Without coordinator, sendPrompt must be called
    expect(mockSendPrompt).toHaveBeenCalled()
  })

  it("should handle coordinator dispatch failure gracefully", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const mockCoordinator = { dispatch: vi.fn().mockRejectedValue(new Error("dispatch failed")) }
    const toolDef = createGovernanceSessionTool(client, mockCoordinator)

    const result = await toolDef.execute(
      { agent: "gsd-auditor", brief: "audit phase 23", title: "audit-phase23" },
      defaultContext,
    )

    const parsed = JSON.parse(result)
    expect(parsed.kind).toBe("error")
    expect(parsed.message).toContain("agent dispatch failed")
  })

  it("should respect coordinator parameter in factory signature", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()

    // Should accept 1 arg
    const toolDef1 = createGovernanceSessionTool(client)
    expect(typeof toolDef1.execute).toBe("function")

    // Should accept 2 args
    const mockCoordinator = { dispatch: vi.fn().mockResolvedValue({}) }
    const toolDef2 = createGovernanceSessionTool(client, mockCoordinator)
    expect(typeof toolDef2.execute).toBe("function")
  })

  // -----------------------------------------------------------------------
  // OLD TESTS REMOVED:
  // - "should forward parent session ID from context" — governance sessions
  //   are now root sessions (no parentID).
  // - Tests for hm-governance: title prefix — replaced by naming service format.
  // -----------------------------------------------------------------------
})
