# Harness Audit Report — 2026-04-06

## Executive Summary

- **Overall health: WARNING** — Core functionality exists and tests pass, but critical architectural claims are false, key features are hallucinated, and the plugin layer violates its own design principles.
- **Critical issues: 10**
- **Warnings: 12**
- **Info: 7**

The harness delivers real value in **delegation, continuity persistence, task queuing, and completion detection**. But it also carries significant debt: the plugin layer is 5× its size target and contains business logic it shouldn't, 3 major features are claimed but don't exist, and documentation is increasingly disconnected from code reality.

---

## Critical Issues (Must Fix)

### C1: plugin.ts — 491 LOC, target <100 (4.9× over budget)
- **Location:** `src/plugin.ts`
- **Description:** The composition root is the second-largest file in the codebase. It contains: `getPermissionRulesForAgent()` (35 LOC), `AGENT_TOOLS` definitions, `AGENT_DEFAULTS`, `normalizeCategory()`, `isValidAgent()`, circuit breaker logic in `tool.execute.before` hook, tool call budget enforcement, delegation routing logic in `delegate-task` tool handler (~130 LOC), continuity snapshot building in `experimental.session.compacting` hook, and inline composition of `PromptEnhancePlugin`.
- **Impact:** Core architectural principle ("zero business logic in plugin layer") is violated. The plugin is not assembly — it IS the routing, permissions, budgeting, and guardrails engine.
- **Evidence:** `wc -l src/plugin.ts` → 491. Read lines 35-491 show business logic throughout.

### C2: lifecycle-manager.ts — 705 LOC (41% over 500 limit)
- **Location:** `src/lib/lifecycle-manager.ts`
- **Description:** Largest module in the codebase. The `observeBackgroundCompletion()` method alone spans 115 LOC (lines 584-698).
- **Impact:** Violates max module size rule. Changes to this file risk cascading failures across the delegation system.
- **Evidence:** `wc -l src/lib/lifecycle-manager.ts` → 705.

### C3: continuity.ts — 638 LOC (28% over 500 limit)
- **Location:** `src/lib/continuity.ts`
- **Description:** Contains normalization functions (lines 110-488), clone functions (lines 490-555), and CRUD functions (lines 557-638). Module-level `storeCache` singleton prevents isolated unit testing.
- **Impact:** Oversized, untestable in isolation. Own code smell notes recommend splitting into `continuity-normalizer.ts` + `continuity-clone.ts` + `continuity.ts`.
- **Evidence:** `wc -l src/lib/continuity.ts` → 638.

### C4: "Zero business logic in plugin layer" — HALLUCINATION
- **Location:** `AGENTS.md:7`
- **Description:** The claim is documented as a core principle but the implementation is the opposite. plugin.ts contains all routing, permissions, budgeting, and circuit breaker logic.
- **Impact:** Anyone reading AGENTS.md will have a fundamentally wrong mental model of the architecture.

### C5: "Auto-loop / Ralph-loop" — HALLUCINATION
- **Location:** `AGENTS.md:18`, `architecture-proposal-hivemind-v3.md:44`
- **Description:** No `auto-loop`, `ralph-loop`, or `ralph` references exist anywhere in `src/`. No self-referential loop mechanism is implemented.
- **Impact:** Claimed runtime feature does not exist. Users expecting autonomous retry loops will be disappointed.

### C6: "Session recovery" — HALLUCINATION
- **Location:** `AGENTS.md:18`, `architecture-proposal-hivemind-v3.md:48`
- **Description:** No `recovery`, `session.recover`, or `session_recovery` references in `src/`. Continuity persistence exists but no automatic recovery logic.
- **Impact:** Claimed runtime feature does not exist. Failed sessions do not auto-recover.

