/**
 * Unit tests for the runtime-policy module.
 *
 * Covers:
 *  - Default policy values match current production behavior
 *  - Session-specific overrides win over workspace defaults
 *  - Out-of-range limits are clamped/rejected with [Hivemind] errors
 *
 * RESEARCH D-16: This module supplements OpenCode built-ins — it does NOT
 * replace hook/session surfaces that OpenCode already provides.
 */
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it, expect } from "vitest"
import {
  DEFAULT_RUNTIME_POLICY,
  loadRuntimePolicy,
  getRuntimePolicyForSession,
} from "../../src/shared/runtime-policy.js"
import type {
  RuntimePolicy,
  SessionPolicyOverride,
} from "../../src/shared/types.js"
import { resolveWorkspaceRuntimePolicy } from "../../src/shared/workspace-runtime-policy.js"

// ---------------------------------------------------------------------------
// Test 1: Missing policy file resolves defaults that match current behavior
// ---------------------------------------------------------------------------

describe("DEFAULT_RUNTIME_POLICY", () => {
  it("global_limit matches current production default (3)", () => {
    expect(DEFAULT_RUNTIME_POLICY.concurrency.globalLimit).toBe(3)
  })

  it("repeatedSignatureThreshold matches current production default (16)", () => {
    expect(DEFAULT_RUNTIME_POLICY.budget.repeatedSignatureThreshold).toBe(16)
  })

  it("maxToolCallsPerSession matches current production default (400)", () => {
    expect(DEFAULT_RUNTIME_POLICY.budget.maxToolCallsPerSession).toBe(400)
  })

  it("warningCap matches current production default (25)", () => {
    expect(DEFAULT_RUNTIME_POLICY.budget.warningCap).toBe(25)
  })

  it("resetOnCompact defaults to true", () => {
    expect(DEFAULT_RUNTIME_POLICY.budget.resetOnCompact).toBe(true)
  })

  it("builtin async background child-session support defaults to false", () => {
    expect(DEFAULT_RUNTIME_POLICY.trustedRuntime.builtinAsyncBackgroundChildSessions).toBe(false)
  })

  it("does not expose the removed category gate policy surface", () => {
    expect("categoryGate" in DEFAULT_RUNTIME_POLICY).toBe(false)
  })
})

describe("loadRuntimePolicy", () => {
  it("returns defaults when called with no workspace policy", () => {
    const policy = loadRuntimePolicy(undefined)
    expect(policy).toEqual(DEFAULT_RUNTIME_POLICY)
  })

  it("returns defaults when called with empty workspace policy", () => {
    const policy = loadRuntimePolicy({})
    expect(policy.concurrency.globalLimit).toBe(DEFAULT_RUNTIME_POLICY.concurrency.globalLimit)
    expect(policy.budget.maxToolCallsPerSession).toBe(DEFAULT_RUNTIME_POLICY.budget.maxToolCallsPerSession)
  })

  it("ignores stale category gate workspace policy without restoring the surface", () => {
    const policy = loadRuntimePolicy({
      categoryGate: { askUnknownCategories: true, readonlyCategories: "review" as never, commandCategory: "command" },
    } as never)

    expect("categoryGate" in policy).toBe(false)
  })

  it("merges workspace-level overrides onto defaults", () => {
    const workspace: RuntimePolicy = {
      concurrency: { globalLimit: 5 },
      budget: { maxToolCallsPerSession: 200, repeatedSignatureThreshold: 16, warningCap: 25, resetOnCompact: true },
      trustedRuntime: { builtinAsyncBackgroundChildSessions: true },
    }
    const policy = loadRuntimePolicy(workspace)
    expect(policy.concurrency.globalLimit).toBe(5)
    expect(policy.budget.maxToolCallsPerSession).toBe(200)
    // Budget fields that are provided should come from workspace
    expect(policy.budget.repeatedSignatureThreshold).toBe(16)
    expect(policy.trustedRuntime.builtinAsyncBackgroundChildSessions).toBe(true)
  })
})

describe("resolveWorkspaceRuntimePolicy", () => {
  it("reads project-local policy from .hivemind/state", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "runtime-policy-project-"))
    try {
      mkdirSync(join(projectRoot, ".hivemind", "state"), { recursive: true })
      writeFileSync(join(projectRoot, ".hivemind", "state", "hivemind.runtime-policy.json"), JSON.stringify({
        concurrency: { globalLimit: 2 },
      }))

      expect(resolveWorkspaceRuntimePolicy(projectRoot)?.concurrency?.globalLimit).toBe(2)
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })
})

