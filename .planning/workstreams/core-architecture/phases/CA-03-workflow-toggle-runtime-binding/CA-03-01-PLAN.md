---
phase: CA-03-workflow-toggle-runtime-binding
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/hooks/governance-block.ts
  - src/hooks/toggle-gates.ts
  - src/hooks/create-core-hooks.ts
  - tests/hooks/create-core-hooks.test.ts
  - tests/hooks/governance-block.test.ts
  - tests/hooks/toggle-gates.test.ts
autonomous: true
requirements: [CA-03-01, CA-03-02]
tags: [governance, toggles, hooks, TDD]

must_haves:
  truths:
    - "Governance block appears at the top of every system prompt as imperative instructions"
    - "Governance block format matches D-06: hybrid instruction+fields with mode/expertise/language directives"
    - "Every workflow toggle value is accessible via deps.hivemindConfig.workflow.<toggle> from hook factories"
    - "system.transform injects governance block before intake/behavioral blocks (position 0)"
    - "Toggle gate helpers provide isToggleEnabled() and getDiscussMode() functions"
  artifacts:
    - path: "src/hooks/governance-block.ts"
      provides: "Governance block builder function"
      exports: ["buildGovernanceBlock"]
      min_lines: 50
    - path: "src/hooks/toggle-gates.ts"
      provides: "Toggle gate helper functions"
      exports: ["isToggleEnabled", "getDiscussMode"]
      min_lines: 30
    - path: "src/hooks/create-core-hooks.ts"
      provides: "Modified system.transform with governance block injection"
      contains: "buildGovernanceBlock"
  key_links:
    - from: "src/hooks/create-core-hooks.ts"
      to: "src/hooks/governance-block.ts"
      via: "import { buildGovernanceBlock }"
      pattern: "import.*buildGovernanceBlock"
    - from: "src/hooks/create-core-hooks.ts"
      to: "deps.hivemindConfig"
      via: "governance block reads config fields"
      pattern: "deps\\.hivemindConfig"
    - from: "governance block"
      to: "system prompt"
      via: "system.transform pushes governance block at position 0"
      pattern: "--- Governance ---"
---

<objective>
Wire the structured governance block and workflow toggle infrastructure into the core hook system.

Purpose: Bridge CA-01 (config schema + subscriber) and CA-02 (behavioral profile resolution) by making governance fields and workflow toggles observable in runtime agent behavior via the system.transform hook.

Output:
- `src/hooks/governance-block.ts` — Pure function that builds the hybrid instruction+fields governance block string per D-05/D-06/D-07
- `src/hooks/toggle-gates.ts` — Helper functions for reading toggle state from hivemind config
- Modified `src/hooks/create-core-hooks.ts` — system.transform injects governance block before intake/behavioral blocks
- Test files with governance block format validation and toggle gate behavior verification
</objective>

<execution_context>
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/workstreams/core-architecture/phases/CA-03-workflow-toggle-runtime-binding/CA-03-CONTEXT.md (D-05 through D-13)
@.planning/workstreams/core-architecture/phases/CA-03-workflow-toggle-runtime-binding/CA-03-RESEARCH.md (Patterns 1 and 2)

<interfaces>
<!-- Key types and contracts the executor needs. Extracted from codebase. -->

From src/hooks/types.ts:
```typescript
export interface HookDependencies {
  lifecycleManager: HarnessLifecycleManager
  hivemindConfig?: HivemindConfigs
  getBehavioralProfile?: (sessionId: string) => ResolvedBehavioralProfile
  getIntake?: (sessionId: string) => IntakeResult | undefined
  // ... other fields
}
```

From src/schema-kernel/hivemind-configs.schema.ts:
```typescript
export type HivemindConfigs = z.infer<typeof HivemindConfigsSchema>
// Fields: mode, user_expert_level, conversation_language, documents_and_artifacts_language,
//   parallelization, atomic_commit, commit_docs, workflow: WorkflowConfig
export type WorkflowConfig = z.infer<typeof WorkflowConfigSchema>
// Fields: research, plan_check, verifier, discuss_mode, use_worktrees,
//   research_before_questions, ... (13 toggles total)
export type DiscussMode = "sufficient-phase-discussion" | "intensive-phase-discussion" | "skip-phase-discussion"
```

