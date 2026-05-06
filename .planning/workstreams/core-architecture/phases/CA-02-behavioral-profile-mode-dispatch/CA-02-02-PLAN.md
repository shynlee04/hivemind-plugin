---
phase: CA-02
plan: "02"
title: "Integration — Hooks, Plugin, Delegation, Category Gates"
wave: 2
depends_on: ["CA-02-01"]
files_modified:
  - src/hooks/types.ts
  - src/hooks/create-core-hooks.ts
  - src/plugin.ts
  - src/lib/delegation-manager.ts
  - src/lib/category-gates.ts
  - src/lib/session-api.ts
  - tests/hooks/create-core-hooks.test.ts
  - tests/lib/delegation-manager.test.ts
  - tests/lib/category-gates.test.ts
autonomous: true
requirements:
  - REQ-CA02-02
  - REQ-CA02-05
  - REQ-CA02-06
  - REQ-CA02-07
  - REQ-CA02-08
---

# CA-02 Plan 02: Integration — Hooks, Plugin, Delegation, Category Gates

<objective>
Wire the behavioral profile module (from Plan 01) into the runtime: extend HookDependencies with a profile accessor, inject behavioral fields into system.transform, extend DelegationManager with guardrailLevel overrides, add advisory skillFilter to category gates, and add getSessionBehavioralProfile to session-api. Each integration point follows the existing dependency injection and CQRS patterns.
</objective>

<must_haves>
- HookDependencies has getBehavioralProfile accessor (D-09, D-10)
- system.transform injects behavioral.guardrailLevel, behavioral.delegationMode, behavioral.toolAccessPattern, behavioral.skillFilter, language.conversation, language.documents, runtime.communicationStyle, runtime.decisionSpeed, runtime.expertise, discuss.mode (D-04, D-05, D-09, D-14)
- plugin.ts wires resolveBehavioralProfile into deps bundle at composition root
- DelegationManager respects guardrailLevel: strict→concurrency 1, moderate→no change, minimal→no change (D-12)
- Category gates log advisory skillFilter for hivemind-powered mode (D-11)
- session-api exports getSessionBehavioralProfile wrapper
- All modified files retain existing JSDoc and stay under 500 LOC
- Zero regressions on existing test suite
</must_haves>

## Task 1: Extend HookDependencies with behavioral profile accessor

<read_first>
- src/hooks/types.ts (current HookDependencies interface — 39 lines, has hivemindConfig field)
- src/lib/behavioral-profile/types.ts (ResolvedBehavioralProfile type)
- src/lib/behavioral-profile/resolve-behavioral-profile.ts (resolveBehavioralProfile function signature)
</read_first>

<action>
Edit `src/hooks/types.ts`:

1. Add import at top:
```typescript
import type { ResolvedBehavioralProfile } from "../lib/behavioral-profile/types.js"
```

2. Add field to `HookDependencies` interface after the `hivemindConfig` field:
```typescript
  /**
   * Resolves the behavioral profile for a session.
   * Lazy — computes on first call, caches for session lifetime.
   * @see D-09, D-10 in CA-02-CONTEXT.md
   */
  getBehavioralProfile?: (sessionId: string) => ResolvedBehavioralProfile
```

This is optional (`?`) to maintain backward compatibility — existing code that creates HookDependencies without behavioral profile continues to work.
</action>

<acceptance_criteria>
- `src/hooks/types.ts` contains `import type { ResolvedBehavioralProfile }`
- `src/hooks/types.ts` contains `getBehavioralProfile?: (sessionId: string) => ResolvedBehavioralProfile`
- Field is documented with JSDoc
- `npm run typecheck` exits 0
- File stays under 50 LOC
</acceptance_criteria>

## Task 2: Extend system.transform hook with behavioral profile injection

