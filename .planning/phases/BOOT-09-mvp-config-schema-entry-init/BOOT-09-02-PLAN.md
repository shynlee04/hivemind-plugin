---
phase: BOOT-09
plan: 02
type: execute
wave: 2
depends_on:
  - BOOT-09-01
files_modified:
  - src/hooks/lifecycle/core-hooks.ts
  - src/plugin.ts
autonomous: true
requirements:
  - REQ-01
  - REQ-02
user_setup: []

must_haves:
  truths:
    - "system.transform injects Language Governance block at output.system[0] for main sessions"
    - "system.transform skips language injection for child/delegated sessions"
    - "Language block uses --- Language Governance --- header with CRITICAL: prefix and MUST imperative"
    - "Language block includes override: 'even if the user writes in another language, you MUST override'"
    - "Changing conversation_language in config changes the injected instruction text"
    - "Documents language instruction is combined in the same Language Governance block"
    - "All existing governance block, intake, and behavioral profile injections remain unchanged"
    - "isMainSession observer is registered in plugin.ts eventObservers"
    - "hivemindConfig is passed to createToolGuardHooks"
  artifacts:
    - path: "src/hooks/lifecycle/core-hooks.ts"
      provides: "Language governance block injection in system.transform handler"
      pattern: "output.system.*unshift|Language Governance"
    - path: "src/plugin.ts"
      provides: "isMainSession observer wiring + hivemindConfig to tool guard"
      contains: "createSessionIsMainObserver"
  key_links:
    - from: "core-hooks.ts"
      to: "HookDependencies.isMainSession"
      via: "deps.isMainSession"
      pattern: "deps\\.isMainSession"
    - from: "plugin.ts"
      to: "event-observers.ts"
      via: "createSessionIsMainObserver"
      pattern: "createSessionIsMainObserver"
---

<objective>
Inject the Language Governance block into the `system.transform` hook output at position 0 for main sessions, and wire all BOOT-09 dependencies in `plugin.ts`.

**Purpose:** Language fields (`conversation_language`, `documents_and_artifacts_language`) produce enforced behavior — not decorative metadata — via system prompt injection with strong framing.
**Output:** Modified `system.transform` handler + plugin wiring + tests.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@/Users/apple/hivemind-plugin-private/.planning/phases/BOOT-09-mvp-config-schema-entry-init/BOOT-09-SPEC.md
@/Users/apple/hivemind-plugin-private/.planning/phases/BOOT-09-mvp-config-schema-entry-init/BOOT-09-CONTEXT.md
@/Users/apple/hivemind-plugin-private/.planning/phases/BOOT-09-mvp-config-schema-entry-init/BOOT-09-RESEARCH.md

<interfaces>
<!-- Key types and patterns the executor needs -->

From `src/hooks/lifecycle/core-hooks.ts:23-24`:
```typescript
type SystemInput = { sessionID?: string }
type SystemOutput = { system?: unknown }
```

From `src/hooks/lifecycle/core-hooks.ts:69-134` — Current `system.transform` handler (full):
```typescript
"system.transform": async (input, output): Promise<void> => {
  const sessionID = asString(getNestedValue(input, ["sessionID"]))
  if (!sessionID) return
  output.system = Array.isArray(output.system) ? output.system : []
  // Governance block push at line 81-85
  if (deps.hivemindConfig) {
    const profile = deps.getBehavioralProfile?.(sessionID)
    const governanceBlock = buildGovernanceBlock(deps.hivemindConfig, profile ?? undefined)
    ;(output.system as string[]).push(governanceBlock)
  }
  // ... intake + profile injections ...
}
```

From `src/plugin.ts:112-114` — Existing deps wiring:
```typescript
const sessionEntryObserverFactory = createSessionEntryEventObserver()
const deps = { client, lifecycleManager, stateManager: taskState, runAutoLoop, runRalphLoop, escalationMessage, getIntake: sessionEntryObserverFactory.getIntake, hivemindConfig, getBehavioralProfile: (sessionId: string) => resolveBehavioralProfile(sessionId, projectDirectory) }
```

From `src/plugin.ts:168` — Tool guard hook instantiation:
```typescript
const toolGuardHooks = createToolGuardHooks({ stateManager: taskState, lifecycleManager, runtimePolicy })
```

From `src/plugin.ts:171-174` — Core hooks + eventObservers:
```typescript
...createCoreHooks({
  ...deps,
  eventObservers: [consumeDelegationFact, sessionEventObserver, consumeJourneyFact, consumeSessionTrackerFact, consumeSessionEntryFact],
}),
```

From `src/hooks/guards/tool-guard-hooks.ts:26-29` — Current ToolGuardDependencies:
```typescript
export interface ToolGuardDependencies {
  stateManager: TaskStateManager
  lifecycleManager?: HarnessLifecycleManager
  runtimePolicy?: RuntimePolicy
}
```

From `src/schema-kernel/hivemind-configs.schema.ts:265-268` — Language fields:
```typescript
conversation_language: SupportedLanguageSchema.default("en"),
documents_and_artifacts_language: SupportedLanguageSchema.default("en"),
document_paths: z.array(z.string()).default([".hivemind/planning/"]),  // added in Plan 01
```

