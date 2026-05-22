# Hard Restructuring — Cluster Map

**Date:** 2026-05-21
**Evidence Level:** L2-L3 (code analysis + file-system evidence + synthesis of 6 deep-analysis reports)
**Scope:** Full `src/` surface — 227 source files, ~36,082 LOC
**Sources:** CONCERNS.md, ARCHITECTURE.md, STRUCTURE.md, hard-restructuring-synthesis, hard-restructuring-map-full, hard-restructuring-advisor, HIVEMIND-PHILOSOPHY.md, ROADMAP.md

---

## Executive Summary

The Hivemind harness is in a **transitional but fundamentally healthy state**. The factory-injection DI pattern is consistent across ~90% of modules, the SDK contract (v1.15.5) is correctly implemented, and the CQRS boundary is conceptually sound. However, accumulated baggage from rapid development creates **structural risk** for the next 15+ phases of work.

**Key findings:**
- **~1,769 LOC of dead/unwired code** across 11 subsystems (prompt-packet, journal, sidecar, 3 dead schemas, 2 dead transforms, session-classification-hook, schema-normalizer, concurrency-key, deprecated profile methods)
- **3 CRITICAL findings:** stale `dist/` (38 artifacts), 18 unused npm dependencies (including React ecosystem), `permission.schema.ts` enum bug
- **6 HIGH findings:** SDK hook mismatches, delegation dual-facade, config singleton, no typed error hierarchy, fire-and-forget promises, documentation drift
- **~3,765 LOC untested** across routing, config, features, and session-view
- **2 LOC-cap violations** (event-capture.ts at 702, session-tracker/index.ts at 561) and 6 near-cap files
- **4 CQRS violations** (tool-after-workflow durable writes, noop assertHookWriteBoundary, session-api leaf violation, dual delegation stores)

**Recommended approach:** Non-destructive first pass (dead code deletion, dist rebuild, hook cleanup, enum bugfix) → then destructive second pass (async I/O, error typing, plugin decomposition, CQRS enforcement, module splits). This minimizes regression risk while creating a clean slate for architecture work.

---

## Cluster Health Matrix

### CL-01: Composition Root (plugin.ts + index.ts)

| File | LOC | Status | Tested | Wired | Quality Issue | Action |
|------|-----|--------|--------|-------|---------------|--------|
| `src/plugin.ts` | 493 | ACTIVE | Partial | ✅ | Near 500 LOC cap; 5 fire-and-forget promises; sync I/O in startup; 2 extra non-SDK hooks; temporal coupling in setupDelegationModules | REFACTOR |
| `src/index.ts` | 30 | ACTIVE | N/A | ✅ | Clean barrel | KEEP |

**Design flaws:** Fire-and-forget promise hygiene (Anti-Pattern 2); temporal coupling (Anti-Pattern 5); legacy migration code runs every startup; inline tool.execute.after (25 lines).
**Dependencies:** All layers (tools, hooks, coordination, task-management, features, routing, config).
**Recommended action:** REFACTOR — extract to startup.ts, tool-registry.ts, hook-composition.ts.

### CL-02: Task-Management (continuity + journal + trajectory + lifecycle)

| Module | LOC | Status | Tested | Wired | Quality Issue | Action |
|--------|-----|--------|--------|-------|---------------|--------|
| `continuity/index.ts` | 467 | ACTIVE | ✅ | ✅ | Near cap (33 lines); 9 legacy refs; sync I/O | KEEP (async conversion in Phase 21) |
| `continuity/delegation-persistence.ts` | 196 | ACTIVE | ✅ | ✅ | 9 sync I/O calls in runtime path | KEEP (async conversion) |
| `continuity/store-cache.ts` | 34 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `journal/` (4 files) | 540 | **DESIGNED_ONLY** | ✅ | ❌ **UNWIRED** | No runtime callers; 540 LOC of audit trail with no trigger | REWRITE (wire or delete) |
| `lifecycle/index.ts` | 242 | ACTIVE | ✅ | ✅ | Silent catch blocks for best-effort replay | KEEP |
| `trajectory/` (3 files) | 411 | ACTIVE | ❌ | ✅ | File I/O; no dedicated tests for trajectory.schema.ts | KEEP |

