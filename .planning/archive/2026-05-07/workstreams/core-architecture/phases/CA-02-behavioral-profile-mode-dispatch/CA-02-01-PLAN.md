---
phase: CA-02
plan: "01"
title: "Core Behavioral Profile Module — Types, Lookup, Resolution"
wave: 1
depends_on: []
files_modified:
  - src/lib/behavioral-profile/.gitkeep
  - src/lib/behavioral-profile/types.ts
  - src/lib/behavioral-profile/profiles.ts
  - src/lib/behavioral-profile/resolve-behavioral-profile.ts
  - src/schema-kernel/index.ts
  - tests/lib/behavioral-profile/profiles.test.ts
  - tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts
  - tests/lib/behavioral-profile/.gitkeep
autonomous: true
requirements:
  - REQ-CA02-01
  - REQ-CA02-03
  - REQ-CA02-04
  - REQ-CA02-09
---

# CA-02 Plan 01: Core Behavioral Profile Module

<objective>
Create the `src/lib/behavioral-profile/` module with the static lookup table (D-01, D-02, D-03), the `ResolvedBehavioralProfile` type (D-07), and the lazy-cached resolution function (D-06, D-08). This is a pure data/logic module with zero integration side effects — it depends only on existing leaf modules (`config-subscriber`, `profile-resolver`, `hivemind-configs.schema`).
</objective>

<must_haves>
- Static lookup table maps all 3 modes to correct BehavioralProfile values (D-01, D-02)
- DelegationMode type includes waiter, sync, disabled (D-03)
- ResolvedBehavioralProfile type matches D-07 interface exactly
- Config-first merge: user_expert_level wins over runtime expertise (D-06)
- Resolution cached per sessionId — second call returns same reference (D-08)
- discussMode included in resolved profile as signal only (D-13)
- invalidateBehavioralProfile() clears cache for session teardown
- All new files have JSDoc documentation
- All new files under 500 LOC
- Zero circular dependencies with existing modules
</must_haves>

## Task 1: Create directory structure and types module

<read_first>
- src/schema-kernel/hivemind-configs.schema.ts (HivemindMode, UserExpertLevel, SupportedLanguage, DiscussMode types)
- src/lib/session-entry/profile-resolver.ts (ProfileMatch, Expertise, CommunicationStyle, DecisionSpeed types)
- src/hooks/types.ts (HookDependencies — verify hivemindConfig field exists)
- .planning/workstreams/core-architecture/phases/CA-02-behavioral-profile-mode-dispatch/CA-02-CONTEXT.md (D-01 through D-08, D-13)
</read_first>

<action>
1. Create `src/lib/behavioral-profile/.gitkeep` (register directory in git)
2. Create `tests/lib/behavioral-profile/.gitkeep` (register test directory in git)
3. Create `src/lib/behavioral-profile/types.ts` with:

```typescript
/**
 * Behavioral profile type definitions for the Hivemind mode dispatch system.
 *
 * @module behavioral-profile/types
 * @description Defines the static behavioral profile shape (BehavioralProfile),
 * the unified resolution output (ResolvedBehavioralProfile), and supporting
 * union types for guardrail levels, delegation modes, tool access patterns,
 * and skill filters. These are TypeScript-only types — no Zod schemas.
 *
 * Leaf module — depends only on schema-kernel and profile-resolver types.
 */

import type { HivemindMode, SupportedLanguage, UserExpertLevel, DiscussMode } from "../../schema-kernel/hivemind-configs.schema.js"
import type { ProfileMatch, Expertise, CommunicationStyle, DecisionSpeed } from "../session-entry/profile-resolver.js"

/** Guardrail strictness level controlling delegation and tool behavior. */
export type GuardrailLevel = "minimal" | "moderate" | "strict"

/** Delegation dispatch strategy. */
export type DelegationMode = "waiter" | "sync" | "disabled"

/** Tool access filtering level. */
export type ToolAccessPattern = "full" | "restricted" | "curated"

/** Skill loading filter. */
export type SkillFilter = "all" | "curated"

/**
 * Static behavioral profile derived from a HivemindMode.
 * One entry per mode in the lookup table — no runtime computation.
 *
 * @see D-01, D-02 in CA-02-CONTEXT.md
 */
export interface BehavioralProfile {
  guardrailLevel: GuardrailLevel
  delegationMode: DelegationMode
  toolAccessPattern: ToolAccessPattern
  skillFilter: SkillFilter
}

/**
 * Unified resolved behavioral profile combining config values,
 * static mode lookup, and runtime profile detection.
 *
 * Produced once per session by resolveBehavioralProfile().
 *
 * @see D-07 in CA-02-CONTEXT.md
 */
export interface ResolvedBehavioralProfile {
  /** Active mode from configs.json */
  mode: HivemindMode
  /** Static behavioral profile derived from mode */
  behavioralProfile: BehavioralProfile
  /** Language configuration from configs.json */
  language: {
    conversation: SupportedLanguage
    documents: SupportedLanguage
  }
  /** User expertise level from configs.json */
  userExpertLevel: UserExpertLevel
  /** Discussion mode — signal only, no routing (D-13) */
  discussMode: DiscussMode
  /** Runtime-detected profile from profile-resolver.ts (SEI-04) */
  runtimeProfile: ProfileMatch
  /** Merged fields: config-first with runtime fallback */
  merged: {
    expertise: Expertise
    communicationStyle: CommunicationStyle
    decisionSpeed: DecisionSpeed
  }
}

/**
 * Behavioral override parameters for DelegationManager dispatch.
 * Supplements RuntimePolicy — never replaces it.
 *
 * @see D-12 in CA-02-CONTEXT.md
 */
export interface BehavioralOverrides {
  guardrailLevel: GuardrailLevel
  delegationMode: DelegationMode
}
```

