---
phase: HER-2
plan: 03
type: execute
wave: 3
depends_on: [HER-2-02]
files_modified:
  - src/plugin.ts
  - src/hooks/create-core-hooks.ts
  - src/hooks/create-session-hooks.ts
  - src/lib/session-entry/
  - src/lib/prompt-packet/
autonomous: true
requirements: [HER-2-E, HER-2-F]

must_haves:
  truths:
    - "session-entry/ is wired as event observer on session.created"
    - "session-entry/ injects routing context via system.transform hook"
    - "prompt-packet/ compaction-preservation is wired into compaction hook"
    - "npm run typecheck passes with 0 errors"
    - "npm test passes (no new failures)"
    - "npm run build succeeds"
  artifacts:
    - path: "src/plugin.ts"
      provides: "session-entry observer registered in eventObservers"
      contains: "sessionEntryObserver"
    - path: "src/hooks/create-core-hooks.ts"
      provides: "system.transform hook with intake injection"
    - path: "src/hooks/create-session-hooks.ts"
      provides: "compaction hook preserving intake result"
  key_links:
    - from: "src/plugin.ts"
      to: "src/lib/session-entry/intake-gate.ts"
      via: "event observer"
      pattern: "sessionEntryObserver"
    - from: "src/hooks/create-core-hooks.ts"
      to: "src/lib/session-entry/intake-gate.ts"
      via: "system.transform hook"
      pattern: "resolveIntake"
    - from: "src/hooks/create-session-hooks.ts"
      to: "src/lib/prompt-packet/compaction-preservation.ts"
      via: "compaction hook"
      pattern: "toCompactionPacket"
---

<objective>
Wire session-entry/ as hooks (event observer + system.transform injection) and prompt-packet/ compaction-preservation into the compaction hook.

Purpose: Enable session intake routing (purpose classification, language detection, profile resolution) and compaction context preservation. These are the highest-value dead code modules — they fill the empty system.transform stub and enhance the compaction hook.
Output: session-entry/ wired as event observer + system.transform, prompt-packet/ wired into compaction hook.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/workstreams/harness-ecosystem-recovery/ROADMAP.md
@.planning/workstreams/harness-ecosystem-recovery/phases/HER-2-dead-code-cleanup/HER-2-CONTEXT.md

# Key source files
@src/plugin.ts
@src/hooks/create-core-hooks.ts
@src/hooks/create-session-hooks.ts
@src/hooks/plugin-event-observers.ts
@src/lib/session-entry/intake-gate.ts
@src/lib/session-entry/index.ts
@src/lib/prompt-packet/compaction-preservation.ts
@src/lib/prompt-packet/kernel-packet.ts
@src/lib/prompt-packet/index.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create session-entry event observer (D-10, D-11)</name>
  <files>
    src/hooks/plugin-event-observers.ts
    src/plugin.ts
  </files>
  <read_first>
    - src/hooks/plugin-event-observers.ts (full file — understand observer pattern)
    - src/lib/session-entry/intake-gate.ts (understand resolveIntake API)
    - src/lib/session-entry/index.ts (understand barrel exports)
    - src/plugin.ts (full file — understand eventObservers array)
  </read_first>
  <action>
Create a session-entry event observer that calls `resolveIntake()` on `session.created` events and stores the result in memory.

**D-10:** Wire as hooks (event observer), NOT tools
**D-11:** Event observer on `session.created` → `resolveIntake()` → store IntakeResult in memory

Steps:

1. **Add observer to `src/hooks/plugin-event-observers.ts`:**

   Add a new observer factory following the existing `createDelegationEventObserver` pattern:

   ```typescript
   import type { IntakeResult } from "../lib/session-entry/intake-gate.js"
   import { resolveIntake } from "../lib/session-entry/intake-gate.js"

   export type SessionEntryEventFact =
     | { kind: "session-created"; sessionId: string; intake: IntakeResult }
     | { kind: "ignored" }

   export function createSessionEntryEventObserver(): {
     observer: (input: { event?: unknown }) => Promise<SessionEntryEventFact>
     getIntake: (sessionId: string) => IntakeResult | undefined
   } {
     const intakeCache = new Map<string, IntakeResult>()

     const observer = async ({ event }: { event?: unknown }): Promise<SessionEntryEventFact> => {
       const eventType = asString(getNestedValue(event, ["type"]))
       const sessionId = getEventSessionID(event)

       if (eventType !== "session.created" || !sessionId) {
         return { kind: "ignored" }
       }

       // Extract initial user message for purpose classification
       const messages = getNestedValue(event, ["messages"]) as Array<{ role: string; content: string }> | undefined
       const userMessage = messages?.find(m => m.role === "user")?.content ?? ""

       const intake = resolveIntake(userMessage)
       intakeCache.set(sessionId, intake)

       return { kind: "session-created", sessionId, intake }
     }

     return { observer, getIntake: (sessionId: string) => intakeCache.get(sessionId) }
   }
   ```

