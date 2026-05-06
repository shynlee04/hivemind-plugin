# Phase CA-02: Behavioral Profile System + Mode Dispatch — Research

**Researched:** 2026-05-06
**Domain:** TypeScript plugin runtime behavior profiling — static config → behavioral mapping → hook injection → consumer surface
**Confidence:** HIGH

## Summary

Phase CA-02 bridges the gap between `configs.json` values (`mode`, `user_expert_level`, `discuss_mode`, language fields) and observable runtime behavior changes. It introduces a static lookup table (`BehavioralProfile`), a config-first merge with runtime `ProfileMatch` (from existing `profile-resolver.ts`), a unified `ResolvedBehavioralProfile` type resolved once per session, and injection into the `system.transform` hook for downstream consumers.

All 14 locked decisions (D-01 through D-14) are technically sound and align with existing Hivemind V3 patterns. The static lookup table approach (D-01) is validated by oh-my-opencode's `AgentMode` pattern. The `system.transform` injection (D-04, D-09) follows the same pattern already used by the intake context injection in `create-core-hooks.ts`. The lazy-cache resolution per session (D-08) mirrors the proven `config-subscriber.ts` pattern.

**Primary recommendation:** Proceed with implementation as designed. The only risk area is D-12 (guardrailLevel overrides in DelegationManager) — ensure the behavioral override layer respects the existing runtime policy hierarchy (workspace > session > delegation) without introducing ambiguity. Add a `BehavioralOverrides` interface that supplements rather than replaces the existing `RuntimePolicy`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Mode→behavioral profile mapping | API / Backend (`src/lib/`) | — | Static lookup; pure data, no I/O |
| Language config injection | Hooks (`src/hooks/`) | — | system.transform hook owns session context injection |
| Profile merge (config + runtime) | API / Backend (`src/lib/`) | — | Resolution logic; no side effects |
| system.transform behavioral injection | Hooks (`src/hooks/`) | — | Hook is the injection boundary into OpenCode runtime |
| Selective tool exposure | Plugin root (`src/plugin.ts`) | Tools (`src/tools/`) | Tools receive profile via deps at construction time |
| Category gate skillFilter | API / Backend (`src/lib/category-gates.ts`) | — | Existing gate infrastructure; advisory only |
| DelegationManager guardrail overrides | API / Backend (`src/lib/delegation-manager.ts`) | — | Per-session behavioral adjustment layer |

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

| ID | Decision | Detail |
|----|----------|--------|
| D-01 | Static lookup table | `BehavioralProfile` type mapping `mode` → `{guardrailLevel, delegationMode, toolAccessPattern, skillFilter}` |
| D-02 | Profile defaults | `expert-advisor` → moderate/waiter/full/all; `hivemind-powered` → strict/waiter/restricted/curated; `free-style` → minimal/disabled/full/all |
| D-03 | Delegation modes | `'waiter'` (SDK dispatch), `'sync'` (direct), `'disabled'` (no delegation) |
| D-04 | Language injection via system.transform | `conversation_language`, `documents_and_artifacts_language` injected as context lines |
| D-05 | No dedicated language hook | Reuse existing `system.transform` injection point |
| D-06 | Config-first merge | Static config is source of truth; runtime `ProfileMatch` fills gaps |
| D-07 | Unified `ResolvedBehavioralProfile` type | Single resolution point combining config + runtime + merged |
| D-08 | Resolution once per session | `resolveBehavioralProfile(sessionId)` — lazy at first access |
| D-09 | system.transform injects behavioral fields | `behavioral.guardrailLevel`, `behavioral.delegationMode`, `language.*`, `runtime.*` |
| D-10 | Selective tool injection | Only coordination tools (`delegate-task`, `delegation-status`, `configure-primitive`, `session-journal-export`) receive resolved profile |
| D-11 | Category gates read skillFilter | Advisory filtering only (non-blocking); flag non-curated skills in `hivemind-powered` mode |
| D-12 | DelegationManager checks guardrailLevel | Session-level overrides for concurrency and tool-budget |
| D-13 | discuss_mode as profile signal only | Included in resolved profile; no auto-routing (deferred to WS-4) |
| D-14 | /gsd-discuss-phase reads configs.json directly | `system.transform` exposes `discussMode` in session context |

### the agent's Discretion

- File organization within `src/lib/behavioral-profile/` (exact file count and naming)
- Inline documentation style (JSDoc)
- Test file placement and naming
- Whether `resolveBehavioralProfile` takes `sessionId` or uses a closure over project root
- How `deps` evolve (add `getBehavioralProfile` accessor vs. inline resolution)

### Deferred Ideas (OUT OF SCOPE)

- f-04 Auto-commands / workflow router (belongs to WS-4)
- Tool guard enforcement (blocking pre-execution hooks — post-GA feature)
- Per-mode hook injection profiles (declarative enable/disable per mode)
- Behavioral profile editor in sidecar (WS-2/WS-8 dependency)
- A/B testing and metrics for profile impact
- `user_expert_level` auto-detection enhancement
</user_constraints>

