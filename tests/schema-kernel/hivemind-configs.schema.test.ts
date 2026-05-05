import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import {
  HIVEMIND_CONFIGS_SCHEMA_VERSION,
  HivemindConfigsSchema,
  SupportedLanguageSchema,
  HivemindModeSchema,
  UserExpertLevelSchema,
  DiscussModeSchema,
  WorkflowConfigSchema,
  DelegationSystemsSchema,
  LEGACY_KEY_MAP,
  migrateKeys,
  getDefaultConfigs,
  getConfigsPath,
  readConfigs,
  writeConfigs,
} from "../../src/schema-kernel/hivemind-configs.schema.js"

// Helpers
const sp = (schema: any, data: unknown) => schema.safeParse(data)

// ===========================================================================
// Schema version
// ===========================================================================

describe("HIVEMIND_CONFIGS_SCHEMA_VERSION", () => {
  it("is 2.0.0", () => {
    expect(HIVEMIND_CONFIGS_SCHEMA_VERSION).toBe("2.0.0")
  })
})

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
// DiscussModeSchema (NEW — skeleton v2 §9.1)
// ===========================================================================

describe("DiscussModeSchema", () => {
  it("accepts all 3 discuss modes", () => {
    for (const mode of [
      "sufficient-phase-discussion",
      "intensive-phase-discussion",
      "skip-phase-discussion",
    ]) {
      expect(sp(DiscussModeSchema, mode).success).toBe(true)
    }
  })

  it("rejects invalid discuss mode", () => {
    expect(sp(DiscussModeSchema, "invalid-mode").success).toBe(false)
  })
})

// ===========================================================================
// WorkflowConfigSchema (NEW — skeleton v2 §9.1)
// ===========================================================================

