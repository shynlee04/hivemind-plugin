// Evidence label: transport-mocked
// Per tests/AGENTS.md: Tests assert against externally observable surfaces
// (the `start()` factory's behavior and the SDK call shape), not internals.
// Phase AUDIT-04.02.2 T1-2 REWRITE: 4 phantom tests REPLACED with 4 tests
// exercising the 3-condition decision tree (REQ-02 contract per D-08).

import { describe, it, expect, vi, beforeEach } from "vitest"
import type { OpenCodeClient } from "../../../src/shared/session-api.js"

function mockClient() {
  return {
    session: {
      create: vi.fn().mockResolvedValue({ data: { id: "ses_child_1" } }),
      get: vi.fn(),
      status: vi.fn(),
      abort: vi.fn(),
      messages: vi.fn(),
      prompt: vi.fn(),
      promptAsync: vi.fn(),
    },
  } as unknown as OpenCodeClient & {
    session: Record<string, ReturnType<typeof vi.fn>>
  }
}

const defaultParams = {
  agent: "test-agent",
  delegationId: "del_1",
  parentSessionId: "ses_parent_1",
  prompt: "Run the test task",
  validatedAgent: { name: "test-agent", model: { providerID: "anthropic", modelID: "claude-3" } } as any,
  workingDirectory: "/tmp/test",
  onChildSessionId: vi.fn(),
}

/**
 * Mock the session-api module to control sendBackground and sendPromptAsync behavior.
 * This lets each test assert the EXACT 3-condition decision tree branch.
 */
const mockSendBackground = vi.fn()
const mockSendPromptAsync = vi.fn()

vi.mock("../../../src/shared/session-api.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../src/shared/session-api.js")>()
  return {
    ...actual,
    sendBackground: (...args: unknown[]) => mockSendBackground(...args),
    sendPromptAsync: (...args: unknown[]) => mockSendPromptAsync(...args),
    createSession: vi.fn().mockResolvedValue({ data: { id: "ses_child_mock" } }),
    getSessionID: vi.fn().mockReturnValue("ses_child_mock"),
  }
})

describe("REQ-02: 3-condition decision tree in sdk-child-session-starter", () => {
  beforeEach(() => {
    vi.resetModules()
    mockSendBackground.mockReset().mockResolvedValue(undefined)
    mockSendPromptAsync.mockReset().mockResolvedValue(undefined)
  })

  it("[COND 1/3] background=true AND hasSubagents=true AND v2 available → sendBackground, NOT sendPromptAsync", async () => {
    const client = mockClient()
    const { createSdkChildSessionStarter } = await import(
      "../../../src/coordination/delegation/sdk-child-session-starter.js"
    )
    const starter = createSdkChildSessionStarter(client)
    await starter.start({
      ...defaultParams,
      background: true,
      hasSubagents: true,
      _adapterV2Available: true,
    })
    expect(mockSendBackground).toHaveBeenCalledTimes(1)
    expect(mockSendPromptAsync).not.toHaveBeenCalled()
  })

  it("[COND 2/3] background=true BUT hasSubagents=false → sendPromptAsync, NOT sendBackground", async () => {
    const client = mockClient()
    const { createSdkChildSessionStarter } = await import(
      "../../../src/coordination/delegation/sdk-child-session-starter.js"
    )
    const starter = createSdkChildSessionStarter(client)
    await starter.start({
      ...defaultParams,
      background: true,
      hasSubagents: false,
    })
    expect(mockSendBackground).not.toHaveBeenCalled()
    expect(mockSendPromptAsync).toHaveBeenCalledTimes(1)
  })

  it("[COND 3/3] background=true AND hasSubagents=true BUT v2=null → sendPromptAsync fallback", async () => {
    // This branch is tested explicitly: when _adapterV2Available is false,
    // the 3-condition tree falls through to sendPromptAsync.
    const client = mockClient()
    const { createSdkChildSessionStarter } = await import(
      "../../../src/coordination/delegation/sdk-child-session-starter.js"
    )
    const starter = createSdkChildSessionStarter(client)
    await starter.start({
      ...defaultParams,
      background: true,
      hasSubagents: true,
      _adapterV2Available: false, // v2 NOT available → fallback
    })
    // v2 unavailable → falls back to sendPromptAsync (NOT sendBackground)
    expect(mockSendBackground).not.toHaveBeenCalled()
    expect(mockSendPromptAsync).toHaveBeenCalledTimes(1)
  })

  it("[DEFAULT] background=false → sendPromptAsync, NOT sendBackground", async () => {
    const client = mockClient()
    const { createSdkChildSessionStarter } = await import(
      "../../../src/coordination/delegation/sdk-child-session-starter.js"
    )
    const starter = createSdkChildSessionStarter(client)
    await starter.start({
      ...defaultParams,
      background: false,
    })
    expect(mockSendBackground).not.toHaveBeenCalled()
    expect(mockSendPromptAsync).toHaveBeenCalledTimes(1)
  })
})