**Design flaws:** Journal subsystem is fully designed but unwired — 540 LOC with zero runtime consumers. Continuity store uses sync I/O in runtime paths.
**Dependencies:** coordination (delegation), shared (types, session-api), features (session-tracker).
**Recommended action:** KEEP continuity/lifecycle/trajectory; REWRITE journal (decision needed: wire into lifecycle handler or formally defer).

### CL-03: Coordination (delegation + completion + concurrency + spawner + command-delegation + sdk-delegation)

| Module | LOC | Status | Tested | Wired | Quality Issue | Action |
|--------|-----|--------|--------|-------|---------------|--------|
| `delegation/manager.ts` | 362 | MIGRATIONAL | ✅ | ✅ | Thin facade — v1/v2 dual-path; 362 LOC of indirection | REFACTOR |
| `delegation/manager-runtime.ts` | 478 | ACTIVE | ✅ | ✅ | Near cap (22 lines); 15 imports from 10 modules | REFACTOR |
| `delegation/coordinator.ts` | 445 | ACTIVE | ✅ | ✅ | 2nd in-memory delegation store (parallel to state-machine) | REFACTOR |
| `delegation/state-machine.ts` | 443 | ACTIVE | ✅ | ✅ | 1st in-memory delegation store | KEEP |
| `delegation/completion-detector.ts` | 273 | ACTIVE | ✅ | ✅ | Naming collision with completion/detector.ts | REFACTOR (rename) |
| `delegation/` (other 12 files) | ~1,300 | ACTIVE | ✅ | ✅ | notification-formatter could merge with notification-router | CONSOLIDATE (2 files) |
| `completion/detector.ts` | 226 | ACTIVE | ✅ | ✅ | Canonical watcher — naming collision | REFACTOR (rename) |
| `completion/notification-handler.ts` | 242 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `concurrency/queue.ts` | 300 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `command-delegation/handler.ts` | 416 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `sdk-delegation/handler.ts` | 324 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `spawner/` (5 files) | ~300 | ACTIVE | ✅ | ✅ | concurrency-key.ts is near-dead (12 LOC) | DELETE (1 file) |

**Design flaws:** DelegationManager dual-path (Anti-Pattern 4); two in-memory delegation stores with potential drift; naming collision between two "completion-detector" files.
**Dependencies:** task-management (lifecycle, continuity), features (background-command/PTY, session-tracker), shared (state, types, runtime-policy).
**Recommended action:** REFACTOR (manager.ts unification, naming fixes, store consolidation) — but defer to post-Phase 25 (forward-looking).

### CL-04: Tools Surface (config + delegation + hivemind + session + prompt)

| Sub-group | Files | LOC | Status | Tested | Quality Issue | Action |
|-----------|-------|-----|--------|--------|---------------|--------|
| `config/` (4 files) | 4 | 864 | ACTIVE | ✅ | configure-primitive.ts at 490 LOC; wide import path | REFACTOR |
| `delegation/` (3 files) | 3 | 326 | ACTIVE | ✅ (3 files) | delegation-status renderV2 too dense | REFACTOR |
| `hivemind/` (7 files) | 7 | 836 | ACTIVE | ⚠️ 1 untested | 3 session tools mislocated; session-view has NO tests | CONSOLIDATE |
| `session/` (4 files) | 4 | 439 | ACTIVE | ✅ | execute-slash-command: envelope divergence, no Zod schema | REFACTOR |
| `prompt/` (6 files) | 6 | 448 | ACTIVE | ✅ | _projectRoot unused in 2 files | KEEP |

**Design flaws:** 3 session tools (session-context, session-hierarchy, session-tracker) mislocated under hivemind/ instead of session/; execute-slash-command is the only tool NOT using renderToolResult(); 5 tools use wide `@opencode-ai/plugin` import instead of narrow `/tool`.
**Dependencies:** schema-kernel, shared, coordination, features, config, routing.
**Recommended action:** CONSOLIDATE (relocate session tools), REFACTOR (envelope consistency, import standardization, configure-primitive split).

