import { describe, it, expect } from "vitest"
import {
  detectLanguage,
  type LanguageDetection,
} from "../../../src/lib/session-entry/language-resolution.js"

describe("detectLanguage", () => {
  // ── SEI-02: Unicode-range language detection ─────────────────────────

  describe("Latin script detection", () => {
    it("detects English as Latin script", () => {
      const result = detectLanguage("Hello, how are you today?")
      expect(result.script).toBe("latin")
      expect(result.language).toBe("en")
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    it("detects plain ASCII as Latin", () => {
      const result = detectLanguage("The quick brown fox jumps over the lazy dog")
      expect(result.script).toBe("latin")
    })

    it("detects French accented characters as Latin", () => {
      const result = detectLanguage("Café résumé naïve")
      expect(result.script).toBe("latin")
    })
  })

  describe("CJK script detection", () => {
    it("detects Chinese characters as CJK", () => {
      const result = detectLanguage("你好世界")
      expect(result.script).toBe("cjk")
      expect(result.language).toBe("zh")
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    it("detects Japanese kanji as CJK", () => {
      const result = detectLanguage("こんにちは世界")
      expect(result.script).toBe("cjk")
      expect(result.language).toBe("ja")
    })

    it("detects Korean as CJK", () => {
      const result = detectLanguage("안녕하세요")
      expect(result.script).toBe("cjk")
      expect(result.language).toBe("ko")
    })
  })

  describe("Arabic script detection", () => {
    it("detects Arabic text", () => {
      const result = detectLanguage("مرحبا بالعالم")
      expect(result.script).toBe("arabic")
      expect(result.language).toBe("ar")
      expect(result.confidence).toBeGreaterThan(0.5)
    })
  })

  describe("Cyrillic script detection", () => {
    it("detects Russian text", () => {
      const result = detectLanguage("Привет мир")
      expect(result.script).toBe("cyrillic")
      expect(result.language).toBe("ru")
      expect(result.confidence).toBeGreaterThan(0.5)
    })
  })

  describe("Devanagari script detection", () => {
    it("detects Hindi text", () => {
      const result = detectLanguage("नमस्ते दुनिया")
      expect(result.script).toBe("devanagari")
      expect(result.language).toBe("hi")
      expect(result.confidence).toBeGreaterThan(0.5)
    })
  })

  describe("Thai script detection", () => {
    it("detects Thai text", () => {
      const result = detectLanguage("สวัสดีชาวโลก")
      expect(result.script).toBe("thai")
      expect(result.language).toBe("th")
      expect(result.confidence).toBeGreaterThan(0.5)
    })
  })

  // ── Edge cases ──────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("returns unknown for empty input", () => {
      const result = detectLanguage("")
      expect(result.script).toBe("unknown")
      expect(result.confidence).toBe(0)
    })

    it("returns unknown for whitespace-only input", () => {
      const result = detectLanguage("   \t\n  ")
      expect(result.script).toBe("unknown")
      expect(result.confidence).toBe(0)
    })

    it("handles mixed scripts by returning dominant script", () => {
      // Mostly CJK with some Latin
      const result = detectLanguage("你好世界这是中文测试这是更多中文文字Hello")
      expect(result.script).toBe("cjk")
    })

    it("handles ASCII-only as Latin", () => {
      const result = detectLanguage("12345 !@#$%")
      expect(result.script).toBe("latin")
    })

    it("produces a result with all required fields", () => {
      const result = detectLanguage("test")
      expect(result).toHaveProperty("language")
      expect(result).toHaveProperty("script")
      expect(result).toHaveProperty("confidence")
      expect(typeof result.language).toBe("string")
      expect(typeof result.script).toBe("string")
      expect(typeof result.confidence).toBe("number")
    })

    it("confidence is always between 0 and 1", () => {
      const inputs = ["", "Hello", "你好", "مرحبا", "Привет", "नमस्ते", "สวัสดี"]
      for (const input of inputs) {
        const result = detectLanguage(input)
        expect(result.confidence).toBeGreaterThanOrEqual(0)
        expect(result.confidence).toBeLessThanOrEqual(1)
      }
    })
  })
})