From `tests/hooks/create-core-hooks.test.ts` — Test pattern (lines 1-7):
```typescript
import { describe, it, expect, vi } from "vitest"
import { createCoreHooks } from "../../src/hooks/lifecycle/core-hooks.js"
import type { HookDependencies } from "../../src/hooks/types.js"
import type { ResolvedBehavioralProfile } from "../../src/routing/behavioral-profile/types.js"
import type { IntakeResult } from "../../src/routing/session-entry/intake-gate.js"
import { HivemindConfigsSchema } from "../../src/schema-kernel/hivemind-configs.schema.js"
```

The factory mock pattern at test line 8-13:
```typescript
function createFakeLifecycleManager() {
  return { handleEvent: vi.fn(), replayPendingNotificationsForEvent: vi.fn() }
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Inject Language Governance block in core-hooks.ts system.transform</name>
  <files>src/hooks/lifecycle/core-hooks.ts</files>
  <read_first>src/hooks/lifecycle/core-hooks.ts (full file, 166 lines)</read_first>
  <action>
    Add a language governance block builder and injection logic in the `system.transform` handler (between line 77 and the governance block push at line 81).

    1. **Add an import** for `HookDependencies.isMainSession` — the type is already in `src/hooks/types.ts`; no new import needed since `deps` is already typed as `HookDependencies`.

    2. **Before the existing governance block push** (line 81), inject at position 0:
    ```typescript
    // BOOT-09: Language Governance block (position 0 — BEFORE governance block)
    // Per D-05: language block injected at output.system[0] before governance block.
    // Per D-06: governance block format is LOCKED — do NOT modify buildGovernanceBlock().
    // Per D-07: strong framing with header, CRITICAL:, MUST imperative, override.
    if (deps.isMainSession?.(sessionID) && deps.hivemindConfig) {
      const convLang = deps.hivemindConfig.conversation_language
      const docLang = deps.hivemindConfig.documents_and_artifacts_language
      const docPaths = deps.hivemindConfig.document_paths?.join(", ") ?? ".hivemind/planning/"

      if (convLang) {
        const lines = [
          "--- Language Governance ---",
          `CRITICAL: You MUST respond in ${convLang}.`,
          `Even if the user writes in another language, you MUST override and respond in ${convLang}.`,
          "",
          `When writing .md files under configured document paths (e.g., ${docPaths}), you MUST write in ${docLang}.`,
        ]
        ;(output.system as string[]).unshift(lines.join("\n"))
      }
    }
    ```

    3. **Do NOT modify** the existing governance block push at lines 81-85 — the governance block format is LOCKED per D-06.

    4. After injection:
       - Position 0: Language Governance block (new)
       - Position 1: Governance block (existing, shifted)
       - Position 2: Intake context (existing, shifted)
       - Position 3: Behavioral profile (existing, shifted)

    Per D-05: injected at `output.system[0]` BEFORE governance block.
    Per D-07: header "--- Language Governance ---", "CRITICAL:" prefix, "MUST respond in [lang]", override: "Even if the user writes in another language..."
    Per D-11 Layer 1: documents language instruction is combined in the same block.
    Per REQ-02: override behavior is explicit.
    Per REQ-01: ONLY injected for main sessions (checked via `deps.isMainSession?.(sessionID)`).
    Per SPEC.md: ALL existing governance block, intake, and behavioral profile injections remain unchanged.

    **Add tests** in `tests/hooks/create-core-hooks.test.ts`:
    - Test language governance block is injected at `output.system[0]` for main sessions (pass `isMainSession: () => true`)
    - Test language governance block is NOT injected for child sessions (pass `isMainSession: () => false`)
    - Test block contains "--- Language Governance ---" header
    - Test block contains "CRITICAL:" prefix
    - Test block contains "MUST respond in"
    - Test block contains "Even if the user writes in another language"
    - Test block contains document language instruction referencing paths
    - Test changing `conversation_language` from "en" to "vi" changes the text
    - Test existing governance block, intake, and behavioral profile injections are still present at [1], [2], [3]
    - Test that when no `hivemindConfig` is provided, no language block is injected
    - Test that when `isMainSession` is undefined (not provided), no language block is injected (defensive)
  </action>
  <verify>
    <automated>npx vitest run tests/hooks/create-core-hooks.test.ts -t "Language"</automated>
  </verify>
  <acceptance_criteria>
    1. `output.system[0]` contains "--- Language Governance ---" for main sessions per D-05
    2. `output.system[0]` contains "CRITICAL:" prefix per D-07
    3. `output.system[0]` contains "MUST respond in {language}" per D-07
    4. `output.system[0]` contains "Even if the user writes in another language" per REQ-02
    5. `output.system[0]` contains document language instruction with paths per D-11 Layer 1
    6. `output.system` length = expected injections count (4: lang + governance + intake + profile)
    7. Changing config from `conversation_language: "en"` to `"vi"` changes the injected text per REQ-01
    8. Child sessions get NO language block — `output.system` still has governance + intake + profile at 0/1/2
    9. `buildGovernanceBlock()` is NOT modified — governance block content unchanged per D-06
    10. All existing tests pass
  </acceptance_criteria>
</task>

<task type="auto">
  <name>Task 2: Wire isMainSession observer and tool guard config in plugin.ts</name>
  <files>src/plugin.ts</files>
  <read_first>src/plugin.ts (full file, 271 lines)</read_first>
  <action>
    Make three changes in `src/plugin.ts`:

    **Change 1 — Import `createSessionIsMainObserver`** (line 16):
    Add `createSessionIsMainObserver` to the existing import from `event-observers.ts`:
    ```typescript
    import { createDelegationEventObserver, createSessionEntryEventObserver, createSessionJourneyEventObserver, createSessionIsMainObserver } from "./hooks/observers/event-observers.js"
    ```

    **Change 2 — Create the observer factory and wire into deps** (after line 112, before line 114):
    ```typescript
    const sessionIsMainObserverFactory = createSessionIsMainObserver()
    ```
    Then add `isMainSession` to the `deps` object at line 114:
    ```typescript
    isMainSession: sessionIsMainObserverFactory.isMainSession,
    ```

    **Change 3 — Register the observer** in the `eventObservers` array at line 173:
    Add `consumeIsMainSessionFact` handler and include it in the array:
    ```typescript
    const consumeIsMainSessionFact = async ({ event }: { event?: unknown }) => {
      try {
        await sessionIsMainObserverFactory.observer({ event })
      } catch {
        // Best-effort isMainSession caching: never block canonical event handling.
      }
    }
    ```
    And in line 173, add `consumeIsMainSessionFact` to the array:
    ```typescript
    eventObservers: [consumeDelegationFact, sessionEventObserver, consumeJourneyFact, consumeSessionTrackerFact, consumeSessionEntryFact, consumeIsMainSessionFact],
    ```

    **Change 4 — Pass `hivemindConfig` to tool guard hooks** (line 168):
    ```typescript
    const toolGuardHooks = createToolGuardHooks({ stateManager: taskState, lifecycleManager, runtimePolicy, hivemindConfig })
    ```
    Note: The `ToolGuardDependencies` interface will have `hivemindConfig` added in Plan 03. TypeScript will error on this change until Plan 03 applies its changes. This is expected — Plan 03 is a co-requisite in Wave 2 and will resolve the type error. Both plans run, then typecheck verifies.

    Per D-04: `isMainSession` is injected via HookDependencies (matches `getBehavioralProfile` pattern).
    Per D-02: cache populated from `session.created` event (via the observer registered in eventObservers).
    Per SPEC.md constraint #5: No new hook registration — both hooks are already registered.
    Per SPEC.md constraint #6: Must NOT inject language instructions into child/delegated sessions.
  </action>
  <verify>
    <automated>npm run typecheck</automated>
  </verify>
  <acceptance_criteria>
    1. `createSessionIsMainObserver` is imported from `event-observers.js`
    2. `sessionIsMainObserverFactory` is created from `createSessionIsMainObserver()`
    3. `isMainSession` is in the `deps` object with value `sessionIsMainObserverFactory.isMainSession`
    4. `consumeIsMainSessionFact` observer calls `sessionIsMainObserverFactory.observer({ event })` in try/catch
    5. `consumeIsMainSessionFact` is in the `eventObservers` array
    6. `hivemindConfig` is passed to `createToolGuardHooks({ stateManager, lifecycleManager, runtimePolicy, hivemindConfig })`
    7. Typecheck passes (Plan 03 must be applied first for the ToolGuardDependencies interface change)
  </acceptance_criteria>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| system.transform hook → output.system | Injected string array — no privileged execution vector |
| plugin.ts → hook factories | Typed dependency injection — no runtime reflection |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-BOOT09-03 | T (Tampering) | Language block format | mitigate | Block follows locked format per D-07 — no user-controlled string injection risk; language values come from schema-validated config |
| T-BOOT09-04 | S (Spoofing) | isMainSession cache | accept | Cache populated from SDK-native `parentID` field which is set by OpenCode runtime — not user-controllable |
</threat_model>

<verification>
1. `npx vitest run tests/hooks/create-core-hooks.test.ts` — all language governance tests pass
2. `npm run typecheck` passes (may require Plan 03 to be applied first for hivemindConfig in ToolGuardDependencies)
3. `npx vitest run` — no regressions in existing hook or governance-block tests
</verification>

<success_criteria>
- Language Governance block injected at `output.system[0]` for main sessions per D-05
- Block format follows D-07: header, CRITICAL:, MUST, override
- Block combines conversation language + document language + paths per D-11 Layer 1
- Child sessions skip language injection entirely
- Existing governance block at [1] is untouched per D-06
- `isMainSession` observer registered and wired via HookDependencies per D-04
- `hivemindConfig` passed to tool guard hooks (resolves dependency chain for Plan 03)
- All existing tests pass without regression
</success_criteria>

<output>
After completion, create `.planning/phases/BOOT-09-mvp-config-schema-entry-init/BOOT-09-02-SUMMARY.md`
</output>
