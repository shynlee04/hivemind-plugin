import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import {
  HivemindConfigsSchema,
  SupportedLanguageSchema,
  HivemindModeSchema,
  UserExpertLevelSchema,
  DelegationSystemsSchema,
  getDefaultConfigs,
  getConfigsPath,
  readConfigs,
  writeConfigs,
} from "../../src/schema-kernel/hivemind-configs.schema.js"

// Helpers
const sp = (schema: any, data: unknown) => schema.safeParse(data)

// ===========================================================================
// SupportedLanguageSchema
// ===========================================================================

describe("SupportedLanguageSchema", () => {
  it("accepts all 10 supported languages", () => {
    for (const lang of ["en", "vi", "zh", "fr", "ja", "ko", "de", "es", "th", "id"]) {
      expect(sp(SupportedLanguageSchema, lang).success).toBe(true)
    }
  })

  it("rejects unsupported language", () => {
    expect(sp(SupportedLanguageSchema, "xx").success).toBe(false)
  })

  it("rejects empty string", () => {
    expect(sp(SupportedLanguageSchema, "").success).toBe(false)
  })
})

// ===========================================================================
// HivemindModeSchema
// ===========================================================================

describe("HivemindModeSchema", () => {
  it("accepts all 3 modes", () => {
    for (const mode of ["expert-advisor", "hivemind-powered", "free-style"]) {
      expect(sp(HivemindModeSchema, mode).success).toBe(true)
    }
  })

  it("rejects unknown mode", () => {
    expect(sp(HivemindModeSchema, "unknown-mode").success).toBe(false)
  })
})

// ===========================================================================
// UserExpertLevelSchema
// ===========================================================================

describe("UserExpertLevelSchema", () => {
  it("accepts all 5 levels", () => {
    for (const level of [
      "clumsy-vibecoder",
      "beginner-friendly",
      "intermediate-high-level",
      "architecture-driven",
      "absolute-expert",
    ]) {
      expect(sp(UserExpertLevelSchema, level).success).toBe(true)
    }
  })

  it("rejects unknown level", () => {
    expect(sp(UserExpertLevelSchema, "unknown-level").success).toBe(false)
  })
})

// ===========================================================================
// DelegationSystemsSchema
// ===========================================================================

describe("DelegationSystemsSchema", () => {
  it("accepts valid delegation systems", () => {
    const result = sp(DelegationSystemsSchema, {
      native_task: true,
      delegate_task: true,
      background_delegation: false,
    })
    expect(result.success).toBe(true)
  })

  it("applies defaults for empty object", () => {
    const result = sp(DelegationSystemsSchema, {})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.native_task).toBe(true)
      expect(result.data.delegate_task).toBe(true)
      expect(result.data.background_delegation).toBe(false)
    }
  })

  it("rejects non-boolean values", () => {
    expect(sp(DelegationSystemsSchema, { native_task: "yes" }).success).toBe(false)
  })
})

// ===========================================================================
// HivemindConfigsSchema
// ===========================================================================

describe("HivemindConfigsSchema", () => {
  it("accepts full valid config", () => {
    const result = sp(HivemindConfigsSchema, {
      conversationLanguage: "en",
      documentsLanguage: "vi",
      mode: "expert-advisor",
      userExpertLevel: "architecture-driven",
      delegationSystems: {
        native_task: true,
        delegate_task: false,
        background_delegation: true,
      },
    })
    expect(result.success).toBe(true)
  })

  it("applies all defaults for empty object", () => {
    const result = sp(HivemindConfigsSchema, {})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.conversationLanguage).toBe("en")
      expect(result.data.documentsLanguage).toBe("en")
      expect(result.data.mode).toBe("expert-advisor")
      expect(result.data.userExpertLevel).toBe("intermediate-high-level")
      expect(result.data.delegationSystems.native_task).toBe(true)
      expect(result.data.delegationSystems.delegate_task).toBe(true)
      expect(result.data.delegationSystems.background_delegation).toBe(false)
    }
  })

  it("strips unknown fields (lenient)", () => {
    const result = sp(HivemindConfigsSchema, {
      conversationLanguage: "en",
      unknownField: "value",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect("unknownField" in result.data).toBe(false)
    }
  })

  it("rejects invalid mode", () => {
    expect(sp(HivemindConfigsSchema, { mode: "invalid" }).success).toBe(false)
  })

  it("rejects invalid language", () => {
    expect(sp(HivemindConfigsSchema, { conversationLanguage: "xx" }).success).toBe(false)
  })

  it("rejects invalid expert level", () => {
    expect(sp(HivemindConfigsSchema, { userExpertLevel: "guru" }).success).toBe(false)
  })
})

