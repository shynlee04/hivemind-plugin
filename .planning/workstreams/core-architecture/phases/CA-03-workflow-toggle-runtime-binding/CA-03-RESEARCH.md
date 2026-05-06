# Phase CA-03: Workflow Toggle Runtime Binding - Research

**Researched:** 2026-05-06
**Domain:** Runtime configuration binding — hook-level toggle gating, governance block injection, execution field consumption
**Confidence:** HIGH

## Summary

Phase CA-03 bridges the gap between CA-01 (config schema v2 + subscriber) and CA-02 (behavioral profile resolution) by wiring 21 config values into observable runtime behavior. Currently `getConfig()` loads configs at plugin init and `resolveBehavioralProfile()` is wired into deps, but **no hook, tool, or command gates behavior on workflow toggles or governance fields**. CA-03 delivers five artifacts: (1) a structured governance block injected into `system.transform`, (2) six toggle consumers at the hook level, (3) three execution field consumers in `src/lib/` modules, (4) JSDoc annotations for seven future toggles, and (5) retroactive validation of 17 blocked UATs from CA-01 and CA-02.

The implementation is a direct extension of existing, well-established patterns: `create-core-hooks.ts` already injects behavioral profile context into `system.transform` (lines 100-124), `HookDependencies` already carries `hivemindConfig` (line 38), and `config-subscriber.ts` provides lazy-cached configs via `getConfig()`. No new libraries, no architectural departures, no schema changes — pure wiring of existing toggles to existing hook/tool/module consumers.

**Primary recommendation:** Extend `createCoreHooks` to inject governance block and toggle-gate all hook factories; add toggle checks to `DelegationManager`, `continuity.ts`, and `delegation-persistence.ts` at their natural entry points. Follow the TDD pattern established in `tests/hooks/create-core-hooks.test.ts` — use authentic config objects, not mocks. Target 17 new test cases minimum (one per blocked UAT + toggle-specific behavior tests).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Governance block injection | Hook (system.transform) | — | CQRS read-side: system prompt injection is pure observation |
| Workflow toggle gating | Hook (various) | Tool (defensive) | Toggle checks in hooks gate whether feature activates; tools check defensively |
| Execution field consumption | `src/lib/` (deep modules) | — | Module-level behavior control — parallelization, persistence, document write |
| JSDoc future consumer tags | Schema Kernel | — | Co-located with field definitions for discoverability |
| UAT retro-validation | Test layer | — | Vitest test evidence with pass/fail results |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 6.0.3 | Language | Project standard; strict mode with `verbatimModuleSyntax` |
| Node.js | v25.9.0 | Runtime | Project requirement (>= 20.0.0) |
| Vitest | 4.1.5 | Test framework | Project standard; globals enabled, coverage thresholds enforced |
| Zod | 4.4.3 | Schema validation | Schema kernel foundation; v4 factory defaults pattern established |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@opencode-ai/plugin` | >= 1.1.0 | Hook system | `system.transform`, `event`, `shell.env` hook signatures |
| `node:fs` | built-in | File reads | Config subscriber disk reads (via `readConfigs()`) |

No new dependencies required. Phase CA-03 is pure wiring of existing toggles to existing consumers.

**Installation:**
```bash
# No new packages needed — pure code wiring
npm install   # already satisfied
```

**Version verification:** All versions confirmed via `npm view` on 2026-05-06 — vitest@4.1.5, zod@4.4.3, typescript@6.0.3. [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                       .hivemind/configs.json                       │
│                   (13 toggles + 3 exec fields + 4 governance)      │
└──────────────┬───────────────────────────────────────────────────┘
               │ readConfigs() at plugin init
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    config-subscriber.ts                            │
│              getConfig() → lazy cache → HivemindConfigs            │
└──────────────┬───────────────────────────────────────────────────┘
               │ injected into HookDependencies.hivemindConfig
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                        plugin.ts                                   │
│          deps = { hivemindConfig, getBehavioralProfile, ... }     │
└──────────┬──────────────┬────────────────┬───────────────────────┘
           │              │                │
           ▼              ▼                ▼
┌─────────────────┐ ┌──────────────┐ ┌──────────────────────────┐
│ createCoreHooks │ │ toolGuards   │ │ src/lib/ modules          │
│                 │ │              │ │                           │
│ system.transform│ │ tool.execute │ │ DelegationManager         │
│ ─ governance    │ │ .before      │ │  ─ parallelization check  │
│ ─ toggle gates  │ │  ─ toggle    │ │ continuity.ts             │
│                 │ │    checks    │ │  ─ atomic_commit check    │
│                 │ │              │ │ delegation-persistence.ts │
│                 │ │              │ │  ─ commit_docs check      │
└─────────────────┘ └──────────────┘ └───────────────────────────┘
```

