/**
 * Unit tests for createGovernanceSessionTool factory.
 *
 * Verifies all behavioral requirements (REQ-02 through REQ-07):
 * - Session title format hm-governance:* (REQ-03)
 * - Prompt injection via sendPrompt (REQ-04)
 * - TUI toast notification with success variant (REQ-05)
 * - Best-effort git commit via execSync (REQ-06)
 * - Return shape { sessionID, title } (REQ-07)
 * - Error handling for invalid input and SDK failures
 *
 * Mock strategy: Mock all external dependencies (SDK calls, child_process,
 * tool-response helpers) so tests run in isolation.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mock external dependencies ---

/**
 * Mock @opencode-ai/plugin's tool() function.
 *
 * The real tool() returns { description, args, execute } and has a
 * .schema property that exposes Zod-like helpers:
 *
 *   tool.schema.string()    → { describe(fn), optional() }
 *   tool.schema.string().describe("...")  → arg definition
 *   tool.schema.string().optional().describe("...")  → optional arg definition
 *
 * We use Object.assign to give the mock function the .schema sub-object
 * so that createGovernanceSessionTool's destructuring `const s = tool.schema`
 * resolves correctly.
 */
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

// Mock node:child_process for git commit (REQ-06)
const mockExecSync = vi.fn()