2. **Register in `src/plugin.ts`:**

   Add import:
   ```typescript
   import { createSessionEntryEventObserver } from "./hooks/plugin-event-observers.js"
   ```

   Create observer instance (near line 77):
   ```typescript
   const { observer: sessionEntryObserver, getIntake } = createSessionEntryEventObserver()
   ```

   Add to eventObservers array (line 104):
   ```typescript
   eventObservers: [consumeDelegationFact, sessionEventObserver, consumeJourneyFact, sessionEntryObserver],
   ```

3. Run typecheck: `npm run typecheck`
4. Run build: `npm run build`
  </action>
  <verify>
    <automated>grep -c "sessionEntryObserver\|createSessionEntryEventObserver" src/plugin.ts src/hooks/plugin-event-observers.ts && npm run typecheck 2>&1 | tail -3</automated>
  </verify>
  <acceptance_criteria>
    - `src/hooks/plugin-event-observers.ts` exports `createSessionEntryEventObserver`
    - `src/plugin.ts` imports and registers `sessionEntryObserver` in `eventObservers` array
    - Observer calls `resolveIntake()` on `session.created` events
    - Observer stores IntakeResult in a Map keyed by sessionId
    - `npm run typecheck` exits 0
    - `npm run build` exits 0
  </acceptance_criteria>
  <done>session-entry event observer created and registered in plugin.ts</done>
</task>

<task type="auto">
  <name>Task 2: Wire system.transform hook with intake injection (D-12, D-14)</name>
  <files>src/hooks/create-core-hooks.ts</files>
  <read_first>
    - src/hooks/create-core-hooks.ts (full file — understand system.transform stub at lines 68-74)
    - src/hooks/types.ts (understand HookDependencies interface)
    - src/lib/session-entry/intake-gate.ts (understand IntakeResult structure)
  </read_first>
  <action>
Wire the system.transform hook to inject routing context (purpose class, language, profile) into the agent prompt.

**D-12:** System.transform hook injects routing context (purpose class, language, profile) into agent prompt
**D-14:** Fills the empty `system.transform` stub at `create-core-hooks.ts:68-74`

Steps:

1. **Update `src/hooks/types.ts`** to add `getIntake` to HookDependencies:
   ```typescript
   import type { IntakeResult } from "../lib/session-entry/intake-gate.js"

   export interface HookDependencies {
     // ... existing fields ...
     getIntake?: (sessionId: string) => IntakeResult | undefined
   }
   ```

2. **Update `src/hooks/create-core-hooks.ts`** system.transform hook:

   Replace the empty stub (lines 68-74) with:
   ```typescript
   "system.transform": async (
     input: SystemInput,
     output: SystemOutput,
   ): Promise<void> => {
     const sessionID = asString(getNestedValue(input, ["sessionID"]))
     if (!sessionID || !deps.getIntake) return

     const intake = deps.getIntake(sessionID)
     if (!intake) return

     const contextLines = [
       "Session intake context:",
       `- purpose: ${intake.purpose.purpose} (confidence: ${intake.purpose.confidence})`,
       `- language: ${intake.language.language}`,
       `- routing_target: ${intake.routingTarget}`,
     ]

     if (intake.profile.communicationStyle) {
       contextLines.push(`- communication_style: ${intake.profile.communicationStyle}`)
     }
     if (intake.warnings.length > 0) {
       contextLines.push(`- warnings: ${intake.warnings.join("; ")}`)
     }

     // Inject as system context
     output.system = Array.isArray(output.system) ? output.system : []
     ;(output.system as string[]).push(contextLines.join("\n"))
   },
   ```

3. **Pass `getIntake` through deps in plugin.ts:**

   Update the deps bundle to include `getIntake`:
   ```typescript
   const deps = {
     client,
     lifecycleManager,
     stateManager: taskState,
     runAutoLoop,
     runRalphLoop,
     escalationMessage,
     getIntake,
   }
   ```

4. Run typecheck: `npm run typecheck`
5. Run build: `npm run build`
6. Run tests: `npm test`
  </action>
  <verify>
    <automated>grep -c "resolveIntake\|getIntake\|system.transform" src/hooks/create-core-hooks.ts && npm run typecheck 2>&1 | tail -3</automated>
  </verify>
  <acceptance_criteria>
    - `src/hooks/create-core-hooks.ts` system.transform hook is NOT empty — it calls `deps.getIntake()`
    - `src/hooks/types.ts` HookDependencies includes `getIntake` field
    - `src/plugin.ts` passes `getIntake` in deps bundle
    - `npm run typecheck` exits 0
    - `npm run build` exits 0
  </acceptance_criteria>
  <done>system.transform hook wired with intake injection</done>
