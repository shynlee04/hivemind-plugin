import { describe, it, expect, vi } from "vitest"
import { createCoreHooks } from "../../src/hooks/create-core-hooks.js"
import type { HookDependencies } from "../../src/hooks/types.js"
import type { ResolvedBehavioralProfile } from "../../src/lib/behavioral-profile/types.js"
import type { IntakeResult } from "../../src/lib/session-entry/intake-gate.js"
import { HivemindConfigsSchema } from "../../src/schema-kernel/hivemind-configs.schema.js"

function createFakeLifecycleManager() {
  return {
    handleEvent: vi.fn(),
    replayPendingNotificationsForEvent: vi.fn(),
  }
}

describe("createCoreHooks", () => {
  describe("event hook", () => {
    it("routes session.created events to lifecycle manager with correct eventType and sessionID", async () => {
      const lm = createFakeLifecycleManager()
      const hooks = createCoreHooks({ lifecycleManager: lm as never } as never)

      await hooks.event({ event: { type: "session.created", sessionID: "ses_test" } })

      expect(lm.handleEvent).toHaveBeenCalledWith({
        event: expect.objectContaining({ type: "session.created" }),
        eventType: "session.created",
        sessionID: "ses_test",
      })
      expect(lm.replayPendingNotificationsForEvent).toHaveBeenCalledWith(
        "ses_test",
        "session.created"
      )
    })

    it("routes session.updated events to lifecycle manager", async () => {
      const lm = createFakeLifecycleManager()
      const hooks = createCoreHooks({ lifecycleManager: lm as never } as never)

      await hooks.event({
        event: { type: "session.updated", sessionID: "ses_002" }
      })

      expect(lm.handleEvent).toHaveBeenCalledWith({
        event: expect.objectContaining({ type: "session.updated" }),
        eventType: "session.updated",
        sessionID: "ses_002",
      })
    })

    it("calls replayPendingNotificationsForEvent on session events", async () => {
      const lm = createFakeLifecycleManager()
      const hooks = createCoreHooks({ lifecycleManager: lm as never } as never)

      await hooks.event({ event: { type: "session.idle", sessionID: "ses_003" } })

      expect(lm.replayPendingNotificationsForEvent).toHaveBeenCalledWith(
        "ses_003",
        "session.idle"
      )
    })

    it("bails out when event has no type (handleEvent NOT called)", async () => {
      const lm = createFakeLifecycleManager()
      const hooks = createCoreHooks({ lifecycleManager: lm as never } as never)

      await hooks.event({ event: {} })

      expect(lm.handleEvent).not.toHaveBeenCalled()
      expect(lm.replayPendingNotificationsForEvent).not.toHaveBeenCalled()
    })

    it("bails out when event has no sessionID (handleEvent NOT called)", async () => {
      const lm = createFakeLifecycleManager()
      const hooks = createCoreHooks({ lifecycleManager: lm as never } as never)

      await hooks.event({ event: { type: "session.created" } })

      expect(lm.handleEvent).not.toHaveBeenCalled()
    })

    it("calls event observers when provided", async () => {
      const observer = vi.fn()
      const lm = createFakeLifecycleManager()
      const hooks = createCoreHooks({
        lifecycleManager: lm as never,
        eventObservers: [observer],
      } as never)

      await hooks.event({ event: { type: "session.created", sessionID: "ses_005" } })

      expect(observer).toHaveBeenCalledWith({
        event: { type: "session.created", sessionID: "ses_005" },
      })
    })
  })

  describe("shell.env hook", () => {
    it("injects CI=true, GIT_TERMINAL_PROMPT=0, NO_COLOR=1, TERM=dumb", async () => {
      const hooks = createCoreHooks({
        lifecycleManager: { handleEvent: vi.fn(), replayPendingNotificationsForEvent: vi.fn() } as never,
      } as never)

      const output: Record<string, unknown> = {}
      await hooks["shell.env"]({}, output)

      expect(output.env).toMatchObject({
        CI: "true",
        GIT_TERMINAL_PROMPT: "0",
        NO_COLOR: "1",
        TERM: "dumb",
      })
    })

    it("merges with existing user-set env vars (does not overwrite)", async () => {
      const hooks = createCoreHooks({
        lifecycleManager: { handleEvent: vi.fn(), replayPendingNotificationsForEvent: vi.fn() } as never,
      } as never)

      const output: Record<string, unknown> = {
        env: { NODE_ENV: "production", CI: "false" },
      }
      await hooks["shell.env"]({}, output)

      // Should overwrite CI with "true" (harness priority)
      expect((output.env as Record<string, string>).CI).toBe("true")
      // Should preserve user-set NODE_ENV
      expect((output.env as Record<string, string>).NODE_ENV).toBe("production")
    })
  })

  /**
   * Creates a type-safe fake that matches the real ResolvedBehavioralProfile
   * interface exactly. All union values are valid members of their respective
   * types (DecisionSpeed, DiscussMode, etc.).
   *
   * @returns Authentic ResolvedBehavioralProfile matching types.ts contract
   */
  function createFakeBehavioralProfile(): ResolvedBehavioralProfile {
    return {
      mode: "hivemind-powered",
      behavioralProfile: {
        guardrailLevel: "strict",
        delegationMode: "waiter",
        toolAccessPattern: "restricted",
        skillFilter: "curated",
      },
      language: {
        conversation: "en",
        documents: "en",
      },
      userExpertLevel: "architecture-driven",
      discussMode: "sufficient-phase-discussion",
      runtimeProfile: {
        communicationStyle: "concise",
        decisionSpeed: "fast",
        expertise: "senior",
        matchConfidence: 0.8,
      },
      merged: {
        communicationStyle: "concise",
        decisionSpeed: "fast",
        expertise: "senior",
      },
    }
  }

  /**
   * Creates a type-safe fake IntakeResult matching intake-gate.ts contract.
   *
   * @returns Authentic IntakeResult with valid ClassificationResult, LanguageDetection, ProfileMatch
   */
  function createFakeIntake(): IntakeResult {
    return {
      purpose: { purpose: "implementation", confidence: 0.9, alternatives: [] },
      language: { language: "en", script: "latin", confidence: 1 },
      routingTarget: "gsd-executor",
      profile: {
        communicationStyle: "concise",
        decisionSpeed: "fast",
        expertise: "mid",
        matchConfidence: 0.45,
      },
      warnings: [],
    }
  }

  describe("behavioral profile injection", () => {

    it("injects behavioral fields into system.transform when getBehavioralProfile is provided", async () => {
      const profile = createFakeBehavioralProfile()
      const deps: Pick<HookDependencies, "lifecycleManager" | "getIntake" | "getBehavioralProfile"> = {
        lifecycleManager: createFakeLifecycleManager() as HookDependencies["lifecycleManager"],
        getIntake: () => createFakeIntake(),
        getBehavioralProfile: () => profile,
      }
      const hooks = createCoreHooks(deps as HookDependencies)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_bp_test" }, output)

      const system = output.system as string[]
      expect(system).toBeDefined()
      expect(system.length).toBeGreaterThanOrEqual(2)
      const behavioralBlock = system.find((s) => s.includes("Behavioral profile context:"))
      expect(behavioralBlock).toBeDefined()
      expect(behavioralBlock).toContain("behavioral.guardrailLevel: strict")
      expect(behavioralBlock).toContain("behavioral.delegationMode: waiter")
      expect(behavioralBlock).toContain("behavioral.toolAccessPattern: restricted")
      expect(behavioralBlock).toContain("behavioral.skillFilter: curated")
      expect(behavioralBlock).toContain("language.conversation: en")
      expect(behavioralBlock).toContain("language.documents: en")
      expect(behavioralBlock).toContain("runtime.communicationStyle: concise")
      expect(behavioralBlock).toContain("runtime.decisionSpeed: fast")
      expect(behavioralBlock).toContain("runtime.expertise: senior")
      expect(behavioralBlock).toContain("discuss.mode: sufficient-phase-discussion")
    })

    it("system.transform works without getBehavioralProfile (backward compat)", async () => {
      const deps: Pick<HookDependencies, "lifecycleManager" | "getIntake"> = {
        lifecycleManager: createFakeLifecycleManager() as HookDependencies["lifecycleManager"],
        getIntake: () => createFakeIntake(),
      }
      const hooks = createCoreHooks(deps as HookDependencies)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_no_bp" }, output)

      const system = output.system as string[]
      expect(system).toBeDefined()
      // Should have intake but NOT behavioral
      expect(system.some((s) => s.includes("Session intake context:"))).toBe(true)
      expect(system.some((s) => s.includes("Behavioral profile context:"))).toBe(false)
    })

    it("behavioral injection comes AFTER intake injection", async () => {
      const profile = createFakeBehavioralProfile()
      const deps: Pick<HookDependencies, "lifecycleManager" | "getIntake" | "getBehavioralProfile"> = {
        lifecycleManager: createFakeLifecycleManager() as HookDependencies["lifecycleManager"],
        getIntake: () => createFakeIntake(),
        getBehavioralProfile: () => profile,
      }
      const hooks = createCoreHooks(deps as HookDependencies)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_order_test" }, output)

      const system = output.system as string[]
      const intakeIdx = system.findIndex((s) => s.includes("Session intake context:"))
      const behavioralIdx = system.findIndex((s) => s.includes("Behavioral profile context:"))
      expect(intakeIdx).toBeLessThan(behavioralIdx)
    })

    it("behavioral injection works independently when intake is unavailable", async () => {
      const profile = createFakeBehavioralProfile()
      const deps: Pick<HookDependencies, "lifecycleManager" | "getIntake" | "getBehavioralProfile"> = {
        lifecycleManager: createFakeLifecycleManager() as HookDependencies["lifecycleManager"],
        getIntake: () => undefined,
        getBehavioralProfile: () => profile,
      }
      const hooks = createCoreHooks(deps as HookDependencies)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_bp_only" }, output)

      // Intake returns undefined, so no intake context — but behavioral SHOULD still inject
      const system = output.system as string[]
      expect(system).toBeDefined()
      expect(system.some((s) => s.includes("Behavioral profile context:"))).toBe(true)
      expect(system.some((s) => s.includes("Session intake context:"))).toBe(false)
    })

    // -----------------------------------------------------------------------
    // Feature Evaluation: Language Injection (D-04, D-05, REQ-CA02-02)
    //
    // The harness serves multilingual projects. A user with
    // conversation_language: "vi" and documents_language: "en" MUST see
    // those values rendered in the system.transform output that agents read.
    // -----------------------------------------------------------------------

    it("injects non-English language codes (vi/en) matching real user config", async () => {
      const profile: ResolvedBehavioralProfile = {
        ...createFakeBehavioralProfile(),
        language: { conversation: "vi", documents: "en" },
      }
      const deps: Pick<HookDependencies, "lifecycleManager" | "getIntake" | "getBehavioralProfile"> = {
        lifecycleManager: createFakeLifecycleManager() as HookDependencies["lifecycleManager"],
        getIntake: () => createFakeIntake(),
        getBehavioralProfile: () => profile,
      }
      const hooks = createCoreHooks(deps as HookDependencies)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_lang_vi" }, output)

      const system = output.system as string[]
      const behavioralBlock = system.find((s) => s.includes("Behavioral profile context:"))
      expect(behavioralBlock).toContain("language.conversation: vi")
      expect(behavioralBlock).toContain("language.documents: en")
    })

    it("injects CJK language codes (ja/zh) through system.transform", async () => {
      const profile: ResolvedBehavioralProfile = {
        ...createFakeBehavioralProfile(),
        language: { conversation: "ja", documents: "zh" },
      }
      const deps: Pick<HookDependencies, "lifecycleManager" | "getIntake" | "getBehavioralProfile"> = {
        lifecycleManager: createFakeLifecycleManager() as HookDependencies["lifecycleManager"],
        getIntake: () => createFakeIntake(),
        getBehavioralProfile: () => profile,
      }
      const hooks = createCoreHooks(deps as HookDependencies)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_lang_ja" }, output)

      const system = output.system as string[]
      const behavioralBlock = system.find((s) => s.includes("Behavioral profile context:"))
      expect(behavioralBlock).toContain("language.conversation: ja")
      expect(behavioralBlock).toContain("language.documents: zh")
    })

    it("injects Thai/Korean language codes (th/ko)", async () => {
      const profile: ResolvedBehavioralProfile = {
        ...createFakeBehavioralProfile(),
        language: { conversation: "th", documents: "ko" },
      }
      const deps: Pick<HookDependencies, "lifecycleManager" | "getIntake" | "getBehavioralProfile"> = {
        lifecycleManager: createFakeLifecycleManager() as HookDependencies["lifecycleManager"],
        getIntake: () => createFakeIntake(),
        getBehavioralProfile: () => profile,
      }
      const hooks = createCoreHooks(deps as HookDependencies)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_lang_th" }, output)

      const system = output.system as string[]
      const behavioralBlock = system.find((s) => s.includes("Behavioral profile context:"))
      expect(behavioralBlock).toContain("language.conversation: th")
      expect(behavioralBlock).toContain("language.documents: ko")
    })

    // -----------------------------------------------------------------------
    // Feature Evaluation: Multi-Mode Behavioral Profiles (D-01, D-02, REQ-CA02-01)
    //
    // Each mode produces different guardrailLevel, delegationMode, etc.
    // Agents MUST see the correct values for their session's active mode.
    // -----------------------------------------------------------------------

    it("injects expert-advisor mode profile (moderate/waiter/full/all)", async () => {
      const profile: ResolvedBehavioralProfile = {
        mode: "expert-advisor",
        behavioralProfile: {
          guardrailLevel: "moderate",
          delegationMode: "waiter",
          toolAccessPattern: "full",
          skillFilter: "all",
        },
        language: { conversation: "en", documents: "en" },
        userExpertLevel: "intermediate-high-level",
        discussMode: "sufficient-phase-discussion",
        runtimeProfile: {
          communicationStyle: "mixed",
          decisionSpeed: "fast",
          expertise: "mid",
          matchConfidence: 0.5,
        },
        merged: {
          communicationStyle: "mixed",
          decisionSpeed: "fast",
          expertise: "mid",
        },
      }
      const deps: Pick<HookDependencies, "lifecycleManager" | "getIntake" | "getBehavioralProfile"> = {
        lifecycleManager: createFakeLifecycleManager() as HookDependencies["lifecycleManager"],
        getIntake: () => createFakeIntake(),
        getBehavioralProfile: () => profile,
      }
      const hooks = createCoreHooks(deps as HookDependencies)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_expert" }, output)

      const system = output.system as string[]
      const behavioralBlock = system.find((s) => s.includes("Behavioral profile context:"))
      expect(behavioralBlock).toContain("behavioral.guardrailLevel: moderate")
      expect(behavioralBlock).toContain("behavioral.delegationMode: waiter")
      expect(behavioralBlock).toContain("behavioral.toolAccessPattern: full")
      expect(behavioralBlock).toContain("behavioral.skillFilter: all")
      expect(behavioralBlock).toContain("runtime.expertise: mid")
    })

    it("injects free-style mode profile (minimal/disabled/full/all)", async () => {
      const profile: ResolvedBehavioralProfile = {
        mode: "free-style",
        behavioralProfile: {
          guardrailLevel: "minimal",
          delegationMode: "disabled",
          toolAccessPattern: "full",
          skillFilter: "all",
        },
        language: { conversation: "en", documents: "en" },
        userExpertLevel: "clumsy-vibecoder",
        discussMode: "skip-phase-discussion",
        runtimeProfile: {
          communicationStyle: "detailed",
          decisionSpeed: "deliberate",
          expertise: "junior",
          matchConfidence: 0.3,
        },
        merged: {
          communicationStyle: "detailed",
          decisionSpeed: "deliberate",
          expertise: "junior",
        },
      }
      const deps: Pick<HookDependencies, "lifecycleManager" | "getIntake" | "getBehavioralProfile"> = {
        lifecycleManager: createFakeLifecycleManager() as HookDependencies["lifecycleManager"],
        getIntake: () => createFakeIntake(),
        getBehavioralProfile: () => profile,
      }
      const hooks = createCoreHooks(deps as HookDependencies)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_freestyle" }, output)

      const system = output.system as string[]
      const behavioralBlock = system.find((s) => s.includes("Behavioral profile context:"))
      expect(behavioralBlock).toContain("behavioral.guardrailLevel: minimal")
      expect(behavioralBlock).toContain("behavioral.delegationMode: disabled")
      expect(behavioralBlock).toContain("behavioral.toolAccessPattern: full")
      expect(behavioralBlock).toContain("behavioral.skillFilter: all")
      expect(behavioralBlock).toContain("runtime.expertise: junior")
      expect(behavioralBlock).toContain("discuss.mode: skip-phase-discussion")
    })

    // -----------------------------------------------------------------------
    // Feature Evaluation: DiscussMode Signal (D-13, D-14, REQ-CA02-09)
    //
    // All three discuss modes must be visible to agents for workflow routing.
    // -----------------------------------------------------------------------

    it("injects intensive-phase-discussion mode", async () => {
      const profile: ResolvedBehavioralProfile = {
        ...createFakeBehavioralProfile(),
        discussMode: "intensive-phase-discussion",
      }
      const deps: Pick<HookDependencies, "lifecycleManager" | "getIntake" | "getBehavioralProfile"> = {
        lifecycleManager: createFakeLifecycleManager() as HookDependencies["lifecycleManager"],
        getIntake: () => createFakeIntake(),
        getBehavioralProfile: () => profile,
      }
      const hooks = createCoreHooks(deps as HookDependencies)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_discuss_intensive" }, output)

      const system = output.system as string[]
      const behavioralBlock = system.find((s) => s.includes("Behavioral profile context:"))
      expect(behavioralBlock).toContain("discuss.mode: intensive-phase-discussion")
    })

    it("injects skip-phase-discussion mode", async () => {
      const profile: ResolvedBehavioralProfile = {
        ...createFakeBehavioralProfile(),
        discussMode: "skip-phase-discussion",
      }
      const deps: Pick<HookDependencies, "lifecycleManager" | "getIntake" | "getBehavioralProfile"> = {
        lifecycleManager: createFakeLifecycleManager() as HookDependencies["lifecycleManager"],
        getIntake: () => createFakeIntake(),
        getBehavioralProfile: () => profile,
      }
      const hooks = createCoreHooks(deps as HookDependencies)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_discuss_skip" }, output)

      const system = output.system as string[]
      const behavioralBlock = system.find((s) => s.includes("Behavioral profile context:"))
      expect(behavioralBlock).toContain("discuss.mode: skip-phase-discussion")
    })

    // -----------------------------------------------------------------------
    // Feature Evaluation: Real-Life Config Scenario (CA-01→CA-02 Integration)
    //
    // This test mirrors the ACTUAL .hivemind/configs.json values:
    //   conversation_language: "vi", documents_language: "en",
    //   mode: "expert-advisor", user_expert_level: "intermediate-high-level",
    //   discuss_mode: "sufficient-phase-discussion"
    //
    // It validates the complete CA-01 schema → CA-02 profile → system.transform
    // pipeline as a real user would experience it.
    // -----------------------------------------------------------------------

    it("renders complete profile matching real configs.json (vi/en, expert-advisor, intermediate)", async () => {
      const profile: ResolvedBehavioralProfile = {
        mode: "expert-advisor",
        behavioralProfile: {
          guardrailLevel: "moderate",
          delegationMode: "waiter",
          toolAccessPattern: "full",
          skillFilter: "all",
        },
        language: { conversation: "vi", documents: "en" },
        userExpertLevel: "intermediate-high-level",
        discussMode: "sufficient-phase-discussion",
        runtimeProfile: {
          communicationStyle: "mixed",
          decisionSpeed: "fast",
          expertise: "mid",
          matchConfidence: 0.5,
        },
        merged: {
          communicationStyle: "mixed",
          decisionSpeed: "fast",
          expertise: "mid",
        },
      }
      const deps: Pick<HookDependencies, "lifecycleManager" | "getIntake" | "getBehavioralProfile"> = {
        lifecycleManager: createFakeLifecycleManager() as HookDependencies["lifecycleManager"],
        getIntake: () => createFakeIntake(),
        getBehavioralProfile: () => profile,
      }
      const hooks = createCoreHooks(deps as HookDependencies)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_reallife" }, output)

      const system = output.system as string[]
      expect(system).toBeDefined()

      // Intake block present
      expect(system.some((s) => s.includes("Session intake context:"))).toBe(true)
      // Behavioral block present
      const behavioralBlock = system.find((s) => s.includes("Behavioral profile context:"))
      expect(behavioralBlock).toBeDefined()

      // Verify ALL 10 behavioral context lines match real config
      expect(behavioralBlock).toContain("behavioral.guardrailLevel: moderate")
      expect(behavioralBlock).toContain("behavioral.delegationMode: waiter")
      expect(behavioralBlock).toContain("behavioral.toolAccessPattern: full")
      expect(behavioralBlock).toContain("behavioral.skillFilter: all")
      expect(behavioralBlock).toContain("language.conversation: vi")
      expect(behavioralBlock).toContain("language.documents: en")
      expect(behavioralBlock).toContain("runtime.communicationStyle: mixed")
      expect(behavioralBlock).toContain("runtime.decisionSpeed: fast")
      expect(behavioralBlock).toContain("runtime.expertise: mid")
      expect(behavioralBlock).toContain("discuss.mode: sufficient-phase-discussion")
    })
  })

  // -----------------------------------------------------------------------
  // Governance Block Injection (CA-03-01: D-05, D-06, D-07)
  //
  // Governance block is injected at position 0 of system array BEFORE
  // intake and behavioral blocks. Format matches D-06 hybrid instruction+fields.
  // -----------------------------------------------------------------------

  describe("governance block injection", () => {
    function createHivemindConfig(overrides?: Record<string, unknown>) {
      return HivemindConfigsSchema.parse({
        mode: "expert-advisor",
        user_expert_level: "intermediate-high-level",
        conversation_language: "vi",
        documents_and_artifacts_language: "en",
        ...overrides,
      })
    }

    function buildDepsWithConfig(
      hivemindConfig?: ReturnType<typeof HivemindConfigsSchema.parse>,
    ): Partial<HookDependencies> {
      return {
        lifecycleManager: createFakeLifecycleManager() as HookDependencies["lifecycleManager"],
        getIntake: () => createFakeIntake(),
        getBehavioralProfile: () => createFakeBehavioralProfile(),
        hivemindConfig,
      }
    }

    it("Test 1: governance block appears as first system array element before intake and behavioral blocks", async () => {
      const hivemindConfig = createHivemindConfig()
      const deps = buildDepsWithConfig(hivemindConfig)
      const hooks = createCoreHooks(deps as HookDependencies)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_gov_order" }, output)

      const system = output.system as string[]
      expect(system.length).toBeGreaterThanOrEqual(3)

      // Governance at position 0
      expect(system[0]).toContain("--- Governance ---")

      // Intake after governance
      const intakeIdx = system.findIndex((s) => s.includes("Session intake context:"))
      expect(intakeIdx).toBeGreaterThan(0)

      // Behavioral after intake
      const behavioralIdx = system.findIndex((s) => s.includes("Behavioral profile context:"))
      expect(behavioralIdx).toBeGreaterThan(intakeIdx)
    })

    it("Test 2: governance block format matches D-06 — header, instruction line, field:value line", async () => {
      const hivemindConfig = createHivemindConfig()
      const deps = buildDepsWithConfig(hivemindConfig)
      const hooks = createCoreHooks(deps as HookDependencies)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_gov_format" }, output)

      const system = output.system as string[]
      const governanceBlock = system.find((s) => s.startsWith("--- Governance ---"))
      expect(governanceBlock).toBeDefined()

      const lines = governanceBlock!.split("\n")
      expect(lines[0]).toBe("--- Governance ---")
      // Instruction line should contain mode, expertise, and language directives
      expect(lines[1]).toContain("You are operating in")
      expect(lines[1]).toContain("Communicate at")
      expect(lines[1]).toContain("Use ")
      // Field:value context line
      expect(lines[2]).toContain("communicationStyle:")
      expect(lines[2]).toContain("|")
      expect(lines[2]).toContain("decisionSpeed:")
      expect(lines[2]).toContain("expertise:")
    })

    it("Test 3: governance block has correct mode instruction for expert-advisor", async () => {
      const hivemindConfig = createHivemindConfig({ mode: "expert-advisor" })
      const deps = buildDepsWithConfig(hivemindConfig)
      const hooks = createCoreHooks(deps as HookDependencies)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_gov_mode" }, output)

      const system = output.system as string[]
      const governanceBlock = system.find((s) => s.startsWith("--- Governance ---"))
      expect(governanceBlock).toContain("You are operating in expert-advisor mode.")
    })

    it("Test 4: governance block has correct expertise instruction for intermediate-high-level", async () => {
      const hivemindConfig = createHivemindConfig({ user_expert_level: "intermediate-high-level" })
      const deps = buildDepsWithConfig(hivemindConfig)
      const hooks = createCoreHooks(deps as HookDependencies)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_gov_expertise" }, output)

      const system = output.system as string[]
      const governanceBlock = system.find((s) => s.startsWith("--- Governance ---"))
      expect(governanceBlock).toContain("Communicate at intermediate-high level.")
    })

    it("Test 5: governance block has correct language instruction for vi/en config", async () => {
      const hivemindConfig = createHivemindConfig({
        conversation_language: "vi",
        documents_and_artifacts_language: "en",
      })
      const deps = buildDepsWithConfig(hivemindConfig)
      const hooks = createCoreHooks(deps as HookDependencies)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_gov_lang" }, output)

      const system = output.system as string[]
      const governanceBlock = system.find((s) => s.startsWith("--- Governance ---"))
      expect(governanceBlock).toContain("Use vi for all conversation and en for all documents.")
    })

    it("Test 6: governance block includes field:value context from behavioral profile", async () => {
      const hivemindConfig = createHivemindConfig()
      // Use a profile with explicit merged values for testing
      const deps: Partial<HookDependencies> = {
        lifecycleManager: createFakeLifecycleManager() as HookDependencies["lifecycleManager"],
        getIntake: () => createFakeIntake(),
        getBehavioralProfile: () => ({
          ...createFakeBehavioralProfile(),
          merged: {
            communicationStyle: "detailed",
            decisionSpeed: "deliberate",
            expertise: "intermediate-high",
          },
        }),
        hivemindConfig,
      }
      const hooks = createCoreHooks(deps as HookDependencies)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_gov_fields" }, output)

      const system = output.system as string[]
      const governanceBlock = system.find((s) => s.startsWith("--- Governance ---"))
      expect(governanceBlock).toContain("communicationStyle: detailed")
      expect(governanceBlock).toContain("decisionSpeed: deliberate")
      expect(governanceBlock).toContain("expertise: intermediate-high")
    })

    it("Test 7: system.transform with no hivemindConfig (undefined) — governance block NOT injected", async () => {
      const deps: Pick<HookDependencies, "lifecycleManager" | "getIntake" | "getBehavioralProfile"> = {
        lifecycleManager: createFakeLifecycleManager() as HookDependencies["lifecycleManager"],
        getIntake: () => createFakeIntake(),
        getBehavioralProfile: () => createFakeBehavioralProfile(),
        // hivemindConfig NOT provided — undefined
      }
      const hooks = createCoreHooks(deps as HookDependencies)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_no_config" }, output)

      const system = output.system as string[]
      // Should NOT contain governance block
      expect(system.every((s) => !s.startsWith("--- Governance ---"))).toBe(true)
      // But intake and behavioral should still work
      expect(system.some((s) => s.includes("Session intake context:"))).toBe(true)
      expect(system.some((s) => s.includes("Behavioral profile context:"))).toBe(true)
    })

    it("Test 8: system.transform with no sessionID returns early before any injection", async () => {
      const hivemindConfig = createHivemindConfig()
      const deps = buildDepsWithConfig(hivemindConfig)
      const hooks = createCoreHooks(deps as HookDependencies)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({}, output) // No sessionID

      const system = output.system
      // system should NOT have been changed from its initial state (undefined/not set)
      expect(system).toBeUndefined()
    })

    it("Test 9: existing intake injection still works (regression)", async () => {
      const hivemindConfig = createHivemindConfig()
      const deps = buildDepsWithConfig(hivemindConfig)
      const hooks = createCoreHooks(deps as HookDependencies)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_gov_intake_reg" }, output)

      const system = output.system as string[]
      expect(system.some((s) => s.includes("Session intake context:"))).toBe(true)
    })

    it("Test 10: existing behavioral profile injection still works (regression)", async () => {
      const hivemindConfig = createHivemindConfig()
      const deps = buildDepsWithConfig(hivemindConfig)
      const hooks = createCoreHooks(deps as HookDependencies)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_gov_bp_reg" }, output)

      const system = output.system as string[]
      const behavioralBlock = system.find((s) => s.includes("Behavioral profile context:"))
      expect(behavioralBlock).toBeDefined()
      expect(behavioralBlock).toContain("behavioral.guardrailLevel: strict")
      expect(behavioralBlock).toContain("behavioral.delegationMode: waiter")
      expect(behavioralBlock).toContain("runtime.communicationStyle: concise")
      expect(behavioralBlock).toContain("runtime.expertise: senior")
    })

    it("Test 11: output.system has 3 elements — governance, intake, behavioral", async () => {
      const hivemindConfig = createHivemindConfig()
      const deps = buildDepsWithConfig(hivemindConfig)
      const hooks = createCoreHooks(deps as HookDependencies)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_gov_3elems" }, output)

      const system = output.system as string[]
      expect(system.length).toBe(3)
      expect(system[0]).toContain("--- Governance ---")
      expect(system[1]).toContain("Session intake context:")
      expect(system[2]).toContain("Behavioral profile context:")
    })

    it("Test 12: output.system has 2 elements when intake is not available — governance, behavioral", async () => {
      const hivemindConfig = createHivemindConfig()
      const deps: Partial<HookDependencies> = {
        lifecycleManager: createFakeLifecycleManager() as HookDependencies["lifecycleManager"],
        getIntake: () => undefined, // No intake available
        getBehavioralProfile: () => createFakeBehavioralProfile(),
        hivemindConfig,
      }
      const hooks = createCoreHooks(deps as HookDependencies)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_gov_2elems" }, output)

      const system = output.system as string[]
      expect(system.length).toBe(2)
      expect(system[0]).toContain("--- Governance ---")
      expect(system[1]).toContain("Behavioral profile context:")
      // No intake
      expect(system.every((s) => !s.includes("Session intake context:"))).toBe(true)
    })
  })
})