### C7: CLI substrate — HALLUCINATION
- **Location:** `architecture-proposal-hivemind-v3.md:184`
- **Description:** No `bin/` directory exists. No `hivemind-tools.cjs` file anywhere. The "script rule" (report facts, leave judgment to agent) has no enforcement mechanism.
- **Impact:** All tool operations must go through plugin hooks. No standalone CLI for harness management.

### C8: harness-control-plane.ts — HALLUCINATION
- **Location:** `AGENTS.md:126`, `README.md:42`
- **Description:** File does not exist at `.opencode/plugins/harness-control-plane.ts`. Only `prompt-enhance.ts` exists in `.opencode/plugins/`.
- **Impact:** README.md and AGENTS.md document a non-existent integration point. Misleading for anyone trying to use the package.

### C9: "types.ts is leaf" — HALLUCINATION
- **Location:** `AGENTS.md:47`, `AGENTS.md:66`
- **Description:** `types.ts` imports `TaskStatus` from `task-status.js` (line 1). NOT a leaf — has 1 dependency. `task-status.ts` is the true leaf.
- **Impact:** Dependency graph documentation is wrong. Affects understanding of change ripple effects.

### C10: Dependency chain is 5 levels, not 2
- **Location:** `AGENTS.md:68`
- **Description:** Actual deepest chain: `lifecycle-manager → notification-handler → session-api → helpers → types → task-status` = 5 levels. Claim of 2 levels is wrong.
- **Impact:** Changes to `task-status.ts` ripple through 5 levels, not 2. Much higher blast radius than documented.

---

## Warnings (Should Fix)

### W1: agent-registry.ts and notification-handler.ts not re-exported
- **Location:** `src/index.ts`
- **Description:** These modules (112 + 85 = 197 LOC) are listed in the project structure but not exported from the public API.
- **Impact:** Consumers of the package cannot access agent definitions or notification handling.

### W2: hooks/, plugins/, schema-kernel/, shared/, tools/ not re-exported
- **Location:** `src/index.ts`
- **Description:** 1,009 LOC across 5 directories exists but is not part of the public API surface. Tool factory functions (`createPromptSkimTool`, etc.) are inaccessible to package consumers.
- **Impact:** These modules are internal-only despite being structured as reusable components.

### W3: 3 `as any` casts in plugin.ts
- **Location:** `src/plugin.ts:59` (2 casts), `src/plugin.ts:125` (1 cast)
- **Description:** Violates "no any types on new code" rule.
- **Impact:** Type safety undermined at the composition root.

### W4: 5 of 11 lib modules lack unit tests
- **Location:** `tests/lib/`
- **Description:** Missing tests for: `lifecycle-manager` (705 LOC), `continuity` (638 LOC), `state` (106 LOC), `concurrency` (98 LOC), `runtime` (69 LOC). These are the most critical modules.
- **Impact:** The two largest modules (which most need test coverage) have zero tests.

### W5: hf-* commands reference external worktree paths
- **Location:** `.opencode/commands/hf-audit.md`, `hf-create.md`, `hf-stack.md`
- **Description:** These commands reference `@/Users/apple/hivemind-plugin/.worktrees/hivefiver-v2/.opencode/hivefiver/workflows/...` — an absolute path to a different worktree.
- **Impact:** These commands will fail if the `hivefiver-v2` worktree doesn't exist or is at a different path. Not portable.

### W6: deep-init.md and deep-research-synthesis-repomix.md lack frontmatter
- **Location:** `.opencode/commands/deep-init.md`, `deep-research-synthesis-repomix.md`
- **Description:** These are the two largest command files (303 LOC and 620 LOC respectively) but have no YAML frontmatter (no `description:`, no `agent:`, no `subtask:`).
- **Impact:** OpenCode cannot route these commands properly. They may not appear in command lists.

### W7: .opencode/hivefiver/ contains symlinks to external worktree
- **Location:** `.opencode/hivefiver/references → ../../.hivefiver-meta-builder/references-lab/active/refactoring`
- **Description:** Symlinks point outside this repo. If the target worktree is deleted or moved, these break silently.
- **Impact:** Fragile cross-worktree dependency.