### CL-05: Routing (session-entry + behavioral-profile + command-engine)

| Module | LOC | Status | Tested | Wired | Quality Issue | Action |
|--------|-----|--------|--------|-------|---------------|--------|
| `session-entry/` (5 files) | 542 | ACTIVE | ❌ **NONE** | ✅ | Fragile substring matching; dead registry validator; no tests | REFACTOR |
| `behavioral-profile/` (4 files) | 277 | ACTIVE | ❌ **NONE** | ✅ | Dead no-op methods (L93-102); deprecated profile methods | REFACTOR |
| `command-engine/` (2 files) | 398 | ACTIVE | ❌ **NONE** | ✅ | No tests | KEEP (add tests) |

**Design flaws:** intake-gate registry validator is dead code (never receives validator argument); PURPOSE_TO_ROUTING_TARGET dispatch is computed but never consumed; deprecated profile methods are no-ops.
**Dependencies:** config (compiler, subscriber), features (bootstrap, runtime-pressure), shared (types).
**Recommended action:** REFACTOR (remove dead code, add tests for all 3 sub-modules).

### CL-06: Features (10 feature modules)

| Module | LOC | Status | Tested | Wired | Quality Issue | Action |
|--------|-----|--------|--------|-------|---------------|--------|
| `session-tracker/` (14 files) | ~5,500 | ACTIVE | ✅ (3 files) | ✅ | event-capture.ts 702 LOC (+40%); index.ts 561 LOC (+12%); dead transform/ subdir (155 LOC); legacy hook (76 LOC) | REFACTOR |
| `bootstrap/` (9 files) | 2,259 | ACTIVE | ✅ (3 files) | ✅ | Clean modular design | KEEP |
| `runtime-pressure/` (5 files) | 625 | ACTIVE | ❌ **NONE** | ✅ (tool) | No tests; authority-matrix overlaps with skill | REFACTOR |
| `doc-intelligence/` (5 files) | 454 | ACTIVE | ❌ **NONE** | ✅ (tool) | No tests; estimatedTokens uses 4-char heuristic | REFACTOR |
| `agent-work-contracts/` (4 files) | 400 | ACTIVE | ❌ **NONE** | ✅ (tool) | No tests; sync fs APIs | REFACTOR |
| `background-command/pty/` (5 files) | 398 | ACTIVE | ⚠️ 1 test | ✅ (plugin) | PTY imports bun-pty directly; non-lazy import risk | REFACTOR |
| `sdk-supervisor/` (2 files) | 312 | ACTIVE | ✅ (2 files) | ✅ | isWrapperAvailable() uses `|| true` — non-functional | REFACTOR |
| `prompt-packet/` (4 files) | 348 | **DEAD** | — | ❌ | Zero consumers — superseded by session-tracker | DELETE |
| `auto-loop/` (2 files) | 66 | ACTIVE | ✅ (2 files) | ✅ | Clean | KEEP |
| `ralph-loop/` (2 files) | 62 | ACTIVE | ✅ (2 files) | ✅ | Clean | KEEP |

**Design flaws:** prompt-packet is 100% dead code (348 LOC); session-tracker has 2 LOC-cap violations and 2 dead files in transform/; sdk-supervisor health check is non-functional.
**Dependencies:** shared (types, security, session-api), schema-kernel, coordination (concurrency).
**Recommended action:** DELETE (prompt-packet), REFACTOR (session-tracker splits, test gaps, health check fix), KEEP (bootstrap, auto-loop, ralph-loop).

### CL-07: Hooks (lifecycle + guards + observers + transforms + composition)