// ---------------------------------------------------------------------------
// Test 2: Per-session overrides win over workspace defaults
// ---------------------------------------------------------------------------

describe("getRuntimePolicyForSession", () => {
  it("returns workspace policy when no session override provided", () => {
    const workspace: RuntimePolicy = {
      concurrency: { globalLimit: 5 },
      budget: { maxToolCallsPerSession: 300, repeatedSignatureThreshold: 10, warningCap: 20, resetOnCompact: false },
      trustedRuntime: { builtinAsyncBackgroundChildSessions: false },
    }
    const resolved = getRuntimePolicyForSession(workspace, undefined)
    expect(resolved.budget.maxToolCallsPerSession).toBe(300)
    expect(resolved.concurrency.globalLimit).toBe(5)
    expect(resolved.trustedRuntime.builtinAsyncBackgroundChildSessions).toBe(false)
  })

  it("session budget override wins over workspace default", () => {
    const workspace: RuntimePolicy = {
      concurrency: { globalLimit: 3 },
      budget: { maxToolCallsPerSession: 400, repeatedSignatureThreshold: 16, warningCap: 25, resetOnCompact: true },
      trustedRuntime: { builtinAsyncBackgroundChildSessions: false },
    }
    const sessionOverride: SessionPolicyOverride = {
      budget: { maxToolCallsPerSession: 100 },
    }
    const resolved = getRuntimePolicyForSession(workspace, sessionOverride)
    expect(resolved.budget.maxToolCallsPerSession).toBe(100)
    // Non-overridden fields should keep workspace value
    expect(resolved.budget.repeatedSignatureThreshold).toBe(16)
  })

  it("session concurrency override wins over workspace default", () => {
    const workspace: RuntimePolicy = {
      concurrency: { globalLimit: 3 },
      budget: { maxToolCallsPerSession: 400, repeatedSignatureThreshold: 16, warningCap: 25, resetOnCompact: true },
      trustedRuntime: { builtinAsyncBackgroundChildSessions: false },
    }
    const sessionOverride: SessionPolicyOverride = {
      concurrency: { globalLimit: 1 },
    }
    const resolved = getRuntimePolicyForSession(workspace, sessionOverride)
    expect(resolved.concurrency.globalLimit).toBe(1)
  })

  it("session override with per-key concurrency wins", () => {
    const workspace: RuntimePolicy = {
      concurrency: { globalLimit: 3 },
      budget: { maxToolCallsPerSession: 400, repeatedSignatureThreshold: 16, warningCap: 25, resetOnCompact: true },
      trustedRuntime: { builtinAsyncBackgroundChildSessions: false },
    }
    const sessionOverride: SessionPolicyOverride = {
      concurrency: {
        globalLimit: 2,
        perKey: { "model:gpt-5": { limit: 1 } },
      },
    }
    const resolved = getRuntimePolicyForSession(workspace, sessionOverride)
    expect(resolved.concurrency.globalLimit).toBe(2)
    expect(resolved.concurrency.perKey?.["model:gpt-5"]?.limit).toBe(1)
  })

  it("session trusted runtime override can explicitly enable builtin async background child sessions", () => {
    const workspace: RuntimePolicy = {
      concurrency: { globalLimit: 3 },
      budget: { maxToolCallsPerSession: 400, repeatedSignatureThreshold: 16, warningCap: 25, resetOnCompact: true },
      trustedRuntime: { builtinAsyncBackgroundChildSessions: false },
    }
    const sessionOverride: SessionPolicyOverride = {
      trustedRuntime: { builtinAsyncBackgroundChildSessions: true },
    }

    const resolved = getRuntimePolicyForSession(workspace, sessionOverride)

    expect(resolved.trustedRuntime.builtinAsyncBackgroundChildSessions).toBe(true)
  })

  it("falls back to the default trusted runtime when older workspace fixtures omit trustedRuntime", () => {
    const legacyWorkspace = {
      concurrency: { globalLimit: 5 },
      budget: {
        maxToolCallsPerSession: 300,
        repeatedSignatureThreshold: 10,
        warningCap: 20,
        resetOnCompact: false,
      },
    } as RuntimePolicy

    const resolved = getRuntimePolicyForSession(legacyWorkspace, undefined)

    expect(resolved.concurrency.globalLimit).toBe(5)
    expect(resolved.budget.maxToolCallsPerSession).toBe(300)
    expect(resolved.trustedRuntime.builtinAsyncBackgroundChildSessions).toBe(
      DEFAULT_RUNTIME_POLICY.trustedRuntime.builtinAsyncBackgroundChildSessions,
    )
  })
})

