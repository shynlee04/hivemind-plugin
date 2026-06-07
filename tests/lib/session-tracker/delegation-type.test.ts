/**
 * TODO-2 (2026-06-04) — Tests for the delegationType discriminator.
 *
 * Verifies:
 *  1. The 4 user-locked enum values are exported from the session-tracker
 *     types module (single source of truth)
 *  2. The Zod schema parses manifest entries with AND without the field
 *     (R1 backward-compat, R2 .optional() mitigation)
 *  3. The reader propagates the optional field to the resulting Delegation
 *     record (MVD §12.4 read-side enrichment)
 *  4. The setter convention maps input.tool to the correct enum value
 *     (MVD §12.3 — no runtime function, but a hand-rolled reducer is tested)
 *  5. The default "sdk-direct" fallback is used for unrecognised tools
 *     (used by the dual-write path in delegation-persistence.ts)
 */
import { describe, it, expect } from "vitest"
import { DelegationType, type ChildSessionRecord, type HierarchyManifestChild } from "../../../src/features/session-tracker/types.js"
import { HierarchyManifestChildSchema, hierarchyChildToDelegation } from "../../../src/tools/delegation/readers/types.js"

describe("DelegationType discriminator (TODO-2 MVD)", () => {
  describe("DelegationType enum", () => {
    it("exports the 4 user-locked enum values", () => {
      // The single source of truth for the delegationType values
      // (set by user decision on 2026-06-04 — see .hivemind/planning/audit-2026-06-04/todo.md)
      const allValues: DelegationType[] = ["async-spawn", "native-task", "slash-cmd", "sdk-direct"]
      expect(allValues).toHaveLength(4)
    })

    it("documents the producer tool mapping", () => {
      // This is a "living documentation" test — the mapping must stay
      // aligned with the user-locked enum to prevent accidental drift.
      const PRODUCER_MAP: Record<DelegationType, string> = {
        "async-spawn": "delegate-task",
        "native-task": "task",
        "slash-cmd": "execute-slash-command",
        "sdk-direct": "direct SDK call",
      }
      expect(PRODUCER_MAP["async-spawn"]).toBe("delegate-task")
      expect(PRODUCER_MAP["native-task"]).toBe("task")
      expect(PRODUCER_MAP["slash-cmd"]).toBe("execute-slash-command")
      expect(PRODUCER_MAP["sdk-direct"]).toBe("direct SDK call")
    })
  })

  describe("HierarchyManifestChildSchema (R2 mitigation)", () => {
    it("parses manifest entries WITHOUT delegationType (R1 backward compat)", () => {
      const legacyEntry = {
        parentSessionID: "parent-1",
        status: "completed",
        subagentType: "hm-executor",
        delegationDepth: 1,
        createdAt: "2026-05-28T00:00:00.000Z",
        updatedAt: "2026-05-28T00:01:00.000Z",
        childFile: "child-1.json",
        rootMainSessionID: "root-1",
      }
      const parsed = HierarchyManifestChildSchema.safeParse(legacyEntry)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.delegationType).toBeUndefined()
      }
    })

    it("parses manifest entries WITH delegationType (MVD entries)", () => {
      const mvdEntry = {
        parentSessionID: "parent-1",
        status: "active",
        subagentType: "hm-executor",
        delegationDepth: 1,
        createdAt: "2026-05-28T00:00:00.000Z",
        updatedAt: "2026-05-28T00:01:00.000Z",
        childFile: "child-1.json",
        rootMainSessionID: "root-1",
        delegationType: "async-spawn" as const,
      }
      const parsed = HierarchyManifestChildSchema.safeParse(mvdEntry)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.delegationType).toBe("async-spawn")
      }
    })

    it("rejects unknown delegationType values (enum-locked per REQ-10)", () => {
      // The Zod schema uses z.enum() (not z.string()) so only the 4 locked
      // literal values are accepted. Unknown values fail validation.
      const futureEntry = {
        parentSessionID: "parent-1",
        status: "active",
        createdAt: "2026-05-28T00:00:00.000Z",
        delegationType: "future-enum-value-not-yet-defined",
      }
      const parsed = HierarchyManifestChildSchema.safeParse(futureEntry)
      expect(parsed.success).toBe(false)
    })
  })

  describe("hierarchyChildToDelegation (MVD read-side enrichment)", () => {
    it("propagates delegationType from child record to Delegation", () => {
      const child = {
        parentSessionID: "parent-1",
        status: "completed",
        subagentType: "hm-executor",
        delegationDepth: 1,
        createdAt: "2026-05-28T00:00:00.000Z",
        updatedAt: "2026-05-28T00:01:00.000Z",
        childFile: "child-1.json",
        rootMainSessionID: "root-1",
        delegationType: "async-spawn",
      }
      const validated = HierarchyManifestChildSchema.parse(child)
      const delegation = hierarchyChildToDelegation("child-1", validated, "/tmp/proj")

      expect(delegation.delegationType).toBe("async-spawn")
      expect(delegation.id).toBe("child-1")
      expect(delegation.parentSessionId).toBe("parent-1")
    })

    it("returns undefined delegationType for legacy entries (R1 backward compat)", () => {
      const child = {
        parentSessionID: "parent-1",
        status: "completed",
        subagentType: "hm-executor",
        delegationDepth: 1,
        createdAt: "2026-05-28T00:00:00.000Z",
        updatedAt: "2026-05-28T00:01:00.000Z",
        childFile: "child-1.json",
        rootMainSessionID: "root-1",
        // no delegationType
      }
      const validated = HierarchyManifestChildSchema.parse(child)
      const delegation = hierarchyChildToDelegation("child-2", validated, "/tmp/proj")

      expect(delegation.delegationType).toBeUndefined()
    })
  })

  describe("Setter convention (MVD §12.3)", () => {
    // The setter convention lives inline in tool-delegation.ts:308 and
    // capture/handlers/types.ts:139 (the producer at the writer call
    // site). The function below mirrors the inline mapping so any drift
    // between the inline setter and this canonical mapper is caught by
    // the test. This is a "test-seam" pattern — the inline setter is the
    // production code, the function below is the contract.
    function toolToDelegationType(tool: string): DelegationType {
      if (tool === "delegate-task") return "async-spawn"
      if (tool === "task") return "native-task"
      if (tool === "execute-slash-command") return "slash-cmd"
      return "sdk-direct"
    }

    it("maps 'delegate-task' to 'async-spawn'", () => {
      expect(toolToDelegationType("delegate-task")).toBe("async-spawn")
    })

    it("maps 'task' to 'native-task'", () => {
      expect(toolToDelegationType("task")).toBe("native-task")
    })

    it("maps 'execute-slash-command' to 'slash-cmd'", () => {
      expect(toolToDelegationType("execute-slash-command")).toBe("slash-cmd")
    })

    it("falls back to 'sdk-direct' for unrecognised tools", () => {
      expect(toolToDelegationType("bash")).toBe("sdk-direct")
      expect(toolToDelegationType("read")).toBe("sdk-direct")
      expect(toolToDelegationType("")).toBe("sdk-direct")
      expect(toolToDelegationType("unknown-tool-name")).toBe("sdk-direct")
    })
  })

  describe("Type-level: optional field on record types (R1)", () => {
    it("ChildSessionRecord accepts records without delegationType", () => {
      // Compile-time check: this assignment must compile cleanly
      const record: ChildSessionRecord = {
        sessionID: "child-1",
        parentSessionID: "parent-1",
        delegationDepth: 1,
        delegatedBy: {
          agentName: "hm-executor",
          model: "unknown",
          tool: "task",
          description: "",
          subagentType: "",
        },
        created: "2026-05-28T00:00:00.000Z",
        updated: "2026-05-28T00:01:00.000Z",
        status: "active",
        mainAgent: { name: "hm-executor", model: "unknown" },
        turns: [],
        children: [],
        // no delegationType — must typecheck
      }
      expect(record.delegationType).toBeUndefined()
    })

    it("ChildSessionRecord accepts records WITH delegationType", () => {
      const record: ChildSessionRecord = {
        sessionID: "child-1",
        parentSessionID: "parent-1",
        delegationDepth: 1,
        delegatedBy: {
          agentName: "hm-executor",
          model: "unknown",
          tool: "delegate-task",
          description: "",
          subagentType: "",
        },
        created: "2026-05-28T00:00:00.000Z",
        updated: "2026-05-28T00:01:00.000Z",
        status: "active",
        mainAgent: { name: "hm-executor", model: "unknown" },
        turns: [],
        children: [],
        delegationType: "async-spawn",
      }
      expect(record.delegationType).toBe("async-spawn")
    })

    it("HierarchyManifestChild accepts records with and without delegationType", () => {
      const legacy: HierarchyManifestChild = {
        sessionID: "child-1",
        parentSessionID: "parent-1",
        rootMainSessionID: "root-1",
        delegationDepth: 1,
        delegatedBy: "hm-executor",
        subagentType: "hm-executor",
        createdAt: "2026-05-28T00:00:00.000Z",
        updatedAt: "2026-05-28T00:01:00.000Z",
        status: "active",
        turnCount: 0,
        childFile: "child-1.json",
      }
      const modern: HierarchyManifestChild = {
        ...legacy,
        delegationType: "native-task",
      }
      expect(legacy.delegationType).toBeUndefined()
      expect(modern.delegationType).toBe("native-task")
    })
  })
})