From src/hooks/create-core-hooks.ts (existing system.transform pattern at lines 68-124):
```typescript
export interface CoreHooks {
  "system.transform": (input: SystemInput, output: SystemOutput) => Promise<void>
}
// Existing pattern: output.system is array, push strings, intake block first, behavioral block second
```

From tests/hooks/create-core-hooks.test.ts (existing test helpers):
```typescript
// createFakeLifecycleManager() returns { handleEvent: vi.fn(), replayPendingNotificationsForEvent: vi.fn() }
// createFakeBehavioralProfile() returns a ResolvedBehavioralProfile with mode: "expert-advisor"
// Tests construct deps as: Pick<HookDependencies, "lifecycleManager" | "getIntake" | "getBehavioralProfile">
// Then cast: createCoreHooks(deps as HookDependencies)
// NO mocks used for config objects — authentic HivemindConfigs objects constructed with HivemindConfigsSchema.parse({...})
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Build governance block builder (TDD)</name>
  <files>src/hooks/governance-block.ts, tests/hooks/governance-block.test.ts</files>
  <read_first>
    - src/hooks/governance-block.ts (does not exist — pattern: create new file following kebab-case naming)
    - src/hooks/create-core-hooks.ts (lines 100-124 — existing behavioral profile injection to understand output array pattern)
    - src/schema-kernel/hivemind-configs.schema.ts (lines 50-103 — HivemindModeSchema, UserExpertLevelSchema enums for field values)
    - src/hooks/types.ts (lines 37-38 — hivemindConfig type on HookDependencies)
    - .planning/workstreams/core-architecture/phases/CA-03-workflow-toggle-runtime-binding/CA-03-CONTEXT.md (D-05, D-06, D-07 — governance block format specification)
    - tests/hooks/create-core-hooks.test.ts (lines 1-80 — existing test patterns, imports, fake factory functions)
  </read_first>
  <behavior>
    - Test 1: buildGovernanceBlock with mode=expert-advisor, expertise=intermediate-high-level, language=en → returns string containing "You are operating in expert-advisor mode." and "Communicate at intermediate-high level." and "Use en for all conversation and documents."
    - Test 2: buildGovernanceBlock with mode=hivemind-powered → returns string containing "strict guardrails"
    - Test 3: buildGovernanceBlock with mode=free-style → returns string containing "free-style mode"
    - Test 4: buildGovernanceBlock with all expertise levels (clumsy-vibecoder, beginner-friendly, intermediate-high-level, architecture-driven, absolute-expert) → each produces the correct instruction text
    - Test 5: buildGovernanceBlock with different languages (vi for conversation, en for documents) → returns "Use vi for all conversation and en for all documents."
    - Test 6: buildGovernanceBlock output starts with "--- Governance ---" and ends with field:value lines (communicationStyle:, decisionSpeed:, expertise:)
    - Test 7: buildGovernanceBlock with undefined behavioralProfile → still returns governance block but skips field:value lines (only mode/expertise/language instructions)
    - Test 8: buildGovernanceBlock output is a single string (not an array), with line breaks as \n
  </behavior>
  <action>
    Create `src/hooks/governance-block.ts` with a single exported function:

    ```typescript
    export function buildGovernanceBlock(
      config: HivemindConfigs,
      profile?: ResolvedBehavioralProfile | undefined
    ): string
    ```

    The function produces the hybrid instruction+fields format per D-06:

    ```
    --- Governance ---
    You are operating in {mode-description} mode. Communicate at {expertise-description} level. Use {conversation_lang} for all conversation and {documents_lang} for all documents.
    communicationStyle: {style} | decisionSpeed: {speed} | expertise: {level}
    ```

    **Mode instruction mapping** (from config.mode, mandatory):
    - `"expert-advisor"` → `"You are operating in expert-advisor mode."`
    - `"hivemind-powered"` → `"You are operating in hivemind-powered mode with strict guardrails."`
    - `"free-style"` → `"You are operating in free-style mode."`

    **Expertise instruction mapping** (from config.user_expert_level, mandatory):
    - `"clumsy-vibecoder"` → `"Communicate at beginner level with detailed explanations."`
    - `"beginner-friendly"` → `"Communicate at beginner-friendly level."`
    - `"intermediate-high-level"` → `"Communicate at intermediate-high level."`
    - `"architecture-driven"` → `"Communicate at architecture-driven level."`
    - `"absolute-expert"` → `"Communicate at absolute expert level — skip basics."`

    **Language instruction** (from config.conversation_language + config.documents_and_artifacts_language, mandatory):
    - Template: `"Use {conversation_language} for all conversation and {documents_and_artifacts_language} for all documents."`

    **Field:value lines** (from profile.merged, optional — only when profile is provided):
    - Template: `"{key}: {value}"` joined by `" | "`
    - Fields in order: `communicationStyle`, `decisionSpeed`, `expertise`

    **Output format:** Single string with `\n` line breaks between the header line, instruction line, and field:value line.

    **Write tests FIRST** (tdd="true"): Create `tests/hooks/governance-block.test.ts` with all 8 behavior tests above. Use `HivemindConfigsSchema.parse({...})` to construct authentic config objects (no mocks — per D-20). Run `npx vitest run tests/hooks/governance-block.test.ts` — RED (tests fail). Then implement `buildGovernanceBlock()` — GREEN (tests pass).

    Import types:
    - `import type { HivemindConfigs } from "../schema-kernel/hivemind-configs.schema.js"`
    - `import type { ResolvedBehavioralProfile } from "../lib/behavioral-profile/types.js"`
  </action>
  <verify>
    <automated>npx vitest run tests/hooks/governance-block.test.ts</automated>
  </verify>
  <acceptance_criteria>
    - `src/hooks/governance-block.ts` exists and exports `buildGovernanceBlock`
    - `tests/hooks/governance-block.test.ts` exists with 8 tests, all passing
    - `grep -c "export function buildGovernanceBlock" src/hooks/governance-block.ts` returns `1`
    - `grep -c "--- Governance ---" src/hooks/governance-block.ts` returns `1`
    - `grep -c "expert-advisor" src/hooks/governance-block.ts` returns at least `1`
    - `grep -c "hivemind-powered" src/hooks/governance-block.ts` returns at least `1`
    - `grep -c "free-style" src/hooks/governance-block.ts` returns at least `1`
    - `grep -c "communicationStyle" src/hooks/governance-block.ts` returns at least `1`
    - `npm run typecheck` exits 0
  </acceptance_criteria>
  <done>Governance block builder function passes all 8 tests — produces correct hybrid instruction+fields format for all mode/expertise/language combinations</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Build toggle gate helpers (TDD)</name>
  <files>src/hooks/toggle-gates.ts, tests/hooks/toggle-gates.test.ts</files>
  <read_first>
    - src/hooks/toggle-gates.ts (does not exist — pattern: create new file)
    - src/schema-kernel/hivemind-configs.schema.ts (lines 110-155 — WorkflowConfigInnerSchema with all 13 toggle fields and their defaults)
    - src/hooks/types.ts (lines 37-38 — hivemindConfig type definition)
    - tests/hooks/create-core-hooks.test.ts (lines 1-80 — import patterns, vitest globals usage)
  </read_first>
  <behavior>
    - Test 1: isToggleEnabled returns true when config is defined and toggle field is true
    - Test 2: isToggleEnabled returns false when config is defined and toggle field is false
    - Test 3: isToggleEnabled returns the Zod default value when config is undefined (uses getDefaultConfigs() as fallback)
    - Test 4: isToggleEnabled handles all 6 wired toggles: "research", "plan_check", "verifier", "discuss_mode", "use_worktrees", "research_before_questions"
    - Test 5: getDiscussMode returns the discuss_mode enum value from config
    - Test 6: getDiscussMode returns "sufficient-phase-discussion" (Zod default) when config is undefined
    - Test 7: isToggleEnabled for a boolean toggle with the value `false` returns `false`
    - Test 8: isToggleEnabled for use_worktrees (defaults to false) correctly distinguishes from toggles that default to true
  </behavior>
  <action>
    Create `src/hooks/toggle-gates.ts` with two exported functions:

    ```typescript
    import { getDefaultConfigs } from "../schema-kernel/hivemind-configs.schema.js"
    import type { HivemindConfigs, DiscussMode } from "../schema-kernel/hivemind-configs.schema.js"

    type BooleanToggle = "research" | "plan_check" | "verifier" | "use_worktrees" | "research_before_questions"

    export function isToggleEnabled(config: HivemindConfigs | undefined, toggle: BooleanToggle): boolean

    export function getDiscussMode(config: HivemindConfigs | undefined): DiscussMode
    ```

    **isToggleEnabled implementation:**
    1. Resolve config: use `config ?? getDefaultConfigs()`
    2. Read `config.workflow[toggle]` — this is always a boolean (Zod defaults ensure it)
    3. Return the boolean value

    **getDiscussMode implementation:**
    1. Resolve config: use `config ?? getDefaultConfigs()`
    2. Read `config.workflow.discuss_mode` — returns DiscussMode enum string
    3. Return the value

    **Note:** `discuss_mode` is NOT included in `BooleanToggle` — it is an enum, not a boolean toggle. It gets its own dedicated accessor function `getDiscussMode()`.

    **Write tests FIRST** (tdd="true"): Create `tests/hooks/toggle-gates.test.ts` with all 8 behavior tests above. Use `HivemindConfigsSchema.parse({...})` to construct config objects with explicit toggle overrides. Run `npx vitest run tests/hooks/toggle-gates.test.ts` — RED (tests fail). Then implement the functions — GREEN (tests pass).
  </action>
  <verify>
    <automated>npx vitest run tests/hooks/toggle-gates.test.ts</automated>
  </verify>
  <acceptance_criteria>
    - `src/hooks/toggle-gates.ts` exists and exports `isToggleEnabled`, `getDiscussMode`
    - `tests/hooks/toggle-gates.test.ts` exists with 8 tests, all passing
    - `grep -c "export function isToggleEnabled" src/hooks/toggle-gates.ts` returns `1`
    - `grep -c "export function getDiscussMode" src/hooks/toggle-gates.ts` returns `1`
    - `grep -c "getDefaultConfigs" src/hooks/toggle-gates.ts` returns at least `1`
    - `npm run typecheck` exits 0
  </acceptance_criteria>
  <done>Toggle gate helpers pass all 8 tests — isToggleEnabled correctly reads boolean toggles with fallback, getDiscussMode correctly reads discuss mode enum</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Wire governance block + toggle context into system.transform (TDD)</name>
  <files>src/hooks/create-core-hooks.ts, tests/hooks/create-core-hooks.test.ts</files>
  <read_first>
    - src/hooks/create-core-hooks.ts (full file, 157 LOC — understand current system.transform at lines 68-124 and the behavioral profile injection pattern)
    - src/hooks/governance-block.ts (created in Task 1 — understand buildGovernanceBlock signature)
    - src/hooks/toggle-gates.ts (created in Task 2 — understand isToggleEnabled, getDiscussMode signatures)
    - src/hooks/types.ts (full file, 45 LOC — HookDependencies interface)
    - tests/hooks/create-core-hooks.test.ts (full file, 548 LOC — understand existing test patterns: fake factories, profile construction, system.transform test setup pattern at lines 360-546)
    - src/schema-kernel/hivemind-configs.schema.ts (HivemindConfigsSchema — needed to construct valid config objects for tests)
  </read_first>
  <behavior>
    - Test 1: system.transform with hivemindConfig and behavioralProfile → governance block appears as first system array element before "Session intake context:" and "Behavioral profile context:"
    - Test 2: Governance block format matches D-06: starts with "--- Governance ---" header, followed by instruction line, followed by field:value line
    - Test 3: Governance block has correct mode instruction: "You are operating in expert-advisor mode." when config mode is "expert-advisor"
    - Test 4: Governance block has correct expertise instruction: "Communicate at intermediate-high level." when config user_expert_level is "intermediate-high-level"
    - Test 5: Governance block has correct language instruction: "Use vi for all conversation and en for all documents." when config uses vi/en
    - Test 6: Governance block includes field:value context: "communicationStyle: detailed | decisionSpeed: deliberate | expertise: intermediate-high"
    - Test 7: system.transform with no hivemindConfig (undefined) → governance block is NOT injected (no crash, graceful no-op)
    - Test 8: system.transform with no sessionID → returns early before any injection
    - Test 9: Existing intake injection still works correctly (regression: intake block appears after governance block)
    - Test 10: Existing behavioral profile injection still works correctly (regression: behavioral block still appears with all 10 context lines)
    - Test 11: system.transform output.system is an array with 3 elements: [governance block, intake block, behavioral block]
    - Test 12: system.transform output.system is an array with 2 elements when intake is not available: [governance block, behavioral block]
  </behavior>
  <action>
    Modify `src/hooks/create-core-hooks.ts` to integrate governance block injection into `system.transform`:

    **Step 1: Add imports** at top of file:
    ```typescript
    import { buildGovernanceBlock } from "./governance-block.js"
    ```

    **Step 2: Modify system.transform handler** (current lines 68-124):

    After the early return check for sessionID (line 73) and array initialization (line 76), inject the governance block BEFORE the intake context block:

    ```typescript
    "system.transform": async (input, output) => {
      const sessionID = asString(getNestedValue(input, ["sessionID"]))
      if (!sessionID) return

      output.system = Array.isArray(output.system) ? output.system : []

      // CA-03: Governance block — always active, non-negotiable (D-07)
      // Injected BEFORE intake and behavioral blocks so it frames all other context.
      if (deps.hivemindConfig) {
        const profile = deps.getBehavioralProfile?.(sessionID)
        const governanceBlock = buildGovernanceBlock(deps.hivemindConfig, profile ?? undefined)
        ;(output.system as string[]).push(governanceBlock)
      }

      // Existing: Intake context injection (unchanged, lines 78-98)
      if (deps.getIntake) {
        // ... keep existing intake logic exactly as-is ...
      }

      // Existing: Behavioral profile injection (unchanged, lines 100-124)
      if (deps.getBehavioralProfile) {
        // ... keep existing behavioral logic exactly as-is ...
      }
    }
    ```

    **IMPORTANT:** The governance block push goes at position 0 of the system array (before intake push). This is per RESEARCH.md Pitfall 1: "Governance block should be injected BEFORE intake and behavioral blocks." The existing code pushes intake first at line 96, then behavioral at line 122. The governance push goes BEFORE the intake `if` block — insert it between lines 76 and 78.

    **Step 3: Do NOT modify** the intake injection block (lines 78-98) or the behavioral profile injection block (lines 100-124). These remain exactly as-is.

    **Write tests FIRST** (tdd="true"): Add 12 governance block tests to `tests/hooks/create-core-hooks.test.ts`. Follow existing patterns:
    - Use `createFakeLifecycleManager()` for lifecycle manager
    - Use `createFakeBehavioralProfile()` for behavioral profile
    - Use `createFakeIntake()` for intake (already exists)
    - Construct authentic `HivemindConfigs` using `HivemindConfigsSchema.parse({...})` with field overrides
    - Pass `hivemindConfig` in the deps object alongside `getBehavioralProfile` and `getIntake`
    - Use the existing pattern: `const deps = { lifecycleManager, getIntake, getBehavioralProfile, hivemindConfig }` cast as `HookDependencies`

    **Test setup pattern for governance tests:**
    ```typescript
    import { HivemindConfigsSchema } from "../../src/schema-kernel/hivemind-configs.schema.js"

    const hivemindConfig = HivemindConfigsSchema.parse({
      mode: "expert-advisor",
      user_expert_level: "intermediate-high-level",
      conversation_language: "vi",
      documents_and_artifacts_language: "en",
    })

    const deps = {
      lifecycleManager: createFakeLifecycleManager(),
      getIntake: () => createFakeIntake(),
      getBehavioralProfile: () => createFakeBehavioralProfile(),
      hivemindConfig,
    }
    const hooks = createCoreHooks(deps as HookDependencies)
    const output: Record<string, unknown> = {}
    await hooks["system.transform"]({ sessionID: "ses_test" }, output)
    const system = output.system as string[]
    ```

    Run `npx vitest run tests/hooks/create-core-hooks.test.ts` — RED (new tests fail). Implement governance injection — GREEN (all tests pass including existing ones).

    **Regression guard:** After implementation, run `npm test` to ensure all 1690+ existing tests still pass (2 pre-existing session-journal failures are expected and acceptable).
  </action>
  <verify>
    <automated>npx vitest run tests/hooks/create-core-hooks.test.ts</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "buildGovernanceBlock" src/hooks/create-core-hooks.ts` returns at least `1`
    - `grep -c "--- Governance ---" tests/hooks/create-core-hooks.test.ts` returns at least `1` (governance block format test)
    - All existing 1690+ tests still pass (no regressions — 2 pre-existing session-journal failures acceptable)
    - `npm run typecheck` exits 0
    - `npm test` exits 0 (full suite green minus pre-existing failures)
  </acceptance_criteria>
  <done>Governance block injected at position 0 of system prompt via system.transform — 12 new tests pass, all existing behavioral/intake tests still pass with no regressions</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| config.json → system prompt | Config values cross from filesystem into agent prompt context |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-CA03-01 | Tampering | governance-block builder | mitigate | Always read mode/expertise/language from Zod-parsed `deps.hivemindConfig` — never from raw JSON. Zod `.default()` ensures valid values even with missing config. |
