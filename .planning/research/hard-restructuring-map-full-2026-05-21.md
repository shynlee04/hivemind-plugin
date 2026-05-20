# Hard Restructuring Map — Full Synthesis

**Date:** 2026-05-21
**Source Reports:**
1. `deep-analysis-tools-2026-05-21.md` (620 LOC)
2. `deep-analysis-routing-cli-config-2026-05-21.md` (388 LOC)
3. `deep-analysis-features-2026-05-21.md` (447 LOC)
4. `deep-analysis-coordination-hooks-2026-05-21.md` (357 LOC)
5. `deep-analysis-schema-task-2026-05-21.md` (524 LOC)
6. `deep-analysis-plugin-shared-sidecar-2026-05-21.md` (913 LOC)
7. `CONCERNS.md` (185 LOC)
8. `ROADMAP.md` (phases 19-25 descriptions)
9. `HIVEMIND-PHILOSOPHY.md` (500 LOC)

**Total analysis surface:** 3,249 LOC of structured findings across 6 reports + alignment with concerns, roadmap, philosophy.

---

## Section A: Module Health Matrix (FILE-BY-FILE)

Every file in `src/` assessed across 6 dimensions. Files organized by module. LOC counts from source analysis reports.

### A.1 plugin.ts — Composition Root

| File | LOC | Status | Tested | Wired | Quality Issue | Action |
|------|-----|--------|--------|-------|---------------|--------|
| `src/plugin.ts` | 493 | ACTIVE | Partial (lifecycle tests) | ✅ | Near 500 LOC cap; 5 fire-and-forget promises; sync I/O in startup; inline tool.execute.after (25 lines) | REFACTOR |
| `src/index.ts` | 30 | ACTIVE | N/A (barrel) | ✅ | — | KEEP |

**Source:** plugin-shared-sidecar analysis §1-8. Evidence: plugin.ts at 493 LOC, `void` promises at L223/L244/L262/L276/L290, sync I/O at L232.

### A.2 tools/ — Tool Surface (27 source files, 24 tools)

| File | LOC | Status | Tested | Wired | Quality Issue | Action |
|------|-----|--------|--------|-------|---------------|--------|
| `config/configure-primitive.ts` | 490 | ACTIVE | ✅ | ✅ | At 500 LOC cap; inline schema; handleCompile 103 lines; wide import | REFACTOR |
| `config/configure-primitive-paths.ts` | 45 | ACTIVE | — | ✅ (helper) | Clean | KEEP |
| `config/validate-restart.ts` | 116 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `config/bootstrap-init.ts` | 309 | ACTIVE | ✅ | ✅ | Clean; testable export pattern | KEEP |
| `config/bootstrap-recover.ts` | 219 | ACTIVE | ✅ | ✅ | Clean; testable export pattern | KEEP |
| `delegation/delegate-task.ts` | 93 | ACTIVE | ✅ (3 files) | ✅ | Clean | KEEP |
| `delegation/delegation-status.ts` | 208 | ACTIVE | ✅ (2 files) | ✅ | renderDelegationV2 too dense | REFACTOR |
| `delegation/types.ts` | ~25 | ACTIVE | — | ✅ (re-exports) | Clean | KEEP |
| `hivemind/hivemind-doc.ts` | 45 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `hivemind/hivemind-agent-work.ts` | 152 | ACTIVE | ✅ | ✅ | Clean; good separation | KEEP |
| `hivemind/hivemind-trajectory.ts` | 112 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `hivemind/hivemind-pressure.ts` | 94 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `hivemind/hivemind-sdk-supervisor.ts` | 53 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `hivemind/hivemind-command-engine.ts` | 67 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `hivemind/hivemind-session-view.ts` | 127 | ACTIVE | ❌ **NONE** | ✅ | **NO TESTS**; direct readFile I/O | REFACTOR |
| `hivemind/run-background-command.ts` | 228 | ACTIVE | ✅ | ✅ | Clean; z.discriminatedUnion | KEEP |
| `hivemind/session-context.ts` | 224 | ACTIVE | ✅ | ✅ | **MISLOCATED** — belongs in session/ | CONSOLIDATE |
| `hivemind/session-hierarchy.ts` | 228 | ACTIVE | ✅ | ✅ | **MISLOCATED** — belongs in session/ | CONSOLIDATE |
| `hivemind/session-tracker.ts` | 373 | ACTIVE | ✅ | ✅ | **MISLOCATED** — belongs in session/; approaches 500 LOC | CONSOLIDATE |
| `prompt/prompt-analyze/tools.ts` | 169 | ACTIVE | ✅ | ✅ | _projectRoot unused | KEEP |
| `prompt/prompt-analyze/index.ts` | ~20 | ACTIVE | — | ✅ (barrel) | Clean | KEEP |
| `prompt/prompt-analyze/types.ts` | ~15 | ACTIVE | — | ✅ (types) | Clean | KEEP |
| `prompt/prompt-skim/tools.ts` | 107 | ACTIVE | ✅ | ✅ | _projectRoot unused | KEEP |
| `prompt/prompt-skim/index.ts` | ~15 | ACTIVE | — | ✅ (barrel) | Clean | KEEP |
| `prompt/prompt-skim/types.ts` | ~15 | ACTIVE | — | ✅ (types) | Clean | KEEP |
| `session/execute-slash-command.ts` | 152 | ACTIVE | ✅ | ✅ | **Return envelope divergence** — only tool NOT using renderToolResult(); NO Zod schema | REFACTOR |
| `session/session-journal-export.ts` | 117 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `session/session-patch/tools.ts` | 136 | ACTIVE | ✅ | ✅ | Clean; path traversal protection | KEEP |
| `session/session-patch/index.ts` | ~15 | ACTIVE | — | ✅ (barrel) | Clean | KEEP |
| `session/session-patch/types.ts` | ~15 | ACTIVE | — | ✅ (types) | Clean | KEEP |

**Source:** tools analysis §3.7-3.9. Evidence: 3 session tools under hivemind/; execute-slash-command return envelope at L401-405; No test for hivemind-session-view at L527.

### A.3 routing/, cli/, config/ Modules