### Recommended Project Structure

No new files or directories. All changes are modifications to existing modules:
```
src/
├── hooks/
│   ├── create-core-hooks.ts          # MODIFY: governance block + toggle gates
│   └── create-tool-guard-hooks.ts    # MODIFY: defensive toggle checks
├── lib/
│   ├── delegation-manager.ts         # MODIFY: parallelization toggle check
│   ├── continuity.ts                 # MODIFY: atomic_commit toggle check
│   └── delegation-persistence.ts    # MODIFY: commit_docs toggle check
├── schema-kernel/
│   └── hivemind-configs.schema.ts   # MODIFY: @future-consumer JSDoc tags
└── plugin.ts                         # No change needed
tests/
├── hooks/
│   └── create-core-hooks.test.ts     # MODIFY: governance block + toggle tests
├── lib/
│   ├── delegation-manager.test.ts    # MODIFY: parallelization test
│   ├── continuity.test.ts            # MODIFY: atomic_commit test
│   └── delegation-persistence.test.ts # MODIFY: commit_docs test
```

### Pattern 1: Governance Block Injection (D-05, D-06, D-07)

**What:** A structured "--- Governance ---" block appended to `system.transform` output as an imperative instruction set, followed by field:value context lines for runtime metadata. Always active — non-negotiable reminder before every prompt.

**When to use:** Every `system.transform` invocation that has a sessionID. No toggle gating needed — governance block is always injected (D-07).

**Source:** [CITED: CA-03-CONTEXT.md D-05, D-06, D-07] + existing behavioral profile injection pattern at `create-core-hooks.ts:100-124`

**Schema:** Output format matches hybrid instruction + fields per D-06:
```
--- Governance ---
You are operating in expert-advisor mode. Communicate at intermediate-high level. Use en for all conversation and documents.
communicationStyle: detailed | decisionSpeed: deliberate | expertise: intermediate-high
```

**Data source mapping:**
| Governance Block Field | Config Source | Behavioral Profile Field |
|------------------------|---------------|--------------------------|
| Mode instruction | `config.mode` | `profile.mode` |
| Expertise instruction | `config.user_expert_level` | `profile.userExpertLevel` |
| Language instruction | `config.conversation_language`, `config.documents_and_artifacts_language` | `profile.language` |
| `communicationStyle:` | — | `profile.merged.communicationStyle` |
| `decisionSpeed:` | — | `profile.merged.decisionSpeed` |
| `expertise:` | — | `profile.merged.expertise` (from `mapLevelToExpertise()` or runtime) |

### Pattern 2: Toggle Gating (D-03, D-08 through D-13)

**What:** Consistent pattern across all 6 wired toggles:
1. Hook factory reads toggle from `deps.hivemindConfig.workflow.<toggle>`
2. When toggle is `false`, hook returns early (no-op)
3. Tool defensive check: before execution, tool reads toggle and returns explanatory message if off

**Source:** [CITED: CA-03-CONTEXT.md D-03, D-08 through D-13]

**Toggle → Consumer → Mechanism table:**

| Toggle | Consumer | Mechanism | When `false` |
|--------|----------|-----------|-------------|
| `research` | `research_before_questions` gate + research-phase hooks | Hook-level early return | Skip research-related skill loading and hook injection |
| `plan_check` | Plan verification hooks | Hook-level early return | Skip post-plan quality checks |
| `verifier` | Verification-phase hooks | Hook-level early return | Skip implementation verification steps |
| `discuss_mode` | Discuss-phase workflow routing | Config value controls intensity | `skip-phase-discussion` bypasses discussion |
| `use_worktrees` | Git worktree isolation hooks | Hook-level early return | Skip worktree creation for parallel tasks |
| `research_before_questions` | Pre-question web search hooks | Hook-level early return (toggle=true enables behavior) | When `true`, research context gathered before questions |