// ---------------------------------------------------------------------------
// Test 3: Out-of-range limits are clamped/rejected with [Hivemind] errors
// ---------------------------------------------------------------------------

describe("loadRuntimePolicy — validation", () => {
  it("rejects zero globalLimit with [Hivemind] error", () => {
    const workspace: RuntimePolicy = {
      concurrency: { globalLimit: 0 },
      budget: { maxToolCallsPerSession: 400, repeatedSignatureThreshold: 16, warningCap: 25, resetOnCompact: true },
      trustedRuntime: { builtinAsyncBackgroundChildSessions: false },
    }
    expect(() => loadRuntimePolicy(workspace)).toThrow(/\[Hivemind\]/)
  })

  it("rejects negative globalLimit with [Hivemind] error", () => {
    const workspace: RuntimePolicy = {
      concurrency: { globalLimit: -1 },
      budget: { maxToolCallsPerSession: 400, repeatedSignatureThreshold: 16, warningCap: 25, resetOnCompact: true },
      trustedRuntime: { builtinAsyncBackgroundChildSessions: false },
    }
    expect(() => loadRuntimePolicy(workspace)).toThrow(/\[Hivemind\]/)
  })

  it("rejects zero maxToolCallsPerSession with [Hivemind] error", () => {
    const workspace: RuntimePolicy = {
      concurrency: { globalLimit: 3 },
      budget: { maxToolCallsPerSession: 0, repeatedSignatureThreshold: 16, warningCap: 25, resetOnCompact: true },
      trustedRuntime: { builtinAsyncBackgroundChildSessions: false },
    }
    expect(() => loadRuntimePolicy(workspace)).toThrow(/\[Hivemind\]/)
  })

  it("rejects zero repeatedSignatureThreshold with [Hivemind] error", () => {
    const workspace: RuntimePolicy = {
      concurrency: { globalLimit: 3 },
      budget: { maxToolCallsPerSession: 400, repeatedSignatureThreshold: 0, warningCap: 25, resetOnCompact: true },
      trustedRuntime: { builtinAsyncBackgroundChildSessions: false },
    }
    expect(() => loadRuntimePolicy(workspace)).toThrow(/\[Hivemind\]/)
  })

  it("rejects zero warningCap with [Hivemind] error", () => {
    const workspace: RuntimePolicy = {
      concurrency: { globalLimit: 3 },
      budget: { maxToolCallsPerSession: 400, repeatedSignatureThreshold: 16, warningCap: 0, resetOnCompact: true },
      trustedRuntime: { builtinAsyncBackgroundChildSessions: false },
    }
    expect(() => loadRuntimePolicy(workspace)).toThrow(/\[Hivemind\]/)
  })
})

describe("getRuntimePolicyForSession — validation", () => {
  it("rejects session override with zero budget.maxToolCallsPerSession", () => {
    const workspace: RuntimePolicy = {
      concurrency: { globalLimit: 3 },
      budget: { maxToolCallsPerSession: 400, repeatedSignatureThreshold: 16, warningCap: 25, resetOnCompact: true },
      trustedRuntime: { builtinAsyncBackgroundChildSessions: false },
    }
    const sessionOverride: SessionPolicyOverride = {
      budget: { maxToolCallsPerSession: 0 },
    }
    expect(() => getRuntimePolicyForSession(workspace, sessionOverride)).toThrow(/\[Hivemind\]/)
  })

  it("rejects session override with negative concurrency.globalLimit", () => {
    const workspace: RuntimePolicy = {
      concurrency: { globalLimit: 3 },
      budget: { maxToolCallsPerSession: 400, repeatedSignatureThreshold: 16, warningCap: 25, resetOnCompact: true },
      trustedRuntime: { builtinAsyncBackgroundChildSessions: false },
    }
    const sessionOverride: SessionPolicyOverride = {
      concurrency: { globalLimit: -5 },
    }
    expect(() => getRuntimePolicyForSession(workspace, sessionOverride)).toThrow(/\[Hivemind\]/)
  })
})