| File | LOC | Status | Tested | Wired | Quality Issue | Action |
|------|-----|--------|--------|-------|---------------|--------|
| `routing/session-entry/index.ts` | 23 | ACTIVE | ❌ | ✅ (barrel) | — | KEEP |
| `routing/session-entry/purpose-classifier.ts` | 195 | ACTIVE | ❌ | ✅ (via intake-gate) | Fragile substring matching; no NLP | REFACTOR |
| `routing/session-entry/language-resolution.ts` | 153 | ACTIVE | ❌ | ✅ (via intake-gate) | Dominant script only | KEEP |
| `routing/session-entry/profile-resolver.ts` | 148 | ACTIVE | ❌ | ✅ (via intake-gate) | Thin heuristics | REFACTOR |
| `routing/session-entry/intake-gate.ts` | 148 | ACTIVE | ❌ | ✅ (partial — no registry validator) | Registry validation is DEAD CODE | REFACTOR |
| `routing/behavioral-profile/index.ts` | 29 | ACTIVE | ❌ | ✅ (barrel) | — | KEEP |
| `routing/behavioral-profile/types.ts` | 100 | ACTIVE | ❌ | ✅ (type imports) | — | KEEP |
| `routing/behavioral-profile/profiles.ts` | 45 | ACTIVE | ❌ | ✅ | — | KEEP |
| `routing/behavioral-profile/resolve-behavioral-profile.ts` | 103 | ACTIVE | ❌ | ✅ (via plugin.ts) | Dead no-op methods (L93-102) | REFACTOR |
| `routing/command-engine/index.ts` | 223 | ACTIVE | ❌ | ✅ (via tool) | No tests | KEEP |
| `routing/command-engine/types.ts` | 175 | ACTIVE | ❌ | ✅ (type imports) | — | KEEP |
| `cli/index.ts` | 96 | ACTIVE | ✅ (8 files) | ✅ | Clean | KEEP |
| `cli/router.ts` | 189 | ACTIVE | ✅ | ✅ | — | KEEP |
| `cli/renderer.ts` | 122 | ACTIVE | ✅ | ✅ | — | KEEP |
| `cli/discovery.ts` | 77 | ACTIVE | ✅ | ✅ | — | KEEP |
| `cli/commands/help.ts` | 34 | ACTIVE | ✅ | ✅ | — | KEEP |
| `cli/commands/init.ts` | 314 | ACTIVE | ✅ | ✅ | — | KEEP |
| `cli/commands/doctor.ts` | 338 | ACTIVE | ✅ | ✅ | — | KEEP |
| `cli/commands/recover.ts` | 144 | ACTIVE | ✅ | ✅ | — | KEEP |
| `cli/commands/version.ts` | 64 | ACTIVE | ✅ | ✅ | — | KEEP |
| `config/compiler.ts` | 410 | ACTIVE | ❌ | ✅ | At 410 LOC; overstuffed (6+ functions); decompileAgent bug (name "unknown") | REFACTOR |
| `config/subscriber.ts` | 97 | ACTIVE | ❌ | ✅ (5+ consumers) | Module-level singleton cache; "cache-per-project" is actually last-wins | REFACTOR |
| `config/workflow/index.ts` | 43 | ACTIVE | ❌ | ✅ | Barrel | KEEP |
| `config/workflow/workflow-types.ts` | 53 | ACTIVE | ❌ | ✅ | — | KEEP |
| `config/workflow/workflow-state.ts` | 185 | ACTIVE | ❌ | ✅ | Clean | KEEP |
| `config/workflow/workflow-guards.ts` | 122 | ACTIVE | ❌ | ✅ | Clean | KEEP |
| `config/workflow/workflow-persistence.ts` | 182 | ACTIVE | ❌ | ✅ | Clean | KEEP |
| `config/AGENTS.md` | 42 | DOCS | — | — | — | KEEP |
| `config/workflow/AGENTS.md` | 41 | DOCS | — | — | — | KEEP |

**Source:** routing-cli-config analysis §2-7. Evidence: Zero test coverage for routing + config (3 modules, ~2,400 LOC untested); decompileAgent bug at compiler.ts:191; intake-gate registry validator at L53-80 never receives validator argument.

### A.4 features/ — Feature Sector (67 .ts files, 12,669 LOC)

| File/Directory | LOC | Status | Tested | Wired | Quality Issue | Action |
|----------------|-----|--------|--------|-------|---------------|--------|
| `session-tracker/index.ts` | 561 | ACTIVE | ✅ (3 files) | ✅ | **OVER 500 LOC CAP** (+12%) | REFACTOR |
| `session-tracker/capture/event-capture.ts` | 702 | ACTIVE | ✅ | ✅ | **OVER 500 LOC CAP** (+40%) | REFACTOR |
| `session-tracker/capture/message-capture.ts` | ~420 | ACTIVE | ✅ | ✅ | — | KEEP |
| `session-tracker/capture/tool-capture.ts` | ~432 | ACTIVE | ✅ | ✅ | — | KEEP |
| `session-tracker/persistence/` (9 files) | 2,271 | ACTIVE | ✅ | ✅ | Overloaded directory (atomic primitives + writers + registry + retry + quarantine) | REFACTOR |
| `session-tracker/recovery/` (1 file) | 415 | ACTIVE | ✅ | ✅ | — | KEEP |
| `session-tracker/transform/` (2 files) | 274 | MIXED | — | ⚠️ | `schema-normalizer.ts` (155 LOC) **never imported** — dead code | DELETE |
| `session-tracker/hooks/session-classification-hook.ts` | 76 | LEGACY_ARTIFACT | — | ❌ | **Never connected** — superseded by handleToolExecuteBefore pattern | DELETE |
| `session-tracker/initialization.ts` | ~180 | ACTIVE | — | ✅ | — | KEEP |
| `session-tracker/session-router.ts` | ~90 | ACTIVE | — | ✅ | — | KEEP |
| `session-tracker/pending-dispatch-registry.ts` | ~312 | ACTIVE | — | ✅ | Over-engineered (3 reverse indices for a temporary race window) | REFACTOR |
| `bootstrap/` (9 files) | 2,259 | ACTIVE | ✅ (3 files) | ✅ | Clean modular design | KEEP |
| `runtime-pressure/` (5 files) | 625 | ACTIVE | ❌ **NONE** | ✅ (tool) | No tests; authority-matrix overlaps with skill | REFACTOR |
| `doc-intelligence/` (5 files) | 454 | ACTIVE | ❌ **NONE** | ✅ (tool) | No tests; estimatedTokens uses 4-char heuristic | REFACTOR |
| `agent-work-contracts/` (4 files) | 400 | ACTIVE | ❌ **NONE** | ✅ (tool) | No tests; sync fs APIs | REFACTOR |
| `background-command/pty/` (5 files) | 398 | ACTIVE | ⚠️ 1 test | ✅ (plugin) | PTY imports bun-pty directly; non-lazy import risk | REFACTOR |
| `prompt-packet/` (4 files) | 348 | **DESIGNED_ONLY** | — | ❌ **NO CONSUMERS** | **100% dead code** — superseded by session-tracker | DELETE |
| `sdk-supervisor/` (2 files) | 312 | ACTIVE | ✅ (2 files) | ✅ | `isWrapperAvailable()` uses `\|\| true` — non-functional health check | REFACTOR |
| `auto-loop/` (2 files) | 66 | ACTIVE | ✅ (2 files) | ✅ | Clean; no backpressure | KEEP |
| `ralph-loop/` (2 files) | 62 | ACTIVE | ✅ (2 files) | ✅ | Clean; no retry logic | KEEP |

**Source:** features analysis §1-6. Evidence: event-capture.ts at 702 LOC (§2.1), prompt-packet dead at §4 (348 LOC), session-classification-hook legacy at §3.2.

### A.5 coordination/ & hooks/ (47 files, ~6,200 LOC)

