# 8-Cluster Code Surface Inventory

**Date:** 2026-06-06
**Status:** FINALIZED — cross-cutting resolved, ready for stale cleanup

---

## Cluster Definitions (8 clusters)

| Cluster | Focus | Primary Code Surfaces |
|---------|-------|----------------------|
| **C1: Governance + CLI + Config** | Installation, settings, permissions, primitives chaining, schema-kernel, routing, bootstrap, governance guards | `src/cli/`, `src/config/`, `src/routing/`, `src/schema-kernel/`, `src/features/bootstrap/`, `src/features/governance-engine/`, `src/features/governance/`, `bin/`, `scripts/`, `assets/rules/`, `opencode.json` |
| **C2: Internal Programmatic Modules** | Session tracking (incl. hooks/capture), lifecycle, journal, trajectory, continuity, contracts | `src/task-management/`, `src/features/session-tracker/` (all subdirs), `src/features/agent-work-contracts/`, `src/features/sdk-supervisor/` |
| **C3: Delegation + Coordination + Intelligence** | Coordination libs + coordination tools (LLM-callable): delegate-task, execute-slash-command, tmux, pressure, trajectory, loops | `src/coordination/`, `src/features/tmux/`, `src/features/runtime-pressure/`, `src/features/capability-gate/`, `src/features/auto-loop/`, `src/features/ralph-loop/`, `src/tools/session/execute-slash-command.ts`, `src/tools/session/dispatch-command.ts`, `src/tools/session/semantic-agent-selector.ts`, `src/tools/delegation/`, `src/tools/hivemind/hivemind-{trajectory,pressure,session-view,agent-work,steer,sdk-supervisor}.ts`, `src/tools/hivemind/run-background-command.ts`, `src/tools/tmux-*.ts` |
| **C4: Injections + Hooks** | SDK event observers, pure read-side hooks, CQRS classifier, pane-monitor, transforms | `src/hooks/lifecycle/`, `src/hooks/observers/`, `src/hooks/transforms/tool-after-{composer,workflow}.ts`, `src/hooks/transforms/chat-message-capture.ts`, `src/hooks/composition/cqrs-boundary.ts`, `src/hooks/pane-monitor.ts`, `src/hooks/types.ts` |
| **C5: Tool Surfaces** | Independent LLM-callable tools: prompt analysis, doc intelligence, tool intelligence | `src/tools/hivemind/hivemind-doc.ts`, `src/tools/prompt/`, `src/features/doc-intelligence/`, `src/features/tool-intelligence/`, `src/features/prompt-packet/` |
| **C6: Assets — Shipped Primitives** | hm-*/hf-* agents, skills, commands, workflows, templates, references, agent-instructions | `assets/`, `.opencode/agents/hm-*`, `.opencode/agents/hf-*`, `.opencode/skills/hm-*`, `.opencode/skills/hf-*`, `.opencode/commands/`, `.hivefiver-meta-builder/` |
| **C7: Sidecar** | Next.js dashboard, HTTP server, SSE/WS pools, read-only state, JSON-render catalog | `src/sidecar/`, `sidecar/` (root Next.js app) |
| **C8: Foundation** | Shared utilities, types, helpers, runtime policy, composition root, public API | `src/shared/` (16 files), `src/plugin.ts`, `src/index.ts` |

---

## Cross-Cutting Rules (RESOLVED)

1. **Tests belong to their cluster**: `tests/features/` → C2, `tests/tools/` → C3/C5, `tests/hooks/` → C4, `tests/coordination/` → C3, `tests/sidecar/` → C7, `tests/shared/` → C8, `tests/cli/` → C1, `tests/schema-kernel/` → C1, `tests/task-management/` → C2, `tests/integration/` → cross-cluster, `tests/plugin/` → C8, `tests/plugins/` → C8
2. **Coordination tools → C3**: Tools whose PURPOSE is coordination (execute-slash-command, delegate-task, hivemind-trajectory, etc.) belong to C3, not C5. C5 is for independent tools only.
3. **Governance guards → C1**: Hooks whose PURPOSE is governance enforcement (tool-guard-hooks, governance-block, tool-before-guard, contract-enforcement) belong to C1, not C4. C4 is for pure read-side observers only.
4. **Session tracker internals → C2**: hooks/ and capture/ are internal to session-tracker. Keep in C2 with cross-cutting notes.
5. **Foundation → C8**: src/shared/, src/plugin.ts, src/index.ts are foundation layer used by ALL clusters.