Ensure all types use `import type` (verbatimModuleSyntax compliance). No runtime imports — this is a pure type module.
</action>

<acceptance_criteria>
- `src/lib/behavioral-profile/.gitkeep` exists
- `tests/lib/behavioral-profile/.gitkeep` exists
- `src/lib/behavioral-profile/types.ts` contains `export interface BehavioralProfile`
- `src/lib/behavioral-profile/types.ts` contains `export interface ResolvedBehavioralProfile`
- `src/lib/behavioral-profile/types.ts` contains `export interface BehavioralOverrides`
- `src/lib/behavioral-profile/types.ts` contains `export type DelegationMode = "waiter" | "sync" | "disabled"`
- `src/lib/behavioral-profile/types.ts` contains `export type GuardrailLevel = "minimal" | "moderate" | "strict"`
- `src/lib/behavioral-profile/types.ts` uses only `import type` (no runtime imports)
- `npm run typecheck` exits 0
</acceptance_criteria>

## Task 2: Create static lookup table (profiles.ts)

<read_first>
- src/lib/behavioral-profile/types.ts (BehavioralProfile type from Task 1)
- src/schema-kernel/hivemind-configs.schema.ts (HivemindMode enum values: "expert-advisor", "hivemind-powered", "free-style")
- .planning/workstreams/core-architecture/phases/CA-02-behavioral-profile-mode-dispatch/CA-02-CONTEXT.md (D-01, D-02 exact default values)
</read_first>

<action>
Create `src/lib/behavioral-profile/profiles.ts`:

```typescript
/**
 * Static mode → behavioral profile lookup table.
 *
 * @module behavioral-profile/profiles
 * @description Maps each HivemindMode to a pre-defined BehavioralProfile.
 * Pure data — no computation, no I/O. One lookup per mode.
 *
 * @see D-01, D-02 in CA-02-CONTEXT.md
 */

import type { HivemindMode } from "../../schema-kernel/hivemind-configs.schema.js"
import type { BehavioralProfile } from "./types.js"

/**
 * Static lookup table mapping each HivemindMode to its BehavioralProfile.
 *
 * @example
 * ```typescript
 * const profile = BehavioralProfiles["expert-advisor"]
 * // { guardrailLevel: "moderate", delegationMode: "waiter", ... }
 * ```
 *
 * @see D-01 Static lookup table design decision
 * @see D-02 Default values per mode
 */
export const BehavioralProfiles: Record<HivemindMode, BehavioralProfile> = {
  "expert-advisor": {
    guardrailLevel: "moderate",
    delegationMode: "waiter",
    toolAccessPattern: "full",
    skillFilter: "all",
  },
  "hivemind-powered": {
    guardrailLevel: "strict",
    delegationMode: "waiter",
    toolAccessPattern: "restricted",
    skillFilter: "curated",
  },
  "free-style": {
    guardrailLevel: "minimal",
    delegationMode: "disabled",
    toolAccessPattern: "full",
    skillFilter: "all",
  },
}
```

Module must have zero runtime dependencies beyond type imports. Under 50 LOC.
</action>