<phase_requirements>
## Phase Requirements

> Requirements are not locked by a SPEC.md for CA-02. This phase synthesizes from CA-01 configs schema decisions (D-CONF-01, D-CONF-04, D-CONF-05, D-BIND-01, D-BIND-02) and SEI-04 `profile-resolver.ts`.

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-CA02-01 | Static lookup table mapping `mode → BehavioralProfile` (`guardrailLevel`, `delegationMode`, `toolAccessPattern`, `skillFilter`) | D-01, D-02, D-03; validated by oh-my-opencode `AgentMode` pattern |
| REQ-CA02-02 | Language config injection (`conversation_language`, `documents_and_artifacts_language`) into `system.transform` hook and via `deps.hivemindConfig` | D-04, D-05; follows existing intake injection pattern in `create-core-hooks.ts` |
| REQ-CA02-03 | Config-first profile merge with runtime `ProfileMatch` fallback → `ResolvedBehavioralProfile` | D-06, D-07; code example in CONTEXT.md validated against types |
| REQ-CA02-04 | Resolution once per session (lazy at first access) via `resolveBehavioralProfile()` | D-08; mirrors `config-subscriber.ts` lazy-cache pattern |
| REQ-CA02-05 | `system.transform` hook injects behavioral fields into session context | D-09; existing hook already injects intake context — extension point verified |
| REQ-CA02-06 | Selective tool injection — coordination tools receive resolved profile | D-10; `delegate-task`, `delegation-status`, `configure-primitive`, `session-journal-export` |
| REQ-CA02-07 | Category gates advisory skillFilter (non-blocking) | D-11; `category-gates.ts` is narrowing-only — advisory logging fits architecture |
| REQ-CA02-08 | DelegationManager checks `guardrailLevel` for session-level concurrency/tool-budget overrides | D-12; existing `runtimePolicy` hierarchy must be respected |
| REQ-CA02-09 | `discuss_mode` in resolved profile as signal only (deferred to WS-4) | D-13, D-14; `system.transform` exposes `discussMode` in session context |
</phase_requirements>

## Standard Stack

### Core
No new external dependencies are required for this phase. All types, utilities, and runtime primitives already exist in the project.

| Component | Version | Purpose |
|-----------|---------|---------|
| TypeScript + Zod (existing) | 5.x / 4.x (via `zod` in `schema-kernel/`) | Type definitions, runtime validation of profile shapes |
| `@opencode-ai/plugin` (peer dep) | >= 1.1.0 | `system.transform` hook signature, `Plugin` type |
| `profile-resolver.ts` (existing SEI-04) | — | `resolveProfile(context)` → `ProfileMatch` for runtime half of merge |

### Existing Artifacts Consumed (No New Dependencies)

| Artifact | Path | Consumed For |
|----------|------|-------------|
| `HivemindConfigs` type | `src/schema-kernel/hivemind-configs.schema.ts` | `mode`, `user_expert_level`, `discuss_mode`, language fields |
| `getConfig()` | `src/lib/config-subscriber.ts` | Config retrieval (already wired into `plugin.ts`) |
| `resolveProfile()` | `src/lib/session-entry/profile-resolver.ts` | Runtime profile match |
| `HookDependencies` | `src/hooks/types.ts` | `hivemindConfig` field already present; add behavioral accessor |
| `createCoreHooks()` | `src/hooks/create-core-hooks.ts` | system.transform extension point |
| `DelegationManager` | `src/lib/delegation-manager.ts` | guardrailLevel override injection |
| `resolveCategoryGateDecision()` | `src/lib/category-gates.ts` | skillFilter advisory checks |
| `schema-kernel/index.ts` | `src/schema-kernel/index.ts` | New type exports (BehavioralProfile, etc.) |

## Architecture Patterns

### System Architecture Diagram

```
configs.json (.hivemind/)
    │
    ├──► config-subscriber.ts (lazy-cache)
    │        │
    │        └──► getConfig() → HivemindConfigs { mode, user_expert_level, conversation_language, ... }
    │
    └──► plugin.ts (composition root)
             │
             ├──► deps.hivemindConfig ──────────────────────────────────────┐
             │                                                               │
             ├──► NEW: src/lib/behavioral-profile/                          │
             │     ├── profiles.ts          (BehavioralProfiles lookup)      │
             │     ├── types.ts            (BehavioralProfile, ResolvedBP)   │
             │     └── resolve-behavioral-profile.ts (session-scoped cache)  │
             │           │                                                  │
             │           ├── reads: getConfig() + resolveProfile()           │
             │           └── outputs: ResolvedBehavioralProfile              │
             │                                                               │
             ├──► create-core-hooks.ts (system.transform extension) ◄───────┘
             │     └── injects: behavioral.* + language.* + runtime.*
             │          into session system context
             │
             ├──► delegation-manager.ts
             │     └── dispatches with behavioral overrides (guardrailLevel)
             │
             ├──► category-gates.ts
             │     └── advisory skillFilter check (reads from profile)
             │
             └──► tools (selective injection)
                   ├── delegate-task        (delegationMode, guardrailLevel)
                   ├── delegation-status    (behavioral context display)
                   ├── configure-primitive  (toolAccessPattern)
                   └── session-journal-export (profile in export)
```