describe("WorkflowConfigSchema", () => {
  it("accepts full valid workflow config", () => {
    const result = sp(WorkflowConfigSchema, {
      research: true,
      cross_session_tasks_dependencies_validation: true,
      trajectory_control: true,
      advanced_continuity_validation: true,
      task_plus_enabled: true,
      plan_check: false,
      verifier: false,
      ui_phase: true,
      ui_safety_gate: true,
      ai_integration_phase: true,
      research_before_questions: false,
      discuss_mode: "intensive-phase-discussion",
      use_worktrees: true,
    })
    expect(result.success).toBe(true)
  })

  it("applies correct defaults for empty object", () => {
    const result = sp(WorkflowConfigSchema, {})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.research).toBe(true)
      expect(result.data.cross_session_tasks_dependencies_validation).toBe(false)
      expect(result.data.trajectory_control).toBe(false)
      expect(result.data.advanced_continuity_validation).toBe(false)
      expect(result.data.task_plus_enabled).toBe(false)
      expect(result.data.plan_check).toBe(true)
      expect(result.data.verifier).toBe(true)
      expect(result.data.ui_phase).toBe(false)
      expect(result.data.ui_safety_gate).toBe(false)
      expect(result.data.ai_integration_phase).toBe(false)
      expect(result.data.research_before_questions).toBe(true)
      expect(result.data.discuss_mode).toBe("sufficient-phase-discussion")
      expect(result.data.use_worktrees).toBe(false)
    }
  })

  it("rejects invalid discuss_mode in workflow", () => {
    expect(sp(WorkflowConfigSchema, { discuss_mode: "bad-value" }).success).toBe(false)
  })

  it("rejects non-boolean workflow toggle", () => {
    expect(sp(WorkflowConfigSchema, { research: "yes" }).success).toBe(false)
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
// LEGACY_KEY_MAP and migrateKeys (NEW — backward compat)
// ===========================================================================

describe("migrateKeys", () => {
  it("maps camelCase keys to snake_case", () => {
    const raw: Record<string, unknown> = {
      conversationLanguage: "en",
      documentsLanguage: "vi",
      userExpertLevel: "absolute-expert",
      delegationSystems: { native_task: true },
    }
    migrateKeys(raw)
    expect(raw.conversation_language).toBe("en")
    expect(raw.documents_and_artifacts_language).toBe("vi")
    expect(raw.user_expert_level).toBe("absolute-expert")
    expect(raw.delegation_systems).toEqual({ native_task: true })
    // Old keys removed
    expect("conversationLanguage" in raw).toBe(false)
    expect("documentsLanguage" in raw).toBe(false)
    expect("userExpertLevel" in raw).toBe(false)
  })

  it("does not overwrite existing snake_case keys", () => {
    const raw: Record<string, unknown> = {
      conversationLanguage: "vi",
      conversation_language: "en",
    }
    migrateKeys(raw)
    // snake_case already present, camelCase kept as-is
    expect(raw.conversation_language).toBe("en")
  })

  it("handles empty object", () => {
    const raw: Record<string, unknown> = {}
    migrateKeys(raw)
    expect(Object.keys(raw)).toHaveLength(0)
  })
})

// ===========================================================================
// HivemindConfigsSchema (updated to snake_case)
// ===========================================================================

describe("HivemindConfigsSchema", () => {
  it("accepts full valid config with snake_case keys", () => {
    const result = sp(HivemindConfigsSchema, {
      conversation_language: "en",
      documents_and_artifacts_language: "vi",
      mode: "expert-advisor",
      user_expert_level: "architecture-driven",
      delegation_systems: {
        native_task: true,
        delegate_task: false,
        background_delegation: true,
      },
      parallelization: true,
      atomic_commit: false,
      commit_docs: true,
      workflow: {
        research: true,
        plan_check: true,
        discuss_mode: "intensive-phase-discussion",
      },
    })
    expect(result.success).toBe(true)
  })

  it("applies all defaults for empty object", () => {
    const result = sp(HivemindConfigsSchema, {})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.conversation_language).toBe("en")
      expect(result.data.documents_and_artifacts_language).toBe("en")
      expect(result.data.mode).toBe("expert-advisor")
      expect(result.data.user_expert_level).toBe("intermediate-high-level")
      expect(result.data.delegation_systems.native_task).toBe(true)
      expect(result.data.delegation_systems.delegate_task).toBe(true)
      expect(result.data.delegation_systems.background_delegation).toBe(false)
      // New execution fields
      expect(result.data.parallelization).toBe(true)
      expect(result.data.atomic_commit).toBe(true)
      expect(result.data.commit_docs).toBe(true)
      // Workflow defaults
      expect(result.data.workflow.research).toBe(true)
      expect(result.data.workflow.plan_check).toBe(true)
      expect(result.data.workflow.verifier).toBe(true)
      expect(result.data.workflow.discuss_mode).toBe("sufficient-phase-discussion")
      expect(result.data.workflow.use_worktrees).toBe(false)
    }
  })

  it("strips unknown fields (lenient)", () => {
    const result = sp(HivemindConfigsSchema, {
      conversation_language: "en",
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
    expect(sp(HivemindConfigsSchema, { conversation_language: "xx" }).success).toBe(false)
  })

  it("rejects invalid expert level", () => {
    expect(sp(HivemindConfigsSchema, { user_expert_level: "guru" }).success).toBe(false)
  })

  it("fills workflow defaults when workflow key is missing", () => {
    const result = sp(HivemindConfigsSchema, { mode: "expert-advisor" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.workflow.research).toBe(true)
      expect(result.data.workflow.discuss_mode).toBe("sufficient-phase-discussion")
    }
  })

  it("parallelization, atomic_commit, commit_docs default to true", () => {
    const result = sp(HivemindConfigsSchema, {})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.parallelization).toBe(true)
      expect(result.data.atomic_commit).toBe(true)
      expect(result.data.commit_docs).toBe(true)
    }
  })

  it("workflow boolean toggles match skeleton v2 §9.1 defaults", () => {
    const result = sp(HivemindConfigsSchema, {})
    expect(result.success).toBe(true)
    if (result.success) {
      const wf = result.data.workflow
      // true defaults
      expect(wf.research).toBe(true)
      expect(wf.plan_check).toBe(true)
      expect(wf.verifier).toBe(true)
      expect(wf.research_before_questions).toBe(true)
      // false defaults
      expect(wf.cross_session_tasks_dependencies_validation).toBe(false)
      expect(wf.trajectory_control).toBe(false)
      expect(wf.advanced_continuity_validation).toBe(false)
      expect(wf.task_plus_enabled).toBe(false)
      expect(wf.ui_phase).toBe(false)
      expect(wf.ui_safety_gate).toBe(false)
      expect(wf.ai_integration_phase).toBe(false)
      expect(wf.use_worktrees).toBe(false)
    }
  })
})

// ===========================================================================
// getDefaultConfigs
// ===========================================================================