---

## src/ Module Inventory (292 TypeScript files)

### C1: Governance + CLI + Config (54 src files + tools + hooks)

| Module | Files | Key Files | Purpose |
|--------|-------|-----------|---------|
| `src/cli/` | 10 | `index.ts` (runCli), `commands/{help,init,doctor,recover,version}.ts` | CLI substrate |
| `src/config/` | 8 | `subscriber.ts`, `compiler.ts`, `defaults.ts`, `workflow/` | Config loading, caching, compilation |
| `src/routing/` | 11 | `command-engine/index.ts`, `session-entry/intake-gate.ts`, `behavioral-profile/` | Intent classification, command discovery |
| `src/schema-kernel/` | 21 | `hivemind-configs.schema.ts`, 19 schemas | Zod schemas, JSON schema generation |
| `src/features/bootstrap/` | 10 | `primitive-loader.ts`, `primitive-registry.ts`, `framework-detector.ts`, `control-plane/` | Primitive loading, framework detection |
| `src/features/governance-engine/` | 4 | `evaluator.ts`, `config-reader.ts`, `create-governance-session.ts` | Governance evaluation |
| `src/features/governance/` | 1 | `persistence.ts` | Governance state persistence |
| **Tools:** | 7 | `configure-primitive.ts`, `bootstrap-init.ts`, `bootstrap-recover.ts`, `validate-restart.ts`, `resolve-command.ts`, `validate-command.ts`, `workflow-parser.ts`, `hivemind-command-engine.ts` | Config + governance tools |
| **Hooks:** | 4 | `tool-guard-hooks.ts`, `governance-block.ts`, `tool-before-guard.ts`, `contract-enforcement.ts` | Governance enforcement hooks |

### C2: Internal Programmatic Modules (46 src files + tools)

| Module | Files | Key Files | Purpose |
|--------|-------|-----------|---------|
| `src/task-management/continuity/` | 4 | `index.ts`, `store-cache.ts`, `continuity-reader.ts`, `delegation-persistence.ts` | Session continuity |
| `src/task-management/journal/` | 4 | `index.ts`, `query.ts`, `replay.ts`, `execution-lineage.ts` | Event timeline |
| `src/task-management/lifecycle/` | 1 | `index.ts` | Lifecycle manager |
| `src/task-management/trajectory/` | 4 | `index.ts`, `ledger.ts`, `store-operations.ts`, `types.ts` | Trajectory ledger |
| `src/features/session-tracker/` | 36 | `index.ts`, `capture/`, `hooks/`, `persistence/`, `recovery/`, `streaming/`, `transform/` | Session knowledge capture (all subdirs) |
| `src/features/agent-work-contracts/` | 6 | `store.ts`, `lifecycle.ts`, `operations.ts`, `bounds.ts` | Contract lifecycle |
| `src/features/sdk-supervisor/` | 2 | `index.ts`, `types.ts` | SDK health monitoring |
| **Tools:** | 7 | `session-tracker.ts`, `session-hierarchy.ts`, `session-context.ts`, `session-delegation-query.ts`, `session-journal-export.ts`, `session-patch/`, `session-resolver.ts` | Session management tools |

### C3: Delegation + Coordination + Intelligence (44 src files + tools)