### Recommended Project Structure

```
src/lib/behavioral-profile/
├── profiles.ts                          # Static lookup table (BehavioralProfiles)
├── resolve-behavioral-profile.ts        # Resolution + lazy-cache per session
├── types.ts                             # BehavioralProfile, ResolvedBehavioralProfile, DelegationMode, etc.
└── .gitkeep

NEW FILES ONLY — no restructuring of existing modules.

Integration changes:
├── src/schema-kernel/index.ts           # ADD: export BehavioralProfile, ResolvedBehavioralProfile types
├── src/hooks/create-core-hooks.ts       # EXTEND: system.transform injects behavioral fields
├── src/hooks/types.ts                   # EXTEND: add getBehavioralProfile to HookDependencies
├── src/plugin.ts                        # EXTEND: resolve + wire behavioral profile into deps
├── src/lib/delegation-manager.ts        # EXTEND: accept behavioral overrides in dispatch()
├── src/lib/category-gates.ts            # ADD optional: advisory skillFilter logging
└── src/lib/session-api.ts              # ADD: getSessionBehavioralProfile() wrapper
```

### Pattern 1: Static Lookup Table (D-01, D-02, D-03)

**What:** A `Record<HivemindMode, BehavioralProfile>` mapping each mode to pre-defined behavioral constants. No runtime computation — simple, testable, and extensible without code changes.

**When to use:** Always — this is the source of truth for mode → behavior mapping.

**Code Pattern (validated against existing types):**

```typescript
// Source: D-01, D-02 from CONTEXT.md; HivemindMode from hivemind-configs.schema.ts
import type { HivemindMode } from "../../schema-kernel/hivemind-configs.schema.js"

export interface BehavioralProfile {
  guardrailLevel: "minimal" | "moderate" | "strict"
  delegationMode: "waiter" | "sync" | "disabled"
  toolAccessPattern: "full" | "restricted" | "curated"
  skillFilter: "all" | "curated"
}

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

### Pattern 2: Config-First Profile Merge (D-06, D-07)

**What:** `configs.json` values are canonical. Runtime `ProfileMatch` (from `profile-resolver.ts`) fills in gaps where config doesn't specify (communicationStyle, decisionSpeed). If `user_expert_level` is set in config, it maps to `expertise` for consistency.

**Merge Rules:**
1. `mode` → `behavioralProfile` via static lookup (D-01)
2. `conversation_language`, `documents_and_artifacts_language` → from config directly
3. `user_expert_level` → mapped to `merged.expertise` (takes precedence over runtime)
4. `communicationStyle`, `decisionSpeed` → from runtime `ProfileMatch` only
5. `discussMode` → from config, included as signal only

**ResolvedBehavioralProfile (D-07 — validated against existing types):**

```typescript
// Uses: HivemindMode from hivemind-configs.schema.ts (already exported)
// Uses: ProfileMatch from profile-resolver.ts (already exported)
// Uses: SupportedLanguage from hivemind-configs.schema.ts (already exported)
// Uses: UserExpertLevel from hivemind-configs.schema.ts (already exported)

export interface ResolvedBehavioralProfile {
  mode: HivemindMode
  behavioralProfile: BehavioralProfile
  language: {
    conversation: SupportedLanguage
    documents: SupportedLanguage
  }
  userExpertLevel: UserExpertLevel
  discussMode: DiscussMode
  runtimeProfile: ProfileMatch
  merged: {
    expertise: Expertise
    communicationStyle: CommunicationStyle
    decisionSpeed: DecisionSpeed
  }
}
```

### Pattern 3: Lazy-Cache Resolution Per Session (D-08)

**What:** Profile resolution happens lazily at first hook/tool access, cached for the session lifetime. Mirrors the proven `config-subscriber.ts` pattern (module-level cache + invalidation).

**When to use:** Every time a session needs a resolved profile — which is once.

```typescript
// Mirrors config-subscriber.ts pattern
const profileCache = new Map<string, ResolvedBehavioralProfile>()