### W8: .opencode/trashskills/ exists (dead code)
- **Location:** `.opencode/trashskills/`
- **Description:** Contains 4 directories: `harness-overview`, `planning-with-files`, `shell-safety`, `wisdom-accumulation`. These appear to be discarded skill versions.
- **Impact:** Clutters the project. May confuse agents that scan `.opencode/` for available skills.

### W9: hooks are minimal (138 LOC vs 800 target)
- **Location:** `src/hooks/`
- **Description:** Only `messages-transform.ts` (92 LOC) and `system-transform.ts` (46 LOC). No event-handler, soft-governance, or sdk-context hooks as proposed.
- **Impact:** Hook system is underdeveloped relative to architecture proposal.

### W10: shared is minimal (80 LOC vs 800 target)
- **Location:** `src/shared/`
- **Description:** `tool-helpers.ts` (9 LOC) and `tool-response.ts` (71 LOC). Far less than the 800 LOC target.
- **Impact:** Shared utilities are thin. Most logic lives in plugin.ts instead.

### W11: asString duplication confirmed
- **Location:** `helpers.ts:33` and `continuity.ts:110`
- **Description:** Identical `asString` function implemented in two files.
- **Impact:** Maintenance burden. Change in one location won't propagate to the other.

### W12: continuity.ts module-level singleton
- **Location:** `continuity.ts:26`
- **Description:** `let storeCache: ContinuityStoreFile | undefined` — module-level singleton prevents isolated unit testing.
- **Impact:** Tests share state. Cannot test continuity store in isolation.

---

## Informational

### I1: Agent count — 18 exist, 6 documented
AGENTS.md lists 6 agents. Actual count is 18: the 6 canonical ones plus `context-mapper`, `context-purifier`, `hivefiver-*` (4), `prompt-analyzer`, `prompt-repackager`, `prompt-skimmer`, `risk-assessor`.

### I2: Skill count — 16 exist, 5 documented
AGENTS.md lists 5 skills. Actual count is 16. Target was ~20, so this is within bounds but documentation is outdated.

### I3: Command count — 12 exist, 6 documented
AGENTS.md lists 6 commands. Actual count is 12: the 6 canonical ones plus `harness-audit`, `hf-audit`, `hf-create`, `hf-prompt-enhance`, `hf-stack`.

### I4: Total codebase — 3,384 LOC (within 4,000-5,000 target)
All `.ts` files in `src/` total 3,384 LOC. Within the lower bound of the target range.

### I5: Tests — 18 files, 279 tests, all passing
`npm test` passes. Good coverage of tools (9 test files) but gaps in lib modules.

### I6: No circular dependencies — VERIFIED
Import graph is strictly acyclic. This claim is accurate.

### I7: Dual-layer state — VERIFIED
Durable JSON file (`continuity.ts`) + in-memory Maps (`state.ts`) with `hydrateFromContinuity()` bridge. Working correctly.

---

## Claim vs Reality Table