**Anti-patterns to avoid:**
- **Toggle-as-blocker in tool.execute.before:** Do NOT throw on toggle `false` in tool guard hooks. Tool guards are for circuit breaker / budget enforcement. Toggle gating in hooks should be no-op (return early), not block. The tool defensive check pattern (return explanatory message) is for tools that read their own toggle pre-execution.

### Execution Field Consumer Pattern (D-14 through D-17)

**What:** Three `src/lib/` modules read execution field toggles at their natural entry points to control core behavior.

**Source:** [CITED: CA-03-CONTEXT.md D-14 through D-17]

| Field | Consumer Module | Entry Point | When `false` |
|-------|----------------|-------------|-------------|
| `parallelization` | `delegation-manager.ts` | `dispatch()` method before wave dispatch | Delegations are sequential |
| `atomic_commit` | `continuity.ts` | `persistStore()` or write entry point | State changes are batched |
| `commit_docs` | `delegation-persistence.ts` | `persistDelegations()` | Document auto-commit skipped |

All three default to `true` (schema defaults preserved from CA-01).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Config toggle reading | Custom config reader | `deps.hivemindConfig.workflow.<toggle>` from HookDependencies | Already loaded, cached, typed — zero overhead |
| Governance block format | Custom format builder | Template string with conditional instruction mapping | Simple, predictable, testable — no parser needed downstream |
| Toggle state management | Custom toggle state tracker | Zod schema defaults + config-subscriber cache | Schema is single source of truth; cache already exists |
| System prompt injection | Custom prompt modification | `system.transform` hook (existing pattern at line 68-125) | Established OpenCode hook surface; already handles intake + behavioral injection |
| Concurrency control | Custom parallelization logic | DelegationManager wave dispatch (existing) | Already controls delegation dispatch; just add gate |

**Key insight:** CA-03 is pure integration — every toggle already has a consumer module with a clear entry point. The work is wiring, not building. Don't create new abstractions; don't introduce new state management. The config subscriber pattern already handles caching, the hook dependency injection already delivers configs, and the behavioral profile resolution already provides merged runtime context.

## Common Pitfalls