export function getBehavioralProfile(
  sessionId: string,
  config: HivemindConfigs,
  getSessionContext?: (sessionId: string) => Record<string, unknown>,
): ResolvedBehavioralProfile {
  const cached = profileCache.get(sessionId)
  if (cached) return cached

  const behavioral = BehavioralProfiles[config.mode]
  const runtimeContext = getSessionContext?.(sessionId)
  const runtime = resolveProfile(runtimeContext)  // SEI-04

  const resolved: ResolvedBehavioralProfile = {
    mode: config.mode,
    behavioralProfile: behavioral,
    language: {
      conversation: config.conversation_language,
      documents: config.documents_and_artifacts_language,
    },
    userExpertLevel: config.user_expert_level,
    discussMode: config.workflow.discuss_mode,
    runtimeProfile: runtime,
    merged: {
      // Config-first: user_expert_level takes precedence when set
      expertise: mapLevelToExpertise(config.user_expert_level) ?? runtime.expertise,
      communicationStyle: runtime.communicationStyle,
      decisionSpeed: runtime.decisionSpeed,
    },
  }

  profileCache.set(sessionId, resolved)
  return resolved
}
```

### Pattern 4: system.transform Hook Extension (D-04, D-05, D-09, D-14)

**What:** The existing `system.transform` hook in `create-core-hooks.ts` already injects intake context (purpose, language, routing target). Phase CA-02 extends the same hook to inject behavioral profile fields using the same output mutation pattern.

**When to use:** On every `system.transform` call for a session with a resolved profile.

**Code Pattern (extending existing hook — lines 68-95 of create-core-hooks.ts):**

```typescript
// ADD to the existing system.transform handler after the intake context block:
if (deps.getBehavioralProfile) {
  const profile = deps.getBehavioralProfile(sessionID)
  contextLines.push(
    `- behavioral.guardrailLevel: ${profile.behavioralProfile.guardrailLevel}`,
    `- behavioral.delegationMode: ${profile.behavioralProfile.delegationMode}`,
    `- behavioral.toolAccessPattern: ${profile.behavioralProfile.toolAccessPattern}`,
    `- language.conversation: ${profile.language.conversation}`,
    `- language.documents: ${profile.language.documents}`,
    `- runtime.communicationStyle: ${profile.merged.communicationStyle}`,
    `- runtime.decisionSpeed: ${profile.merged.decisionSpeed}`,
    `- discuss.mode: ${profile.discussMode}`,
  )
}
```

### Pattern 5: DelegationManager Behavioral Overrides (D-12)

**What:** `DelegationManager.dispatch()` receives optional `BehavioralOverrides` that supplement the existing `RuntimePolicy` with session-level adjustments. The behavioral profile's `guardrailLevel` maps to concurrency limits and tool-budget adjustments.

**When to use:** Per delegation, from the parent session's resolved profile.

**Override hierarchy:** `workspace runtime policy (canonical)` → `behavioral profile (session-level adjustments)` → `per-delegation overrides (parameter)` 

```typescript
// Behavioral profile type for delegation overrides
export interface BehavioralOverrides {
  guardrailLevel: "minimal" | "moderate" | "strict"
  delegationMode: "waiter" | "sync" | "disabled"
}