| Claim | Source | Status | Evidence |
|-------|--------|--------|----------|
| plugin.ts <100 LOC, zero business logic | AGENTS.md:7,44 | HALLUCINATION | 491 LOC, contains permissions/routing/budgeting/circuit-breaker |
| Max 500 LOC per module | AGENTS.md:70,109 | GAP | lifecycle-manager (705), continuity (638) exceed |
| types.ts is leaf | AGENTS.md:47,66 | HALLUCINATION | Imports TaskStatus from task-status |
| Deepest chain: 2 levels | AGENTS.md:68 | HALLUCINATION | Actual: 5 levels |
| No circular dependencies | AGENTS.md:69 | MATCH | Verified acyclic |
| Auto-loop / Ralph-loop | AGENTS.md:18 | HALLUCINATION | Not implemented |
| Session recovery | AGENTS.md:18 | HALLUCINATION | Not implemented |
| Background agents | AGENTS.md:18 | MATCH | observeBackgroundCompletion() implemented |
| Delegation + task persistence | AGENTS.md:18 | MATCH | continuity.ts + lifecycle-manager.ts |
| Task queuing | AGENTS.md:18 | MATCH | DelegationConcurrencyQueue in concurrency.ts |
| Category system | AGENTS.md:18 | GAP | Enum exists, no per-category presets |
| CLI substrate (bin/) | arch-proposal:184 | HALLUCINATION | No bin/ directory |
| harness-control-plane.ts | AGENTS.md:126 | HALLUCINATION | File doesn't exist |
| 5 tools (~500 LOC) | arch-proposal:156 | MATCH | 485 LOC across 4 tool directories + delegate-task |
| hooks (~800 LOC) | arch-proposal:163 | GAP | 138 LOC (83% under) |
| lifecycle (~400 LOC) | arch-proposal:169 | GAP | 705 LOC (76% over) |
| continuity (~400 LOC) | arch-proposal:179 | GAP | 638 LOC (60% over) |
| shared (~800 LOC) | arch-proposal:200 | GAP | 80 LOC (90% under) |
| delegation module (~400 LOC) | arch-proposal:174 | ORPHAN | Fused into lifecycle-manager + plugin |
| Total ~4,000-5,000 LOC | AGENTS.md:143 | MATCH | 3,384 LOC |
| ~20 SKILL.md files | AGENTS.md:144 | MATCH | 16 files |
| No any types | AGENTS.md:108 | GAP | 3 `as any` casts in plugin.ts |
| Deep-clone-on-read | AGENTS.md:105 | MATCH | 7 clone* functions verified |
| [Harness] error prefix | AGENTS.md:106 | MATCH | All Error() calls use prefix |
| Dual-layer state | AGENTS.md:107 | MATCH | JSON file + Maps verified |
| Node >= 20.0.0 | package.json | MATCH | Verified |
| Peer dep @opencode-ai/plugin >= 1.1.0 | package.json | MATCH | Verified |
| Runtime env var overrides | AGENTS.md:36 | MATCH | resolveContinuityFilePath() checks both |
| 6 agents | AGENTS.md:128 | GAP | 18 agents exist |
| 5 skills | AGENTS.md:129 | GAP | 16 skills exist |
| 6 commands | AGENTS.md:130 | GAP | 12 commands exist |
| Tests mirror src/lib/ | AGENTS.md:94 | GAP | 6 of 11 modules tested |
| 279 tests, all passing | npm test | MATCH | Verified |
| asString duplicated | src/lib/AGENTS.md | MATCH | Confirmed in helpers.ts + continuity.ts |
| storeCache singleton | src/lib/AGENTS.md | MATCH | continuity.ts:26 |
| Static .md agent definitions | AGENTS.md:140 | GAP | 18 static .md files exist (claimed as "templates only") |

---

## Context Poisoning Map

| Artifacts | Overlap Type | Risk | Description |
|-----------|-------------|------|-------------|
| `hf-audit` + `harness-audit` | Ambiguous routing | MEDIUM | Both trigger on "audit" — user may not know which to use |
| `hf-create` + `meta-builder` + `skill-synthesis` | Trigger overlap | MEDIUM | All respond to "create a skill" type requests |
| `deep-init.md` (no frontmatter) | Missing routing | HIGH | No agent assignment — OpenCode cannot route this command |
| `deep-research-synthesis-repomix.md` (no frontmatter) | Missing routing | HIGH | No agent assignment — OpenCode cannot route this command |
| `hf-*` commands → external worktree | Broken dependency | HIGH | Commands reference `/Users/apple/hivemind-plugin/.worktrees/hivefiver-v2/...` — will fail if worktree doesn't exist |
| `ultrawork.md` → "do not ask for clarification" | Conflicting instruction | MEDIUM | Contradicts coordinator's clarification protocol in AGENTS.md |
| `.opencode/trashskills/` | Confusion risk | LOW | Dead skills in `.opencode/` may be scanned by agents |