vi.mock("node:child_process", () => ({
  execSync: mockExecSync,
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
  /**
   * Creates a mock OpenCode SDK client for testing.
   * @returns A minimal client stub with session API surface.
   */
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

  /** Default tool context simulating the current session. */
  const defaultContext = { sessionID: "ses_parent_123", directory: "/tmp/test" }

  beforeEach(() => {
    vi.clearAllMocks()
    // Default mocks: happy path
    mockCreateSession.mockResolvedValue({ id: "ses_gov_456", title: "hm-governance:auditor-audit-v2" })
    mockGetSessionID.mockReturnValue("ses_gov_456")
    mockSendPrompt.mockResolvedValue({ info: { id: "msg_1" }, parts: [] })
    mockShowTuiToast.mockResolvedValue(undefined)
    mockExecSync.mockReturnValue("")
  })

  /**
   * Test: Tool shape compliance (REQ-02).
   * Verifies that the factory returns an object with description, args, and execute.
   */
  it("should create tool with correct description, args schema, and execute function", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    expect(toolDef).toHaveProperty("description")
    expect(typeof toolDef.description).toBe("string")
    expect(toolDef.description).toContain("hm-governance")
    expect(toolDef).toHaveProperty("args")
    expect(toolDef.args).toHaveProperty("agent")
    expect(toolDef.args).toHaveProperty("brief")
    expect(toolDef.args).toHaveProperty("title")
    expect(toolDef).toHaveProperty("execute")
    expect(typeof toolDef.execute).toBe("function")
  })

  /**
   * Test: Session title format (REQ-03).
   * Verifies that the created session has title matching /^hm-governance:.+/
   * when title param is provided.
   */
  it("should create session with hm-governance: title format", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    await toolDef.execute(
      { agent: "auditor", brief: "Review X", title: "audit-v2" },
      defaultContext,
    )

    // Verify createSession was called with the correct title format
    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: expect.stringMatching(/^hm-governance:.+/),
      }),
    )

    // Verify the title follows the pattern: hm-governance:{agent}-{title}
    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: "hm-governance:auditor-audit-v2",
      }),
    )
  })

  /**
   * Test: Default title when title omitted.
   * Verifies that when title is not provided, the tool defaults to
   * "hm-governance:{agent}-governance".
   */
  it("should use default title when title is omitted", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    await toolDef.execute(
      { agent: "auditor", brief: "Review X" },
      defaultContext,
    )

    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: "hm-governance:auditor-governance",
      }),
    )
  })

  /**
   * Test: Prompt injection (REQ-04).
   * Verifies that sendPrompt is called with the correct session ID
   * and the brief text in the parts array.
   */
  it("should call sendPrompt with brief text", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    await toolDef.execute(
      { agent: "auditor", brief: "Review all auth modules for security compliance" },
      defaultContext,
    )

    // Verify createSession was called first
    expect(mockCreateSession).toHaveBeenCalled()

    // Verify sendPrompt was called with session ID and brief text
    expect(mockSendPrompt).toHaveBeenCalledWith(
      expect.anything(),
      "ses_gov_456",
      expect.objectContaining({
        parts: expect.arrayContaining([
          expect.objectContaining({
            type: "text",
            text: "Review all auth modules for security compliance",
          }),
        ]),
      }),
    )
  })

  /**
   * Test: TUI toast notification (REQ-05).
   * Verifies that showTuiToast is called with success variant
   * and a message containing the session title and ID.
   */
  it("should call showTuiToast with success variant", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    await toolDef.execute(
      { agent: "auditor", brief: "Review X", title: "security-audit" },
      defaultContext,
    )

    expect(mockShowTuiToast).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("hm-governance:auditor-security-audit"),
      "success",
    )
    expect(mockShowTuiToast).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("ses_gov_456"),
      "success",
    )
  })

  /**
   * Test: Git commit via execSync (REQ-06).
   * Verifies that execSync is called with a git commit command
   * containing the governance session title.
   */
  it("should call execSync for git commit", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    await toolDef.execute(
      { agent: "planner", brief: "Plan milestone 2", title: "milestone-plan" },
      defaultContext,
    )

    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining("git add"),
      expect.anything(),
    )
    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining("pre-governance handoff"),
      expect.anything(),
    )
  })

  /**
   * Test: Return shape (REQ-07).
   * Verifies that execute returns a JSON string that, when parsed,
   * contains sessionID and title fields.
   */
  it("should return { sessionID, title } object", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    const result = await toolDef.execute(
      { agent: "researcher", brief: "Analyze dependencies" },
      defaultContext,
    )

    const parsed = JSON.parse(result)
    expect(parsed).toHaveProperty("kind", "success")
    expect(parsed).toHaveProperty(["data", "sessionID"], "ses_gov_456")
    expect(parsed).toHaveProperty(["data", "title"], "hm-governance:researcher-governance")
  })

  /**
   * Test: Error on invalid input.
   * Verifies that missing required fields (agent or brief) returns
   * an error response rather than throwing.
   */
  it("should return error on invalid input", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    // Missing agent and brief
    const result = await toolDef.execute({}, defaultContext)

    const parsed = JSON.parse(result)
    expect(parsed.kind).toBe("error")
    expect(parsed.message).toContain("Invalid governance session input")
  })

  /**
   * Test: Partial invalid input — missing brief.
   * Verifies that having agent but not brief returns an error.
   */
  it("should return error when brief is missing", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    const result = await toolDef.execute({ agent: "auditor" }, defaultContext)

    const parsed = JSON.parse(result)
    expect(parsed.kind).toBe("error")
    expect(parsed.message).toContain("Invalid governance session input")
  })

  /**
   * Test: SDK failure resilience.
   * Verifies that when createSession rejects, the tool returns
   * an error response instead of throwing an unhandled exception.
   */
  it("should handle SDK failure gracefully", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    // Simulate SDK failure
    mockCreateSession.mockRejectedValue(new Error("SDK temporarily unavailable"))

    const result = await toolDef.execute(
      { agent: "auditor", brief: "Review X" },
      defaultContext,
    )

    const parsed = JSON.parse(result)
    expect(parsed.kind).toBe("error")
    expect(parsed.message).toContain("Failed to create governance session")
    expect(parsed.message).toContain("SDK temporarily unavailable")
  })

  /**
   * Test: Missing session ID after creation.
   * Verifies that when getSessionID returns undefined (session created
   * but no ID returned), the tool returns a sensible error.
   */
  it("should handle missing session ID gracefully", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    // Simulate session created but no ID returned
    mockCreateSession.mockResolvedValue({})
    mockGetSessionID.mockReturnValue(undefined)

    const result = await toolDef.execute(
      { agent: "auditor", brief: "Review X" },
      defaultContext,
    )

    const parsed = JSON.parse(result)
    expect(parsed.kind).toBe("error")
    expect(parsed.message).toContain("no session ID was returned")
  })

  /**
   * Test: Git commit failure is non-fatal.
   * Verifies that a git commit failure (execSync throws) does
   * not prevent the tool from creating the session.
   */
  it("should tolerate git commit failure gracefully", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    // Git commit fails
    mockExecSync.mockImplementation(() => {
      throw new Error("git error")
    })

    const result = await toolDef.execute(
      { agent: "auditor", brief: "Review X", title: "test" },
      defaultContext,
    )

    const parsed = JSON.parse(result)
    // Success despite git failure — git commit is best-effort
    expect(parsed.kind).toBe("success")
    expect(parsed).toHaveProperty(["data", "sessionID"], "ses_gov_456")
  })

  /**
   * Test: Tool passes parent session ID to createSession.
   * Verifies that the current session ID from context is forwarded
   * as parentID when creating the child governance session.
   */
  it("should forward parent session ID from context", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    await toolDef.execute(
      { agent: "auditor", brief: "Review X" },
      { sessionID: "ses_main_999", directory: "/tmp/proj" },
    )

    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        parentID: "ses_main_999",
      }),
    )
  })

  /**
   * Test: TUI toast failure is non-fatal.
   * Verifies that a showTuiToast failure does not prevent
   * the tool from returning a success result.
   */
  it("should tolerate toast failure gracefully", async () => {
    const { createGovernanceSessionTool } = await import(
      "../../../src/features/governance-engine/create-governance-session.js"
    )

    const client = createMockClient()
    const toolDef = createGovernanceSessionTool(client)

    // Toast fails
    mockShowTuiToast.mockRejectedValue(new Error("toast failed"))

    const result = await toolDef.execute(
      { agent: "auditor", brief: "Review X", title: "test" },
      defaultContext,
    )

    const parsed = JSON.parse(result)
    // Success despite toast failure — toast is best-effort
    expect(parsed.kind).toBe("success")
    expect(parsed).toHaveProperty(["data", "sessionID"], "ses_gov_456")
  })
})