| File | LOC | Status | Tested | Wired | Quality Issue | Action |
|------|-----|--------|--------|-------|---------------|--------|
| `delegation/manager.ts` | 362 | MIGRATIONAL | ✅ | ✅ | Thin facade — routes v1 or v2; 362 LOC of indirection | REFACTOR |
| `delegation/manager-runtime.ts` | 478 | ACTIVE | ✅ | ✅ | Near 500 LOC cap; 15 imports from 10 modules; most complex | REFACTOR |
| `delegation/coordinator.ts` | 445 | ACTIVE | ✅ | ✅ | 2nd in-memory delegation store (parallel to state-machine) | REFACTOR |
| `delegation/types.ts` | 196 | ACTIVE | — | ✅ | Shared contracts | KEEP |
| `delegation/state-machine.ts` | 443 | ACTIVE | ✅ | ✅ | 1st in-memory delegation store | KEEP |
| `delegation/dispatcher.ts` | 63 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `delegation/agent-resolver.ts` | 58 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `delegation/completion-detector.ts` | 273 | ACTIVE (misnamed) | ✅ | ✅ | Naming collision with completion/detector.ts | REFACTOR |
| `delegation/escalation-timer.ts` | 86 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `delegation/lifecycle.ts` | 93 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `delegation/monitor.ts` | 229 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `delegation/notification-formatter.ts` | 123 | ACTIVE | ✅ | ✅ | Could merge into notification-router | CONSOLIDATE |
| `delegation/notification-router.ts` | 155 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `delegation/resume-resolver.ts` | 82 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `delegation/retry-handler.ts` | 50 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `delegation/sdk-child-session-starter.ts` | 62 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `delegation/slot-manager.ts` | 107 | ACTIVE | ✅ | ✅ | Wraps concurrency/queue.ts | KEEP |
| `delegation/survival-kit.ts` | 129 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `completion/detector.ts` | 226 | ACTIVE | ✅ | ✅ | Canonical watcher — naming collision with delegation/completion-detector.ts | REFACTOR |
| `completion/notification-handler.ts` | 242 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `concurrency/queue.ts` | 300 | ACTIVE | ✅ | ✅ | Primitive concurrency gate | KEEP |
| `command-delegation/handler.ts` | 416 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `sdk-delegation/handler.ts` | 324 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `spawner/spawn-request-builder.ts` | 137 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `spawner/session-creator.ts` | 35 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `spawner/spawner-types.ts` | 82 | ACTIVE | — | ✅ | Types | KEEP |
| `spawner/agent-primitive-policy.ts` | 51 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `spawner/concurrency-key.ts` | 12 | NEAR-DEAD | — | ⚠️ | Single-line wrapper; documented for future plan | DELETE |
| `spawner/parent-directory.ts` | 9 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `hooks/composition/cqrs-boundary.ts` | 36 | ACTIVE | — | ⚠️ | assertHookWriteBoundary NEVER throws at runtime | REFACTOR |
| `hooks/guards/governance-block.ts` | 104 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `hooks/guards/tool-guard-hooks.ts` | 203 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `hooks/lifecycle/core-hooks.ts` | 212 | ACTIVE | ✅ | ✅ | Dual system.transform registration (one is dead) | REFACTOR |
| `hooks/lifecycle/session-hooks.ts` | 340 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `hooks/observers/event-observers.ts` | 135 | ACTIVE | ✅ | ✅ | Core observation | KEEP |
| `hooks/observers/delegation-consumer.ts` | 41 | ACTIVE | ✅ | ✅ | Pass-through | KEEP |
| `hooks/observers/session-entry-consumer.ts` | 22 | THIN SHELL | — | ✅ | Could inline into plugin.ts | CONSOLIDATE |
| `hooks/observers/session-main-consumer.ts` | 20 | THIN SHELL | — | ✅ | Could inline into plugin.ts | CONSOLIDATE |
| `hooks/observers/session-tracker-consumer.ts` | 41 | ACTIVE | ✅ | ✅ | Pass-through | KEEP |
| `hooks/transforms/chat-message-capture.ts` | 39 | THIN SHELL | ✅ | ✅ | Clean | KEEP |
| `hooks/transforms/tool-after-composer.ts` | 71 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `hooks/transforms/tool-after-workflow.ts` | 54 | ACTIVE | — | ✅ | **CQRS VIOLATION** — durable writes from hooks sector | REFACTOR |
| `hooks/transforms/tool-before-guard.ts` | 67 | ACTIVE | ✅ | ✅ | Clean | KEEP |

**Source:** coordination-hooks analysis §3-5. Evidence: Two dispatch paths (§5.1), CQRS violation in tool-after-workflow.ts (L301), named collision at L268.

### A.6 schema-kernel/ (20 .ts files, ~2,500 LOC)

| File | LOC | Status | Tested | Wired | Quality Issue | Action |
|------|-----|--------|--------|-------|---------------|--------|
| `index.ts` | 337 | ACTIVE | Partial | ✅ | Barrel + validateWithFallback (fragile locale check) | REFACTOR |
| `hivemind-configs.schema.ts` | 446 | ACTIVE | ✅ Full | ✅ | Production quality | KEEP |
| `permission.schema.ts` | 168 | **DEAD** | Partial | ❌ | No consumers; DUPLICATE ENUM BUG ("allow","ask","ask") | DELETE |
| `tool-definition.schema.ts` | 74 | **DEAD** | Partial | ❌ | No consumers | DELETE |
| `skill-metadata.schema.ts` | 111 | **DEAD** | Partial | ❌ | No consumers | DELETE |
| `agent-frontmatter.schema.ts` | 168 | ACTIVE | ✅ | ✅ | — | KEEP |
| `agent-work-contract.schema.ts` | 148 | ACTIVE | ❌ NONE | ✅ | No dedicated test | KEEP |
| `bootstrap.schema.ts` | 109 | ACTIVE | ❌ NONE | ✅ (2 tools + 2 CLI) | No dedicated test; imports from hivemind-configs | KEEP |
| `command-engine.schema.ts` | 32 | ACTIVE | ❌ NONE | ✅ (barrel) | — | KEEP |
| `command-frontmatter.schema.ts` | 104 | ACTIVE | ✅ | ✅ | — | KEEP |
| `config-precedence.schema.ts` | 76 | ACTIVE | Partial | ✅ (barrel) | — | KEEP |
| `doc-intelligence.schema.ts` | 16 | ACTIVE | ❌ NONE | ✅ (tool) | — | KEEP |
| `generate-config-json-schema.ts` | 149 | ACTIVE | ✅ | ✅ | — | KEEP |
| `mcp-server.schema.ts` | 124 | ACTIVE | Partial | ✅ (barrel) | — | KEEP |
| `prompt-enhance.schema.ts` | 169 | ACTIVE | ✅ Full | ✅ (3 tools) | — | KEEP |
| `runtime-pressure.schema.ts` | 55 | ACTIVE | ❌ NONE | ✅ (barrel) | — | KEEP |
| `sdk-supervisor.schema.ts` | 16 | ACTIVE | ❌ NONE | ✅ (barrel) | — | KEEP |
| `session-tracker.schema.ts` | 141 | ACTIVE | ⚠️ Tool-test only | ✅ (3 tools) | Largest untested live schema | KEEP |
| `session-view.schema.ts` | 37 | ACTIVE | ❌ NONE | ✅ (tool) | — | KEEP |
| `trajectory.schema.ts` | 49 | ACTIVE | ❌ NONE | ✅ (tool) | Used by live tool, no test | KEEP |

**Source:** schema-task analysis §1-5. Evidence: 3 confirmed dead schemas at §1.3; permission.schema.ts bug at L176-178; 9 of 19 schemas with zero tests at §3.

### A.7 task-management/ (11 source files, ~1,900 LOC)

| File | LOC | Status | Tested | Wired | Quality Issue | Action |
|------|-----|--------|--------|-------|---------------|--------|
| `continuity/index.ts` | 467 | ACTIVE | ✅ | ✅ | Core continuity store | KEEP |
| `continuity/delegation-persistence.ts` | 196 | ACTIVE | ✅ | ✅ | — | KEEP |
| `continuity/store-cache.ts` | 34 | ACTIVE | ✅ | ✅ | Clean | KEEP |
| `journal/index.ts` | 119 | **DESIGNED_ONLY** | ✅ | ❌ **UNWIRED** | 540 LOC of audit trail with no runtime trigger | REWRITE (wire or delete) |
| `journal/execution-lineage.ts` | 122 | **DESIGNED_ONLY** | ✅ | ❌ **UNWIRED** | No runtime callers | REWRITE |
| `journal/query.ts` | 168 | **DESIGNED_ONLY** | ✅ | ❌ **UNWIRED** | No runtime callers | REWRITE |
| `journal/replay.ts` | 131 | **DESIGNED_ONLY** | ✅ | ❌ **UNWIRED** | No runtime callers | REWRITE |
| `lifecycle/index.ts` | 242 | ACTIVE | ✅ | ✅ | Core lifecycle | KEEP |
| `trajectory/types.ts` | 128 | ACTIVE | — | ✅ | Types | KEEP |
| `trajectory/ledger.ts` | 93 | ACTIVE | — | ✅ | File I/O | KEEP |
| `trajectory/store-operations.ts` | 190 | ACTIVE | — | ✅ | CRUD | KEEP |