</task>

<task type="auto">
  <name>Task 3: Wire prompt-packet compaction-preservation into compaction hook (D-13)</name>
  <files>src/hooks/create-session-hooks.ts</files>
  <read_first>
    - src/hooks/create-session-hooks.ts (lines 220-285 — compaction hook)
    - src/lib/prompt-packet/compaction-preservation.ts (understand toCompactionPacket API)
    - src/lib/prompt-packet/kernel-packet.ts (understand KernelPacket structure)
    - src/lib/prompt-packet/index.ts (understand barrel exports)
    - src/lib/session-entry/intake-gate.ts (understand IntakeResult for extras)
  </read_first>
  <action>
Wire prompt-packet/compaction-preservation.ts into the compaction hook to preserve intake results across context window compaction.

**D-13:** Compaction hook preserves intake result across context window compaction

Steps:

1. **Add import to `src/hooks/create-session-hooks.ts`:**
   ```typescript
   import { toCompactionPacket, type CompactionExtras } from "../lib/prompt-packet/compaction-preservation.js"
   ```

2. **Add `getIntake` to the deps used by createSessionHooks:**
   The `getIntake` function is already available through `deps.getIntake` (added in Task 2).

3. **Enhance the compaction hook** (after the continuity snapshot section, around line 282):

   Add intake preservation after the continuity snapshot:
   ```typescript
   // Preserve intake result across compaction
   if (deps.getIntake) {
     const intake = deps.getIntake(sessionID)
     if (intake) {
       const extras: CompactionExtras = {
         todo_authority: continuity?.metadata?.todoAuthority ?? null,
         return_contract: continuity?.metadata?.returnContract ?? null,
       }

       // Build a minimal kernel packet from intake + continuity
       const kernelPacket = {
         packet_version: "1.0.0",
         session_id: sessionID,
         parent_session_id: continuity?.parentSessionID ?? null,
         root_session_id: continuity?.rootSessionID ?? null,
         title: continuity?.metadata?.title ?? "unknown",
         description: continuity?.metadata?.description ?? "",
         purpose_category: intake.purpose.purpose,
         agent_type: continuity?.metadata?.agentType ?? null,
         model: continuity?.metadata?.model ?? null,
         constraints: continuity?.metadata?.constraints ?? [],
         session_status: continuity?.metadata?.status ?? "unknown",
         lifecycle_phase: lifecycle?.phase ?? "unknown",
         delegation_depth: continuity?.metadata?.delegationDepth ?? 0,
         queue_key: continuity?.metadata?.queueKey ?? null,
         run_mode: lifecycle?.runMode ?? null,
       }

       const compactionPacket = toCompactionPacket(kernelPacket as any, extras)
       ;(output.context as string[]).push(
         "Intake compaction preservation:\n" + JSON.stringify(compactionPacket, null, 2)
       )
     }
   }
   ```

4. Run typecheck: `npm run typecheck`
5. Run build: `npm run build`
6. Run tests: `npm test`
  </action>
  <verify>
    <automated>grep -c "toCompactionPacket\|compaction-preservation" src/hooks/create-session-hooks.ts && npm run typecheck 2>&1 | tail -3</automated>
  </verify>
  <acceptance_criteria>
    - `src/hooks/create-session-hooks.ts` imports from `prompt-packet/compaction-preservation.js`
    - Compaction hook calls `toCompactionPacket()` when intake is available
    - Compaction output includes intake preservation data
    - `npm run typecheck` exits 0
    - `npm run build` exits 0
    - No new test failures
  </acceptance_criteria>
  <done>prompt-packet compaction-preservation wired into compaction hook</done>
</task>

</tasks>

<verification>
1. `npm run typecheck` — 0 errors
2. `npm run build` — succeeds
3. `npm test` — no new failures
4. `grep -c "sessionEntryObserver\|createSessionEntryEventObserver" src/plugin.ts` — returns 1+ match
5. `grep -c "resolveIntake" src/hooks/create-core-hooks.ts` — returns 1+ match
6. `grep -c "toCompactionPacket" src/hooks/create-session-hooks.ts` — returns 1+ match
7. `grep -c "getIntake" src/plugin.ts` — returns 1+ match
</verification>

<success_criteria>
- session-entry/ wired as event observer on session.created (D-10, D-11)
- system.transform hook injects routing context from intake (D-12, D-14)
- prompt-packet/ compaction-preservation wired into compaction hook (D-13)
- Zero new typecheck errors
- Zero new test failures
- All 3 integration points verified: plugin.ts eventObservers, create-core-hooks.ts system.transform, create-session-hooks.ts compaction
</success_criteria>

<output>
After completion, create `.planning/workstreams/harness-ecosystem-recovery/phases/HER-2-dead-code-cleanup/HER-2-03-SUMMARY.md`
</output>