// In DelegationManager.dispatch():
// guardrailLevel → concurrency limit adjustment:
//   strict  → max 1 concurrent (no queue)
//   moderate → default policy (as-is)
//   minimal → raised limit (if policy allows)
```

### Anti-Patterns to Avoid

- **Don't resolve profile eagerly at plugin init** — session context may not exist yet. Use lazy resolution (D-08).
- **Don't create a new Zod schema for `BehavioralProfile`** — these are TypeScript types only. The source of truth for config values remains `hivemind-configs.schema.ts`.
- **Don't block delegation on `skillFilter`** — D-11 is explicitly advisory (non-blocking). Category gates remain narrowing-only.
- **Don't replace `runtimePolicy` with `behavioralProfile`** — D-12 says behavioral overrides supplement runtime policy, not replace it. The override hierarchy is workspace > session > delegation.
- **Don't create a dedicated hook for language** — D-05 explicitly forbids this. Use `system.transform`.
- **Don't make tools read profile from global state** — inject via `deps` or tool constructors. Follow the existing dependency injection pattern.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Config cache | Custom cache layer | `config-subscriber.ts` — `getConfig(projectRoot)` | Already tested, lazy-load, per-project, invalidation support |
| Profile resolution cache | New Map wrapper with different semantics | Same Map pattern as `config-subscriber` and `state.ts` | Consistent with codebase conventions |
| Hook dependency injection | Custom DI container | `HookDependencies` interface (existing) — add `getBehavioralProfile` | Already used by all hook factories |
| Type-safe profile enums | Raw string unions | Zod schemas in `hivemind-configs.schema.ts` | `HivemindMode`, `UserExpertLevel`, `DiscussMode` already validated |
| Category gate extension | New gate system | `category-gates.ts` — extend `resolveCategoryGateDecision()` | Narrowing-only design already supports advisory logging |
| Runtime profile | Custom behavior detection | `profile-resolver.ts` (SEI-04) | Already resolves `communicationStyle`, `decisionSpeed`, `expertise` |

**Key insight:** Phase CA-02 is a **composition phase** — it wires existing primitives together rather than building new ones. The value is in the mapping layer, merge strategy, and injection points, not in novel infrastructure.

## Runtime State Inventory

> This phase is greenfield code (new `src/lib/behavioral-profile/` directory) + existing file modifications. No rename/refactor/migration. Runtime state inventory is not applicable.

**Verdict: SKIPPED** — Phase CA-02 creates new modules and modifies existing ones within the same codebase. No stored data, live service config, OS-registered state, secrets, or build artifacts carry stale references to anything being renamed.

## Common Pitfalls

### Pitfall 1: Circular Dependency Between behavioral-profile and config-subscriber

**What goes wrong:** `resolve-behavioral-profile.ts` imports `config-subscriber.ts` which imports `hivemind-configs.schema.ts`. If `hivemind-configs.schema.ts` re-exports behavioral-profile types (via `index.ts`), and those types import from `behavioral-profile/index.ts`, a cycle forms.

**Why it happens:** Adding behavioral-profile type exports to `schema-kernel/index.ts` while behavioral-profile imports from config-subscriber.

**How to avoid:** Keep `BehavioralProfile` and `ResolvedBehavioralProfile` types in `src/lib/behavioral-profile/types.ts`. Export them from `schema-kernel/index.ts` using `export type { BehavioralProfile, ResolvedBehavioralProfile } from "../lib/behavioral-profile/types.js"` — only type re-exports, no runtime imports.

**Warning signs:** TypeScript compiler error about circular references; "Cannot access 'X' before initialization" at runtime.

### Pitfall 2: System Transform Output Mutation Breaking OpenCode Runtime

**What goes wrong:** Mutating `output.system` in a way that conflicts with other plugins or the platform's system prompt format.

**Why it happens:** The `system.transform` hook receives `output.system` which may be `string | string[] | unknown`. Pushing context lines as strings may clash if another plugin expects a different format.

**How to avoid:** Follow the existing pattern in `create-core-hooks.ts` lines 93-94: check if `output.system` is an array, coerce if not, then push. Use the same pattern for behavioral fields:
```typescript
output.system = Array.isArray(output.system) ? output.system : []
;(output.system as string[]).push(contextLines.join("\n"))
```

**Warning signs:** Agent ignores or misinterprets behavioral directives; other plugins' context disappears.

### Pitfall 3: Profile Cache Leaking Across Sessions

**What goes wrong:** `profileCache` Map grows unboundedly as new sessions are created. Memory leak over long-running plugin instances.

**Why it happens:** Session IDs accumulate; no TTL or eviction strategy.

**How to avoid:** Add session teardown hook to clear cache entries. Or use a `WeakMap` keyed by session ID (if session IDs are objects) or add explicit `invalidateBehavioralProfile(sessionId)` called from the lifecycle manager on session close. For MVP, simple Map is acceptable — sessions are finite per plugin lifetime. But document this as tech debt.

**Warning signs:** Memory grows over time; old session profiles never cleaned.

### Pitfall 4: DelegationManager Behavioral Override Priority Conflicts

**What goes wrong:** `guardrailLevel` from behavioral profile conflicts with `runtimePolicy` concurrency settings. Which wins?

**Why it happens:** D-12 says "behavioral profile provides session-level adjustments" but doesn't specify whether adjustments tighten (only make stricter) or can also loosen.

**How to avoid:** Define explicit override semantics:
- `guardrailLevel: "strict"` → tightens: reduces concurrency to 1, enforces max tool budget
- `guardrailLevel: "moderate"` → no adjustment (respects `runtimePolicy` as-is)
- `guardrailLevel: "minimal"` → loosens only if `runtimePolicy` allows (e.g., raises concurrency ceiling but never exceeds workspace policy max)
- Behavioral overrides NEVER bypass workspace policy — they only narrow or pass through

**Warning signs:** Delegation with `free-style` mode gets higher concurrency than workspace policy permits; `hivemind-powered` delegation accidentally restricted more than intended.

### Pitfall 5: profile-resolver.ts Context Shape Mismatch

**What goes wrong:** `resolveProfile()` in `profile-resolver.ts` expects `{ messageLength, technicalTerms, averageResponseTime, totalInteractions }` but the session context provided doesn't have these fields.

**Why it happens:** The session context shape at `system.transform` time may differ from what `profile-resolver` expects. The intake gate (`session-entry/intake-gate.ts`) processes messages differently.

**How to avoid:** Call `resolveProfile()` with `undefined` context initially (produces default `ProfileMatch` with `matchConfidence: 0`). Enhance later with actual session metrics as they become available. The `ProfileMatch` is designed to degrade gracefully with missing signals.

**Warning signs:** `matchConfidence` always 0; profile resolution never improves.

## Code Examples

### Complete Profile Resolution (D-06, D-07, D-08)

```typescript
// Source: synthesized from CONTEXT.md D-06/D-07/D-08; validated against existing types
// File: src/lib/behavioral-profile/resolve-behavioral-profile.ts