<read_first>
- src/hooks/create-core-hooks.ts (current system.transform handler — lines 68-95, intake injection pattern)
- src/hooks/types.ts (HookDependencies with new getBehavioralProfile field)
- src/lib/behavioral-profile/types.ts (ResolvedBehavioralProfile shape — behavioralProfile, language, merged, discussMode fields)
- .planning/workstreams/core-architecture/phases/CA-02-behavioral-profile-mode-dispatch/CA-02-CONTEXT.md (D-04, D-05, D-09, D-14)
- .planning/workstreams/core-architecture/phases/CA-02-behavioral-profile-mode-dispatch/CA-02-RESEARCH.md (Pattern 4: system.transform extension, Pitfall #2: output mutation)
</read_first>

<action>
Edit `src/hooks/create-core-hooks.ts`, in the `"system.transform"` handler. After the existing intake context injection block (after line 94 `(output.system as string[]).push(contextLines.join("\n"))`), add the behavioral profile injection:

```typescript
      // Behavioral profile injection (CA-02: D-04, D-09, D-14)
      if (deps.getBehavioralProfile) {
        const profile = deps.getBehavioralProfile(sessionID)
        if (profile) {
          const bp = profile.behavioralProfile
          const lang = profile.language
          const rt = profile.merged

          const behavioralLines = [
            "Behavioral profile context:",
            `- behavioral.guardrailLevel: ${bp.guardrailLevel}`,
            `- behavioral.delegationMode: ${bp.delegationMode}`,
            `- behavioral.toolAccessPattern: ${bp.toolAccessPattern}`,
            `- behavioral.skillFilter: ${bp.skillFilter}`,
            `- language.conversation: ${lang.conversation}`,
            `- language.documents: ${lang.documents}`,
            `- runtime.communicationStyle: ${rt.communicationStyle}`,
            `- runtime.decisionSpeed: ${rt.decisionSpeed}`,
            `- runtime.expertise: ${rt.expertise}`,
            `- discuss.mode: ${profile.discussMode}`,
          ]

          // Ensure output.system is array (defensive — intake block above already coerces)
          output.system = Array.isArray(output.system) ? output.system : []
          ;(output.system as string[]).push(behavioralLines.join("\n"))
        }
      }
```

IMPORTANT: The behavioral block must come AFTER the intake block so that intake context is always first. The `output.system` coercion is defensive — the intake block already does it, but if intake is skipped (no intake result), behavioral injection must still work independently.
</action>

<acceptance_criteria>
- `src/hooks/create-core-hooks.ts` contains `deps.getBehavioralProfile`
- `src/hooks/create-core-hooks.ts` contains `behavioral.guardrailLevel`
- `src/hooks/create-core-hooks.ts` contains `language.conversation`
- `src/hooks/create-core-hooks.ts` contains `discuss.mode`
- `src/hooks/create-core-hooks.ts` contains `Behavioral profile context:`
- Behavioral block appears AFTER the intake `contextLines.join` block
- `npm run typecheck` exits 0
- File stays under 200 LOC
</acceptance_criteria>

## Task 3: Wire behavioral profile into plugin.ts composition root

<read_first>
- src/plugin.ts (composition root — find where deps bundle is constructed, where getConfig is called, where hivemindConfig is set)
- src/lib/behavioral-profile/resolve-behavioral-profile.ts (resolveBehavioralProfile function)
- src/lib/config-subscriber.ts (getConfig — already called in plugin.ts)
- src/hooks/types.ts (HookDependencies with getBehavioralProfile)
</read_first>

<action>
Edit `src/plugin.ts`:

1. Add import:
```typescript
import { resolveBehavioralProfile } from "./lib/behavioral-profile/resolve-behavioral-profile.js"
```

2. In the deps bundle construction (where `hivemindConfig` is assigned), add the `getBehavioralProfile` accessor. Find the line that sets `hivemindConfig: config` (or similar) and add after it:
```typescript
getBehavioralProfile: (sessionId: string) => resolveBehavioralProfile(sessionId, projectDirectory),
```

The `projectDirectory` variable is already available in scope (used by `getConfig(projectDirectory)`). The accessor creates a closure over `projectDirectory` so each call resolves using the correct project root. No session context is passed initially — `resolveProfile()` gracefully handles undefined context with `matchConfidence: 0` defaults (RESEARCH.md Pitfall #5).
</action>

<acceptance_criteria>
- `src/plugin.ts` contains `import { resolveBehavioralProfile }`
- `src/plugin.ts` contains `getBehavioralProfile:` in the deps bundle
- `src/plugin.ts` contains `resolveBehavioralProfile(sessionId, projectDirectory)`
- `npm run typecheck` exits 0
- `npm run build` exits 0
- File stays under 250 LOC
</acceptance_criteria>

## Task 4: Extend DelegationManager with behavioral guardrailLevel overrides

<read_first>
- src/lib/delegation-manager.ts (DelegationManager class — find dispatch(), concurrency resolution, RuntimePolicy usage)
- src/lib/behavioral-profile/types.ts (BehavioralOverrides interface, GuardrailLevel type)
- src/lib/runtime-policy.ts (RuntimePolicy type — concurrency fields)
- .planning/workstreams/core-architecture/phases/CA-02-behavioral-profile-mode-dispatch/CA-02-CONTEXT.md (D-12: guardrailLevel adjusts concurrency)
- .planning/workstreams/core-architecture/phases/CA-02-behavioral-profile-mode-dispatch/CA-02-RESEARCH.md (Pattern 5: DelegationManager override, Pitfall #4: priority conflicts — behavioral overrides only tighten, never loosen)
</read_first>

<action>
Edit `src/lib/delegation-manager.ts`:

1. Add import:
```typescript
import type { BehavioralOverrides } from "./behavioral-profile/types.js"
```

2. Add a private helper method to the DelegationManager class:
```typescript
  /**
   * Applies behavioral profile overrides to the runtime policy.
   * Behavioral overrides only TIGHTEN constraints — never loosen beyond workspace policy.
   *
   * @param guardrailLevel - The behavioral guardrail level from the resolved profile
   * @returns Adjusted concurrency limit (undefined = no adjustment)
   * @see D-12 in CA-02-CONTEXT.md
   */
  private applyBehavioralGuardrail(guardrailLevel: BehavioralOverrides["guardrailLevel"]): number | undefined {
    if (guardrailLevel === "strict") {
      // strict: cap concurrent delegations to 1
      return 1
    }
    // moderate, minimal: no adjustment — respect runtime policy as-is
    return undefined
  }
```

3. In the `dispatch()` method (or the method that acquires concurrency slots), add an optional `behavioralOverrides?: BehavioralOverrides` parameter. Before acquiring the semaphore slot, check if guardrail adjustment applies:
```typescript
const guardrailLimit = behavioralOverrides
  ? this.applyBehavioralGuardrail(behavioralOverrides.guardrailLevel)
  : undefined
// If guardrailLimit is set, use Math.min(existingLimit, guardrailLimit)
```

The behavioral override MUST NOT increase concurrency beyond the workspace runtime policy limit. It can only tighten (reduce) or pass through.
</action>

<acceptance_criteria>
- `src/lib/delegation-manager.ts` contains `import type { BehavioralOverrides }`
- `src/lib/delegation-manager.ts` contains `applyBehavioralGuardrail`
- `src/lib/delegation-manager.ts` contains `guardrailLevel === "strict"`
- Method returns `1` for strict, `undefined` for moderate and minimal
- `npm run typecheck` exits 0
- File stays under 500 LOC
</acceptance_criteria>

## Task 5: Add advisory skillFilter to category gates

<read_first>
- src/lib/category-gates.ts (resolveCategoryGateDecision function, CategoryGatePolicy type, existing gate logic)
- src/lib/behavioral-profile/types.ts (SkillFilter type — "all" | "curated")
- .planning/workstreams/core-architecture/phases/CA-02-behavioral-profile-mode-dispatch/CA-02-CONTEXT.md (D-11: advisory filtering, non-blocking)
</read_first>

<action>
Edit `src/lib/category-gates.ts`:

1. Add import:
```typescript
import type { SkillFilter } from "./behavioral-profile/types.js"
```

2. Add advisory logging function (does NOT modify gate decisions — advisory only):
```typescript
/**
 * Logs advisory skill filter notice when mode restricts skill loading.
 * Non-blocking — does not prevent skill loading, only annotates.
 *
 * @param skillFilter - The active skill filter from behavioral profile
 * @param skillName - Name of the skill being loaded
 * @returns Advisory message if filter applies, undefined otherwise
 * @see D-11 in CA-02-CONTEXT.md
 */
export function checkSkillFilterAdvisory(
  skillFilter: SkillFilter,
  skillName: string,
): string | undefined {
  if (skillFilter === "curated" && skillName) {
    return `[Harness] Advisory: skillFilter is "curated" — skill "${skillName}" may not be in curated set`
  }
  return undefined
}
```

This is intentionally minimal — a pure function that returns an advisory string. It does NOT modify any gate decisions. The caller (category gate consumer or tool) decides whether to log it.
</action>

<acceptance_criteria>
- `src/lib/category-gates.ts` contains `export function checkSkillFilterAdvisory`
- `src/lib/category-gates.ts` contains `import type { SkillFilter }`
- Function accepts `(skillFilter: SkillFilter, skillName: string)`
- Function returns `string | undefined`
- Function returns advisory message when `skillFilter === "curated"`
- Function returns `undefined` when `skillFilter === "all"`
- Function does NOT call any other gate functions (no side effects)
- `npm run typecheck` exits 0
- File stays under 200 LOC
</acceptance_criteria>

## Task 6: Add getSessionBehavioralProfile to session-api.ts

<read_first>
- src/lib/session-api.ts (existing SDK wrappers — find pattern for adding new wrapper functions)
- src/lib/behavioral-profile/resolve-behavioral-profile.ts (resolveBehavioralProfile function)
- src/lib/behavioral-profile/types.ts (ResolvedBehavioralProfile type)
</read_first>

<action>
Edit `src/lib/session-api.ts`:

1. Add imports:
```typescript
import type { ResolvedBehavioralProfile } from "./behavioral-profile/types.js"
import { resolveBehavioralProfile } from "./behavioral-profile/resolve-behavioral-profile.js"
```

2. Add wrapper function:
```typescript
/**
 * Retrieves the resolved behavioral profile for a session.
 * Delegates to resolveBehavioralProfile with lazy caching.
 *
 * @param sessionId - The session ID to resolve profile for
 * @param projectRoot - Absolute path to project root
 * @param sessionContext - Optional session context for runtime profile detection
 * @returns The resolved behavioral profile
 * @see D-10 in CA-02-CONTEXT.md
 */
export function getSessionBehavioralProfile(
  sessionId: string,
  projectRoot: string,
  sessionContext?: Record<string, unknown>,
): ResolvedBehavioralProfile {
  return resolveBehavioralProfile(sessionId, projectRoot, sessionContext)
}
```

This is a thin SDK wrapper following the existing pattern in session-api.ts. It provides a consistent API surface for tools that need behavioral profiles.
</action>

<acceptance_criteria>
- `src/lib/session-api.ts` contains `export function getSessionBehavioralProfile`
- `src/lib/session-api.ts` contains `import { resolveBehavioralProfile }`
- `src/lib/session-api.ts` contains `import type { ResolvedBehavioralProfile }`
- Function returns `ResolvedBehavioralProfile`
- `npm run typecheck` exits 0
- File stays under 500 LOC
</acceptance_criteria>

## Task 7: Integration tests

<read_first>
- tests/hooks/create-core-hooks.test.ts (if exists — existing hook test patterns)
- tests/lib/delegation-manager.test.ts (if exists — existing delegation test patterns)
- tests/lib/category-gates.test.ts (if exists — existing gate test patterns)
- src/hooks/create-core-hooks.ts (system.transform with behavioral injection)
- src/lib/delegation-manager.ts (applyBehavioralGuardrail)
- src/lib/category-gates.ts (checkSkillFilterAdvisory)
</read_first>

<action>
Create or extend test files:

**For system.transform behavioral injection** — extend or create `tests/hooks/create-core-hooks.test.ts`:
- Test: system.transform with getBehavioralProfile in deps injects behavioral lines into output.system
- Test: system.transform without getBehavioralProfile in deps still works (backward compat)
- Test: behavioral injection includes all expected fields (guardrailLevel, delegationMode, toolAccessPattern, skillFilter, language.conversation, language.documents, communicationStyle, decisionSpeed, expertise, discuss.mode)
- Test: behavioral injection comes AFTER intake injection

**For DelegationManager behavioral overrides** — extend or create `tests/lib/delegation-manager.test.ts`:
- Test: applyBehavioralGuardrail with "strict" returns 1
- Test: applyBehavioralGuardrail with "moderate" returns undefined
- Test: applyBehavioralGuardrail with "minimal" returns undefined

**For category gates advisory** — extend or create `tests/lib/category-gates.test.ts`:
- Test: checkSkillFilterAdvisory with "curated" returns advisory string
- Test: checkSkillFilterAdvisory with "all" returns undefined
- Test: advisory string contains the skill name

Minimum 10 new test cases across the files.
</action>

<acceptance_criteria>
- System.transform test file contains `describe("behavioral profile injection"`
- Delegation manager test file contains test for `applyBehavioralGuardrail`
- Category gates test file contains `describe("checkSkillFilterAdvisory"` or test for `skillFilter`
- At least 10 new test cases total
- `npm test` exits with 0 new failures
- `npm run typecheck` exits 0
</acceptance_criteria>

<verification>
```bash
npm run typecheck && npm test && echo "PLAN-02 VERIFIED"
```
</verification>