describe("getDefaultConfigs", () => {
  it("returns expected defaults with snake_case keys", () => {
    const defaults = getDefaultConfigs()
    expect(defaults.conversation_language).toBe("en")
    expect(defaults.documents_and_artifacts_language).toBe("en")
    expect(defaults.mode).toBe("expert-advisor")
    expect(defaults.user_expert_level).toBe("intermediate-high-level")
    expect(defaults.delegation_systems).toEqual({
      native_task: true,
      delegate_task: true,
      background_delegation: false,
    })
    // New fields
    expect(defaults.parallelization).toBe(true)
    expect(defaults.atomic_commit).toBe(true)
    expect(defaults.commit_docs).toBe(true)
    expect(defaults.workflow.research).toBe(true)
    expect(defaults.workflow.discuss_mode).toBe("sufficient-phase-discussion")
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

  it("reads valid config with snake_case keys from disk", () => {
    writeFileSync(
      join(tmpDir, ".hivemind", "configs.json"),
      JSON.stringify({
        conversation_language: "vi",
        documents_and_artifacts_language: "vi",
        mode: "hivemind-powered",
        user_expert_level: "absolute-expert",
        delegation_systems: {
          native_task: true,
          delegate_task: true,
          background_delegation: true,
        },
        parallelization: false,
        atomic_commit: true,
        commit_docs: false,
        workflow: {
          research: false,
          discuss_mode: "intensive-phase-discussion",
        },
      }),
    )
    const configs = readConfigs(tmpDir)
    expect(configs.conversation_language).toBe("vi")
    expect(configs.mode).toBe("hivemind-powered")
    expect(configs.delegation_systems.background_delegation).toBe(true)
    expect(configs.parallelization).toBe(false)
    expect(configs.workflow.research).toBe(false)
    expect(configs.workflow.discuss_mode).toBe("intensive-phase-discussion")
  })

  it("reads legacy camelCase config and migrates to snake_case", () => {
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
    expect(configs.conversation_language).toBe("vi")
    expect(configs.documents_and_artifacts_language).toBe("vi")
    expect(configs.mode).toBe("hivemind-powered")
    expect(configs.user_expert_level).toBe("absolute-expert")
    expect(configs.delegation_systems.background_delegation).toBe(true)
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
        conversation_language: "ja",
        futureField: "should be stripped",
      }),
    )
    const configs = readConfigs(tmpDir)
    expect(configs.conversation_language).toBe("ja")
    expect("futureField" in configs).toBe(false)
  })

  it("existing 5-field camelCase configs.json parses correctly under expanded schema", () => {
    // This simulates the exact current production format
    writeFileSync(
      join(tmpDir, ".hivemind", "configs.json"),
      JSON.stringify({
        conversationLanguage: "en",
        documentsLanguage: "en",
        mode: "expert-advisor",
        userExpertLevel: "intermediate-high-level",
        delegationSystems: {
          native_task: true,
          delegate_task: true,
          background_delegation: false,
        },
      }),
    )
    const configs = readConfigs(tmpDir)
    expect(configs.conversation_language).toBe("en")
    expect(configs.mode).toBe("expert-advisor")
    // New fields get defaults
    expect(configs.parallelization).toBe(true)
    expect(configs.atomic_commit).toBe(true)
    expect(configs.commit_docs).toBe(true)
    expect(configs.workflow.research).toBe(true)
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

  it("writes valid config to disk with snake_case keys", () => {
    const config = getDefaultConfigs()
    config.conversation_language = "ko"
    const written = writeConfigs(tmpDir, config)
    expect(written.conversation_language).toBe("ko")

    const raw = readFileSync(join(tmpDir, ".hivemind", "configs.json"), "utf8")
    const parsed = JSON.parse(raw)
    expect(parsed.conversation_language).toBe("ko")
    // Verify no camelCase keys in output
    expect("conversationLanguage" in parsed).toBe(false)
  })

  it("creates parent directory if missing", () => {
    const config = getDefaultConfigs()
    writeConfigs(tmpDir, config)
    expect(existsSync(join(tmpDir, ".hivemind", "configs.json"))).toBe(true)
  })

  it("round-trips through read/write", () => {
    const original = getDefaultConfigs()
    original.mode = "hivemind-powered"
    original.user_expert_level = "absolute-expert"
    original.parallelization = false
    original.workflow.discuss_mode = "intensive-phase-discussion"
    writeConfigs(tmpDir, original)
    const roundTripped = readConfigs(tmpDir)
    expect(roundTripped).toEqual(original)
  })

  it("throws on invalid config", () => {
    expect(() => writeConfigs(tmpDir, { mode: "invalid" } as any)).toThrow()
  })

  it("writes expanded schema fields to disk", () => {
    const config = getDefaultConfigs()
    config.atomic_commit = false
    config.workflow.use_worktrees = true
    writeConfigs(tmpDir, config)

    const raw = readFileSync(join(tmpDir, ".hivemind", "configs.json"), "utf8")
    const parsed = JSON.parse(raw)
    expect(parsed.atomic_commit).toBe(false)
    expect(parsed.workflow.use_worktrees).toBe(true)
    expect(parsed.workflow.discuss_mode).toBe("sufficient-phase-discussion")
  })
})