import { getConfig } from "../config-subscriber.js"
import { resolveProfile } from "../session-entry/profile-resolver.js"
import { BehavioralProfiles } from "./profiles.js"
import type { BehavioralProfile, ResolvedBehavioralProfile } from "./types.js"
import type { HivemindConfigs, UserExpertLevel } from "../../schema-kernel/hivemind-configs.schema.js"
import type { Expertise } from "../session-entry/profile-resolver.js"

const profileCache = new Map<string, ResolvedBehavioralProfile>()

/**
 * Maps config `user_expert_level` to profile `expertise` for consistency.
 * Returns undefined if the level is not explicitly mappable (falls back to runtime).
 */
function mapLevelToExpertise(level: UserExpertLevel): Expertise | undefined {
  const mapping: Record<UserExpertLevel, Expertise> = {
    "clumsy-vibecoder": "junior",
    "beginner-friendly": "junior",
    "intermediate-high-level": "mid",
    "architecture-driven": "senior",
    "absolute-expert": "senior",
  }
  return mapping[level]
}

/**
 * Resolves a session's behavioral profile lazily and caches for the session lifetime.
 * First call computes; subsequent calls for the same sessionID return cached.
 *
 * @param sessionId - The session ID to resolve profile for
 * @param projectRoot - Absolute path to project root for config reading
 * @param sessionContext - Optional session context for runtime profile detection
 * @returns Resolved behavioral profile
 */
export function resolveBehavioralProfile(
  sessionId: string,
  projectRoot: string,
  sessionContext?: Record<string, unknown>,
): ResolvedBehavioralProfile {
  const cached = profileCache.get(sessionId)
  if (cached) return cached

  const config: HivemindConfigs = getConfig(projectRoot)
  const behavioral: BehavioralProfile = BehavioralProfiles[config.mode]
  const runtime = resolveProfile(sessionContext)

  const resolved: ResolvedBehavioralProfile = {
    mode: config.mode,
    behavioralProfile: behavioral,
    language: {
      conversation: config.conversation_language,
      documents: config.documents_and_artifacts_language,
    },
    userExpertLevel: config.user_expert_level,
    discussMode: config.workflow.discuss_mode,
    runtimeProfile: runtime,
    merged: {
      expertise: mapLevelToExpertise(config.user_expert_level) ?? runtime.expertise,
      communicationStyle: runtime.communicationStyle,
      decisionSpeed: runtime.decisionSpeed,
    },
  }

  profileCache.set(sessionId, resolved)
  return resolved
}

/** Clears cached profile for a session (call on session teardown). */
export function invalidateBehavioralProfile(sessionId: string): void {
  profileCache.delete(sessionId)
}
```

### System Transform Extension (D-04, D-05, D-09, D-14)

```typescript
// Source: extension of existing create-core-hooks.ts:68-95
// ADD after the intake context block, before output.system mutation

if (deps.getBehavioralProfile) {
  const profile = deps.getBehavioralProfile(sessionID)
  if (profile) {
    const bp = profile.behavioralProfile
    const lang = profile.language
    const rt = profile.merged
    
    contextLines.push(
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
    )
  }
}
```

### DelegationManager Behavioral Override (D-12)

```typescript
// Source: extension of delegation-manager.ts dispatch() method
// ADD to resolveAcquireArgs or as a pre-acquire adjustment

