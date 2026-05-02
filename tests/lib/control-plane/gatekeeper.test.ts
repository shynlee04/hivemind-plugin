/**
 * @fileoverview Tests for control-plane gatekeeper — intercepts and routes
 * user messages through gate decisions before they reach the agent.
 *
 * RED phase: These tests MUST fail before implementation exists.
 * Test size: small (unit tests, no network/process boundary).
 * Public interface: createGatekeeper, GateDecision, GateResult.
 *
 * Requirements: CP-01, CP-03, CP-04
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { promises as fs, mkdirSync } from "node:fs"
import path from "node:path"
import os from "node:os"

import {
  createGatekeeper,
  type Gatekeeper,
  type GateDecision,
  type GateResult,
  BLOCKING_GATES,
  NON_BLOCKING_GATES,
} from "../../../src/lib/control-plane/gatekeeper.js"

import {
  GateDecisionType,
  type GateDecisionRecord,
  isBlockingDecision,
  classifyGateDecision,
} from "../../../src/lib/control-plane/gate-decision.js"

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "hivemind-cp-test-"))
})

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
})

// ---------------------------------------------------------------------------
// Tests: GateDecision classification (CP-03)
// ---------------------------------------------------------------------------

describe("GateDecision classification", () => {
  it("should classify blocking decisions correctly", () => {
    expect(isBlockingDecision(GateDecisionType.BLOCK)).toBe(true)
    expect(isBlockingDecision(GateDecisionType.DENY)).toBe(true)
  })

  it("should classify non-blocking decisions correctly", () => {
    expect(isBlockingDecision(GateDecisionType.ALLOW)).toBe(false)
    expect(isBlockingDecision(GateDecisionType.WARN)).toBe(false)
    expect(isBlockingDecision(GateDecisionType.DEFER)).toBe(false)
  })

  it("should classify gate decisions from context", () => {
    const result = classifyGateDecision({
      rule: "manualStateWritesForbidden",
      context: { toolName: "session-patch" },
    })
    expect(result).toBeDefined()
    expect(typeof result.decision).toBe("string")
    expect(typeof result.blocking).toBe("boolean")
  })
})

// ---------------------------------------------------------------------------
// Tests: Blocking vs Non-blocking gate decisions (CP-03)
// ---------------------------------------------------------------------------

describe("Blocking vs Non-blocking enforcement", () => {
  it("should list blocking gate types", () => {
    expect(Array.isArray(BLOCKING_GATES)).toBe(true)
    expect(BLOCKING_GATES.length).toBeGreaterThan(0)
  })

  it("should list non-blocking gate types", () => {
    expect(Array.isArray(NON_BLOCKING_GATES)).toBe(true)
  })

  it("blocking and non-blocking should not overlap", () => {
    const blocking = new Set(BLOCKING_GATES)
    for (const nb of NON_BLOCKING_GATES) {
      expect(blocking.has(nb)).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// Tests: Gatekeeper creation (CP-01)
// ---------------------------------------------------------------------------

describe("createGatekeeper", () => {
  it("should create a gatekeeper instance", () => {
    const gatekeeper = createGatekeeper({ projectRoot: tmpDir })
    expect(gatekeeper).toBeDefined()
    expect(typeof gatekeeper.evaluate).toBe("function")
    expect(typeof gatekeeper.registerGate).toBe("function")
    expect(typeof gatekeeper.getRegisteredGates).toBe("function")
  })

  it("should register a custom gate", () => {
    const gatekeeper = createGatekeeper({ projectRoot: tmpDir })

    const customGate: GateDecision = {
      id: "test-gate",
      description: "Test gate for unit testing",
      blocking: false,
      evaluate: () => ({ decision: GateDecisionType.ALLOW, reason: "test" }),
    }

    gatekeeper.registerGate(customGate)
    const gates = gatekeeper.getRegisteredGates()
    expect(gates.some((g) => g.id === "test-gate")).toBe(true)
  })

  it("should evaluate all registered gates and return results", async () => {
    const gatekeeper = createGatekeeper({ projectRoot: tmpDir })

    gatekeeper.registerGate({
      id: "always-allow",
      description: "Always allows",
      blocking: false,
      evaluate: () => ({ decision: GateDecisionType.ALLOW, reason: "ok" }),
    })

    const result: GateResult = await gatekeeper.evaluate({
      message: "test message",
      sessionId: "test-session",
    })

    expect(result).toBeDefined()
    expect(result.allowed).toBe(true)
    expect(Array.isArray(result.decisions)).toBe(true)
  })

  it("should block when a blocking gate denies", async () => {
    const gatekeeper = createGatekeeper({ projectRoot: tmpDir })

    gatekeeper.registerGate({
      id: "block-gate",
      description: "Always blocks",
      blocking: true,
      evaluate: () => ({ decision: GateDecisionType.BLOCK, reason: "blocked for testing" }),
    })

    const result = await gatekeeper.evaluate({
      message: "test message",
      sessionId: "test-session",
    })

    expect(result.allowed).toBe(false)
    expect(result.blockingGate).toBe("block-gate")
  })

  it("should pass when all blocking gates allow", async () => {
    const gatekeeper = createGatekeeper({ projectRoot: tmpDir })

    gatekeeper.registerGate({
      id: "warn-only",
      description: "Warns but allows",
      blocking: false,
      evaluate: () => ({ decision: GateDecisionType.WARN, reason: "warning" }),
    })

    gatekeeper.registerGate({
      id: "blocking-allow",
      description: "Blocking gate that allows",
      blocking: true,
      evaluate: () => ({ decision: GateDecisionType.ALLOW, reason: "ok" }),
    })

    const result = await gatekeeper.evaluate({
      message: "test message",
      sessionId: "test-session",
    })

    expect(result.allowed).toBe(true)
    // Should still collect the warning
    expect(result.warnings.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Tests: manualStateWritesForbidden enforcement (CP-04)
// ---------------------------------------------------------------------------

describe("manualStateWritesForbidden (CP-04)", () => {
  it("should have a manual-state-writes gate", () => {
    const gatekeeper = createGatekeeper({ projectRoot: tmpDir })
    const gates = gatekeeper.getRegisteredGates()
    const stateGate = gates.find((g) => g.id === "manual-state-writes")
    expect(stateGate).toBeDefined()
  })

  it("should block direct state mutation attempts via restricted tools", async () => {
    const gatekeeper = createGatekeeper({ projectRoot: tmpDir })

    const result = await gatekeeper.evaluate({
      message: "Write to .hivemind/state/session-continuity.json directly",
      sessionId: "test-session",
      toolName: "write-file",
      toolArgs: { path: ".hivemind/state/session-continuity.json" },
    })

    // Should be blocked by manual-state-writes gate
    expect(result.allowed).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Tests: Primitive detection (CP-02)
// ---------------------------------------------------------------------------

describe("Primitive detection", () => {
  it("should detect known harness primitives in gatekeeper context", async () => {
    const gatekeeper = createGatekeeper({ projectRoot: tmpDir })

    // Create a minimal .opencode structure
    const agentsDir = path.join(tmpDir, ".opencode", "agents")
    mkdirSync(agentsDir, { recursive: true })
    await fs.writeFile(
      path.join(agentsDir, "hm-l2-researcher.md"),
      `---
description: "Research specialist"
---
Body`,
    )

    const primitives = await gatekeeper.detectPrimitives()
    expect(primitives.length).toBeGreaterThan(0)
    expect(primitives.some((p) => p.name === "hm-l2-researcher")).toBe(true)
  })
})
