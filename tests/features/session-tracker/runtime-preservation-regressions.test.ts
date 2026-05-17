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
import { HierarchyIndex } from "../../../src/features/session-tracker/persistence/hierarchy-index.js"
import { HierarchyManifestWriter } from "../../../src/features/session-tracker/persistence/hierarchy-manifest.js"
import { SessionRecovery } from "../../../src/features/session-tracker/recovery/session-recovery.js"

vi.mock("../../../src/shared/session-api.js", () => ({
  getSession: vi.fn(),
}))

import { getSession } from "../../../src/shared/session-api.js"
const mockGetSession = vi.mocked(getSession)

async function tempProjectRoot(prefix: string): Promise<string> {
  const root = resolve(tmpdir(), `${prefix}-${randomBytes(4).toString("hex")}`)
  await mkdir(root, { recursive: true })
  return root
}

describe("CP-ST-06 runtime preservation regressions", () => {
  let projectRoot: string

  beforeEach(async () => {
    vi.clearAllMocks()
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
})