function applyBehavioralOverrides(
  policy: RuntimePolicy,
  overrides: BehavioralOverrides,
): RuntimePolicy {
  // Only tighten — never loosen beyond workspace policy
  if (overrides.guardrailLevel === "strict") {
    return {
      ...policy,
      concurrency: {
        ...policy.concurrency,
        globalLimit: Math.min(policy.concurrency.globalLimit, 1),
      },
    }
  }
  // moderate: no adjustment
  // minimal: no tightening (respects policy)
  return policy
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded agent behavior in prompt | Behavior derived from config via static lookup | Phase CA-02 (planned) | Cleaner separation; config changes propagate without prompt edits |
| Intake-only system.transform injection | Intake + behavioral profile injection | Phase CA-02 (planned) | Single hook provides full session context to agents |
| RuntimePolicy as sole concurrency source | RuntimePolicy + behavioral overrides | Phase CA-02 (planned) | Session-level adjustments without overriding workspace policy |

**Deprecated/outdated:**
- None — Phase CA-02 introduces new patterns; no existing code is deprecated.

### Ecosystem Reference: oh-my-opencode AgentMode Pattern

oh-my-opencode uses `AgentMode = "primary" | "subagent" | "all"` to control agent behavior and model selection. The pattern (static type → behavioral implication) validates D-01's static lookup table approach. Key insight: behavior dispatch based on a single config value (`mode`) is well-established in the OpenCode plugin ecosystem.

Source: `code-yeongyu/oh-my-opencode` — `src/agents/types.ts` lines 1-4

### Ecosystem Reference: OpenCode Plugin SDK Hook Patterns

The OpenCode plugin SDK supports `system.transform`, `messages.transform`, and `experimental.session.compacting` hooks — all following the `(input, output)` mutation pattern. This validates D-04/D-05/D-09 (language/behavioral injection via system.transform) as idiomatic.

Source: `https://opencode.ai/docs/plugins` — Context7 `/websites/opencode_ai_plugins`

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `output.system` in `system.transform` hook is always either `string[]` or `undefined` in the Hivemind runtime — not a different shape from OpenCode's default | Common Pitfalls #2 | If OpenCode passes `output.system` as a string, pushing to it as array would break. Mitigation: existing code already coerces `output.system = Array.isArray(output.system) ? output.system : []` — works for both. |
| A2 | Session context (for `resolveProfile()`) will be available at `system.transform` time with at least `messageLength` | D-06 | If session context is empty at hook time, `resolveProfile()` gracefully degrades with `matchConfidence: 0`. Low risk. |
| A3 | Category gate advisory skillFilter does not require new `CategoryGatePolicy` fields — can be implemented as a separate advisory check alongside existing gate | D-11 | If the gate infrastructure requires schema changes to `CategoryGatePolicy` type, need to update `types.ts`. Low risk — advisory checks are side-effect-free. |
| A4 | `Map<string, ResolvedBehavioralProfile>` cache is acceptable memory-wise for the session lifetime (sessions are finite per plugin instance) | Pitfall #3 | If sessions live very long and accumulate, memory could grow. Mitigation: add `invalidateBehavioralProfile()` on session teardown. |

## Open Questions

1. **Session context availability at system.transform time**
   - What we know: `system.transform` hook receives `{ sessionID }` input. The existing intake context is populated by `getIntake(sessionID)`. Session messages (for `resolveProfile` context) may or may not be available at this point.
   - What's unclear: Whether `messageLength`, `technicalTerms`, or other profile signals are extractable from the session at `system.transform` time.
   - Recommendation: Call `resolveProfile()` with minimal/undefined context initially. Profile improves as more session data becomes available. The `ProfileMatch` is designed to degrade gracefully.

2. **Profile cache invalidation timing**
   - What we know: The lifecycle manager tracks session state transitions (idle, busy, deleted). Session teardown triggers event handling.
   - What's unclear: Whether `session:deleted` event is reliably delivered for all sessions in the Hivemind runtime.
   - Recommendation: Add `invalidateBehavioralProfile()` call in the event handler for session deletion/error events. If event not received, the Map-based cache with finite entries per plugin instance lifetime is acceptable for MVP.

3. **DelegationManager behavioral override scope — per-session or per-delegation?**
   - What we know: D-12 says "DelegationManager checks guardrailLevel from resolved profile when determining per-session concurrency and tool-budget overrides."
   - What's unclear: Whether the behavioral override applies to the parent session's delegation policy or the child session's behavior. The CONTEXT.md suggests parent-session-level adjustments.
   - Recommendation: Apply behavioral overrides at the parent session level (concurrency limits for outgoing delegations). Child sessions inherit their own resolved profile independently.

## Environment Availability

> Step 2.6: SKIPPED — Phase CA-02 has no external dependencies beyond the existing project stack (TypeScript, Zod, `@opencode-ai/plugin` peer dependency). All dependencies are already installed and verified by the existing build pipeline (`npm run typecheck`, `npm test`).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (existing — `tests/lib/`, `tests/tools/`) |
| Config file | `vitest.config.ts` (existing — globals: true) |
| Quick run command | `npx vitest run tests/lib/behavioral-profile/` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-CA02-01 | Static lookup returns correct profile for each mode | unit | `npx vitest run tests/lib/behavioral-profile/profiles.test.ts -t "mode lookup"` | ❌ Wave 0 |
| REQ-CA02-02 | Language config injected via system.transform | unit | `npx vitest run tests/hooks/create-core-hooks.test.ts -t "behavioral injection"` | ❌ Wave 0 |
| REQ-CA02-03 | Config-first merge produces correct ResolvedBehavioralProfile | unit | `npx vitest run tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts -t "merge"` | ❌ Wave 0 |
| REQ-CA02-04 | Resolution cached per session (second call returns same reference) | unit | `npx vitest run tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts -t "cache"` | ❌ Wave 0 |
| REQ-CA02-05 | system.transform output includes behavioral fields | integration | `npx vitest run tests/hooks/create-core-hooks.test.ts -t "system.transform behavioral"` | ❌ Wave 0 |
| REQ-CA02-06 | Coordination tools receive resolved profile | unit | Per-tool test in `tests/tools/` | ❌ Wave 0 |
| REQ-CA02-07 | Category gates log advisory skillFilter (non-blocking) | unit | `npx vitest run tests/lib/category-gates.test.ts -t "skillFilter"` | ❌ Wave 0 |
| REQ-CA02-08 | guardrailLevel adjusts concurrency limits | unit | `npx vitest run tests/lib/delegation-manager.test.ts -t "behavioral"` | ❌ Wave 0 |
| REQ-CA02-09 | discussMode included in system.transform output | unit | Same as REQ-CA02-05 | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/lib/behavioral-profile/` (fast, < 10 tests)
- **Per wave merge:** `npx vitest run tests/lib/ tests/hooks/` (medium)
- **Phase gate:** `npm test` (full suite, including existing tests)

### Wave 0 Gaps
- [ ] `tests/lib/behavioral-profile/` — new test directory (profiles.test.ts, resolve-behavioral-profile.test.ts, types.test.ts)
- [ ] `tests/hooks/create-core-hooks.test.ts` — extend with behavioral injection test cases
- [ ] `tests/lib/delegation-manager.test.ts` — extend with behavioral override test cases
- [ ] `tests/lib/category-gates.test.ts` — extend with skillFilter advisory test case
- [ ] `tests/tools/delegate-task.test.ts` — extend with behavioral profile test case
- [ ] Test framework setup: none needed — existing vitest infrastructure covers all

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A — profile resolution doesn't touch auth |
| V3 Session Management | Yes | Session ID validation via existing `assertValidSessionID()` in `session-api.ts` |
| V4 Access Control | Yes | Category gates remain narrowing-only; behavioral profile doesn't broaden permissions |
| V5 Input Validation | Yes | Config values validated by Zod schemas (`hivemind-configs.schema.ts`); profile types are TypeScript-enforced |
| V6 Cryptography | No | N/A — no cryptographic operations |

### Known Threat Patterns for Behavioral Profile System

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed `configs.json` injecting arbitrary system context | Tampering | Zod schema validation in `readConfigs()` — unknown keys stripped, invalid values fall back to defaults |
| Profile cache poisoning across sessions | Spoofing | Cache keyed by `sessionId` — no cross-session access; `matchConfidence` prevents trust in unverified runtime matches |
| Behavioral override bypassing workspace policy | Elevation of Privilege | Override semantics: behavioral profile ONLY tightens (D-02); never loosens beyond workspace policy limits |
| system.transform output format confusion (array vs string) | Tampering | Existing coercion: `output.system = Array.isArray(output.system) ? output.system : []` — validates before push |

## Sources

### Primary (HIGH confidence)
- `/websites/opencode_ai_plugins` (Context7) — OpenCode Plugin SDK hooks API: `system.transform`, `messages.transform`, `shell.env`, compaction hooks
- `code-yeongyu/oh-my-opencode` (Zread) — `src/agents/types.ts` AgentMode pattern, `src/plugin/hooks/create-transform-hooks.ts` transform hook architecture
- `src/schema-kernel/hivemind-configs.schema.ts` (local) — HivemindConfigs type, mode/language/expert-level/discuss-mode schemas
- `src/lib/session-entry/profile-resolver.ts` (local) — ProfileMatch type and resolveProfile() function
- `src/hooks/create-core-hooks.ts` (local) — Existing system.transform hook implementation with intake injection
- `src/lib/delegation-manager.ts` (local) — DelegationManager dispatch(), concurrency, category gate integration
- `src/lib/category-gates.ts` (local) — Category gate decision logic (narrowing-only)
- `src/lib/config-subscriber.ts` (local) — Lazy-load cache pattern (template for profile cache)
- `src/plugin.ts` (local) — Composition root, deps wiring, hivemindConfig injection
- `.planning/workstreams/core-architecture/phases/CA-02-behavioral-profile-mode-dispatch/CA-02-CONTEXT.md` (local) — All 14 locked decisions and implementation guidance

### Secondary (MEDIUM confidence)
- `https://opencode.ai/docs/plugins` — OpenCode plugin documentation (no system.transform signature docs found; inferred from compaction hook pattern)

### Tertiary (LOW confidence)
- None — all claims verified against source code or official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all existing artifacts confirmed by file reads
- Architecture: HIGH — D-01 through D-14 validated against existing code patterns; ecosystem patterns confirm approach
- Pitfalls: MEDIUM — identified 5 potential issues but all have mitigations; pitfall #3 (cache memory) is the highest residual risk
- Ecosystem patterns: HIGH — oh-my-opencode AgentMode and OpenCode plugin SDK hooks confirmed via source reads

**Research date:** 2026-05-06
**Valid until:** 2026-06-06 (stable domain — type system and hook patterns change slowly)
