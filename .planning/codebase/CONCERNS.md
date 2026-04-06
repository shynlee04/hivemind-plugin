# Codebase Concerns

**Analysis Date:** 2026-04-06
**Project:** opencode-harness v0.1.0
**Phase:** Phase 1 — Consolidate

---

## Dead Code and Unused Files

### DC1: `agent-registry.ts` — Completely Dead (112 LOC)

- **File:** `src/lib/agent-registry.ts`
- **Evidence:** Zero imports from any production file in `src/`. Not re-exported from `src/index.ts`. Only imported by its own test (`tests/lib/agent-registry.test.ts`). Contains a hand-rolled YAML frontmatter parser (`parseAgentFrontmatter`), `getPermissionForTool`, and `isToolDenied` — none called anywhere.
- **Impact:** 112 LOC maintenance burden. `isToolDenied` checks for `{ "*": "deny" }` patterns no code path produces.
- **Fix:** Delete `src/lib/agent-registry.ts` and `tests/lib/agent-registry.test.ts`.

### DC2: `asString` Duplication (2 implementations, 16+ references)

- **Files:** `src/lib/helpers.ts:33` (exported) vs `src/lib/continuity.ts:110` (private, identical)
- **Evidence:** `continuity.ts` has its own private `asString` identical to `helpers.ts`. The helpers version is imported by `plugin.ts`, `session-api.ts`, `runtime.ts`, `lifecycle-manager.ts`. The continuity version used 16+ times internally.
- **Fix:** Import `asString` from `./helpers.js` in `continuity.ts`, delete local copy.

### DC3: `.opencode/trashskills/` — Dead Skills Directory

- **Directory:** `.opencode/trashskills/` (4 subdirs: `harness-overview/`, `planning-with-files/`, `shell-safety/`, `wisdom-accumulation/`)
- **Evidence:** Discarded skill versions, not registered as active skills. May confuse agents scanning `.opencode/`.
- **Fix:** Delete or move to `.archive/`.

### DC4: Hallucinated Features — Documented But Not Implemented

| Feature | Claimed In | Evidence of Absence |
|---------|-----------|---------------------|
| Auto-loop / Ralph-loop | `AGENTS.md:18`, `docs/draft/architecture-proposal-hivemind-v3.md:44` | grep for `auto-loop`, `ralph` in `src/` returns nothing |
| Session recovery | `AGENTS.md:18`, `architecture-proposal-hivemind-v3.md:48` | grep for `recovery`, `session.recover` in `src/` returns nothing |
| CLI substrate (`bin/`) | `architecture-proposal-hivemind-v3.md:184` | No `bin/` directory, no `hivemind-tools.cjs` |
| `harness-control-plane.ts` | `AGENTS.md:126`, `README.md:42` | File does not exist at `.opencode/plugins/harness-control-plane.ts` |
| **Fix:** Either implement or remove claims from docs. |

### DC5: Documentation-Code Mismatches

| Claim | Source | Actual |
|-------|--------|--------|
| `plugin.ts` <100 LOC, zero business logic | `AGENTS.md:7,44` | 477 LOC, contains permissions/routing/budgeting/circuit-breaker |
| Max 500 LOC per module | `AGENTS.md:70` | `lifecycle-manager.ts` (705), `continuity.ts` (638) exceed |
| `types.ts` is leaf | `AGENTS.md:47,66` | Imports `TaskStatus` from `task-status.js` — 1 dependency |
| Deepest chain: 2 levels | `AGENTS.md:68` | Actual: 5 levels (`lifecycle-manager` → `notification-handler` → `session-api` → `helpers` → `types` → `task-status`) |
| 6 agents / 5 skills / 6 commands | `AGENTS.md:128-130` | 18 agents / 16 skills / 12 commands exist |
| **Fix:** Update AGENTS.md to reflect reality. |

---

## Known Bugs

### HIGH Priority

#### BUG-1: Double-Compaction Counting

- **Files:** `src/plugins/prompt-enhance.ts` (event handler), `src/plugins/prompt-enhance.ts` (compacting hook)
- **Verified:** Yes — by `tests/plugins/prompt-enhance-compaction.test.ts` which expects `compaction_count: 1`
- **Symptom:** Both the `event` hook (listening for `session.compacted`) and `experimental.session.compacting` hook call `recordCompaction()`, resulting in count=2, budget=70% instead of count=1, budget=85% after a single compaction.
- **Impact:** Context budget tracked incorrectly, agents receive wrong context awareness data.
- **Fix:** Remove `session.compacted` handling from `event` hook. Keep `experimental.session.compacting` as the single compaction path. The test file already validates this fix pattern.