| Module | LOC | Status | Tested | Wired | Quality Issue | Action |
|--------|-----|--------|--------|-------|---------------|--------|
| `composition/cqrs-boundary.ts` | 36 | ACTIVE | — | ⚠️ | assertHookWriteBoundary NEVER throws at runtime | REFACTOR |
| `guards/` (2 files) | 307 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `lifecycle/core-hooks.ts` | 212 | ACTIVE | ✅ | ✅ | Dual system.transform registration (one is dead) | REFACTOR |
| `lifecycle/session-hooks.ts` | 340 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `observers/` (4 files) | 239 | ACTIVE | ✅ | ✅ | 2 thin shells (session-entry-consumer, session-main-consumer) could inline | CONSOLIDATE |
| `transforms/` (4 files) | 231 | ACTIVE | ✅ | ✅ | tool-after-workflow.ts: **CQRS VIOLATION** — durable writes from hooks | REFACTOR |

**Design flaws:** tool-after-workflow.ts performs durable writes from hooks sector (CQRS violation); assertHookWriteBoundary is called but never throws; dual system.transform registration (one dead).
**Dependencies:** injected lifecycle/session-tracker/delegation/state dependencies, shared types.
**Recommended action:** REFACTOR (CQRS fix, enforce or remove boundary assertion, remove dead hook), CONSOLIDATE (thin observer shells).

### CL-08: Schema-Kernel (20 schema files)

| Category | Files | LOC | Status | Tested | Quality Issue | Action |
|----------|-------|-----|--------|--------|---------------|--------|
| Dead schemas | 3 | 353 | **DEAD** | Partial | Zero consumers; permission.schema.ts has duplicate enum bug | DELETE |
| Active tested | 4 | 875 | ACTIVE | ✅ | Production quality | KEEP |
| Active untested | 9 | 684 | ACTIVE | ❌ **NONE** | No dedicated tests; trajectory.schema.ts used by live tool | KEEP (add tests) |
| Barrel + generator | 4 | 688 | ACTIVE | Partial | validateWithFallback fragile locale check | REFACTOR |

**Design flaws:** 3 dead schemas persist through barrel re-exports; permission.schema.ts has `z.enum(["allow", "ask", "ask"])` bug; 9 schemas with zero dedicated tests.
**Dependencies:** zod only (leaf); consumed by tools, config, features.
**Recommended action:** DELETE (3 dead schemas), KEEP + ADD TESTS (9 untested), REFACTOR (barrel + validateWithFallback).

### CL-09: Shared (leaf utilities + types + security + sidecar)

| Module | LOC | Status | Tested | Wired | Quality Issue | Action |
|--------|-----|--------|--------|-------|---------------|--------|
| `types.ts` | 381 | ACTIVE | — | ✅ (22 importers) | 5 concern areas mixed; re-exports from coordination/config | REFACTOR |
| `helpers.ts` | 295 | ACTIVE | ✅ | ✅ (11 importers) | 5 concern areas mixed | REFACTOR |
| `session-api.ts` | 311 | ACTIVE | ✅ | ✅ (32 importers) | **LEAF VIOLATION** — imports from routing/ | REFACTOR |
| `state.ts` | 251 | ACTIVE | ✅ | ✅ | Singleton; no recovery path | KEEP |
| `runtime-policy.ts` | 236 | ACTIVE | ✅ | ✅ (4 importers) | Clean | KEEP |
| `tool-response.ts` | 71 | ACTIVE | ✅ | ✅ (21 importers) | Clean | KEEP |
| `tool-helpers.ts` | 9 | ACTIVE | — | ✅ (17 importers) | Trivial — could merge into tool-response.ts | CONSOLIDATE |
| `security/` (2 files) | 223 | ACTIVE | — | ✅ | redaction.ts NOT used by session-tracker writers | REFACTOR |
| `sidecar/readonly-state.ts` | 120 | DESIGNED_ONLY | ❌ **NONE** | ❌ **UNWIRED** | 2/10 readiness — no tools consume, no sidecar server | REWRITE |
| Other (6 files) | ~200 | ACTIVE | — | ✅ | Clean | KEEP |

