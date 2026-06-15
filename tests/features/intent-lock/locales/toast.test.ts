/**
 * Tests for locale-keyed toast templates (P27.2 T25).
 *
 * Evidence label: runtime-truthful (small).
 */

import { describe, it, expect } from "vitest"

import {
  loadToastTemplates,
  en,
  vi,
} from "../../../../src/features/intent-lock/locales/toast-templates.js"

describe("toast templates (T25)", () => {
  it("loads en templates by default", () => {
    const t = loadToastTemplates("en")
    expect(t.gateActive).toContain("active")
    expect(t.gateBlocked).toContain("blocked")
    expect(t.gateComplete).toContain("COMPLETED")
  })

  it("loads vi templates for vi locale", () => {
    const t = loadToastTemplates("vi")
    expect(t.gateActive).toContain("hoạt động")
    expect(t.gateBlocked).toContain("chặn")
    expect(t.gateComplete).toContain("HOÀN THÀNH")
  })

  it("falls back to en for unknown locale", () => {
    const t = loadToastTemplates("unknown-locale")
    expect(t.gateActive).toBe(en.gateActive)
    expect(t.gateBlocked).toBe(en.gateBlocked)
    expect(t.gateComplete).toBe(en.gateComplete)
  })

  it("en templates have {toolName} variable", () => {
    expect(en.gateBlocked).toContain("{toolName}")
  })

  it("en templates have {evidenceList} variable", () => {
    expect(en.gateBlocked).toContain("{evidenceList}")
  })

  it("en templates have {currentState} variable", () => {
    expect(en.gateActive).toContain("{currentState}")
  })

  it("vi templates contain all required strings", () => {
    expect(vi.gateActive).toContain("Cổng")
    expect(vi.gateBlocked).toContain("Cổng")
    expect(vi.gateComplete).toContain("HOÀN THÀNH")
  })
})
