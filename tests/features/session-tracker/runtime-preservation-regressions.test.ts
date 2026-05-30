/**
 * Runtime preservation regression tests for CP-ST-06 follow-up failures.
 *
 * These tests pin the user-visible guarantees that failed in real runtime:
 * existing main-session markdown must not be cleared, unknown sub-sessions
 * must not be bootstrapped into root directories, and L2 child session files
 * must stay under the root main session directory.
 *
 * @module tests/features/session-tracker/runtime-preservation-regressions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mkdir, readFile, rm } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join, resolve } from "node:path"
import { tmpdir } from "node:os"
import { randomBytes } from "node:crypto"

import { SessionTracker } from "../../../src/features/session-tracker/index.js"
import { EventCapture } from "../../../src/features/session-tracker/capture/event-capture.js"
import { SessionWriter } from "../../../src/features/session-tracker/persistence/session-writer.js"
import { ChildWriter } from "../../../src/features/session-tracker/persistence/child-writer.js"
import { SessionIndexWriter } from "../../../src/features/session-tracker/persistence/session-index-writer.js"
import { ProjectIndexWriter } from "../../../src/features/session-tracker/persistence/project-index-writer.js"
import { HierarchyIndex } from "../../../src/features/session-tracker/persistence/hierarchy-index.js"
import { HierarchyManifestWriter } from "../../../src/features/session-tracker/persistence/hierarchy-manifest.js"
import { SessionRecovery } from "../../../src/features/session-tracker/recovery/session-recovery.js"
import { ToolCapture } from "../../../src/features/session-tracker/capture/tool-capture.js"
import { MessageCapture } from "../../../src/features/session-tracker/capture/message-capture.js"
import { AgentTransform } from "../../../src/features/session-tracker/transform/agent-transform.js"

vi.mock("../../../src/shared/session-api.js", () => ({
  getSession: vi.fn(),
  getSessionMessages: vi.fn().mockResolvedValue([]),
}))

import { getSession, getSessionMessages } from "../../../src/shared/session-api.js"
const mockGetSession = vi.mocked(getSession)
const mockGetSessionMessages = vi.mocked(getSessionMessages)

async function tempProjectRoot(prefix: string): Promise<string> {
  const root = resolve(tmpdir(), `${prefix}-${randomBytes(4).toString("hex")}`)
  await mkdir(root, { recursive: true })
  return root
}

describe("CP-ST-06 runtime preservation regressions", () => {
  let projectRoot: string

  beforeEach(async () => {
    vi.clearAllMocks()
    mockGetSessionMessages.mockResolvedValue([])
    projectRoot = await tempProjectRoot("st-runtime-preserve")
  })

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true })
  })

  it("does not clear existing main markdown when session initialization is called again", async () => {
    const writer = new SessionWriter({ projectRoot })
    const sessionID = "ses_preserve_main_md"

    await writer.createSessionDir(sessionID)
    await writer.initializeSessionFile(sessionID, {
      sessionID,
      parentSessionID: null,
      delegationDepth: 0,
      status: "active",
    })
    await writer.appendUserTurn(sessionID, 1, "first user turn must survive")
    await writer.appendAgentBlock(
      sessionID,
      "main-agent",
      "test-model",
      undefined,
      "full assistant message must survive compaction and re-init",
    )
    await writer.appendCompactionBlock(sessionID, "## COMPACTED\n\nreal compact context\n")

    await writer.initializeSessionFile(sessionID, {
      sessionID,
      parentSessionID: null,
      delegationDepth: 0,
      status: "active",
    })

    const content = await readFile(
      join(projectRoot, ".hivemind", "session-tracker", sessionID, `${sessionID}.md`),
      "utf-8",
    )
    expect(content).toContain("first user turn must survive")
    expect(content).toContain("full assistant message must survive compaction and re-init")
    expect(content).toContain("real compact context")
  })

  it("captures the first real-human prompt when SDK identifies a new root before session.created", async () => {
    const sessionID = "ses_first_real_human_root"
    const tracker = new SessionTracker({
      client: {
        app: { log: vi.fn() },
        session: { get: mockGetSession, messages: vi.fn().mockResolvedValue([]), list: vi.fn().mockResolvedValue([]) },
      } as never,
      projectRoot,
    })
    mockGetSession.mockResolvedValue({ id: sessionID, parentID: null } as never)

    await tracker.initialize()
    await tracker.handleChatMessage(
      { sessionID, messageID: "msg_real_human_1", variant: "user" },
      { message: { role: "user" }, parts: [{ type: "text", text: "real human opening prompt must not disappear" }] },
    )

    const content = await readFile(
      join(projectRoot, ".hivemind", "session-tracker", sessionID, `${sessionID}.md`),
      "utf-8",
    )
    expect(content).toContain("## USER (turn 1)")
    expect(content).toContain("**source:** real-human")
    expect(content).toContain("real human opening prompt must not disappear")
  })

  it("captures the first real-human prompt when SDK root object omits parentID", async () => {
    const sessionID = "ses_sdk_omits_parent_id"
    const tracker = new SessionTracker({
      client: {
        app: { log: vi.fn() },
        session: { get: mockGetSession, messages: vi.fn().mockResolvedValue([]), list: vi.fn().mockResolvedValue([]) },
      } as never,
      projectRoot,
    })
    mockGetSession.mockResolvedValue({ id: sessionID } as never)

    await tracker.initialize()
    await tracker.handleChatMessage(
      { sessionID, messageID: "msg_sdk_omits_parent", variant: "user" },
      { message: { role: "user" }, parts: [{ type: "text", text: "root prompt when SDK omits parentID" }] },
    )

    const content = await readFile(
      join(projectRoot, ".hivemind", "session-tracker", sessionID, `${sessionID}.md`),
      "utf-8",
    )
    expect(content).toContain("## USER (turn 1)")
    expect(content).toContain("**source:** real-human")
    expect(content).toContain("root prompt when SDK omits parentID")
  })

  it("backfills a missed initial real-human prompt before the first main-session tool block", async () => {
    const sessionID = "ses_backfill_initial_prompt"
    const tracker = new SessionTracker({
      client: {
        app: { log: vi.fn() },
        session: { get: mockGetSession, messages: vi.fn().mockResolvedValue([]), list: vi.fn().mockResolvedValue([]) },
      } as never,
      projectRoot,
    })
    mockGetSession.mockResolvedValue({ id: sessionID } as never)
    mockGetSessionMessages.mockResolvedValue([
      {
        info: { role: "user" },
        parts: [
          { type: "text", text: "real human prompt recovered from SDK messages" },
          { type: "text", synthetic: true, text: "synthetic command expansion must not become human prompt" },
        ],
      },
    ] as never)

    await tracker.initialize()
    await tracker.handleToolExecuteAfter(
      { tool: "read", sessionID, callID: "call_backfill_prompt", args: { filePath: "README.md" } },
      { title: "read", output: "ok", metadata: {} },
    )

    const content = await readFile(
      join(projectRoot, ".hivemind", "session-tracker", sessionID, `${sessionID}.md`),
      "utf-8",
    )
    expect(content).toContain("## USER (turn 1)")
    expect(content).toContain("**source:** real-human")
    expect(content).toContain("real human prompt recovered from SDK messages")
    expect(content).not.toContain("synthetic command expansion must not become human prompt")
    expect(content.indexOf("## USER (turn 1)")).toBeLessThan(content.indexOf("### Tool: read"))
  })

  it("preserves full session.compacted payload in main session markdown", async () => {
    const writer = new SessionWriter({ projectRoot })
    const sessionID = "ses_compact_main_payload"
    const compactSummary = "compact summary line 1\ncompact summary line 2\n" + "C".repeat(5000)

    await writer.createSessionDir(sessionID)
    await writer.initializeSessionFile(sessionID, {
      sessionID,
      parentSessionID: null,
      delegationDepth: 0,
      status: "active",
    })
    mockGetSession.mockResolvedValue({ id: sessionID, parentID: null } as never)

    const eventCapture = new EventCapture({
      client: { app: { log: vi.fn() }, session: { get: mockGetSession } } as never,
      sessionWriter: writer,
      childWriter: new ChildWriter({ projectRoot }),
      sessionIndexWriter: new SessionIndexWriter({ projectRoot }),
    })

    await eventCapture.handleSessionEvent({
      eventType: "session.compacted",
      sessionID,
      event: { summary: compactSummary, reason: "manual-test" },
    })

    const content = await readFile(
      join(projectRoot, ".hivemind", "session-tracker", sessionID, `${sessionID}.md`),
      "utf-8",
    )
    expect(content).toContain("## COMPACTED")
    expect(content).toContain(compactSummary)
    // reason field is NOT included in compaction output — findCompactionText
    // uses the summary field, and the source only writes compact_summary + continuity index
  })

  it("preserves L1 and L2 session.compacted payloads in child journey records", async () => {
    const rootSessionID = "ses_compact_root_payload"
    const l1SessionID = "ses_compact_l1_payload"
    const l2SessionID = "ses_compact_l2_payload"
    const hierarchyIndex = new HierarchyIndex({ projectRoot })
    hierarchyIndex.registerChild(rootSessionID, l1SessionID)
    hierarchyIndex.registerChild(l1SessionID, l2SessionID)

    await mkdir(join(projectRoot, ".hivemind", "session-tracker", rootSessionID), { recursive: true })
    const childWriter = new ChildWriter({ projectRoot, hierarchyIndex })
    await childWriter.createChildFile(rootSessionID, l1SessionID, {
      sessionID: l1SessionID,
      parentSessionID: rootSessionID,
      delegationDepth: 1,
      delegatedBy: { agentName: "parent", model: "test", tool: "task", description: "l1", subagentType: "gsd-debugger" },
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      status: "active",
      mainAgent: { name: "gsd-debugger", model: "test" },
      turns: [],
      children: [],
      journey: [],
    })
    await childWriter.createChildFile(l1SessionID, l2SessionID, {
      sessionID: l2SessionID,
      parentSessionID: l1SessionID,
      delegationDepth: 2,
      delegatedBy: { agentName: "l1", model: "test", tool: "task", description: "l2", subagentType: "gsd-debugger" },
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      status: "active",
      mainAgent: { name: "gsd-debugger", model: "test" },
      turns: [],
      children: [],
      journey: [],
    })

    const eventCapture = new EventCapture({
      client: { app: { log: vi.fn() }, session: { get: mockGetSession } } as never,
      sessionWriter: new SessionWriter({ projectRoot }),
      childWriter,
      sessionIndexWriter: new SessionIndexWriter({ projectRoot }),
      hierarchyIndex,
    })

    mockGetSession.mockImplementation(async (id: string) => {
      if (id === l1SessionID) return { id, parentID: rootSessionID } as never
      if (id === l2SessionID) return { id, parentID: l1SessionID } as never
      return { id, parentID: null } as never
    })

    const l1Summary = "L1 compact summary\n" + "A".repeat(4000)
    const l2Summary = "L2 compact summary\n" + "B".repeat(4000)
    await eventCapture.handleSessionEvent({ eventType: "session.compacted", sessionID: l1SessionID, event: { summary: l1Summary } })
    await eventCapture.handleSessionEvent({ eventType: "session.compacted", sessionID: l2SessionID, event: { summary: l2Summary } })

    const l1Raw = await readFile(join(projectRoot, ".hivemind", "session-tracker", rootSessionID, `${l1SessionID}.json`), "utf-8")
    const l2Raw = await readFile(join(projectRoot, ".hivemind", "session-tracker", rootSessionID, `${l2SessionID}.json`), "utf-8")
    const l1Record = JSON.parse(l1Raw) as { journey: Array<{ type: string; content: string }> }
    const l2Record = JSON.parse(l2Raw) as { journey: Array<{ type: string; content: string }> }

    expect(l1Record.journey).toContainEqual(expect.objectContaining({ type: "session_compacted", content: expect.stringContaining(l1Summary) }))
    expect(l2Record.journey).toContainEqual(expect.objectContaining({ type: "session_compacted", content: expect.stringContaining(l2Summary) }))
  })

  it("preserves readable boundaries for multi-part user and assistant text", async () => {
    const sessionID = "ses_multipart_messages"
    const writer = new SessionWriter({ projectRoot })
    const messageCapture = new MessageCapture({
      client: { app: { log: vi.fn() } } as never,
      sessionWriter: writer,
      agentTransform: new AgentTransform(),
      projectRoot,
      sessionIndexWriter: new SessionIndexWriter({ projectRoot }),
    })

    await writer.createSessionDir(sessionID)
    await writer.initializeSessionFile(sessionID, {
      sessionID,
      parentSessionID: null,
      delegationDepth: 0,
      status: "active",
    })

    await messageCapture.handleChatMessage(
      { sessionID },
      { message: { role: "user" }, parts: [{ type: "text", text: "user part one" }, { type: "text", text: "user part two" }] },
    )
    await messageCapture.handleChatMessage(
      { sessionID, agent: "main", model: { providerID: "test", modelID: "model" } },
      { message: { role: "assistant" }, parts: [{ type: "text", text: "assistant part one" }, { type: "text", text: "assistant part two" }] },
    )

    const content = await readFile(join(projectRoot, ".hivemind", "session-tracker", sessionID, `${sessionID}.md`), "utf-8")
    expect(content).toContain("user part one\nuser part two")
    expect(content).toContain("assistant part one\nassistant part two")
    expect(content).not.toContain("user part oneuser part two")
    expect(content).not.toContain("assistant part oneassistant part two")
  })

  it("does not bootstrap unknownSub chat messages into main-session capture", async () => {
    const tracker = new SessionTracker({
      client: { app: { log: vi.fn() } } as never,
      projectRoot,
    })
    const ensureSessionReady = vi.fn().mockResolvedValue(undefined)
    const handleChatMessage = vi.fn().mockResolvedValue(undefined)

    ;(tracker as unknown as { sessionRouter: unknown }).sessionRouter = {
      route: vi.fn().mockResolvedValue({ route: "unknownSub", classification: { kind: "unknownSub", gate: "none" } }),
    }
    ;(tracker as unknown as { bootstrap: unknown }).bootstrap = { ensureSessionReady }
    ;(tracker as unknown as { messageCapture: unknown }).messageCapture = { handleChatMessage }
    ;(tracker as unknown as { bootstrappedSessions: Set<string> }).bootstrappedSessions = new Set()

    await tracker.handleChatMessage(
      { sessionID: "ses_unknown_sub_chat", messageID: "msg_1", variant: "user" },
      { message: { role: "user" }, parts: [{ type: "text", text: "child prompt" }] },
    )

    expect(ensureSessionReady).not.toHaveBeenCalled()
    expect(handleChatMessage).not.toHaveBeenCalled()
  })

  it("does not bootstrap unknownSub tool events into main-session capture", async () => {
    const tracker = new SessionTracker({
      client: { app: { log: vi.fn() } } as never,
      projectRoot,
    })
    const ensureSessionReady = vi.fn().mockResolvedValue(undefined)
    const handleToolExecuteAfter = vi.fn().mockResolvedValue(undefined)

    ;(tracker as unknown as { classifier: unknown }).classifier = {
      classify: vi.fn().mockResolvedValue({ kind: "unknownSub", gate: "none" }),
    }
    ;(tracker as unknown as { bootstrap: unknown }).bootstrap = { ensureSessionReady }
    ;(tracker as unknown as { toolCapture: unknown }).toolCapture = { handleToolExecuteAfter }
    ;(tracker as unknown as { pendingRegistry: unknown }).pendingRegistry = { removeByCallID: vi.fn() }

    await tracker.handleToolExecuteAfter(
      { tool: "read", sessionID: "ses_unknown_sub_tool", callID: "call_1", args: {} },
      { title: "read", output: "ok", metadata: {} },
    )

    expect(ensureSessionReady).not.toHaveBeenCalled()
    expect(handleToolExecuteAfter).not.toHaveBeenCalled()
  })

  it("does not bootstrap unknownSub task events into a new root directory", async () => {
    const tracker = new SessionTracker({
      client: { app: { log: vi.fn() } } as never,
      projectRoot,
    })
    const ensureSessionReady = vi.fn().mockResolvedValue(undefined)
    const handleToolExecuteAfter = vi.fn().mockResolvedValue(undefined)

    ;(tracker as unknown as { classifier: unknown }).classifier = {
      classify: vi.fn().mockResolvedValue({ kind: "unknownSub", gate: "none" }),
    }
    ;(tracker as unknown as { bootstrap: unknown }).bootstrap = { ensureSessionReady }
    ;(tracker as unknown as { toolCapture: unknown }).toolCapture = { handleToolExecuteAfter }
    ;(tracker as unknown as { pendingRegistry: unknown }).pendingRegistry = { removeByCallID: vi.fn() }

    await tracker.handleToolExecuteAfter(
      {
        tool: "task",
        sessionID: "ses_unknown_sub_task",
        callID: "call_task_unknown",
        args: { description: "nested task from unresolved child", subagent_type: "gsd-debugger" },
      },
      { title: "Task", output: "task_id: ses_nested_unknown", metadata: {} },
    )

    expect(ensureSessionReady).not.toHaveBeenCalled()
    expect(handleToolExecuteAfter).not.toHaveBeenCalled()
    expect(existsSync(join(projectRoot, ".hivemind", "session-tracker", "ses_unknown_sub_task"))).toBe(false)
  })

  it("writes L2 child session.created files under the root main directory", async () => {
    const rootSessionID = "ses_root_l2_runtime"
    const l1SessionID = "ses_l1_runtime_child"
    const l2SessionID = "ses_l2_runtime_child"
    const hierarchyIndex = new HierarchyIndex({ projectRoot })
    hierarchyIndex.registerChild(rootSessionID, l1SessionID)

    await mkdir(join(projectRoot, ".hivemind", "session-tracker", rootSessionID), { recursive: true })
    mockGetSession.mockResolvedValue({ id: l2SessionID, parentID: l1SessionID } as never)

    const eventCapture = new EventCapture({
      client: { app: { log: vi.fn() }, session: { get: mockGetSession } } as never,
      sessionWriter: new SessionWriter({ projectRoot }),
      childWriter: new ChildWriter({ projectRoot, hierarchyIndex }),
      sessionIndexWriter: new SessionIndexWriter({ projectRoot }),
      hierarchyIndex,
      manifestWriter: new HierarchyManifestWriter({ projectRoot }),
    })

    await eventCapture.handleSessionEvent({
      eventType: "session.created",
      sessionID: l2SessionID,
      event: {},
    })

    expect(existsSync(join(projectRoot, ".hivemind", "session-tracker", rootSessionID, `${l2SessionID}.json`))).toBe(true)
    expect(existsSync(join(projectRoot, ".hivemind", "session-tracker", l1SessionID))).toBe(false)
  })

  it("classifies as root when pending registry has no active entries (getAnyActiveEntry returns undefined)", async () => {
    const rootSessionID = "ses_ambiguous_pending_child"
    const sessionWriter = new SessionWriter({ projectRoot })
    const childWriter = new ChildWriter({ projectRoot })
    const eventCapture = new EventCapture({
      client: { app: { log: vi.fn() }, session: { get: mockGetSession } } as never,
      sessionWriter,
      childWriter,
      sessionIndexWriter: new SessionIndexWriter({ projectRoot }),
      hierarchyIndex: new HierarchyIndex({ projectRoot }),
      manifestWriter: new HierarchyManifestWriter({ projectRoot }),
      pendingRegistry: {
        getAnyActiveEntry: vi.fn().mockReturnValue(undefined),
        has: vi.fn().mockReturnValue(false),
        get: vi.fn(),
      } as never,
    })
    mockGetSession.mockResolvedValue({ id: rootSessionID, parentID: null } as never)

    await eventCapture.handleSessionEvent({
      eventType: "session.created",
      sessionID: rootSessionID,
      event: {},
    })

    // When getAnyActiveEntry() returns undefined, no pending dispatches exist —
    // the session is a true root and should create a directory.
    expect(existsSync(join(projectRoot, ".hivemind", "session-tracker", rootSessionID))).toBe(true)
  })

  it("rebuilds context with root-owned child turns, journey, and lastMessage", async () => {
    const rootSessionID = "ses_recovery_root_full"
    const childSessionID = "ses_recovery_child_full"
    const writer = new SessionWriter({ projectRoot })
    const childWriter = new ChildWriter({ projectRoot })
    const recovery = new SessionRecovery({
      client: { app: { log: vi.fn() }, session: { messages: vi.fn().mockResolvedValue([]) } } as never,
      projectRoot,
    })

    await writer.createSessionDir(rootSessionID)
    await writer.initializeSessionFile(rootSessionID, {
      sessionID: rootSessionID,
      parentSessionID: null,
      delegationDepth: 0,
      status: "active",
    })
    await writer.appendCompactionBlock(rootSessionID, "## COMPACTED\n\ncompact marker\n")
    await childWriter.createChildFile(rootSessionID, childSessionID, {
      sessionID: childSessionID,
      parentSessionID: rootSessionID,
      delegationDepth: 1,
      delegatedBy: {
        agentName: "gsd-debugger",
        model: "test-model",
        tool: "task",
        description: "diagnose context loss",
        subagentType: "gsd-debugger",
      },
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      status: "active",
      mainAgent: { name: "gsd-debugger", model: "test-model" },
      turns: [{ turn: 1, actor: "gsd-debugger", content: "child assistant content", tools: [] }],
      children: [],
      lastMessage: "full child last message must recover",
      journey: [
        {
          timestamp: new Date().toISOString(),
          type: "tool_call",
          content: "read",
          metadata: { tool: "read", filePath: "src/example.ts" },
        },
      ],
    })

    const context = await recovery.rebuildSessionContext(rootSessionID)

    expect(context.fileContent).toContain("compact marker")
    expect(context.fileContent).toContain("child assistant content")
    expect(context.fileContent).toContain("full child last message must recover")
    expect(context.fileContent).toContain("src/example.ts")
  })

  it("captures completed task result into child turns, journey, and lastMessage", async () => {
    const rootSessionID = "ses_task_result_root"
    const childSessionID = "ses_task_result_child"
    const hierarchyIndex = new HierarchyIndex({ projectRoot })
    const childWriter = new ChildWriter({ projectRoot, hierarchyIndex })
    const toolCapture = new ToolCapture({
      client: { app: { log: vi.fn() } } as never,
      sessionWriter: new SessionWriter({ projectRoot }),
      childWriter,
      sessionIndexWriter: new SessionIndexWriter({ projectRoot }),
      projectIndexWriter: new ProjectIndexWriter({
        client: { app: { log: vi.fn() } } as never,
        projectRoot,
      }),
      hierarchyIndex,
    })

    await toolCapture.handleToolExecuteAfter(
      {
        tool: "task",
        sessionID: rootSessionID,
        callID: "call_task_result",
        args: {
          description: "capture subagent work",
          subagent_type: "gsd-debugger",
        },
      },
      {
        title: "Task completed",
        output: `task_id: ${childSessionID}\n\n<task_result>\nchild did real work\n</task_result>`,
        metadata: {},
      },
    )

    const raw = await readFile(
      join(projectRoot, ".hivemind", "session-tracker", rootSessionID, `${childSessionID}.json`),
      "utf-8",
    )
    const childRecord = JSON.parse(raw) as {
      status: string
      turns: Array<{ content: string }>
      journey: Array<{ type: string; content: string; metadata?: Record<string, unknown> }>
      lastMessage?: string
    }

    expect(childRecord.status).toBe("completed")
    expect(childRecord.turns.map((turn) => turn.content)).toEqual([
      "capture subagent work",
      "child did real work",
    ])
    expect(childRecord.lastMessage).toBe("child did real work")
    expect(childRecord.journey).toContainEqual(expect.objectContaining({
      type: "assistant_message",
      content: "child did real work",
      metadata: expect.objectContaining({ capturedFrom: "task_tool_result" }),
    }))
  })

  it("initializes SessionTracker with a runtime child write retry queue", async () => {
    const tracker = new SessionTracker({
      client: { app: { log: vi.fn() }, tui: { showToast: vi.fn() } } as never,
      projectRoot,
    })

    await tracker.initialize()

    const childWriter = (tracker as unknown as { childWriter: { retryQueue?: unknown } }).childWriter
    expect(childWriter.retryQueue).toBeDefined()

    await tracker.cleanup()
  })

  it("rebuilds context for a child session registered in project continuity", async () => {
    const rootSessionID = "ses_project_index_root"
    const childSessionID = "ses_project_index_child"
    const writer = new SessionWriter({ projectRoot })
    const childWriter = new ChildWriter({ projectRoot })
    const projectIndexWriter = new ProjectIndexWriter({
      client: { app: { log: vi.fn() } } as never,
      projectRoot,
    })
    const recovery = new SessionRecovery({
      client: { app: { log: vi.fn() }, session: { messages: vi.fn().mockResolvedValue([]) } } as never,
      projectRoot,
    })

    await writer.createSessionDir(rootSessionID)
    await childWriter.createChildFile(rootSessionID, childSessionID, {
      sessionID: childSessionID,
      parentSessionID: rootSessionID,
      delegationDepth: 1,
      delegatedBy: {
        agentName: "gsd-debugger",
        model: "test-model",
        tool: "task",
        description: "recover direct child",
        subagentType: "gsd-debugger",
      },
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      status: "completed",
      mainAgent: { name: "gsd-debugger", model: "test-model" },
      turns: [{ turn: 1, actor: "gsd-debugger", content: "child-only recovered content", tools: [] }],
      children: [],
      lastMessage: "child-only final message",
      journey: [],
    })
    await projectIndexWriter.addSession(childSessionID, `${rootSessionID}/`, `${childSessionID}.json`)

    const context = await recovery.rebuildSessionContext(childSessionID)

    expect(context.fileContent).toContain("child-only recovered content")
    expect(context.fileContent).toContain("child-only final message")
  })
})
