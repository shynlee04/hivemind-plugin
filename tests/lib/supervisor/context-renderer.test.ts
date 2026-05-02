import { describe, it, expect } from "vitest"
import {
  renderSupervisorContext,
  type SupervisorContext,
} from "../../../src/lib/supervisor/context-renderer.js"

describe("context-renderer", () => {
  it("renders context with all fields", () => {
    const ctx = renderSupervisorContext({
      sessionId: "sess-1",
      status: "running",
      agent: "builder",
      activeTools: ["read_file", "edit_file"],
      recentEvents: ["session.created", "tool.called"],
    })
    expect(ctx.session_id).toBe("sess-1")
    expect(ctx.status).toBe("running")
    expect(ctx.agent).toBe("builder")
    expect(ctx.active_tools).toEqual(["read_file", "edit_file"])
    expect(ctx.recent_events).toHaveLength(2)
    expect(ctx.rendered_at).toBeGreaterThan(0)
  })

  it("defaults empty arrays gracefully", () => {
    const ctx = renderSupervisorContext({
      sessionId: "sess-2",
      status: "idle",
      agent: null,
    })
    expect(ctx.active_tools).toEqual([])
    expect(ctx.recent_events).toEqual([])
    expect(ctx.agent).toBeNull()
  })
})