---

## Cross-Platform Matrix

| Factor | macOS | Linux | Windows |
|--------|-------|-------|---------|
| Path separators | ✅ POSIX | ✅ POSIX | ⚠️ Uses `path.resolve()` — should work |
| `.opencode/state/` path | ✅ | ✅ | ⚠️ Hardcoded `.opencode` — may need adjustment |
| `process.cwd()` | ✅ | ✅ | ✅ |
| `rmSync` in clean script | ✅ | ✅ | ✅ |
| `find` in commands | ✅ | ✅ | ❌ Not native on Windows |
| `wc -l` in commands | ✅ | ✅ | ❌ Not native on Windows |
| External worktree paths | ⚠️ Absolute macOS path | ❌ Will fail | ❌ Will fail |
| `#!/usr/bin/env` scripts | N/A (none) | N/A | N/A |

---

## What Actually Works (Genuinely Useful)

These are the harness features that are **implemented, tested, and functional**:

1. **Delegated session creation** — `delegate-task` tool in plugin.ts creates subagent sessions with proper parent tracking
2. **Continuity persistence** — JSON-based durable state survives session restarts
3. **Task queuing** — Keyed semaphore with FIFO per model+agent+category
4. **Completion detection** — Two-signal (event + message stability) detection
5. **Background session monitoring** — `observeBackgroundCompletion()` polls for async results
6. **Prompt tools** — `prompt-skim`, `prompt-analyze`, `context-budget`, `session-patch` all wired and tested
7. **Circuit breaker** — Tool call budget enforcement in `tool.execute.before` hook
8. **Lifecycle state machine** — Full session lifecycle tracking with phases
9. **Parent chain walking** — `walkParentChain()` for delegation depth tracking
10. **279 passing tests** — Good coverage of tools and helper modules

---

## Recommendations (Prioritized)

### P0 — Fix Documentation Lies
1. Update AGENTS.md to reflect actual state: plugin.ts is 491 LOC with business logic, 18 agents, 16 skills, 12 commands
2. Remove claims for auto-loop, session recovery, CLI substrate, harness-control-plane.ts — or implement them
3. Fix "types.ts is leaf" and "2-level dependency chain" to accurate statements

### P1 — Reduce plugin.ts Size
4. Extract `getPermissionRulesForAgent()` → `src/lib/permissions.ts`
5. Extract circuit breaker logic → `src/lib/circuit-breaker.ts`
6. Extract delegation routing → `src/lib/delegation-router.ts`
7. Extract tool budgeting → `src/lib/tool-budget.ts`
8. Target: plugin.ts under 150 LOC (pure wiring only)

### P2 — Split Oversized Modules
9. Split `lifecycle-manager.ts` (705 LOC) — extract `observeBackgroundCompletion()` to `background-observer.ts`
10. Split `continuity.ts` (638 LOC) — extract normalization and clone functions per own code smell notes

### P3 — Fix Governance Issues
11. Add YAML frontmatter to `deep-init.md` and `deep-research-synthesis-repomix.md`
12. Fix hf-* commands to use relative paths or remove external worktree dependency
13. Remove or archive `.opencode/trashskills/`
14. Re-export `agent-registry.ts` and `notification-handler.ts` from `src/index.ts`

### P4 — Test Coverage
15. Add tests for `lifecycle-manager.ts` (705 LOC, 0 tests)
16. Add tests for `continuity.ts` (638 LOC, 0 tests)
17. Add tests for `concurrency.ts`, `state.ts`, `runtime.ts`

### P5 — Clean Up
18. Remove 3 `as any` casts from plugin.ts
19. Consolidate duplicated `asString` function
20. Replace module-level `storeCache` singleton with injectable dependency