#### BUG-2: session-patch Heading Corruption

- **File:** `src/tools/session-patch/tools.ts:56-60`
- **Verified:** Yes — regex `(?:^|\n)(${escapedSection})[\s\S]*?(?=\n## |$)` with `match[1]` capture verified in code
- **Symptom:** The section-matching regex can match `## [Section]` as a substring inside `### [Section]`, corrupting heading levels when patching.
- **Trigger:** Patching a `## ` section when `### ` sections with similar names exist.
- **Impact:** File content corruption — wrong section content replaced.
- **Fix:** The current code already has `(?:^|\n)` anchor and uses `match[1]`. Verify this is correct. The audit report identified the original bug; the current code appears to have the fix applied. Verify with test.

#### BUG-3: Phantom Agent References in Orchestrator

- **File:** `.opencode/agents/hivefiver-orchestrator.md`
- **Verified:** Yes — audit confirmed references to non-existent agents
- **Symptom:** Execution loop references `prompt-skimmer`, `prompt-analyzer`, `context-mapper`, `risk-assessor`, `prompt-repackager` — none of which exist. Only `researcher`, `builder`, `critic` are defined.
- **Impact:** Task tool calls fail with "unknown agent" error when orchestrator attempts delegation.
- **Fix:** Replace phantom names: `prompt-skimmer` → `researcher`, `prompt-analyzer` → `critic`, `context-mapper` → `researcher`, `risk-assessor` → `critic`, `prompt-repackager` → `builder`.

### MEDIUM Priority

#### BUG-4: system-transform Gating

- **File:** `src/hooks/system-transform.ts`
- **Verified:** Yes — code review shows delegation check exists (lines 55-65), but the hook is still wired in `src/plugin.ts:324` and injects a 36-line YAML contract template
- **Symptom:** The `transformSystemPrompt` function checks for delegation metadata before injecting the prompt-enhance output contract. However, if the continuity store is not yet initialized for a delegated session, the delegation lookup throws and the function returns unchanged — meaning delegated sessions may not get the contract either.
- **Impact:** Either all sessions get the contract (wasting ~200 tokens) or delegated sessions miss it when continuity isn't initialized.
- **Fix:** The current gating logic (lines 55-65) appears correct. The concern is the `try/catch` silently swallowing errors during early session lifecycle. Add logging or defer injection until continuity is available.

#### BUG-5: Cross-Line Contradiction Detection in prompt-analyze