// ===========================================================================
// getDefaultConfigs
// ===========================================================================

describe("getDefaultConfigs", () => {
  it("returns expected defaults", () => {
    const defaults = getDefaultConfigs()
    expect(defaults.conversationLanguage).toBe("en")
    expect(defaults.documentsLanguage).toBe("en")
    expect(defaults.mode).toBe("expert-advisor")
    expect(defaults.userExpertLevel).toBe("intermediate-high-level")
    expect(defaults.delegationSystems).toEqual({
      native_task: true,
      delegate_task: true,
      background_delegation: false,
    })
  })

  it("returns a fresh object on each call", () => {
    const a = getDefaultConfigs()
    const b = getDefaultConfigs()
    expect(a).toEqual(b)
    expect(a).not.toBe(b)
  })
})

// ===========================================================================
// getConfigsPath
// ===========================================================================

describe("getConfigsPath", () => {
  it("resolves to .hivemind/configs.json", () => {
    const path = getConfigsPath("/my/project")
    expect(path).toBe(join("/my/project", ".hivemind", "configs.json"))
  })
})

// ===========================================================================
// readConfigs / writeConfigs — filesystem tests
// ===========================================================================

describe("readConfigs", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = join(tmpdir(), `hivemind-configs-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(join(tmpDir, ".hivemind"), { recursive: true })
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it("returns defaults when file does not exist", () => {
    const configs = readConfigs(tmpDir)
    expect(configs).toEqual(getDefaultConfigs())
  })

  it("reads valid config from disk", () => {
    writeFileSync(
      join(tmpDir, ".hivemind", "configs.json"),
      JSON.stringify({
        conversationLanguage: "vi",
        documentsLanguage: "vi",
        mode: "hivemind-powered",
        userExpertLevel: "absolute-expert",
        delegationSystems: {
          native_task: true,
          delegate_task: true,
          background_delegation: true,
        },
      }),
    )
    const configs = readConfigs(tmpDir)
    expect(configs.conversationLanguage).toBe("vi")
    expect(configs.mode).toBe("hivemind-powered")
    expect(configs.delegationSystems.background_delegation).toBe(true)
  })

  it("returns defaults for corrupt JSON", () => {
    writeFileSync(join(tmpDir, ".hivemind", "configs.json"), "not json {{{")
    const configs = readConfigs(tmpDir)
    expect(configs).toEqual(getDefaultConfigs())
  })

  it("returns defaults for invalid schema (falls back gracefully)", () => {
    writeFileSync(
      join(tmpDir, ".hivemind", "configs.json"),
      JSON.stringify({ mode: "invalid-mode-value" }),
    )
    const configs = readConfigs(tmpDir)
    expect(configs).toEqual(getDefaultConfigs())
  })

  it("strips unknown fields from config", () => {
    writeFileSync(
      join(tmpDir, ".hivemind", "configs.json"),
      JSON.stringify({
        conversationLanguage: "ja",
        futureField: "should be stripped",
      }),
    )
    const configs = readConfigs(tmpDir)
    expect(configs.conversationLanguage).toBe("ja")
    expect("futureField" in configs).toBe(false)
  })
})

describe("writeConfigs", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = join(tmpdir(), `hivemind-configs-write-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it("writes valid config to disk", () => {
    const config = getDefaultConfigs()
    config.conversationLanguage = "ko"
    const written = writeConfigs(tmpDir, config)
    expect(written.conversationLanguage).toBe("ko")

    const raw = readFileSync(join(tmpDir, ".hivemind", "configs.json"), "utf8")
    const parsed = JSON.parse(raw)
    expect(parsed.conversationLanguage).toBe("ko")
  })

  it("creates parent directory if missing", () => {
    const config = getDefaultConfigs()
    writeConfigs(tmpDir, config)
    expect(existsSync(join(tmpDir, ".hivemind", "configs.json"))).toBe(true)
  })

  it("round-trips through read/write", () => {
    const original = getDefaultConfigs()
    original.mode = "hivemind-powered"
    original.userExpertLevel = "absolute-expert"
    writeConfigs(tmpDir, original)
    const roundTripped = readConfigs(tmpDir)
    expect(roundTripped).toEqual(original)
  })

  it("throws on invalid config", () => {
    expect(() => writeConfigs(tmpDir, { mode: "invalid" } as any)).toThrow()
  })
})