<acceptance_criteria>
- `src/lib/behavioral-profile/profiles.ts` contains `export const BehavioralProfiles: Record<HivemindMode, BehavioralProfile>`
- `BehavioralProfiles["expert-advisor"].guardrailLevel` equals `"moderate"`
- `BehavioralProfiles["expert-advisor"].delegationMode` equals `"waiter"`
- `BehavioralProfiles["hivemind-powered"].guardrailLevel` equals `"strict"`
- `BehavioralProfiles["hivemind-powered"].skillFilter` equals `"curated"`
- `BehavioralProfiles["free-style"].guardrailLevel` equals `"minimal"`
- `BehavioralProfiles["free-style"].delegationMode` equals `"disabled"`
- File is under 50 LOC
- `npm run typecheck` exits 0
</acceptance_criteria>

## Task 3: Create resolution module (resolve-behavioral-profile.ts)

<read_first>
- src/lib/behavioral-profile/types.ts (ResolvedBehavioralProfile, BehavioralProfile)
- src/lib/behavioral-profile/profiles.ts (BehavioralProfiles lookup table)
- src/lib/config-subscriber.ts (getConfig function signature and return type)
- src/lib/session-entry/profile-resolver.ts (resolveProfile function signature, ProfileMatch, Expertise type, mapLevelToExpertise behavior)
- src/schema-kernel/hivemind-configs.schema.ts (HivemindConfigs type — mode, user_expert_level, conversation_language, documents_and_artifacts_language, workflow.discuss_mode fields)
- .planning/workstreams/core-architecture/phases/CA-02-behavioral-profile-mode-dispatch/CA-02-CONTEXT.md (D-06, D-07, D-08)
- .planning/workstreams/core-architecture/phases/CA-02-behavioral-profile-mode-dispatch/CA-02-RESEARCH.md (Pattern 3: Lazy-Cache Resolution, Common Pitfalls #1 circular deps, #3 cache leak, #5 context shape)
</read_first>

<action>
Create `src/lib/behavioral-profile/resolve-behavioral-profile.ts`:

The module must implement:

1. **`mapLevelToExpertise(level: UserExpertLevel): Expertise | undefined`** — Maps config `user_expert_level` to profile `expertise`. Mapping:
   - `"clumsy-vibecoder"` → `"junior"`
   - `"beginner-friendly"` → `"junior"`
   - `"intermediate-high-level"` → `"mid"`
   - `"architecture-driven"` → `"senior"`
   - `"absolute-expert"` → `"senior"`

2. **`resolveBehavioralProfile(sessionId, projectRoot, sessionContext?): ResolvedBehavioralProfile`** — Lazily resolves and caches per sessionId:
   - Reads config via `getConfig(projectRoot)`
   - Looks up `BehavioralProfiles[config.mode]` for static behavioral profile
   - Calls `resolveProfile(sessionContext)` for runtime profile match (gracefully handles undefined context)
   - Merges: config-first for expertise (mapLevelToExpertise wins if non-undefined, else runtime), runtime-only for communicationStyle and decisionSpeed
   - Includes `config.workflow.discuss_mode` as `discussMode` signal
   - Caches result in module-level `Map<string, ResolvedBehavioralProfile>`

3. **`invalidateBehavioralProfile(sessionId: string): void`** — Deletes cached entry for session teardown.

4. **`clearAllBehavioralProfiles(): void`** — Clears entire cache (for testing).

All functions must have JSDoc with `@param`, `@returns`, and `@example` tags. Module under 120 LOC.
</action>

<acceptance_criteria>
- `src/lib/behavioral-profile/resolve-behavioral-profile.ts` exports `resolveBehavioralProfile`
- `src/lib/behavioral-profile/resolve-behavioral-profile.ts` exports `invalidateBehavioralProfile`
- `src/lib/behavioral-profile/resolve-behavioral-profile.ts` exports `clearAllBehavioralProfiles`
- Function `resolveBehavioralProfile` accepts `(sessionId: string, projectRoot: string, sessionContext?: Record<string, unknown>)`
- Function returns `ResolvedBehavioralProfile` type
- `mapLevelToExpertise("clumsy-vibecoder")` returns `"junior"`
- `mapLevelToExpertise("architecture-driven")` returns `"senior"`
- Module imports `getConfig` from `../config-subscriber.js`
- Module imports `resolveProfile` from `../session-entry/profile-resolver.js`
- Module imports `BehavioralProfiles` from `./profiles.js`
- Module uses `import type` for type-only imports (verbatimModuleSyntax)
- Module is under 120 LOC
- `npm run typecheck` exits 0
</acceptance_criteria>

## Task 4: Export types from schema-kernel/index.ts

<read_first>
- src/schema-kernel/index.ts (current exports)
- src/lib/behavioral-profile/types.ts (types to re-export)
- .planning/workstreams/core-architecture/phases/CA-02-behavioral-profile-mode-dispatch/CA-02-RESEARCH.md (Pitfall #1: circular dependency avoidance — use `export type` only)
</read_first>

<action>
Add type re-exports to `src/schema-kernel/index.ts`. Append after existing exports:

```typescript
// Behavioral profile types (CA-02)
export type {
  BehavioralProfile,
  ResolvedBehavioralProfile,
  BehavioralOverrides,
  GuardrailLevel,
  DelegationMode,
  ToolAccessPattern,
  SkillFilter,
} from "../lib/behavioral-profile/types.js"
```

CRITICAL: Use `export type` only — no runtime re-exports. This prevents the circular dependency described in RESEARCH.md Pitfall #1 (behavioral-profile → config-subscriber → hivemind-configs.schema → schema-kernel/index → behavioral-profile).
</action>

<acceptance_criteria>
- `src/schema-kernel/index.ts` contains `export type { BehavioralProfile`
- `src/schema-kernel/index.ts` contains `export type {` block with `ResolvedBehavioralProfile`
- `src/schema-kernel/index.ts` contains `BehavioralOverrides` in the export block
- `src/schema-kernel/index.ts` contains `DelegationMode` in the export block
- No runtime imports from `../lib/behavioral-profile/` (only `export type`)
- `npm run typecheck` exits 0
- `npm run build` exits 0 (no circular dependency errors)
</acceptance_criteria>

## Task 5: Unit tests for profiles.ts and resolve-behavioral-profile.ts

<read_first>
- src/lib/behavioral-profile/profiles.ts (lookup table to test)
- src/lib/behavioral-profile/resolve-behavioral-profile.ts (resolution to test)
- src/lib/behavioral-profile/types.ts (types for assertions)
- tests/lib/config-subscriber.test.ts (testing pattern reference — mock style, vitest globals)
- src/lib/config-subscriber.ts (getConfig to mock)
- src/lib/session-entry/profile-resolver.ts (resolveProfile to mock)
- vitest.config.ts (test configuration)
</read_first>

<action>
Create `tests/lib/behavioral-profile/profiles.test.ts`:
- Test that all 3 modes exist in lookup table
- Test each mode returns correct guardrailLevel, delegationMode, toolAccessPattern, skillFilter
- Test that lookup table is exhaustive (covers all HivemindMode values)
- Test that values are frozen/immutable (object identity check)

Create `tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts`:
- Mock `getConfig` from `../../../src/lib/config-subscriber.js`
- Mock `resolveProfile` from `../../../src/lib/session-entry/profile-resolver.js`
- Test: resolution returns correct mode from config
- Test: resolution returns correct behavioral profile for each mode
- Test: language fields populated from config (conversation_language, documents_and_artifacts_language)
- Test: userExpertLevel from config
- Test: discussMode from config.workflow.discuss_mode
- Test: merged.expertise uses mapLevelToExpertise when config has user_expert_level
- Test: merged.expertise falls back to runtime when mapLevelToExpertise returns undefined
- Test: merged.communicationStyle from runtime profile
- Test: merged.decisionSpeed from runtime profile
- Test: cache hit — second call with same sessionId returns same object reference (`toBe` not `toEqual`)
- Test: cache miss — different sessionId computes fresh
- Test: invalidateBehavioralProfile clears cache — next call recomputes
- Test: clearAllBehavioralProfiles resets entire cache
- Test: undefined sessionContext handled gracefully (resolveProfile receives undefined)

Call `clearAllBehavioralProfiles()` in `beforeEach` to prevent cache leaking between tests.

Minimum 15 test cases across both files.
</action>

<acceptance_criteria>
- `tests/lib/behavioral-profile/profiles.test.ts` exists with `describe("BehavioralProfiles"`
- `tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts` exists with `describe("resolveBehavioralProfile"`
- `npx vitest run tests/lib/behavioral-profile/` exits 0
- At least 15 test cases total (count `it(` or `test(` occurrences)
- Tests mock `getConfig` and `resolveProfile` (no real filesystem reads)
- Cache test uses `toBe` (reference equality) not `toEqual`
- `npm test` exits with 0 new failures (existing 2 pre-existing failures acceptable)
</acceptance_criteria>

<verification>
```bash
npm run typecheck && npx vitest run tests/lib/behavioral-profile/ && echo "PLAN-01 VERIFIED"
```
</verification>
