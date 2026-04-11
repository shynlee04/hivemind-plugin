import { describe, it, expect } from "vitest"

import { CompletionVerifier } from "../../../../src/lib/tasking/completion/completion-verifier.js"
import { createInMemoryClient } from "../../helpers/in-memory-client.js"

describe("completion-verifier (D-12)", () => {
  describe("two-poll stability", () => {
    it("first idle poll does NOT complete — consecutiveIdlePolls=1", async () => {
      // WHY: D-12 requires 2 consecutive idle polls to avoid premature completion on single blip
      const client = createInMemoryClient()
      const verifier = new CompletionVerifier()

      // Add sufficient evidence so start gate passes
      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          { type: "reasoning", text: "Working..." },
          { type: "tool-call", name: "read" },
          { type: "tool-call", name: "write" },
        ],
      })

      const result = await verifier.check(client, "ses_1", true)
      expect(result.consecutiveIdlePolls).toBe(1)
      expect(result.status).not.toBe("completed")
    })

    it("second consecutive idle poll DOES complete — consecutiveIdlePolls=2", async () => {
      // WHY: Two idle polls confirm the session is truly done, not just paused
      const client = createInMemoryClient()
      const verifier = new CompletionVerifier()

      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          { type: "reasoning", text: "Working..." },
          { type: "tool-call", name: "read" },
          { type: "tool-call", name: "write" },
        ],
      })

      await verifier.check(client, "ses_1", true) // 1st idle
      const result = await verifier.check(client, "ses_1", true) // 2nd idle
      expect(result.consecutiveIdlePolls).toBe(2)
      expect(result.status).toBe("completed")
    })

    it("third idle poll stays completed", async () => {
      // WHY: Once completed, subsequent idle polls should stay in completed state
      const client = createInMemoryClient()
      const verifier = new CompletionVerifier()

      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          { type: "reasoning", text: "Working..." },
          { type: "tool-call", name: "read" },
          { type: "tool-call", name: "write" },
        ],
      })

      await verifier.check(client, "ses_1", true) // 1st idle
      await verifier.check(client, "ses_1", true) // 2nd idle → completed
      const result = await verifier.check(client, "ses_1", true) // 3rd idle
      expect(result.status).toBe("completed")
      expect(result.consecutiveIdlePolls).toBe(3)
    })
  })

  describe("evidence change resets idle counter", () => {
    it("new messages between polls resets consecutiveIdlePolls to 0", async () => {
      // WHY: New activity means the session is NOT idle — reset prevents false completion
      const client = createInMemoryClient()
      const verifier = new CompletionVerifier()

      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          { type: "reasoning", text: "Working..." },
          { type: "tool-call", name: "read" },
          { type: "tool-call", name: "write" },
        ],
      })

      await verifier.check(client, "ses_1", true) // 1st idle → polls=1

      // New message arrives — activity detected
      client._addMessage("ses_1", {
        role: "assistant",
        parts: [{ type: "tool-call", name: "edit" }],
      })

      const result = await verifier.check(client, "ses_1", true)
      expect(result.consecutiveIdlePolls).toBe(1) // Reset then incremented
      expect(result.status).not.toBe("completed")
    })
  })

  describe("start gate integration", () => {
    it("start gate not passed → status stays pending with no assistant messages", async () => {
      // WHY: If no assistant messages exist, session hasn't started at all
      const client = createInMemoryClient()
      const verifier = new CompletionVerifier()

      const result = await verifier.check(client, "ses_1", true)
      expect(result.status).toBe("pending")
      expect(result.evidence.passed).toBe(false)
    })

    it("start gate not passed but evidence exists → status active", async () => {
      // WHY: Some work happened but doesn't meet the start gate threshold
      const client = createInMemoryClient()
      const verifier = new CompletionVerifier()

      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          { type: "reasoning", text: "Thinking..." },
          { type: "tool-call", name: "read" }, // Only 1 tool call — not enough
        ],
      })

      const result = await verifier.check(client, "ses_1", true)
      expect(result.status).toBe("active")
      expect(result.evidence.passed).toBe(false)
    })

    it("start gate passed + idle but only 1 poll → status idle not completed", async () => {
      // WHY: Start gate passing is necessary but not sufficient — need 2 idle polls
      const client = createInMemoryClient()
      const verifier = new CompletionVerifier()

      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          { type: "reasoning", text: "Working..." },
          { type: "tool-call", name: "read" },
          { type: "tool-call", name: "write" },
        ],
      })

      const result = await verifier.check(client, "ses_1", true)
      expect(result.evidence.passed).toBe(true)
      expect(result.status).toBe("idle")
    })

    it("start gate passed + not idle → status active", async () => {
      // WHY: Session is actively working — not idle
      const client = createInMemoryClient()
      const verifier = new CompletionVerifier()

      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          { type: "reasoning", text: "Working..." },
          { type: "tool-call", name: "read" },
          { type: "tool-call", name: "write" },
        ],
      })

      const result = await verifier.check(client, "ses_1", false)
      expect(result.evidence.passed).toBe(true)
      expect(result.status).toBe("active")
    })
  })

  describe("reset()", () => {
    it("resets all internal state", async () => {
      const client = createInMemoryClient()
      const verifier = new CompletionVerifier()

      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          { type: "reasoning", text: "Working..." },
          { type: "tool-call", name: "read" },
          { type: "tool-call", name: "write" },
        ],
      })

      await verifier.check(client, "ses_1", true) // 1st idle
      await verifier.check(client, "ses_1", true) // 2nd idle → completed
      verifier.reset()

      const result = await verifier.check(client, "ses_1", true)
      expect(result.consecutiveIdlePolls).toBe(1)
      expect(result.status).toBe("idle")
    })
  })
})