- **File:** `src/tools/prompt-analyze/tools.ts:82-105`
- **Verified:** Yes — code implements O(n²) cross-line comparison
- **Symptom:** The current code has BOTH per-line contradiction detection (lines 62-78) AND cross-line detection (lines 82-105). The per-line check produces false positives (e.g., "use foo but do not use bar" on the same line isn't a real contradiction). The cross-line check is O(n²) and flags all pairs, including some that aren't real contradictions.
- **Impact:** High false positive rate — agents get noise instead of signal. For a 100-line prompt, up to 4,950 pairs checked.
- **Fix:** Remove per-line contradiction check entirely. Keep only cross-line. Consider adding proximity filtering (only check lines within N lines of each other) to reduce noise.

### LOW Priority

#### BUG-6: Fake Context-Budget Model

- **File:** `src/tools/context-budget/tools.ts:31-34`
- **Verified:** Yes — budget calculation is hardcoded: `compactionCount === 0 ? 100 : compactionCount <= 2 ? 50 : 25`
- **Symptom:** The budget percentage (100%, 50%, 25%) has no relationship to actual context window usage. It's a step function based on compaction count alone.
- **Impact:** Misleading — agents think they have quantitative context data when it's just a rough heuristic.
- **Fix:** Rename to indicate it's a heuristic, or integrate with actual session message size tracking.

#### BUG-7: Dead Text Injection (messages-transform)

- **File:** `src/hooks/messages-transform.ts`
- **Verified:** Yes — `PROMPT_ENHANCE_TRIGGERS` array (lines 11-17) matches any mention of trigger phrases
- **Symptom:** Trigger detection matches casual mentions like "What does prompt-enhance do?" not just commands. Also inserts `role: "system"` messages that may break OpenCode's message sequence validation.
- **Impact:** Context packets injected unnecessarily. Potential API rejection if OpenCode doesn't allow system messages mid-conversation.
- **Fix:** Narrow trigger detection to command-like patterns (e.g., require line start, exact match). Consider using `role: "user"` instead of `role: "system"` for the injected context packet.

---

## Architecture Risks

### AR1: Module Size Violations

| Module | LOC | Limit | Over By |
|--------|-----|-------|---------|
| `src/lib/lifecycle-manager.ts` | 705 | 500 | 41% |
| `src/lib/continuity.ts` | 638 | 500 | 28% |
| `src/plugin.ts` | 477 | 100 (target) | 377% |

- **`lifecycle-manager.ts`:** The `observeBackgroundCompletion` method alone spans ~115 LOC (lines 584-698) with 4 nearly identical notification blocks for each completion signal type.
  - **Fix:** Extract `observeBackgroundCompletion` to `src/lib/background-observer.ts`. Deduplicate notification logic.
- **`continuity.ts`:** Contains normalization functions (lines 110-488), clone functions (lines 490-555), and CRUD (lines 557-638).
  - **Fix:** Split into `continuity-normalizer.ts`, `continuity-clone.ts`, and keep CRUD in `continuity.ts`.
- **`plugin.ts`:** Contains `getPermissionRulesForAgent()` (35 LOC), `AGENT_TOOLS` definitions, `AGENT_DEFAULTS`, circuit breaker logic, delegation routing (~130 LOC), and continuity snapshot building.
  - **Fix:** Extract to `src/lib/permissions.ts`, `src/lib/circuit-breaker.ts`, `src/lib/delegation-router.ts`. Target: plugin.ts under 150 LOC (pure wiring only).

### AR2: Module-Level Singleton in continuity.ts

- **File:** `src/lib/continuity.ts:26` — `let storeCache: ContinuityStoreFile | undefined`
- **Risk:** Module-level singleton prevents isolated unit testing. Tests share state. Cannot inject mock stores.
- **Impact:** `continuity.ts` (638 LOC) has zero test coverage — the singleton is a primary blocker.
- **Fix:** Convert to class-based store with injectable file path, or export `_resetStoreCache()` for test teardown.

### AR3: `as any` Casts in plugin.ts

- **File:** `src/plugin.ts:59` (2 casts), `src/plugin.ts:125` (1 cast)
- **Evidence:** `const tool = (OpenCodePlugin as { tool?: any }).tool as any` — violates "no any types on new code" rule (`AGENTS.md:108`).
- **Risk:** Type safety undermined at the composition root. SDK API changes won't be caught at compile time.
- **Fix:** Use proper type imports from `@opencode-ai/plugin`.

### AR4: Deceptive Type Definition

- **File:** `src/lib/types.ts:24`
- **Code:** `export type SessionStatusType = "idle" | "busy" | "retry" | string`
- **Risk:** Looks constrained but accepts any string due to `| string` union — TypeScript resolves the entire union to `string`.
- **Fix:** Either remove `| string` for true constraint, or just use `string` to be honest.

### AR5: `route` Field Not Deep-Cloned in continuity.ts

- **File:** `src/lib/continuity.ts` in `patchSessionContinuity` and `cloneContinuityRecord`
- **Risk:** `DelegationRouteResolution` contains `warnings: string[]` — a mutable array. `delegation`, `constraints`, `lifecycle` are explicitly deep-cloned. `route` is spread but `warnings` array is not copied.
- **Impact:** Callers can mutate the `warnings` array and corrupt internal state.
- **Fix:** Add explicit clone: `warnings: [...(patch.route.warnings ?? [])]`

### AR6: `noteObservedActivity` Bypasses `mapStatusToPhase`

- **File:** `src/lib/lifecycle-manager.ts:164`
- **Symptom:** Hardcodes phase to `"running"`. If a session is in `queued` or `dispatching` phase and a tool-activity observation comes in, phase incorrectly jumps to `running`.
- **Fix:** Use `this.mapStatusToPhase()` instead of hardcoding.

### AR7: Race Between `cancelDelegatedSession` and `observeBackgroundCompletion`

- **Files:** `src/lib/lifecycle-manager.ts:242-263` (cancel) vs `observeBackgroundCompletion` (lines 584-698)
- **Risk:** If `releaseQueue` reads state before cancel's patch is persisted, it overwrites with stale state. Currently safe because `patchSessionContinuity` is synchronous, but fragile.
- **Fix:** In `releaseQueue`, skip status/phase update if session is already in a terminal state.

### AR8: Silent Error Swallowing in continuity.ts

- **File:** `src/lib/continuity.ts:85-87` (load), `src/lib/continuity.ts:90-96` (persist)
- **Risk:** `loadStoreFromDisk` silently returns `emptyStore()` on parse errors — user loses all continuity history with zero feedback. `persistStore` silently swallows I/O errors — in-memory and on-disk states diverge undetected.
- **Fix:** At minimum, `console.warn` on failures. Better: return a Result type with error information.

---

## Security Concerns

### SEC1: File System Access in Tools

- **Files:** `src/tools/session-patch/tools.ts`, `src/tools/context-budget/tools.ts`, `src/plugins/prompt-enhance.ts`
- **Risk:** All tools accept arbitrary file paths from user input (`sessionFilePath` argument). No path validation or sandboxing. `session-patch` writes directly to disk with `writeFileSync`.
- **Impact:** A malicious or confused agent could write to arbitrary locations if given the right session-patch arguments.
- **Mitigation:** Current: none beyond OpenCode's permission system. Recommendation: validate paths are within workspace root before file operations.

### SEC2: `process.cwd()` in Tool Factories

- **Files:** `src/plugin.ts:440-443` — `createPromptSkimTool(process.cwd())`, etc.
- **Risk:** `process.cwd()` is captured at plugin initialization time. If the working directory changes, tools still use the original directory.
- **Impact:** Tools may operate on wrong directory in multi-project setups.
- **Mitigation:** Low risk — cwd rarely changes during OpenCode session. Consider passing cwd from context instead.

### SEC3: No Input Sanitization on Prompt Tools

- **Files:** `src/tools/prompt-skim/tools.ts`, `src/tools/prompt-analyze/tools.ts`
- **Risk:** `content` argument is a raw string processed with regex. No length limits. A very large input could cause ReDoS on the regex patterns (especially `CONTRADICTION_PAIRS` with O(n²) cross-line comparison).
- **Impact:** Performance degradation or hang on malicious input.
- **Mitigation:** Add content length limit (e.g., 50,000 chars) and regex timeout.

### SEC4: `.opencode/trashskills/` May Contain Stale Instructions

- **Directory:** `.opencode/trashskills/`
- **Risk:** Discarded skill files could contain outdated security guidance or permissions that conflict with current configuration.
- **Fix:** Delete the directory.

---

## Test Coverage Gaps

### TC1: Zero Coverage for Critical Modules

| Module | LOC | Tests | Risk |
|--------|-----|-------|------|
| `src/lib/lifecycle-manager.ts` | 705 | 0 | **Highest** — orchestration engine |
| `src/lib/continuity.ts` | 638 | 0 | **Highest** — persistence layer |
| `src/lib/state.ts` | 106 | 0 | **Medium** — budget tracking |
| `src/lib/concurrency.ts` | 98 | 0 | **Medium** — queue logic |
| `src/lib/runtime.ts` | 69 | 0 | **Low** — event mapping |
| `src/hooks/system-transform.ts` | 66 | 0 | **Medium** — system prompt injection |
| `src/hooks/messages-transform.ts` | 92 | 0 | **Medium** — message transformation |
| `src/plugins/prompt-enhance.ts` | 103 | 3 | **Low** — partial coverage |

**Total untested: 1,876 LOC (56% of codebase).**

### TC2: `agent-registry.test.ts` Tests Dead Code

- **File:** `tests/lib/agent-registry.test.ts`
- **Risk:** Tests a module (`agent-registry.ts`) that is not imported by any production code. Gives false confidence.
- **Fix:** Delete alongside the dead code.

### TC3: Integration Tests Reference Non-Existent Pipeline

- **File:** `tests/integration/prompt-enhance-pipeline.test.ts`
- **Risk:** Tests a "pipeline" that doesn't exist as an executable surface. Tests pass against mocks but don't validate real behavior.
- **Fix:** Either implement the pipeline or convert tests to unit tests for individual components.

---

## Phase 1 Cleanup Targets

### Priority P0 — Fix Immediately (Blocks Correct Operation)

| # | Issue | File(s) | Effort |
|---|-------|---------|--------|
| 1 | Double-compaction counting | `src/plugins/prompt-enhance.ts` | Small — remove event handler compaction |
| 2 | Delete dead `agent-registry.ts` | `src/lib/agent-registry.ts`, `tests/lib/agent-registry.test.ts` | Small — delete 2 files |
| 3 | Fix `asString` duplication | `src/lib/continuity.ts` | Small — import from helpers |
| 4 | Delete `.opencode/trashskills/` | `.opencode/trashskills/` | Small — delete directory |

### Priority P1 — Fix Soon (Functional Bugs)

| # | Issue | File(s) | Effort |
|---|-------|---------|--------|
| 5 | Gate system-transform properly | `src/hooks/system-transform.ts` | Small — already gated, verify edge cases |
| 6 | Cross-line contradiction noise | `src/tools/prompt-analyze/tools.ts` | Medium — remove per-line check, tune cross-line |
| 7 | `route` field deep-clone | `src/lib/continuity.ts` | Small — add warnings array clone |
| 8 | `noteObservedActivity` phase bypass | `src/lib/lifecycle-manager.ts:164` | Small — use `mapStatusToPhase` |
| 9 | Silent error swallowing | `src/lib/continuity.ts:85-96` | Small — add console.warn |
| 10 | `as any` casts | `src/plugin.ts:59,125` | Small — proper SDK types |

### Priority P2 — Structural Cleanup

| # | Issue | File(s) | Effort |
|---|-------|---------|--------|
| 11 | Split `lifecycle-manager.ts` (705 LOC) | `src/lib/lifecycle-manager.ts` → `background-observer.ts` | Medium |
| 12 | Split `continuity.ts` (638 LOC) | `src/lib/continuity.ts` → `continuity-normalizer.ts` + `continuity-clone.ts` | Medium |
| 13 | Reduce `plugin.ts` (477 LOC → <150) | `src/plugin.ts` → `permissions.ts` + `circuit-breaker.ts` + `delegation-router.ts` | Medium |
| 14 | Fix deceptive `SessionStatusType` | `src/lib/types.ts:24` | Trivial |
| 15 | Update AGENTS.md to reflect reality | `AGENTS.md` | Small — documentation only |

### Priority P3 — Test Coverage

| # | Issue | Target | Effort |
|---|-------|--------|--------|
| 16 | Test `continuity.ts` | `tests/lib/continuity.test.ts` | Large — 638 LOC |
| 17 | Test `lifecycle-manager.ts` | `tests/lib/lifecycle-manager.test.ts` | Large — 705 LOC |
| 18 | Test `concurrency.ts` | `tests/lib/concurrency.test.ts` | Small — 98 LOC |
| 19 | Test `state.ts` | `tests/lib/state.test.ts` | Small — 106 LOC |
| 20 | Test hooks | `tests/hooks/` | Medium — 158 LOC combined |

---

## Verified vs Documented Issues

| Issue | Status | Source |
|-------|--------|--------|
| Double-compaction counting | **Verified** — code has both paths | `prompt-enhance.ts` event + compacting hooks |
| agent-registry.ts dead code | **Verified** — zero production imports | grep of entire `src/` |
| asString duplication | **Verified** — identical implementations | `helpers.ts:33` vs `continuity.ts:110` |
| .opencode/trashskills/ exists | **Verified** — 4 subdirs present | `find .opencode/trashskills` |
| lifecycle-manager 705 LOC | **Verified** — `wc -l` | File system |
| continuity.ts 638 LOC | **Verified** — `wc -l` | File system |
| plugin.ts 477 LOC | **Verified** — `wc -l` | File system |
| 5-level dependency chain | **Verified** — import graph analysis | `lifecycle-manager` → `notification-handler` → `session-api` → `helpers` → `types` → `task-status` |
| No circular dependencies | **Verified** — acyclic | tsc --noEmit passes |
| 3 `as any` casts | **Verified** — `src/plugin.ts:59,125` | Code inspection |
| Hallucinated features (auto-loop, recovery, CLI, control-plane) | **Verified** — grep returns nothing | `src/` search |
| `.opencode/tools/` empty | **Verified** — directory exists but empty | `ls .opencode/tools/` |
| types.ts imports task-status | **Verified** — `types.ts:1` | `import type { TaskStatus } from "./task-status.js"` |
| system-transform gating | **Documented as fix** — code appears to have gating logic already | `system-transform.ts:55-65` |
| session-patch regex | **Documented as fix** — code appears to have anchor already | `session-patch/tools.ts:56-60` |
| Cross-line contradiction | **Documented as fix** — code appears to have O(n²) check already | `prompt-analyze/tools.ts:82-105` |

---

*Concerns audit: 2026-04-06*