| T-CA03-02 | Tampering | toggle-gates helper | mitigate | `isToggleEnabled()` falls back to `getDefaultConfigs()` when config is undefined — no raw JSON reads. Single source of truth: config-subscriber cache + Zod schema defaults. |
| T-CA03-03 | Information Disclosure | governance block in system prompt | accept | Governance block is injected into system prompt context visible only to the current agent session. Contains behavioral metadata (mode, expertise, language), not secrets or PII. No exfiltration risk beyond the session. |
| T-CA03-04 | Tampering | upstream hook manipulation of governance block | accept | Governance block is pushed at position 0 by system.transform. Upstream hooks can only append additional system messages, not remove or modify existing ones. OpenCode hook ordering is deterministic. |
</threat_model>

<verification>
1. `npm run typecheck` — 0 errors
2. `npx vitest run tests/hooks/governance-block.test.ts tests/hooks/toggle-gates.test.ts tests/hooks/create-core-hooks.test.ts` — all pass
3. `npm test` — full suite passes (1690+ tests, 2 pre-existing session-journal failures acceptable)
4. Manual grep verification: governance block output format matches D-06 specification exactly
</verification>

<success_criteria>
- Governance block injected into every system prompt via system.transform hook
- Governance block format matches D-06: "--- Governance ---" header, instruction line, field:value context line
- Governance block positioned BEFORE intake and behavioral blocks in system array
- `buildGovernanceBlock()` produces correct output for all 3 modes, 5 expertise levels, and language combinations
- `isToggleEnabled()` correctly reads boolean toggle state with Zod default fallback
- `getDiscussMode()` correctly reads discuss mode enum with default fallback
- All existing behavioral profile and intake injection tests still pass (no regressions)
- No new dependencies, no schema changes, no architectural departures
</success_criteria>

<output>
After completion, create `.planning/workstreams/core-architecture/phases/CA-03-workflow-toggle-runtime-binding/CA-03-01-SUMMARY.md`
</output>