**Design flaws:** session-api.ts imports from routing/ (non-leaf violation); sidecar is designed but unwired (120 LOC); redaction exists but unused in highest-risk session-tracker path.
**Dependencies:** Node/external basics only — must NOT import from deeper layers.
**Recommended action:** REFACTOR (session-api leaf fix, types/helpers split, redaction application), REWRITE (sidecar — integrate or formally defer), CONSOLIDATE (tool-helpers into tool-response).

### CL-10: Config (compiler + subscriber + workflow)

| Module | LOC | Status | Tested | Wired | Quality Issue | Action |
|--------|-----|--------|--------|-------|---------------|--------|
| `compiler.ts` | 410 | ACTIVE | ❌ **NONE** | ✅ | At 410 LOC; 6+ functions; decompileAgent bug (name "unknown") | REFACTOR |
| `subscriber.ts` | 97 | ACTIVE | ❌ **NONE** | ✅ (5+ consumers) | Module-level singleton cache; "cache-per-project" is actually last-wins | REFACTOR |
| `workflow/` (5 files) | 465 | ACTIVE | ❌ **NONE** | ✅ | Clean logic but zero tests | KEEP (add tests) |

**Design flaws:** Config singleton (Anti-Pattern 1) — only global mutable state in codebase; decompileAgent always returns "unknown"; zero test coverage across 3 modules (~972 LOC).
**Dependencies:** schema-kernel, filesystem/path helpers, external parsers.
**Recommended action:** REFACTOR (compiler split, subscriber instance-scope), KEEP + ADD TESTS (workflow).

### CL-11: CLI Substrate (bin commands + router + renderer + discovery)

| Module | LOC | Status | Tested | Wired | Quality Issue | Action |
|--------|-----|--------|--------|-------|---------------|--------|
| `cli/` (8 files) | 1,052 | ACTIVE | ✅ (8 files) | ✅ | Clean; sync I/O acceptable (cold-start paths) | KEEP |

**Design flaws:** None identified. CLI is well-tested and clean.
**Dependencies:** config (compiler), features (bootstrap), shared (types).
**Recommended action:** KEEP.

---

## Dependency Graph

```
                    ┌─────────────┐
                    │  CL-11 CLI  │  (independent, well-tested)
                    └──────┬──────┘
                           │
┌──────────┐     ┌─────────▼─────────┐     ┌──────────────────┐
│ CL-08    │────▶│  CL-10 Config     │────▶│  CL-01 Composition│
│ Schema   │     │  (compiler,       │     │  Root (plugin.ts) │
│ Kernel   │     │   subscriber)     │     └────────┬─────────┘
└────┬─────┘     └─────────┬─────────┘              │
     │                     │                        │
     │              ┌──────▼──────┐          ┌──────▼──────┐
     │              │ CL-05       │          │ CL-04 Tools │
     │              │ Routing     │          │ Surface     │
     │              └──────┬──────┘          └──────┬──────┘
     │                     │                        │
     │              ┌──────▼──────┐          ┌──────▼──────┐
     │              │ CL-09 Shared│◀─────────│             │
     │              │ (leaf)      │          │             │
     │              └──────┬──────┘          │             │
     │                     │                │             │
     ▼                     ▼                ▼             ▼
┌──────────┐     ┌──────────────────┐  ┌──────────────────┐
│ CL-07    │     │ CL-02 Task-Mgmt  │  │ CL-03 Coordination│
│ Hooks    │────▶│ (continuity,     │◀─│ (delegation,     │
│ (read)   │     │  journal,        │  │  completion,     │
└──────────┘     │  lifecycle)      │  │  concurrency)    │
                 └────────┬─────────┘  └────────┬─────────┘
                          │                     │
                          ▼                     ▼
                 ┌──────────────────┐  ┌──────────────────┐
                 │ CL-06 Features   │  │ (back to CL-01   │
                 │ (session-tracker,│  │  plugin wiring)  │
                 │  bootstrap, etc) │  │                  │
                 └──────────────────┘  └──────────────────┘

  CL-09 Shared is the LEAF — all arrows point TO it, never FROM it
  (except session-api.ts leaf violation — must be fixed)
```

