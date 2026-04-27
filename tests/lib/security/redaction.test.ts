import { describe, expect, it } from "vitest"

import { redactBoundaryFields, redactTextSecrets } from "../../../src/lib/security/redaction.js"

describe("field-aware redaction", () => {
  it("redacts env-style API keys and bearer tokens", () => {
    expect(redactTextSecrets("OPENAI_API_KEY=sk-test-123")).toBe("OPENAI_API_KEY=[REDACTED:API_KEY]")
    expect(redactTextSecrets("Authorization: Bearer abc.def.ghi")).toBe("Authorization: Bearer [REDACTED:TOKEN]")
  })

  it("redacts sensitive JSON field values while preserving keys", () => {
    const redacted = redactBoundaryFields({ token: "abc.def", password: "p4ss", secret: "hidden" }, { redactFieldNames: [] })

    expect(redacted).toEqual({
      token: "[REDACTED:TOKEN]",
      password: "[REDACTED:PASSWORD]",
      secret: "[REDACTED:SECRET]",
    })
  })

  it("redacts configured text fields and preserves operational identifiers", () => {
    const input = {
      id: "del-high-entropy-1234567890",
      delegationId: "del-123",
      sessionId: "ses-123",
      parentSessionId: "ses-parent",
      childSessionId: "ses-child",
      queueKey: "provider:anthropic:model:gpt-5",
      ptySessionId: "pty-123",
      workingDirectory: "/tmp/project-with-token-like-name",
      category: "implementation",
      timestamp: 123,
      status: "completed",
      executionMode: "pty",
      surface: "command-process",
      recoveryGuarantee: "best-effort",
      result: "command produced HIVEMIND_FAKE_TOKEN=secret-value-1234567890",
      normal: "delegation completed successfully",
    }

    const redacted = redactBoundaryFields(input, { redactFieldNames: ["result"] })

    expect(redacted).toMatchObject({
      id: input.id,
      delegationId: input.delegationId,
      sessionId: input.sessionId,
      parentSessionId: input.parentSessionId,
      childSessionId: input.childSessionId,
      queueKey: input.queueKey,
      ptySessionId: input.ptySessionId,
      workingDirectory: input.workingDirectory,
      category: input.category,
      timestamp: input.timestamp,
      status: input.status,
      executionMode: input.executionMode,
      surface: input.surface,
      recoveryGuarantee: input.recoveryGuarantee,
      result: "command produced HIVEMIND_FAKE_TOKEN=[REDACTED:TOKEN]",
      normal: "delegation completed successfully",
    })
  })

  it("returns a cloned object without mutating caller-owned objects", () => {
    const input = { result: "PASSWORD=hunter2", nested: { apiKey: "sk-test" } }
    const redacted = redactBoundaryFields(input, { redactFieldNames: ["result"] })

    expect(redacted).not.toBe(input)
    expect(redacted.nested).not.toBe(input.nested)
    expect(input.result).toBe("PASSWORD=hunter2")
    expect(input.nested.apiKey).toBe("sk-test")
  })
})