**Source:** schema-task analysis §6-7. Evidence: Journal unwired at §7 (540 LOC); `appendJournalEntry()` has no runtime callers.

### A.8 shared/ (14 files, ~1,950 LOC)

| File | LOC | Status | Tested | Wired | Quality Issue | Action |
|------|-----|--------|--------|-------|---------------|--------|
| `shared/types.ts` | 381 | ACTIVE | — | ✅ (22 importers) | 5 concern areas mixed; re-exports from coordination/ and config/ | REFACTOR |
| `shared/helpers.ts` | 295 | ACTIVE | ✅ | ✅ (11 importers) | 5 concern areas (error, text, prompt, serialization, utilities) | REFACTOR |
| `shared/session-api.ts` | 311 | ACTIVE | ✅ | ✅ (32 importers) | **LEAF VIOLATION** — imports from routing/ | REFACTOR |
| `shared/state.ts` | 251 | ACTIVE | ✅ | ✅ | Singleton; no recovery path | KEEP |
| `shared/runtime-policy.ts` | 236 | ACTIVE | ✅ | ✅ (4 importers) | Clean | KEEP |
| `shared/runtime.ts` | 95 | ACTIVE | — | ✅ | Clean | KEEP |
| `shared/tool-response.ts` | 71 | ACTIVE | ✅ | ✅ (21 importers) | Clean | KEEP |
| `shared/tool-helpers.ts` | 9 | ACTIVE | — | ✅ (17 importers) | Trivial — could merge into tool-response.ts | CONSOLIDATE |
| `shared/app-api.ts` | 24 | ACTIVE | — | ✅ (2 importers) | Clean | KEEP |
| `shared/workspace-runtime-policy.ts` | 38 | ACTIVE | — | ✅ (1 importer) | Sync I/O | REFACTOR |
| `shared/plugin-tool-output-summary.ts` | 22 | ACTIVE | — | ✅ (1 importer) | Clean | KEEP |
| `shared/task-status.ts` | 22 | ACTIVE | — | ✅ (re-export) | Clean | KEEP |
| `shared/security/path-scope.ts` | 105 | ACTIVE | — | ✅ | Clean | KEEP |
| `shared/security/redaction.ts` | 118 | ACTIVE | — | ✅ | Clean; session tracker does NOT use it | REFACTOR |
| `sidecar/readonly-state.ts` | 120 | DESIGNED_ONLY | ❌ NONE | ❌ UNWIRED | **2/10 readiness score** — no tools consume it, no sidecar server exists | REWRITE |
| `kernel/.gitkeep` | 0 | PLACEHOLDER | — | — | Empty directory | KEEP |
| `harness/.gitkeep` | 0 | PLACEHOLDER | — | — | Empty directory | KEEP |

**Source:** plugin-shared-sidecar analysis §9-15. Evidence: session-api.ts leaf violation at L660-665; types.ts dumping ground at §12; sidecar readiness at §15.

---

## Section B: Cross-Cutting Issues (NOT file-by-file — systemic)

### B.1 CQRS Violations

| # | Issue | Location | Evidence |
|---|-------|----------|----------|
| 1 | **tool-after-workflow.ts performs durable writes from hooks sector** | `src/hooks/transforms/tool-after-workflow.ts` calls `persistWorkflow()` via dynamic import | coordination-hooks §5.4 L301 |
| 2 | **assertHookWriteBoundary is called but NEVER throws** | `tool-guard-hooks.ts L69,162`; `core-hooks.ts L194` — assigns result to unused variable | coordination-hooks §5.2 #4 L279 |
| 3 | **Notification handler in completion/ patches continuity directly** | `notification-handler.ts` calls `patchSessionContinuity()` and `recordSessionContinuity()` | coordination-hooks §5.2 #3 L277 — technically ok (coordination sector, not hooks) |
| 4 | **session-api.ts imports from routing/ — creates non-leaf shared module** | `session-api.ts:4-5` imports `resolveBehavioralProfile` from routing | plugin-shared-sidecar §11 V1 L660-665 |

### B.2 Pattern Inconsistency — Factory Injection vs Direct Import vs Singleton

| # | Pattern | Where Used | Count | Assessment |
|---|---------|-----------|-------|------------|
| 1 | **Factory with DI** `(projectRoot: string)` | 12 tools | ✅ Best practice — most hivemind tools, session tools |
| 2 | **Factory with complex deps** `(coordinator, manager, client)` | 6 tools | ✅ Necessary for runtime dependencies |
| 3 | **Factory with no deps** `()` | 6 tools | ✅ For bootstrap/config tools |
| 4 | **Singleton** `taskState` in `state.ts` | Hook consumers | ⚠️ No recovery path, cross-test contamination risk |
| 5 | **Module-level cache** in `subscriber.ts` | Continuity, config, routing | ⚠️ Last-wins, not multi-project |
| 6 | **coordinatorRef forward reference** in `setupDelegationModules()` | plugin.ts L170-204 | ⚠️ Anti-pattern: temp undefined window |
| 7 | **Two in-memory delegation stores** | coordinator.ts (this.active) + state-machine.ts (this.delegations) | ❌ **Potential drift** — see B.1 #2 in coordination |

### B.3 Unwired Subsystems