**Critical dependency chains:**
1. Schema-Kernel → Config → Tools → Plugin (must fix schema bugs before config before tools)
2. Shared leaf → all deeper modules (must fix session-api violation before any module split)
3. Coordination → Task-Management → Plugin (delegation dual-path must resolve before plugin decomposition)
4. Hooks → Task-Management → Coordination (CQRS fix depends on knowing where durable writes belong)

---

## Non-Destructive First Pass (Ordered)

These changes do NOT alter runtime logic. They remove dead code, fix bugs, standardize patterns, and rebuild artifacts.

### Wave 1: Dead Code Deletion (0 logic changes)
1. **Delete 3 dead schema files** — `permission.schema.ts` (168 LOC, fix enum bug first), `tool-definition.schema.ts` (74 LOC), `skill-metadata.schema.ts` (111 LOC)
2. **Delete `prompt-packet/`** (348 LOC) — zero consumers, superseded by session-tracker
3. **Delete `session-classification-hook.ts`** (76 LOC) — never connected to plugin.ts
4. **Delete `schema-normalizer.ts`** (155 LOC) — never imported by any module
5. **Delete `concurrency-key.ts`** (12 LOC) — single-line delegating wrapper
6. **Delete deprecated profile methods** — `invalidateBehavioralProfile()`, `clearAllBehavioralProfiles()` (no-ops)
7. **Delete empty dirs** — `src/kernel/`, `src/harness/` (.gitkeep only)

### Wave 2: Hook Cleanup (remove silently-ignored registrations)
8. **Remove `messages.transform` no-op** from `core-hooks.ts` — documented no-op
9. **Remove duplicate `system.transform`** — keep only `experimental.chat.system.transform`
10. **Remove `system.transform` from plugin.ts return** — not in SDK Hooks interface

### Wave 3: Bug Fixes (single-line or tiny fixes)
11. **Fix `permission.schema.ts` enum bug** — change `z.enum(["allow", "ask", "ask"])` to `z.enum(["allow", "ask", "auto"])` (if not deleting)
12. **Fix `decompileAgent` bug** — `compiler.ts:191` returns "unknown" instead of extracting frontmatter name
13. **Fix `execute-slash-command` return envelope** — wrap with `renderToolResult()` + add Zod schema
14. **Add `.catch()` to 5 fire-and-forget promises** — `plugin.ts` L223, L244, L262, L276, L290

### Wave 4: Standardization (pattern alignment, no behavior change)
15. **Standardize `tool()` import path** — change 5 tools from wide `@opencode-ai/plugin` to narrow `@opencode-ai/plugin/tool`
16. **Relocate 3 session tools** — move `session-context.ts`, `session-hierarchy.ts`, `session-tracker.ts` from `hivemind/` to `session/`
17. **Move `getSessionBehavioralProfile`** out of `session-api.ts` to `routing/behavioral-profile/` (leaf constraint fix)

### Wave 5: Artifact Rebuild
18. **Rebuild `dist/`** — eliminates 38 stale compiled artifacts from prior deletions
19. **Sync manifests** — update STRUCTURE.md, ARCHITECTURE.md, CONCERNS.md, AGENTS.md

**Total non-destructive:** ~1,200 LOC removed, 5 bugs fixed, 3 files relocated, 18 commits.

---

## Destructive Second Pass (Ordered)

These changes DO alter runtime logic, module boundaries, or architectural patterns.

### Wave 1: Async I/O Conversion (Phase 21 scope)
1. **Convert `continuity/index.ts`** — `readFileSync`/`writeFileSync`/`renameSync` → `fs/promises`
2. **Convert `delegation-persistence.ts`** — 9 sync I/O calls → async
3. **Convert `agent-work-contracts/store.ts`** — sync fs → async
4. **Convert `plugin.ts` startup sync I/O** — `workspace-runtime-policy.ts` readFileSync → readFile
5. **Retain sync I/O** in CLI cold-start paths (`cli/`, `bin/`, `bootstrap-init.ts`)