### Pitfall 1: Governance Block in Wrong Position
**What goes wrong:** Governance block injected after existing intake/behavioral context instead of before them (or as a separate system message instead of appended to existing output.system array).
**Why it happens:** The existing pattern at `create-core-hooks.ts:76` ensures `output.system` is an array, then pushes intake context, then behavioral context. Adding governance before intake violates the existing pattern intent.
**How to avoid:** Governance block should be injected BEFORE intake and behavioral blocks (it's a non-negotiable reminder that frames everything else). Insert at position 0 of the system array.
**Warning signs:** Tests showing governance block after behavioral profile context.

### Pitfall 2: Toggle Default False Surprises
**What goes wrong:** All six wired toggles have `default: true` in the schema (except `use_worktrees` which defaults to `false`). A toggle check that treats `undefined` as `false` would flip behavior when config is missing.
**Why it happens:** Zod `.default()` only applies during `.parse()` — if the raw config gets into code via a non-Zod path, the default may not be applied.
**How to avoid:** Always read toggles via `deps.hivemindConfig.workflow.<toggle>` (which went through Zod parsing) or via `getConfig()` / `getCachedConfig()`. Never read from raw JSON directly.
**Warning signs:** Tests passing in dev (config present) but failing in production (missing config).

### Pitfall 3: Execution Field Consumer Ordering
**What goes wrong:** `parallelization` toggle checked too late in `DelegationManager.dispatch()` — after wave dispatch is already in progress.
**Why it happens:** The dispatch flow is complex: category gate → depth check → concurrency acquire → spawn request → session create → prompt send. Adding the toggle check after concurrency acquire is too late.
**How to avoid:** Add toggle check as the FIRST step in `dispatch()`, before any other logic. Similarly for `atomic_commit` in `continuity.ts` — check before any persistence mutation.
**Warning signs:** Delegations still dispatched concurrently even when toggle is `false`.

### Pitfall 4: D-20 TDD No-Mock Violation
**What goes wrong:** Tests use `vi.mock()` or similar to mock out toggle values instead of constructing real config objects.
**Why it happens:** Convenience — mocking is easier than assembling full config objects for each test case.
**How to avoid:** D-20 explicitly forbids mocks: "Strict TDD with authentic behaviors — no mocks allowed." Construct `HivemindConfigs` objects using `HivemindConfigsSchema.parse({...})` with explicit field overrides. The existing `create-core-hooks.test.ts` demonstrates this pattern with `createFakeBehavioralProfile()` — follow that.
**Warning signs:** `vi.mock(...)` or `vi.fn()` used for config manipulation in CA-03 tests. The only acceptable `vi.fn()` usage is for lifecycleManager (as in existing tests).

## Code Examples

Verified patterns from the codebase:

### Governance Block Injection in system.transform

```typescript
// Source: create-core-hooks.ts:68-125 (existing behavioral profile injection pattern)
// Extension point: governance block BEFORE intake/behavioral blocks

"system.transform": async (input: SystemInput, output: SystemOutput): Promise<void> => {
  const sessionID = asString(getNestedValue(input, ["sessionID"]))
  if (!sessionID) return

  output.system = Array.isArray(output.system) ? output.system : []

  // CA-03: Governance block — always active (non-negotiable)
  if (deps.hivemindConfig) {
    const cfg = deps.hivemindConfig
    const profile = deps.getBehavioralProfile?.(sessionID)
    const governanceLines = buildGovernanceBlock(cfg, profile)
    ;(output.system as string[]).push(governanceLines)
  }

  // Existing: intake context injection
  if (deps.getIntake) { /* ... unchanged */ }

  // Existing: behavioral profile injection
  if (deps.getBehavioralProfile) { /* ... unchanged */ }
}
```

### Toggle Gating Pattern (Hook-Level Early Return)

```typescript
// Source: D-03, D-08 — Consistent pattern for all 6 wired toggles
// Example: research_before_questions toggle

function createResearchHook(deps: HookDependencies) {
  return async (input: ResearchInput, output: ResearchOutput): Promise<void> => {
    // Gate: skip if toggle is false
    if (!deps.hivemindConfig?.workflow.research_before_questions) {
      return  // no-op
    }
    // ... research logic
  }
}
```

### Execution Field Consumer Pattern

```typescript
// Source: D-14 — DelegationManager parallelization check
// In dispatch() method, BEFORE any other logic:

async dispatch(params: DelegateParams): Promise<Delegation> {
  // CA-03: parallelization toggle check (D-14)
  const config = getConfig(this.projectRoot)
  if (!config.parallelization) {
    // Sequential mode: acquire exclusive concurrency lock
    return this.dispatchSequential(params)
  }
  // ... existing parallel dispatch logic
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Configs loaded but not consumed | Configs gated via hook-level toggle checks | CA-03 | Toggles become observable in runtime behavior |
| Field:value-only behavioral block | Hybrid instruction+fields governance block | CA-03 | Mode/expertise/language become imperative instructions |
| Execution fields inert | Execution fields consumed by modules | CA-03 | parallelization/atomic_commit/commit_docs control runtime |

**Deprecated/outdated:**
- Nothing deprecated — CA-03 is additive. All existing patterns remain valid.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `system.transform` hook receives `input.sessionID` for every invocation | Code Examples | LOW — verified in existing tests; null sessionID already handled by early return |
| A2 | `DelegationManager` can access project root for `getConfig()` call | Common Pitfalls | MEDIUM — `projectDirectory` is available in plugin.ts but may not be accessible from DelegationManager constructor; may need to inject projectRoot into DelegationManager or read config via a different path |
| A3 | `continuity.ts` `persistStore()` / atomic write entry point can cleanly gate on `atomic_commit` without breaking existing durability guarantees | Common Pitfalls | MEDIUM — continuity.ts has complex persistence logic with deep-clone and quarantine; adding a toggle gate at the wrong point could skip critical writes |
| A4 | Seven future toggles' consumer modules exist and are correctly identified in D-18 mapping | Future Toggle Documentation | LOW — consumer modules all exist in `src/`; assignment is based on module responsibility match |
| A5 | All 17 blocked UATs can be re-validated with vitest evidence — no infrastructure gaps | UAT Retro-validation | LOW — vitest 4.1.5 installed, test infrastructure proven, all 17 UATs describe testable behaviors |

## Open Questions

1. **DelegationManager projectRoot access (A2)**
   - What we know: `plugin.ts` passes `projectDirectory` to `getConfig()` at init; `DelegationManager` is instantiated in `plugin.ts` but doesn't currently receive `projectRoot`
   - What's unclear: Whether `DelegationManager` needs `projectRoot` injected or can use `getCachedConfig()` since plugin.ts already calls `getConfig()` before DelegationManager construction
   - Recommendation: Use `getCachedConfig()` in DelegationManager — the plugin init order ensures config is cached before any dispatch. No constructor changes needed.

2. **continuity.ts atomic_commit gating point (A3)**
   - What we know: `continuity.ts` has `persistStore()`, `recordSessionContinuity()`, and `patchSessionContinuity()` as write entry points
   - What's unclear: Whether batching (atomic_commit=false) means queue writes and flush periodically, or skip writes entirely
   - Recommendation: Per D-15: "When false, state changes are batched." Batching means accumulate writes in memory, flush at lifecycle events (session idle/complete). Never skip writes entirely — would lose state.

3. **Toggle defensive checks in tools**
   - What we know: D-03 says "Tools read toggles defensively (don't proceed if toggle off)." But D-03 also says hooks are primary gating.
   - What's unclear: For which tools should defensive checks be added, and at which tool entry points?
   - Recommendation: Defensive checks are secondary to hook-level gating. Add defensive checks only to tools where a hook bypass could reach the tool directly (e.g., `delegate-task` checking `parallelization`, `configure-primitive` checking relevant workflow toggle). Not all toggles have tool-level consumers — most are hook-level only.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | v25.9.0 | — |
| npm | Package management | ✓ | (bundled) | — |
| vitest | Test execution | ✓ | 4.1.5 | — |
| TypeScript | Compilation | ✓ | 6.0.3 | — |
| Zod | Schema validation | ✓ | 4.4.3 | — |

No missing dependencies. Phase CA-03 has zero new external dependencies — pure code wiring.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.5 |
| Config file | `vitest.config.ts` (globals: true, coverage thresholds) |
| Quick run command | `npx vitest run tests/hooks/create-core-hooks.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-05/D-06/D-07 | Governance block injected in system.transform with correct format | unit | `npx vitest run tests/hooks/create-core-hooks.test.ts -t "governance"` | ❌ Wave 0 |
| D-08 | `research` toggle gates research-phase hooks | unit | `npx vitest run tests/hooks/create-core-hooks.test.ts -t "research toggle"` | ❌ Wave 0 |
| D-09 | `plan_check` toggle gates plan verification hooks | unit | `npx vitest run tests/hooks/create-core-hooks.test.ts -t "plan_check toggle"` | ❌ Wave 0 |
| D-10 | `verifier` toggle gates verification-phase hooks | unit | `npx vitest run tests/hooks/create-core-hooks.test.ts -t "verifier toggle"` | ❌ Wave 0 |
| D-11 | `discuss_mode` controls discuss-phase routing | unit | `npx vitest run tests/hooks/create-core-hooks.test.ts -t "discuss_mode"` | ❌ Wave 0 |
| D-12 | `use_worktrees` toggle gates worktree isolation hooks | unit | `npx vitest run tests/hooks/create-core-hooks.test.ts -t "use_worktrees"` | ❌ Wave 0 |
| D-13 | `research_before_questions` toggle gates pre-question research hooks | unit | `npx vitest run tests/hooks/create-core-hooks.test.ts -t "research_before_questions"` | ❌ Wave 0 |
| D-14 | `parallelization` consumed by DelegationManager | unit | `npx vitest run tests/lib/delegation-manager.test.ts -t "parallelization"` | ❌ Wave 0 |
| D-15 | `atomic_commit` consumed by continuity.ts | unit | `npx vitest run tests/lib/continuity.test.ts -t "atomic_commit"` | ❌ Wave 0 |
| D-16 | `commit_docs` consumed by delegation-persistence.ts | unit | `npx vitest run tests/lib/delegation-persistence.test.ts -t "commit_docs"` | ❌ Wave 0 |
| D-18 | @future-consumer JSDoc annotations on 7 toggles | static analysis | `npx vitest run tests/schema-kernel/hivemind-configs.schema.test.ts` | ❌ Wave 0 |
| CA-01-UAT #1-10 | 10 blocked CA-01 UATs re-validated | regression | `npx vitest run tests/schema-kernel/hivemind-configs.schema.test.ts tests/lib/config-subscriber.test.ts tests/hooks/create-core-hooks.test.ts` | ❌ Wave 0 |
| CA-02-UAT #1-7 | 7 blocked CA-02 UATs re-validated | regression | `npx vitest run tests/hooks/create-core-hooks.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose` (relevant test file)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green + coverage above thresholds (85/72/85/85) before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/hooks/create-core-hooks.test.ts` — needs governance block tests + 6 toggle gating tests (extend existing file)
- [ ] `tests/lib/delegation-manager.test.ts` — needs parallelization toggle test
- [ ] `tests/lib/continuity.test.ts` — needs atomic_commit toggle test
- [ ] `tests/lib/delegation-persistence.test.ts` — needs commit_docs toggle test
- [ ] `tests/schema-kernel/hivemind-configs.schema.test.ts` — needs @future-consumer annotation test
- [ ] Framework install: `npm install` — already satisfied

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — (plugin within OpenCode process, no external auth) |
| V3 Session Management | no | — (OpenCode manages sessions natively) |
| V4 Access Control | no | — (CQRS boundary enforced by hook-cqrs-boundary.ts) |
| V5 Input Validation | yes | Zod v4 schemas — all config reads go through `HivemindConfigsSchema.parse()` |
| V6 Cryptography | no | — (no cryptographic operations) |

### Known Threat Patterns for Toggle Binding

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Config bypass via raw JSON read (bypassing Zod defaults) | Tampering | Always read toggles via `deps.hivemindConfig.workflow.<toggle>` (Zod-parsed) |
| Toggle state inconsistency across hooks and tools | Tampering | Single source of truth: config-subscriber cache + Zod defaults |
| Governance block injection manipulated by upstream hooks | Tampering | Governance block is last-in wins in `system.transform`; upstream hooks can only append, not remove |

## Sources

### Primary (HIGH confidence)
- `src/schema-kernel/hivemind-configs.schema.ts` (385 LOC) — Full config schema v2: 13 toggles, 3 execution fields, governance fields [VERIFIED: codebase]
- `src/hooks/create-core-hooks.ts` (157 LOC) — system.transform hook with behavioral profile injection [VERIFIED: codebase]
- `src/hooks/types.ts` (45 LOC) — HookDependencies with hivemindConfig and getBehavioralProfile [VERIFIED: codebase]
- `src/plugin.ts` (183 LOC) — Composition root wiring config + behavioral profile into deps [VERIFIED: codebase]
- `src/lib/config-subscriber.ts` (78 LOC) — Lazy-load config cache [VERIFIED: codebase]
- `tests/hooks/create-core-hooks.test.ts` (548 LOC) — TDD pattern reference: fake deps, authentic profiles, no mocks [VERIFIED: codebase]
- CA-03-CONTEXT.md — 21 locked decisions D-01 through D-21 [CITED: planning artifacts]

### Secondary (MEDIUM confidence)
- `@opencode-ai/plugin` Context7 docs — Confirmed `system.transform` hook signature, injection pattern [VERIFIED: Context7 /websites/opencode_ai_plugins]
- `.planning/codebase/ARCHITECTURE.md` — CQRS separation, 9-surface mutation authority, hook factory pattern [CITED: project docs]
- CA-01-01-SUMMARY.md + CA-01-02-SUMMARY.md — Confirmed schema v2 structure and config subscriber existence [CITED: planning artifacts]

### Tertiary (LOW confidence)
- None — all claims verified against source code or planning artifacts.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies; existing vitest/zod/typescript confirmed via npm registry
- Architecture: HIGH — all patterns (CQRS, hook DI, config-subscriber, behavioral injection) verified in source code
- Pitfalls: MEDIUM — derived from architectural analysis of existing code; A2 and A3 flagged for planner attention

**Research date:** 2026-05-06
**Valid until:** 2026-06-06 (30 days — stable; no fast-moving external dependencies)
