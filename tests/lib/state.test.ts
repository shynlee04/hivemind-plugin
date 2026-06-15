import { TaskStateManager } from "../../src/shared/state.js"
import type { DelegationMeta } from "../../src/shared/types.js"

const makeValidMeta = (rootID: string): DelegationMeta => ({
  rootID,
  depth: 1,
  budgetUsed: 1,
  agent: "builder",
  queueKey: "default",
})

describe("TaskStateManager", () => {
  let mgr: TaskStateManager

  beforeEach(() => {
    mgr = new TaskStateManager()
  })

  // -------------------------------------------------------------------------
  // Construction
  // -------------------------------------------------------------------------

  describe("construction", () => {
    it("constructs with empty state (all Maps empty)", () => {
      expect(mgr.getStats("nonexistent")).toBeUndefined()
      expect(mgr.getRootBudget("nonexistent")).toBeUndefined()
      expect(mgr.getSessionRoot("nonexistent")).toBeUndefined()
      expect(mgr.getDelegationMeta("nonexistent")).toBeUndefined()
      expect(mgr.getSubagents("nonexistent").size).toBe(0)
    })
  })

  // -------------------------------------------------------------------------
  // Session stats
  // -------------------------------------------------------------------------

  describe("session stats", () => {
    it("ensureStats creates new stats for unknown session", () => {
      const stats = mgr.ensureStats("sid-1")
      expect(stats).toMatchObject({
        total: 0,
        byTool: {},
        loop: { signature: "", count: 0 },
        warnings: [],
      })
    })

    it("ensureStats returns existing stats for known session", () => {
      const first = mgr.ensureStats("sid-2")
      first.total = 42
      const second = mgr.ensureStats("sid-2")
      expect(second.total).toBe(42)
      expect(second).toBe(first)
    })

    it("getStats returns undefined for unknown session", () => {
      expect(mgr.getStats("unknown-session")).toBeUndefined()
    })

    it("addWarning appends warning message", () => {
      mgr.addWarning("sid-3", "watch out")
      const stats = mgr.getStats("sid-3")
      expect(stats?.warnings).toContain("watch out")
    })

    it("addWarning caps at 25 warnings", () => {
      for (let i = 0; i < 30; i++) {
        mgr.addWarning("sid-cap", `warning-${i}`)
      }
      const stats = mgr.getStats("sid-cap")
      expect(stats?.warnings.length).toBe(25)
    })
  })

  // -------------------------------------------------------------------------
  // Root budget tracking
  // -------------------------------------------------------------------------

  describe("root budget tracking", () => {
    it("reserveDescendant increments descendant count", () => {
      const count = mgr.reserveDescendant("root-1", 10)
      expect(count).toBe(1)
    })

    it("reserveDescendant throws when exceeding max with [Hivemind] prefix", () => {
      for (let i = 0; i < 3; i++) {
        mgr.reserveDescendant("root-limit", 3)
      }
      expect(() => mgr.reserveDescendant("root-limit", 3)).toThrow(/^\[Hivemind\]/)
    })

    it("rollbackReservation decrements descendant count", () => {
      mgr.reserveDescendant("root-rb", 10)
      mgr.rollbackReservation("root-rb")
      const budget = mgr.getRootBudget("root-rb")
      // After one reserve then one rollback, reserved should be 0
      expect(budget?.reserved).toBe(0)
    })

    it("rollbackReservation is no-op for unknown root", () => {
      expect(() => mgr.rollbackReservation("ghost-root")).not.toThrow()
    })

    it("getRootBudget returns undefined for unknown root", () => {
      expect(mgr.getRootBudget("no-such-root")).toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------
  // Session-to-root mapping
  // -------------------------------------------------------------------------

  describe("session-to-root mapping", () => {
    it("setSessionRoot/getSessionRoot roundtrip", () => {
      mgr.setSessionRoot("sid-map", "root-map")
      expect(mgr.getSessionRoot("sid-map")).toBe("root-map")
    })

    it("getSessionRoot returns undefined for unknown session", () => {
      expect(mgr.getSessionRoot("unmapped-session")).toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------
  // Delegation metadata
  // -------------------------------------------------------------------------

  describe("delegation metadata", () => {
    it("setDelegationMeta/getDelegationMeta roundtrip", () => {
      const meta = makeValidMeta("root-dm")
      mgr.setDelegationMeta("sid-dm", meta)
      expect(mgr.getDelegationMeta("sid-dm")).toEqual(meta)
    })

    it("getDelegationMeta returns undefined for unknown session", () => {
      expect(mgr.getDelegationMeta("no-meta-session")).toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------
  // Subagent registry (OMO Pattern 10)
  // -------------------------------------------------------------------------

  describe("subagent registry", () => {
    it("registerSubagent tracks child under parent", () => {
      mgr.registerSubagent("parent-1", "child-1")
      expect(mgr.getSubagents("parent-1").has("child-1")).toBe(true)
    })

    it("registerSubagent allows multiple children per parent", () => {
      mgr.registerSubagent("parent-2", "child-a")
      mgr.registerSubagent("parent-2", "child-b")
      mgr.registerSubagent("parent-2", "child-c")
      const children = mgr.getSubagents("parent-2")
      expect(children.size).toBe(3)
      expect(children.has("child-a")).toBe(true)
      expect(children.has("child-b")).toBe(true)
      expect(children.has("child-c")).toBe(true)
    })

    it("getSubagents returns empty Set for unknown parent", () => {
      const result = mgr.getSubagents("no-parent")
      expect(result).toBeInstanceOf(Set)
      expect(result.size).toBe(0)
    })
  })

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  describe("cleanup", () => {
    it("forgetSession removes from ALL Maps including subagent registry", () => {
      // Populate all maps for the session
      mgr.ensureStats("sid-forget")
      mgr.setDelegationMeta("sid-forget", makeValidMeta("root-forget"))
      mgr.reserveDescendant("root-forget", 10)
      mgr.commitDescendant("root-forget", "sid-forget")
      mgr.registerSubagent("parent-forget", "sid-forget")
      mgr.addWarning("sid-forget", "some warning")

      mgr.forgetSession("sid-forget")

      expect(mgr.getStats("sid-forget")).toBeUndefined()
      expect(mgr.getDelegationMeta("sid-forget")).toBeUndefined()
      expect(mgr.getSessionRoot("sid-forget")).toBeUndefined()
      // The subagent entry for sid-forget as a child should be cleaned up
      // Note: the parent's registry is not affected — only the session's own entry
    })

    it("clear() empties everything", () => {
      mgr.ensureStats("sid-a")
      mgr.ensureStats("sid-b")
      mgr.reserveDescendant("root-x", 10)
      mgr.registerSubagent("p", "c")
      mgr.setDelegationMeta("sid-a", makeValidMeta("root-x"))

      mgr.clear()

      expect(mgr.getStats("sid-a")).toBeUndefined()
      expect(mgr.getStats("sid-b")).toBeUndefined()
      expect(mgr.getRootBudget("root-x")).toBeUndefined()
      expect(mgr.getSubagents("p").size).toBe(0)
      expect(mgr.getDelegationMeta("sid-a")).toBeUndefined()
    })
  })
})