### Wave 2: Typed Error Hierarchy (Phase 22 scope)
6. **Create `src/shared/errors.ts`** — 5 typed error classes (ValidationError, PermissionError, NotFoundError, PersistenceError, RuntimeError)
7. **Convert ~100 `throw new Error` sites** across 45 files
8. **Fix silent catch blocks** — `lifecycle/index.ts`, `orphan-cleanup.ts`

### Wave 3: Plugin Decomposition (Phase 23 scope)
9. **Extract tool registry** → `src/tools/registry.ts` (~40 LOC extracted)
10. **Extract startup tasks** → `src/plugin/startup.ts`
11. **Extract hook composition** → `src/hooks/composition/composer.ts`
12. **Fix temporal coupling** — pass coordinator directly to DelegationMonitor constructor
13. **Split `configure-primitive.ts`** (490 LOC) — move inline Zod schemas to schema-kernel/
14. **Split `compiler.ts`** (410 LOC) — compile/decompile/batch submodules

### Wave 4: CQRS Enforcement
15. **Move `tool-after-workflow.ts`** durable writes from hooks to coordination or route through tool
16. **Make `assertHookWriteBoundary` enforce** at runtime (throw on durable-write from hooks) or remove
17. **Consolidate thin observer shells** — inline session-entry-consumer and session-main-consumer into plugin.ts

### Wave 5: Module Splits (Phase 24 scope)
18. **Split `event-capture.ts`** (702 LOC) → 2-3 files by lifecycle event family
19. **Split `session-tracker/index.ts`** (561 LOC) → extract initialization block
20. **Simplify `PendingDispatchRegistry`** (312 LOC) → simple Map pair + periodic cleanup
21. **Rename naming collisions** — `delegation/completion-detector.ts` → `delegation/semantic-analyzer.ts`
22. **Split `helpers.ts`** (295 LOC) → error.ts, text.ts, prompt.ts
23. **Split `types.ts`** (381 LOC) → types/ subdirectory

### Wave 6: Test Gap Closure
24. **Add routing tests** — session-entry (542 LOC), behavioral-profile (277 LOC), command-engine (398 LOC)
25. **Add config tests** — compiler.ts (410 LOC), subscriber.ts (97 LOC), workflow (465 LOC)
26. **Add schema tests** — 9 untested schemas (trajectory, bootstrap, agent-work-contract, etc.)
27. **Add feature tests** — runtime-pressure (625 LOC), doc-intelligence (454 LOC), agent-work-contracts (400 LOC)
28. **Add session-view tests** — only tool with zero test coverage