| Subsystem | LOC | Description | Evidence |
|-----------|-----|-------------|----------|
| **prompt-packet/** | 348 | Kernel/delegation packet + compaction preservation — zero consumers | features §4 L405 |
| **session-classification-hook.ts** | 76 | Factory function never connected to plugin.ts | features §3.2 L365 |
| **schema-normalizer.ts** | 155 | Normalization functions never imported by any module | features §3.2 L366; grep confirms |
| **journal/ (4 files)** | 540 | Append-only audit trail + query/replay — no runtime code calls it | schema-task §6.3 L329, §7 L484 |
| **execution-lineage.ts** | 122 | Derived lineage projections — no runtime callers | schema-task §6.3 L331 |
| **sidecar/readonly-state.ts** | 120 | Read-only state guards — no tools, no sidecar server | plugin-shared-sidecar §15 L824-851 |
| **permission.schema.ts** | 168 | OpenCode permission rulesets — zero consumers | schema-task §1.3 L52 |
| **tool-definition.schema.ts** | 74 | Custom tool definition schema — zero consumers | schema-task §1.3 L52 |
| **skill-metadata.schema.ts** | 111 | Skill metadata/frontmatter — zero consumers | schema-task §1.3 L52 |
| **intake-gate registry validator** | ~30 | Validates routing target against primitive registry — never passed at runtime | routing-cli-config §6 L279 |
| **PURPOSE_TO_ROUTING_TARGET dispatch** | ~10 | Maps purpose → agent target — computed but never consumed | routing-cli-config §6 L280 |
| **messages.transform hook** | ~15 | Documented no-op (stripped Phase 35) | coordination-hooks §5.5 L307 |

**Total unwired LOC:** 348 + 76 + 155 + 540 + 122 + 120 + 168 + 74 + 111 + 30 + 10 + 15 = **~1,769 LOC of dead/unwired code**

### B.4 Naming Collisions

| # | Name | Location 1 | Location 2 | Impact |
|---|------|-----------|-----------|--------|
| 1 | **"completion-detector"** | `delegation/completion-detector.ts` (pure semantic analysis functions) | `completion/detector.ts` (watcher class with dual-signal) | Different purposes, same name concept — causes import confusion |
| 2 | **"DelegationManager" concept** | `manager.ts` (thin facade) | `manager-runtime.ts` (heavy implementation) | Two files named "manager" — one is facade, one is real implementation |

### B.5 Migrated-But-Not-Cleaned

| Artifact | What Was Migrated | What Remains | Evidence |
|----------|-------------------|--------------|----------|
| prompt-packet | Session-tracker took over compaction capture | 348 LOC of dead packet code | features §4 L389-399 |
| session-classification-hook | Plugin uses handleToolExecuteBefore instead | 76 LOC factory function | features §3.2 L365 |
| schema-normalizer | Session-tracker writes raw data directly | 155 LOC normalization functions | features §3.2 L366 |
| manager.ts runtime v1 paths | v2 coordinator exists alongside | 362 LOC migration facade | coordination-hooks §5.1 #1 L265 |
| system.transform hook | Test-only (real runtime uses experimental.chat.system.transform) | ~30 LOC duplicate registration | coordination-hooks §5.5 L309 |
| Legacy event-tracker migration | One-shot deletion of `.hivemind/event-tracker/` | ~30 lines of migration code in plugin.ts startup | CONCERNS.md L32-33 |
| Deprecated profile methods | ClearAllBehavioralProfiles now no-ops | ~10 LOC dead methods | routing-cli-config §6 L281 |

### B.6 Test Gaps — Modules with ZERO Tests Despite Complex Logic

| Module | LOC | What Goes Untested |
|--------|-----|-------------------|
| `routing/session-entry/` (5 files) | 542 | Purpose classification, language detection, profile resolution, intake pipeline |
| `routing/behavioral-profile/` (4 files) | 277 | Profile merge strategy, mapping |
| `routing/command-engine/` (2 files) | 398 | Contract analysis, route preview, message transform |
| `config/compiler/` (1 file) | 410 | compile/decompile/batch + atomic write + rollback |
| `config/subscriber/` (1 file) | 97 | Config caching and loading |
| `config/workflow/` (5 files) | 465 | State machine transitions, guards, persistence I/O |
| `features/runtime-pressure/` (5 files) | 625 | Pressure scoring, tool authority mapping |
| `features/doc-intelligence/` (5 files) | 454 | Document parsing, chunking, routing |
| `features/agent-work-contracts/` (4 files) | 400 | Contract CRUD, store persistence |
| `tools/hivemind/hivemind-session-view.ts` | 127 | Session view query |
| `sidecar/readonly-state.ts` | 120 | Path containment, read-only enforcement |

**Total untested (production) code:** ~3,765 LOC

### B.7 LOC Cap Violations (Files Exceeding 500 LOC)

| File | LOC | Cap | Over | Module |
|------|-----|-----|------|--------|
| `features/session-tracker/capture/event-capture.ts` | 702 | 500 | +202 (+40%) | features |
| `features/session-tracker/index.ts` | 561 | 500 | +61 (+12%) | features |

**At-risk files (approaching 500 LOC cap):**

| File | LOC | Room | Module |
|------|-----|------|--------|
| `src/plugin.ts` | 493 | 7 lines | composition root |
| `tools/config/configure-primitive.ts` | 490 | 10 lines | tools |
| `coordination/delegation/manager-runtime.ts` | 478 | 22 lines | coordination |
| `coordination/delegation/coordinator.ts` | 445 | 55 lines | coordination |
| `coordination/delegation/state-machine.ts` | 443 | 57 lines | coordination |
| `schema-kernel/hivemind-configs.schema.ts` | 446 | 54 lines | schema-kernel |
| `continuity/index.ts` | 467 | 33 lines | task-management |
| `config/compiler.ts` | 410 | 90 lines | config |

### B.8 Security Gaps

| # | Issue | Location | Risk |
|---|-------|----------|------|
| 1 | Session tracker persists raw user/assistant text WITHOUT redaction | `message-capture.ts`, `session-writer.ts`, `tool-capture.ts` | Sensitive data in `.hivemind/session-tracker/` files |
| 2 | `redactTextSecrets()` exists but is NOT applied in session-tracker writers | `shared/security/redaction.ts` vs capture files | Mitigation exists but unused in highest-risk path |
| 3 | `.env` file exists in working tree | Repo root (not read) | Must keep in .gitignore |

---

## Section C: Tool Surface Quality Assessment

Per the 24 registered tools, evaluated across schema quality, return envelope consistency, test coverage, and dependency pattern.

### C.1 Tool Grade Summary

| Grade | Count | Tools |
|-------|-------|-------|
| **GOOD** | 16 | delegate-task, run-background-command, prompt-skim, prompt-analyze, session-patch, session-journal-export, validate-restart, bootstrap-init, bootstrap-recover, hivemind-doc, hivemind-agent-work, hivemind-trajectory, hivemind-pressure, hivemind-sdk-supervisor, hivemind-command-engine, hivemind-session-view* |
| **NEEDS_REFACTOR** | 7 | configure-primitive (490 LOC, huge handleCompile), delegation-status (dense renderer), execute-slash-command (envelope divergence, no Zod schema), session-context (mislocated), session-hierarchy (mislocated), session-tracker (mislocated, 373 LOC), config tools import (wide import) |
| **BROKEN** | 0 | — |

*\*hivemind-session-view is GOOD structurally but has NO tests — conditional downgrade.*

### C.2 Return Envelope Consistency

**CRITICAL ISSUE:** 23 of 24 tools use `renderToolResult(success(...))` / `renderToolResult(error(...))`. One tool (`execute-slash-command`) returns raw `{ output, metadata }`. This is architecturally inconsistent and should be fixed.

Evidence: tools analysis §3.3 L460-461.

### C.3 Import Source Divergence

**CRITICAL ISSUE:** Two different `tool()` import paths in use:

| Import Path | Tools Using It | Count |
|-------------|---------------|-------|
| `@opencode-ai/plugin/tool` (narrow) | 18 of 23 tools | ✅ Correct |
| `@opencode-ai/plugin` (wide) | All 4 config tools + execute-slash-command | ❌ Should use narrow |

Evidence: tools analysis §3.2 L449-457.

### C.4 Schema Location Quality

| Location | Count | Assessment |
|----------|-------|------------|
| Imported from `schema-kernel/` | 13 tools | ✅ Best practice |
| Inline in tool file | 7 tools | ⚠️ Needs refactor (duplicates type knowledge) |
| No Zod schema (relies on tool.schema) | 1 tool (execute-slash-command) | ❌ **Critical** — no formal validation |

### C.5 Test Coverage Per Tool

| Coverage Level | Count | Details |
|----------------|-------|---------|
| ✅ Excellent (3+ test files) | 1 | delegate-task |
| ✅ Good (1-2 test files) | 22 | All except hivemind-session-view |
| ❌ None | 1 | hivemind-session-view |

### C.6 ToolContext Usage Pattern

| Pattern | Count | Tools |
|---------|-------|-------|
| Unused (`_context`) | 17 | Most hivemind + prompt + session tools |
| `sessionID` only | 4 | delegation-status, delegate-task, run-background-command |
| Full (sessionID + metadata) | 1 | execute-slash-command |
| Cast from unknown | 2 | configure-primitive (directory/worktree via `as` cast) |

---

## Section D: Restructuring Phase Map

### D.1 Current Phase 19: Non-Destructive Remediation

**Current scope (from ROADMAP.md):** Eliminate dead schemas (permission.schema.ts, tool-definition.schema.ts), rebuild dist/, remove extra hooks.

**Additional findings requiring Phase 19 attention:**

| Finding | File(s) | Action | Effort |
|---------|---------|--------|--------|
| Fix `permission.schema.ts` duplicate enum bug | `schema-kernel/permission.schema.ts:10` | Change `"ask"` duplicate to `"auto"` | Tiny (1 line) |
| Remove 3 dead schema files | `permission.schema.ts` (168 LOC) | DELETE — add @future tag or remove entirely | Small |
| Remove 3 dead schema files | `tool-definition.schema.ts` (74 LOC) | DELETE | Small |
| Remove 3 dead schema files | `skill-metadata.schema.ts` (111 LOC) | DELETE | Small |
| Remove `session-classification-hook.ts` | `features/session-tracker/hooks/session-classification-hook.ts` (76 LOC) | DELETE — superseded | Small |
| Remove `schema-normalizer.ts` | `features/session-tracker/transform/schema-normalizer.ts` (155 LOC) | DELETE — never imported | Small |
| Remove `prompt-packet/` | `features/prompt-packet/` (348 LOC) | DELETE — superseded by session-tracker | Medium |
| Remove `messages.transform` no-op hook | `hooks/lifecycle/core-hooks.ts:189-196` | Remove dead hook registration | Tiny |
| Remove duplicate `system.transform` hook | `hooks/lifecycle/core-hooks.ts:175-180` | Keep only experimental version | Tiny |
| Mark dead schema files with `@future` tags | 3 dead schemas | Add JSDoc annotation | Tiny |
| Remove `concurrency-key.ts` | `spawner/concurrency-key.ts` (12 LOC) | DELETE — single-line wrapper | Tiny |
| Remove deprecated profile methods | `resolve-behavioral-profile.ts:93-102` | DELETE `invalidateBehavioralProfile`, `clearAllBehavioralProfiles` | Tiny |

**Phase 19 delta from original scope:** +6 non-destructive deletions. Total ~880 LOC of dead code removed.

### D.2 Current Phase 20: Package.json Dependency Cleanup

**Current scope (from ROADMAP.md):** Remove 11 unused runtime deps, bump 6 minor versions, move @json-render/* + react to optional.

**Additional findings:**

| Finding | Action | Effort |
|---------|--------|--------|
| `yaml` + `js-yaml` both present as deps | Consolidate to one YAML library | Small |
| `@clack/prompts` already confirmed present | No change needed | — |
| No other dep findings from analysis | — | — |

**Phase 20 delta:** Only add yaml consolidation to existing scope.

### D.3 Current Phase 21: Sync I/O Async Conversion — Runtime Paths

**Current scope (from ROADMAP.md):** Convert sync fs calls in runtime paths (tools, hooks, features, coordination) to async fs/promises.

**Additional findings:**

| Finding | File(s) | Action | Effort |
|---------|---------|--------|--------|
| Sync I/O in startup path | `plugin.ts L232` → `workspace-runtime-policy.ts` | Convert `readFileSync` to `readFile` with fallback | Medium |
| 5 fire-and-forget promises need error handling | `plugin.ts L223, L244, L262, L276, L290` | Add `.catch()` logging | Small |
| agent-work-contracts uses sync fs | `features/agent-work-contracts/store.ts` | Convert to async | Small |
| continuity store uses sync I/O | `task-management/continuity/index.ts` | Convert `writeFileSync`/`renameSync` to async | Large |
| delegation-persistence uses sync I/O | `task-management/continuity/delegation-persistence.ts` | Convert to async | Medium |
| bootstrap uses sync | `features/bootstrap/primitive-loader.ts` | Not runtime-critical (CLI) — could be deferred | Low |

**Phase 21 delta:** Add fire-and-forget .catch() handling + agent-work-contracts conversion + continuity store async conversion.

### D.4 Current Phase 22: Typed Error Hierarchy

**Current scope (from ROADMAP.md):** Create HarnessValidationError, HarnessPermissionError, HarnessNotFoundError, HarnessPersistenceError, HarnessRuntimeError. Replace ~95 `throw new Error` sites.

**Additional findings:**

| Finding | File(s) | Action | Effort |
|---------|---------|--------|--------|
| Error swallowing in notification replay | `lifecycle/index.ts` `catch { // Best-effort replay` | Use typed error catch | Small |
| 100 throw new Error sites (not 95) | scross ~45 files | Correct count to 100 | — |

**Phase 22 delta:** Correct error site count to ~100; fix silent catch blocks.

### D.5 Current Phase 23: Plugin Decomposition

**Current scope (from ROADMAP.md):** Extract tool registration map → src/tools/registry.ts, startup tasks → src/plugin/startup.ts, hook composition → src/hooks/composition/composer.ts.

**Additional findings supporting this:**

| Finding | Action | Effort |
|---------|--------|--------|
| `configure-primitive.ts` at 490 LOC | Decompose handleCompile into smaller functions | Medium |
| `compiler.ts` at 410 LOC | Split into compile/decompile/batch submodules | Medium |
| `event-capture.ts` at 702 LOC | Split by lifecycle event family | Large |
| `session-tracker/index.ts` at 561 LOC | Extract initialization block into initialization.ts | Medium |
| `manager-runtime.ts` at 478 LOC | Near cap — will hit 500 with any addition | Medium |
| `coordinator.ts` at 445 LOC | Second delegation store — consider consolidation | Large |

**Phase 23 delta:** Add configure-primitive decomposition + compiler.ts split to existing scope.

### D.6 Current Phase 24: Module Split

**Current scope (from ROADMAP.md):** TBD — general module splitting.

**Additional findings requiring module split:**

| Finding | Action | Effort | Dependencies |
|---------|--------|--------|-------------|
| `event-capture.ts` (702 LOC) | Split into lifecycle/compaction handlers (~400 LOC each) | Large | Phase 19 (cleanup) + Phase 23 (plugin) |
| `session-tracker/index.ts` (561 LOC) | Extract initialization block into initialization.ts | Medium | Phase 19 |
| `manager-runtime.ts` (478 LOC) | Extract delegation recovery into separate file | Medium | Phase 23 |
| `compiler.ts` (410 LOC) | Split into compiler/compile.ts, compiler/decompile.ts, compiler/batch.ts | Medium | Phase 19 |
| `configure-primitive.ts` (490 LOC) | Move inline Zod schemas to schema-kernel/; split handleCompile | Medium | Phase 23 |
| `helpers.ts` (295 LOC) | Split into helpers/error.ts, helpers/text.ts, helpers/prompt.ts | Medium | Low priority |
| `types.ts` (381 LOC, 5 concerns) | Split into types/task-status.ts, types/runtime-policy.ts, types/continuity.ts, types/governance.ts + facade index | Medium | Low priority |

**Phase 24 delta:** Focus on event-capture.ts split as highest-impact action (702 LOC, handles 40% over cap).

### D.7 Current Phase 25: Legacy/Deprecation Cleanup

**Current scope (from ROADMAP.md):** TBD — legacy cleanup.

**Additional findings:**

| Finding | Action | Effort |
|---------|--------|--------|
| Legacy event-tracker migration in plugin.ts | Move to one-shot cleanup script | Small |
| manager.ts migration facade | Document that v1 runtime paths should be removed and consolidate when safe | Medium |
| coordinatorRef forward reference | Refactor setupDelegationModules to use builder pattern | Medium |
| Dual in-memory delegation stores | Consolidate coordinator.ts state into state-machine.ts | Large |
| 25 `legacy` references and 10 `deprecated` references | Track with owner and removal gate per instance | Medium |

**Phase 25 delta:** Add manager.ts migration analysis + coordinator state consolidation + legacy reference inventory.

### D.8 Proposed Additional Phases

#### Phase 25.1: Session Tool Relocation

**Rationale:** 3 session tools (session-context, session-hierarchy, session-tracker) are mislocated under `src/tools/hivemind/` instead of `src/tools/session/`. They don't follow the `hivemind-` naming convention.

**Actions:**
1. Move `session-context.ts` → `src/tools/session/session-context.ts`
2. Move `session-hierarchy.ts` → `src/tools/session/session-hierarchy.ts`  
3. Move `session-tracker.ts` → `src/tools/session/session-tracker.ts`
4. Update all import paths in `plugin.ts`
5. Add symlink or deprecation notice for old paths

**Effort:** Small | **Depends on:** Phase 19 (cleanup first)

#### Phase 25.2: Routing Test Gap

**Rationale:** Three routing sub-modules have zero test coverage. Purpose classification accuracy, language detection, profile resolution, command engine contract analysis — all untested.

**Actions:**
1. Add `tests/routing/session-entry/` — test classifyPurpose for all 8 classes, detectLanguage for 6+ scripts, resolveProfile heuristics
2. Add `tests/routing/behavioral-profile/` — test resolveBehavioralProfile merge strategy
3. Add `tests/routing/command-engine/` — test contract analysis, route preview

**Effort:** Medium | **Depends on:** Phase 19

#### Phase 25.3: Config Test Gap

**Rationale:** Config module (compiler, subscriber, workflow) has zero test coverage despite non-trivial logic.

**Actions:**
1. Add `tests/config/compiler.test.ts` — compile/decompile/batch/mixed-batch + rollback
2. Add `tests/config/workflow/` — state transitions, guards, persistence
3. Fix `decompileAgent` bug (returns "unknown" instead of frontmatter name)

**Effort:** Medium | **Depends on:** Phase 19

#### Phase 25.4: Schema Test Gap

**Rationale:** 9 of 19 schema files lack dedicated tests. Most critically: trajectory.schema.ts (live tool), bootstrap.schema.ts (2 tools + 2 CLI), agent-work-contract.schema.ts (live tool).

**Actions:**
1. Add tests for `bootstrap.schema.ts`, `agent-work-contract.schema.ts`, `trajectory.schema.ts`
2. Add tests for `session-tracker.schema.ts`, `session-view.schema.ts`, `runtime-pressure.schema.ts`
3. Add tests for `command-engine.schema.ts`, `sdk-supervisor.schema.ts`, `doc-intelligence.schema.ts`

**Effort:** Large | **Depends on:** Phase 19

#### Phase 25.5: CQRS Boundary Enforcement

**Rationale:** `tool-after-workflow.ts` performs durable writes from hooks sector (CQRS violation). `assertHookWriteBoundary` is called but never throws.

**Actions:**
1. Move `tool-after-workflow.ts` logic from hooks to task-management or make it route through a tool
2. Make `assertHookWriteBoundary` actually enforce at runtime (throw on durable-write from hooks)
3. Verify no other CQRS violations exist

**Effort:** Medium | **Depends on:** Phase 23 (plugin decomposition)

#### Phase 25.6: shared/ Leaf Constraint Fix

**Rationale:** `session-api.ts` imports from `routing/` — creates non-leaf shared module.

**Actions:**
1. Move `getSessionBehavioralProfile()` from `session-api.ts` to `routing/behavioral-profile/`
2. Remove the import from `session-api.ts`
3. Update all callers to import from routing directly

**Effort:** Small | **Depends on:** Phase 19

---

## Section E: Priority Work Queue

Ordered by dependency, risk, and impact. Each item includes file/module reference, current problem, required action, estimated effort, and dependencies.

### E.1 Critical (blocker for all subsequent work)

| # | Item | Problem | Action | Effort | Depends On |
|---|------|---------|--------|--------|------------|
| CR-01 | Fix `permission.schema.ts` duplicate enum bug | `z.enum(["allow", "ask", "ask"])` — third value should be `"auto"` | 1-line fix: change second `"ask"` to `"auto"` | Tiny | None |
| CR-02 | Fix `execute-slash-command` return envelope | Only tool NOT using `renderToolResult()` — returns raw `{ output, metadata }` | Add `renderToolResult()` wrapping + proper Zod schema | Small | None |
| CR-03 | Add tests for `hivemind-session-view` | Only tool with ZERO test coverage | Add test suite for session view operations | Medium | None |
| CR-04 | Fix `decompileAgent` name extraction | Always returns `name: "unknown"` instead of extracting from frontmatter | Match `decompileSkill` behavior at compiler.ts:191 | Small | None |
| CR-05 | Move `getSessionBehavioralProfile` out of `session-api.ts` | Session-api.ts imports from routing/ — leaf constraint violation | Move to routing/behavioral-profile/ | Small | None |

### E.2 High Priority (improves developer safety)

| # | Item | Problem | Action | Effort | Depends On |
|---|------|---------|--------|--------|------------|
| HI-01 | Remove `prompt-packet/` (348 LOC dead code) | Zero consumers — superseded by session-tracker | DELETE entire directory | Medium | CR-01 |
| HI-02 | Remove `session-classification-hook.ts` (76 LOC) | Never connected — superseded pattern | DELETE file | Tiny | None |
| HI-03 | Remove `schema-normalizer.ts` (155 LOC) | Never imported by any module | DELETE file | Tiny | None |
| HI-04 | Remove `concurrency-key.ts` (12 LOC) | Single-line delegating wrapper | DELETE file | Tiny | None |
| HI-05 | Remove deprecated profile methods | `invalidateBehavioralProfile()` and `clearAllBehavioralProfiles()` are no-ops | DELETE from resolve-behavioral-profile.ts | Tiny | None |
| HI-06 | Remove `messages.transform` no-op | Documented no-op still registered | Remove from core-hooks.ts | Tiny | None |
| HI-07 | Remove duplicate `system.transform` hook | Both = regular and experimental registered with same impl | Keep only experimental | Tiny | None |
| HI-08 | Remove 3 dead schema files | permission.schema.ts, tool-definition.schema.ts, skill-metadata.schema.ts — zero consumers | DELETE or add @future tags | Small | CR-01 (fix bug first) |
| HI-09 | Move 3 session tools to correct location | session-context.ts, session-hierarchy.ts, session-tracker.ts under hivemind/ | Move to src/tools/session/ | Medium | HI-01 through HI-08 |
| HI-10 | Add `.catch()` to 5 fire-and-forget promises | plugin.ts L223, L244, L262, L276, L290 — silent error swallowing | Add `.catch()` with logging | Small | None |
| HI-11 | Add tests for config/compiler.ts | 410 LOC of compile/decompile/batch with ZERO tests | Add test suite | Medium | None |
| HI-12 | Add tests for routing/session-entry/ | 542 LOC of classification/language resolution with ZERO tests | Add test suite | Medium | None |

### E.3 Medium Priority (structural improvements)

| # | Item | Problem | Action | Effort | Depends On |
|---|------|---------|--------|--------|------------|
| ME-01 | Split `event-capture.ts` (702 LOC) | 40% over 500 LOC cap | Split by lifecycle event family | Large | HI-01 through HI-08 |
| ME-02 | Split `session-tracker/index.ts` (561 LOC) | 12% over 500 LOC cap | Extract init block | Medium | HI-01 through HI-08 |
| ME-03 | Split `configure-primitive.ts` (490 LOC) | At 500 LOC cap; handleCompile 103 LOC | Move inline schemas to schema-kernel/; split handleCompile | Medium | None |
| ME-04 | Split `compiler.ts` (410 LOC) | 6+ functions in one file | Split into compile/decompile/batch submodules | Medium | None |
| ME-05 | Fix CQRS violation in tool-after-workflow.ts | Durable writes from hooks sector | Move to coordination or route through tool | Medium | None |
| ME-06 | Make `assertHookWriteBoundary` actually enforce | Called but never throws — noop at runtime | Remove unused calls or make actual enforcement | Small | None |
| ME-07 | Standardize tool() import path | 5 tools use wide `@opencode-ai/plugin` instead of `/tool` | Change to narrow import | Small | None |
| ME-08 | Simplify `PendingDispatchRegistry` | 3 reverse indices for temporary race window | Replace with simple Map pair + periodic cleanup | Medium | None |
| ME-09 | Wire journal/ into runtime | 540 LOC of audit trail — no code calls it | Add `appendJournalEntry()` in lifecycle handler | Medium | None |
| ME-10 | Add tests for features with zero coverage | runtime-pressure (625), doc-intelligence (454), agent-work-contracts (400) | Add test suites | Large | None |
| ME-11 | Add tests for 9 untested schemas | trajectory, bootstrap, agent-work-contract, session-tracker, session-view, runtime-pressure, sdk-supervisor, command-engine, doc-intelligence | Add schema tests | Large | None |
| ME-12 | Fix `isWrapperAvailable()` in sdk-supervisor | `|| true` fallbacks make health checks non-functional | Fix health check logic | Small | None |

### E.4 Lower Priority (cleanup/quality)

| # | Item | Problem | Action | Effort | Depends On |
|---|------|---------|--------|--------|------------|
| LO-01 | Split `helpers.ts` (295 LOC) | 5 concern areas mixed | Split into helpers/error.ts, helpers/text.ts, helpers/prompt.ts | Medium | None |
| LO-02 | Split `types.ts` (381 LOC) | 5 concern areas + re-exports | Split into types/ subdirectory | Medium | None |
| LO-03 | Fix `validateWithFallback` locale dependency | `issue.message.includes("Unrecognized key")` fragile | Rely only on `issue.code === "unrecognized_keys"` | Tiny | None |
| LO-04 | Remove non-functional `isWrapperAvailable` | Health checks always return true | Fix or remove | Small | None |
| LO-05 | Consolidate `notification-formatter.ts` into `notification-router.ts` | 2 files, producer-consumer tight coupling | Merge | Small | None |
| LO-06 | Remove `coordinatorRef` forward reference | Temp undefined window in plugin.ts init | Refactor setupDelegationModules to pass coordinator to monitor | Medium | None |
| LO-07 | Remove redundant `yaml` library | Both `yaml` and `js-yaml` as deps | Consolidate to one | Small | Phase 20 |
| LO-08 | Wire sidecar/readonly-state.ts | 120 LOC with zero wiring and zero tests | Either integrate or formally defer | Medium | None |
| LO-09 | Apply redactTextSecrets to session tracker | Redaction exists but unused in highest-risk persistence path | Apply to session writer | Medium | None |
| LO-10 | Remove empty `src/kernel/` and `src/harness/` | Placeholder directories with only .gitkeep | Remove or populate | Tiny | None |

### E.5 Forward-Looking (post-Phase 25)

| # | Item | Problem | Action | Effort | Depends On |
|---|------|---------|--------|--------|------------|
| FW-01 | Consolidate manager.ts & manager-runtime.ts | 362 LOC of migration facade | Remove when v1 runtime paths deprecated | Large | Phase 25 |
| FW-02 | Consolidate coordinator.ts state | 2nd in-memory delegation store parallel to state-machine | Merge into state-machine.ts | Large | Phase 25 |
| FW-03 | Wire registry validation into hook | intake-gate registry validator never receives argument | Pass createRegistryValidator or remove feature | Medium | None |
| FW-04 | Implement routingTarget dispatch | PURPOSE_TO_ROUTING_TARGET computed but never consumed | Wire to actual agent dispatch or remove | Large | None |
| FW-05 | Add multi-project cache support for config subscriber | "Cache-per-project" actually last-wins | Implement proper multi-key cache | Medium | None |
| FW-06 | Add `mkdirSync` rollback in mixedBatchCompile | Empty directories left on rollback | Add directory cleanup | Small | None |

---

## Appendix: Grep Commands to Verify Findings

```bash
# Verify permission.schema.ts bug
grep -n "enum.*allow.*ask.*ask" src/schema-kernel/permission.schema.ts

# Verify decompileAgent always returns "unknown"
grep -n "decompileAgent" src/config/compiler.ts

# Verify fire-and-forget promises
grep -n "^void\|^  void" src/plugin.ts

# Verify execute-slash-command return envelope
grep -A3 "return {" src/tools/session/execute-slash-command.ts | head -10

# Verify session tools under hivemind/ directory
ls src/tools/hivemind/session-*.ts

# Verify prompt-packet zero consumers
grep -r "prompt-packet" src/ --include="*.ts" | grep -v "features/prompt-packet"

# Verify sync I/O count
rg -c "(readFileSync|writeFileSync|mkdirSync|existsSync|readdirSync|renameSync)" src/ --type ts

# Verify throw new Error count
rg -c "throw new Error" src/ --type ts

# Verify tool() import divergence
grep -rn "from '@opencode-ai/plugin'" src/tools/ --include="*.ts" | grep -v "/tool"

# Verify CQRS violation in tool-after-workflow
grep -n "persistWorkflow" src/hooks/transforms/tool-after-workflow.ts

# Verify journal unwired status
grep -rn "appendJournalEntry\|buildJournalId\|journal/index" src/ --include="*.ts" | grep -v "task-management/journal\|tests/" | grep -v "\.test\."
```

---

## Result Summary

| Metric | Value |
|--------|-------|
| Total src/ files analyzed | ~260 |
| Dead code identified | ~1,769 LOC |
| Unwired subsystems | 11 (ranging 10-540 LOC each) |
| CQRS violations | 1 confirmed (tool-after-workflow) + 1 dormant (assertHookWriteBoundary) |
| LOC cap violations | 2 files (event-capture.ts 702, session-tracker/index.ts 561) |
| At-risk files (near 500 LOC) | 8 files |
| Untested production code | ~3,765 LOC |
| Bug count confirmed | 2 (permission.schema.ts enum, decompileAgent name) |
| Naming collisions | 1 (completion-detector in 2 locations) |
| Duplicate delegation stores | 2 (coordinator.ts + state-machine.ts) |
| Key action items | 43 (5 critical + 12 high + 12 medium + 10 low + 4 forward-looking) |

---

*Synthesized: 2026-05-21 | Sources: 6 deep-analysis reports + CONCERNS.md + ROADMAP.md + HIVEMIND-PHILOSOPHY.md | Evidence: L4 (source-backed, traceable to file:line references)*