| Module | Files | Key Files | Purpose |
|--------|-------|-----------|---------|
| `src/coordination/delegation/` | 21 | `manager.ts`, `coordinator.ts`, `dispatcher.ts`, `state-machine.ts`, `lifecycle.ts`, `monitor.ts` | Delegation facade, lifecycle, dispatch |
| `src/coordination/spawner/` | 7 | `auto-loop.ts`, `ralph-loop.ts`, `session-creator.ts`, `spawn-request-builder.ts` | Autonomous loops, session creation |
| `src/coordination/completion/` | 2 | `detector.ts`, `notification-handler.ts` | Dual-signal completion |
| `src/coordination/concurrency/` | 1 | `queue.ts` | Concurrency queue |
| `src/coordination/command-delegation/` | 1 | `handler.ts` | Command-routed delegation |
| `src/coordination/sdk-delegation/` | 1 | `handler.ts` | SDK-routed delegation |
| `src/features/tmux/` | 7 | `integration.ts`, `multiplexer.ts`, `grid-planner.ts`, `session-manager.ts` | Tmux integration |
| `src/features/runtime-pressure/` | 5 | `index.ts`, `control-plane.ts`, `authority-matrix.ts`, `model.ts` | Pressure classification |
| `src/features/capability-gate/` | 3 | `index.ts`, `agent-capability-profiles.ts` | Agent capabilities |
| `src/features/auto-loop/` | 2 | `index.ts`, `types.ts` | Auto loop |
| `src/features/ralph-loop/` | 2 | `index.ts`, `types.ts` | Ralph loop |
| **Tools:** | 12 | `execute-slash-command.ts`, `dispatch-command.ts`, `semantic-agent-selector.ts`, `delegate-task.ts`, `delegation-status.ts`, `hivemind-{trajectory,pressure,session-view,agent-work,steer,sdk-supervisor}.ts`, `run-background-command.ts`, `tmux-copilot.ts`, `tmux-state-query.ts` | Coordination tools |

### C4: Injections + Hooks (10 src files)

| Module | Files | Key Files | Purpose |
|--------|-------|-----------|---------|
| `src/hooks/lifecycle/` | 2 | `core-hooks.ts`, `session-hooks.ts` | Event → state routing |
| `src/hooks/observers/` | 5 | `event-observers.ts`, `*-consumer.ts` | Pure read-side observers |
| `src/hooks/transforms/` | 2 | `tool-after-composer.ts`, `tool-after-workflow.ts`, `chat-message-capture.ts` | After pipeline, message capture |
| `src/hooks/composition/` | 1 | `cqrs-boundary.ts` | CQRS classifier |
| `src/hooks/pane-monitor.ts` | 1 | standalone | Tmux pane capture |
| `src/hooks/types.ts` | 1 | standalone | Shared hook types |

### C5: Tool Surfaces — Independent (15 src files)

| Module | Files | Key Files | Purpose |
|--------|-------|-----------|---------|
| `src/tools/hivemind/hivemind-doc.ts` | 1 | standalone | Doc intelligence tool |
| `src/tools/prompt/` | 6 | `prompt-skim/`, `prompt-analyze/` | Prompt analysis |
| `src/features/doc-intelligence/` | 5 | `index.ts`, `chunker.ts`, `parser.ts`, `router.ts` | Document chunking |
| `src/features/tool-intelligence/` | 2 | `index.ts`, `types.ts` | Tool intelligence |
| `src/features/prompt-packet/` | 2 | `kernel-packet.ts`, `compaction-preservation.ts` | Kernel packets |

### C6: Assets — Shipped Primitives (488 primitives)

| Type | Count | Source | Deployed |
|------|-------|--------|----------|
| Agents | 44 | `assets/agents/` | `.opencode/agents/` (77 total: 44 hm/hf + 33 gsd-dev) |
| Skills | 70 | `assets/skills/` | `.opencode/skills/` |
| Commands | 125 | `assets/commands/` | `.opencode/commands/` |
| Workflows | 106 | `assets/workflows/` | `.opencode/workflows/` |
| References | 70 | `assets/references/` | `.opencode/references/` |
| Templates | 40 | `assets/templates/` | `.opencode/templates/` |
| Rules | 1 | `assets/rules/` | `.opencode/rules/` |
| Agent-instructions | 32 | `assets/agent-instructions/` | `.opencode/agent-instructions/` |

### C7: Sidecar (27 src files + root Next.js app)

| Module | Files | Key Files | Purpose |
|--------|-------|-----------|---------|
| `src/sidecar/server/` | ~15 | `factory.ts`, `handler.ts`, `registry.ts`, `cache.ts`, `routes/`, `sse/`, `ws/`, `tool-proxy/` | HTTP server, SSE/WS, tool proxy |
| `src/sidecar/catalog/` | ~4 | `tool-catalog.json`, `json-render-catalog.ts` | Catalogs |
| `src/sidecar/` (other) | ~8 | `readonly-state.ts`, `readonly-state-extensions.ts`, `types.ts` | Read-only state |
| `sidecar/` (root) | 18K+ | `next.config.ts`, `package.json`, `src/`, `tests/` | Next.js dashboard |