### Wave 7: Journal/Sidecar Decision
29. **Decision: journal/** — either wire `appendJournalEntry()` into lifecycle handler OR formally defer with `@deferred` tags
30. **Decision: sidecar/** — either integrate readonly-state.ts into a tool OR formally defer

---

## Recommended Phase Insertion Order

These phases should be inserted BEFORE the current Phase 21 (Sync I/O Async). The existing Phase 19 and Phase 20 are already COMPLETE.

| New Phase | Title | Scope | Depends On | Est. Effort |
|-----------|-------|-------|------------|-------------|
| **Phase 21** | Non-Destructive Cleanup Wave | Dead code deletion (7 files, ~1,200 LOC), hook cleanup (3 registrations), bug fixes (4 bugs), standardization (3 relocations), dist rebuild | Phase 20 (COMPLETE) | 4-5 sub-phases |
| **Phase 22** | Async I/O Conversion + Promise Hygiene | Convert sync fs in runtime paths to async; add .catch() to fire-and-forget promises | Phase 21 | 1 phase |
| **Phase 23** | Typed Error Hierarchy | 5 error classes; convert ~100 throw sites; fix silent catches | Phase 22 | 1 phase |
| **Phase 24** | Plugin Decomposition | Extract tool registry, startup, hook composition; split configure-primitive + compiler; fix temporal coupling | Phase 23 | 1-2 phases |
| **Phase 25** | CQRS Enforcement + Module Splits | Fix tool-after-workflow CQRS violation; split event-capture (702 LOC) + session-tracker/index (561 LOC); simplify PendingDispatchRegistry | Phase 24 | 1-2 phases |
| **Phase 26** | Test Gap Closure + Leaf Fix | Add tests for routing, config, features, schemas; fix session-api leaf violation; consolidate thin observers | Phase 25 | 1-2 phases |
| **Phase 27** | Journal/Sidecar Decision + Legacy Cleanup | Wire or defer journal (540 LOC); integrate or defer sidecar (120 LOC); track legacy/deprecated refs with removal gates | Phase 26 | 1 phase |
| **Phase 28** | Post-Restructuring Integration Verification | Full regression; smoke test all tools; dist verification; manifest sync | Phase 27 | 1 phase |

**Then continue with original phases:**
- Phase 29: Fix sync-oss.yml workflow (was Phase 27)
- Phase 30: Package .opencode/ primitives for distribution (was Phase 28)

---

## Risk Assessment

### High Risk
| Risk | Mitigation |
|------|-----------|
| **Plugin decomposition breaks runtime** — extracting startup/hook-composition changes composition ordering | Extract mechanically (move factory calls, keep wiring); verify with `npm test` after each extraction; no behavioral changes |
| **Async I/O conversion breaks cold-start** — CLI paths may depend on sync behavior | Explicitly retain sync I/O in `cli/`, `bin/`, `bootstrap-init.ts`; only convert runtime paths |
| **CQRS fix breaks workflow persistence** — moving tool-after-workflow durable writes may break existing workflows | Add integration test for workflow persistence before and after move; keep same persistence API, just change caller |

### Medium Risk
| Risk | Mitigation |
|------|-----------|
| **Typed error hierarchy changes error message format** — callers may parse error strings | Preserve exact error messages; only change error type; callers can gradually migrate to type-based catching |
| **Module splits break import paths** — 227 files have inter-module imports | Use IDE refactoring for bulk rename; verify with `npm run typecheck` after each split |
| **Test gap closure reveals existing bugs** — untested code may have latent defects | Run full test suite after each test addition; file bugs separately rather than fixing in same phase |

### Low Risk
| Risk | Mitigation |
|------|-----------|
| **Dead code deletion removes something still needed** | Verify zero importers with grep before each deletion; keep git history for recovery |
| **Session tool relocation breaks plugin.ts imports** | Update all import paths in same commit; verify with typecheck |
| **Hook cleanup removes test-facing aliases** | Keep `system.transform` as test-facing alias if tests depend on it; verify with test suite |

### Overall Confidence
- **Non-destructive pass:** HIGH confidence — zero logic changes, deletions verified by grep, bug fixes are single-line
- **Destructive pass:** MODERATE confidence — each wave is independently testable, but cumulative risk increases with each wave
- **Recommended cadence:** One wave per phase, full regression after each phase, no phase advancement until `npm test` passes

---

## Research Sources
- `.planning/codebase/CONCERNS.md` — tech debt, bugs, security, performance, fragile areas (185 LOC)
- `.planning/codebase/ARCHITECTURE.md` — CQRS model, 9-surface authority, component graph (328 LOC)
- `.planning/codebase/STRUCTURE.md` — file tree, placement conventions, naming (338 LOC)
- `.planning/research/hard-restructuring-synthesis-2026-05-21.md` — SDK audit, DI analysis, severity matrix (454 LOC)
- `.planning/research/hard-restructuring-map-full-2026-05-21.md` — full module health matrix, priority queue (715+ LOC)
- `.planning/research/hard-restructuring-advisor-2026-05-21.md` — gray-area decisions (151 LOC)
- `docs/philosophy/HIVEMIND-PHILOSOPHY.md` — 5 pillars, HIVE+MIND thesis (500 LOC)
- `.planning/ROADMAP.md` — current phase lineup (689 LOC)
- 6 deep-analysis reports (3,249 LOC combined): tools, routing/cli/config, features, coordination/hooks, schema/task, plugin/shared/sidecar

---

*Cluster map generated: 2026-05-21*