### C8: Foundation (16 src files)

| Module | Files | Key Files | Purpose |
|--------|-------|-----------|---------|
| `src/shared/` | 16 | `types.ts`, `helpers.ts`, `state.ts`, `session-api.ts`, `runtime-policy.ts`, `tool-response.ts`, `tool-helpers.ts`, `runtime.ts`, `session-naming.ts`, `task-status.ts`, `workspace-runtime-policy.ts`, `app-api.ts`, `plugin-tool-output-summary.ts`, `errors/commands.ts`, `security/path-scope.ts`, `security/redaction.ts` | Leaf utilities, types, SDK wrappers |
| `src/plugin.ts` | 1 | 1076 LOC | Composition root — wires ALL surfaces |
| `src/index.ts` | 1 | barrel | Public API re-exports |

---

## Tests/ Mapping to Clusters

| Test Directory | Files | Maps To |
|---------------|-------|---------|
| `tests/cli/` | 8 | C1 |
| `tests/coordination/` | 1 | C3 |
| `tests/features/` | 54 | C2 (session-tracker, agent-work-contracts, etc.) |
| `tests/hooks/` | 28 | C4 (observers, transforms) + C1 (guards) |
| `tests/tools/` | 30 | C3 (coordination tools) + C5 (independent tools) |
| `tests/sidecar/` | 23 | C7 |
| `tests/integration/` | 19 | Cross-cluster |
| `tests/schema-kernel/` | 6 | C1 |
| `tests/task-management/` | 5 | C2 |
| `tests/shared/` | 2 | C8 |
| `tests/plugin/` | 1 | C8 |
| `tests/plugins/` | 1 | C8 |
| `tests/lib/` | 113 | Legacy grouping — needs reclassification |
| `tests/fixtures/` | 0 | Test data |
| `tests/kernel/` | 0 | Empty |
| `tests/scripts/` | 0 | Test infrastructure |
| `tests/smoke/` | 0 | Smoke tests |
| **Total** | **292** | |

---

## Stale Folders — Authorized for Removal (Pending Execution)

### Batch A: Empty Shells (0B)
- `agents/`, `commands/`, `skills/`, `templates/` — root-level duplicates
- `state/` (8K) — old session state
- `checkpoints/` (20K) — old checkpoints

### Batch B: Old Artifacts
- `plans/` (156K) — old GSD planning
- `planning/` (60K) — pre-.planning/ era
- `graphify-out/` (4.9M) — old graph exports
- `disablekilo/` (20K) — early governance prototypes
- `skills-lock.json` (236B) — outdated version lock
- `task_plan.md` (3960B) — old task plan

### Batch C: Session Dumps (14.5 MB)
- 59 `session-ses_*.md` files
- `session-phase9-flaw.md` (113K)
- `progress.md` (0B)

### Batch D: Evidence/Report Dumps (~560K)
- `improve-tools-coherence-evidence-failure.md` (87K)
- `INVESTIGATOR-B-AUDIT.md` (33K)
- `OVERVIEW-Unmodified.md` (7K)
- `plugin-diagnostic.md` (2K)
- `coverage-report.md` (2K)
- `repo-for-learning-and-synthesis.md` (5K)
- `qwen-code-export-*.md` (3 files, ~360K)

### Batch E: Dot-Dirs (local-only, NOT committed, ~23MB)
- `.archive/`, `.agent/`, `.codexdisbaled/`, `.commandcode/`, `.qwen/`, `.coordination/`, `.research/`, `.scratch/`, `.tmp/`, `.bob/`, `.checkpoints/`, `.debug/`, `.qoder/`, `.roo/`

---

## Other Surfaces

| Surface | Files | Cluster | Notes |
|---------|-------|---------|-------|
| `bin/` | 4 | C1 | CLI entrypoints |
| `scripts/` | 5 | C1 | Build helpers |
| `docs/` | ~20 | Documentation | Research + draft |
| `eval/` | 3 | Testing | Eval test suite |
| `.github/workflows/` | 8 | CI/CD | CI/CD workflows |
| `.hivefiver-meta-builder/` | many | C6 | Authoring lab for primitives |

---

*Inventory finalized — 2026-06-06*
