# 7-Cluster Code Surface Inventory

**Date:** 2026-06-06
**Status:** IN PROGRESS — deep scan, interactive checkpoints

---

## Cluster Definitions

| Cluster | Focus | Primary Code Surfaces |
|---------|-------|----------------------|
| **C1: Governance + CLI + Config** | Installation, settings, permissions, primitives chaining, schema-kernel, routing, bootstrap | `src/cli/`, `src/config/`, `src/routing/`, `src/schema-kernel/`, `src/features/bootstrap/`, `src/features/governance-engine/`, `src/features/governance/`, `bin/`, `scripts/`, `assets/rules/`, `opencode.json` |
| **C2: Internal Programmatic Modules** | Session tracking, lifecycle, journal, trajectory, continuity, contracts | `src/task-management/`, `src/features/session-tracker/`, `src/features/agent-work-contracts/`, `src/features/sdk-supervisor/` |
| **C3: Delegation + Coordination + Intelligence** | Libs + tools agents call: delegate-task, execute-slash-command, tmux, pressure, trajectory, loops | `src/coordination/`, `src/features/tmux/`, `src/features/runtime-pressure/`, `src/features/capability-gate/`, `src/features/auto-loop/`, `src/features/ralph-loop/`, `src/tools/session/execute-slash-command.ts`, `src/tools/delegation/`, `src/tools/hivemind/`, `src/tools/tmux-*.ts` |
| **C4: Injections + Hooks** | SDK event observers, guards, CQRS classifier, pane-monitor, transforms | `src/hooks/`, `.opencode/hooks/` |
| **C5: Tool Surfaces** | LLM-callable tools (26 total), prompt tools, doc intelligence, tool intelligence | `src/tools/` (all 44 .ts), `src/features/doc-intelligence/`, `src/features/tool-intelligence/`, `src/features/prompt-packet/` |
| **C6: Assets — Shipped Primitives** | hm-*/hf-* agents, skills, commands, workflows, templates, references, agent-instructions | `assets/`, `.opencode/agents/hm-*`, `.opencode/agents/hf-*`, `.opencode/skills/hm-*`, `.opencode/skills/hf-*`, `.opencode/commands/`, `.hivefiver-meta-builder/` |
| **C7: Sidecar** | Next.js dashboard, HTTP server, SSE/WS pools, read-only state, JSON-render catalog | `src/sidecar/`, `sidecar/` (root Next.js app) |

---

## src/ Module Inventory (292 TypeScript files)

### C1: Governance + CLI + Config (54 files)

| Module | Files | Key Files | Purpose |
|--------|-------|-----------|---------|
| `src/cli/` | 10 | `index.ts` (runCli), `commands/{help,init,doctor,recover,version}.ts` | CLI substrate, independent of OpenCode plugin |
| `src/config/` | 8 | `subscriber.ts`, `compiler.ts`, `defaults.ts`, `workflow/` | Config loading, caching, compilation, workflow persistence |
| `src/routing/` | 11 | `command-engine/index.ts`, `session-entry/intake-gate.ts`, `behavioral-profile/` | Intent classification, command discovery, session entry |
| `src/schema-kernel/` | 21 | `hivemind-configs.schema.ts`, 19 schemas, `generate-config-json-schema.ts` | Zod schemas, JSON schema generation |
| `src/features/bootstrap/` | 10 | `primitive-loader.ts`, `primitive-registry.ts`, `framework-detector.ts`, `control-plane/` | Primitive loading, framework detection, runtime validation |
| `src/features/governance-engine/` | 4 | `evaluator.ts`, `config-reader.ts`, `create-governance-session.ts` | Governance evaluation |
| `src/features/governance/` | 1 | `persistence.ts` | Governance state persistence |

### C2: Internal Programmatic Modules (46 files)

| Module | Files | Key Files | Purpose |
|--------|-------|-----------|---------|
| `src/task-management/continuity/` | 4 | `index.ts`, `store-cache.ts`, `continuity-reader.ts`, `delegation-persistence.ts` | Session continuity, delegation persistence |
| `src/task-management/journal/` | 4 | `index.ts`, `query.ts`, `replay.ts`, `execution-lineage.ts` | Append-only event timeline |
| `src/task-management/lifecycle/` | 1 | `index.ts` | Harness lifecycle manager |
| `src/task-management/trajectory/` | 4 | `index.ts`, `ledger.ts`, `store-operations.ts`, `types.ts` | Phase trajectory ledger |
| `src/features/session-tracker/` | 36 | `index.ts`, `bootstrap.ts`, `capture/`, `persistence/`, `recovery/`, `streaming/`, `transform/` | Session knowledge capture, hierarchy, persistence |
| `src/features/agent-work-contracts/` | 6 | `store.ts`, `lifecycle.ts`, `operations.ts`, `bounds.ts` | Contract lifecycle, atomic persistence |
| `src/features/sdk-supervisor/` | 2 | `index.ts`, `types.ts` | SDK health monitoring |

### C3: Delegation + Coordination + Intelligence (58 files)

| Module | Files | Key Files | Purpose |
|--------|-------|-----------|---------|
| `src/coordination/delegation/` | 21 | `manager.ts`, `manager-runtime.ts`, `coordinator.ts`, `dispatcher.ts`, `state-machine.ts`, `lifecycle.ts`, `monitor.ts` | Delegation facade, lifecycle, state machine, dispatch |
| `src/coordination/spawner/` | 7 | `auto-loop.ts`, `ralph-loop.ts`, `session-creator.ts`, `spawn-request-builder.ts` | Autonomous loops, session creation |
| `src/coordination/completion/` | 2 | `detector.ts`, `notification-handler.ts` | Dual-signal WaiterModel completion |
| `src/coordination/concurrency/` | 1 | `queue.ts` | Per-model/per-agent lane concurrency |
| `src/coordination/command-delegation/` | 1 | `handler.ts` | Command-routed delegation |
| `src/coordination/sdk-delegation/` | 1 | `handler.ts` | SDK-routed delegation |
| `src/features/tmux/` | 7 | `integration.ts`, `multiplexer.ts`, `grid-planner.ts`, `session-manager.ts` | Tmux integration, pane management |
| `src/features/runtime-pressure/` | 5 | `index.ts`, `control-plane.ts`, `authority-matrix.ts`, `model.ts` | Runtime pressure classification |
| `src/features/capability-gate/` | 3 | `index.ts`, `agent-capability-profiles.ts` | Agent capability profiles |
| `src/features/auto-loop/` | 2 | `index.ts`, `types.ts` | Autonomous loop |
| `src/features/ralph-loop/` | 2 | `index.ts`, `types.ts` | Ralph loop |

### C4: Injections + Hooks (17 files)

| Module | Files | Key Files | Purpose |
|--------|-------|-----------|---------|
| `src/hooks/lifecycle/` | 2 | `core-hooks.ts`, `session-hooks.ts` | Event → state routing, session hooks |
| `src/hooks/guards/` | 2 | `tool-guard-hooks.ts`, `governance-block.ts` | Governance + circuit breaker + budget |
| `src/hooks/observers/` | 5 | `event-observers.ts`, `*-consumer.ts` | Delegation/session-entry/session-main observers |
| `src/hooks/transforms/` | 5 | `tool-before-guard.ts`, `tool-after-composer.ts`, `tool-after-workflow.ts`, `chat-message-capture.ts`, `contract-enforcement.ts` | Guard chain, after pipeline, message capture |
| `src/hooks/composition/` | 1 | `cqrs-boundary.ts` | CQRS read/write classifier |
| `src/hooks/pane-monitor.ts` | 1 | standalone | Tmux pane capture hook |
| `src/hooks/types.ts` | 1 | standalone | Shared hook dependency types |

### C5: Tool Surfaces (44 files)

| Module | Files | Key Files | Purpose |
|--------|-------|-----------|---------|
| `src/tools/session/` | 16 | `execute-slash-command.ts`, `session-tracker.ts`, `session-hierarchy.ts`, `session-context.ts`, `session-delegation-query.ts`, `session-journal-export.ts`, `session-patch/`, `dispatch-command.ts`, `resolve-command.ts`, `validate-command.ts`, `semantic-agent-selector.ts`, `workflow-parser.ts`, `session-resolver.ts` | Session tools — slash command execution, session tracking, command dispatch |
| `src/tools/hivemind/` | 9 | `hivemind-doc.ts`, `hivemind-trajectory.ts`, `hivemind-pressure.ts`, `hivemind-sdk-supervisor.ts`, `hivemind-command-engine.ts`, `hivemind-session-view.ts`, `hivemind-agent-work.ts`, `hivemind-steer.ts`, `run-background-command.ts` | Hivemind domain tools — doc intelligence, trajectory, pressure, SDK supervisor, steer |
| `src/tools/delegation/` | 6 | `delegate-task.ts`, `delegation-status.ts`, `readers/`, `types.ts` | Delegation tools — task dispatch, status polling |
| `src/tools/prompt/` | 6 | `prompt-skim/`, `prompt-analyze/` | Prompt analysis tools |
| `src/tools/config/` | 5 | `configure-primitive.ts`, `validate-restart.ts`, `bootstrap-init.ts`, `bootstrap-recover.ts` | Config tools — primitive configuration, bootstrap |
| `src/tools/tmux-copilot.ts` | 1 | standalone | Tmux copilot tool |
| `src/tools/tmux-state-query.ts` | 1 | standalone | Tmux state query tool |
| `src/features/doc-intelligence/` | 5 | `index.ts`, `chunker.ts`, `parser.ts`, `router.ts` | Document chunking, parsing, routing |
| `src/features/tool-intelligence/` | 2 | `index.ts`, `types.ts` | Tool intelligence |
| `src/features/prompt-packet/` | 2 | `kernel-packet.ts`, `compaction-preservation.ts` | Kernel packets, compaction preservation |

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
| `src/sidecar/server/` | ~15 | `factory.ts`, `handler.ts`, `registry.ts`, `cache.ts`, `routes/`, `sse/`, `ws/`, `tool-proxy/` | HTTP server, routes, SSE/WS pools, tool proxy |
| `src/sidecar/catalog/` | ~4 | `tool-catalog.json`, `json-render-catalog.ts` | Tool and JSON-render catalogs |
| `src/sidecar/` (other) | ~8 | `readonly-state.ts`, `readonly-state-extensions.ts`, `types.ts` | Read-only state projection |
| `sidecar/` (root) | 18K+ | `next.config.ts`, `package.json`, `src/`, `tests/` | Next.js dashboard app |

---

## Surfaces NOT in Any Cluster

| Surface | Files | Current Status | Recommendation |
|---------|-------|----------------|----------------|
| `src/shared/` | 16 (13 .ts) | Leaf utilities, SDK wrappers, runtime policy, types, helpers | **Foundation layer** — used by ALL clusters. Consider C1 or separate "Foundation" cluster |
| `src/plugin.ts` | 1 | Composition root (1076 LOC) — wires ALL surfaces | **Cross-cluster** — belongs to ALL clusters as the assembly point |
| `src/index.ts` | 1 | Public API barrel | **Cross-cluster** — re-exports for npm package |
| `tests/` | 292 | Vitest test suite mirroring src/ | **Testing infrastructure** — not in any cluster |
| `eval/` | 3 | Eval test suite (stability, correctness, coherence) | **Testing infrastructure** |
| `docs/` | ~20 | Research + draft docs | **Documentation** |
| `bin/` | 4 | CLI entrypoints (hivemind.cjs, validate scripts) | **C1 (Governance)** |
| `scripts/` | 5 | Build helpers (sync-assets.js, etc.) | **C1 (Governance)** |
| `.github/workflows/` | 8 | CI/CD workflows | **CI/CD** |
| `.hivefiver-meta-builder/` | many | Authoring lab for primitives | **C6 (Assets)** — source of truth for hm-*/hf-* |

---

## Cross-Cutting Dependencies Identified

| Source Module | Target Cluster(s) | Nature |
|---------------|-------------------|--------|
| `src/tools/session/execute-slash-command.ts` | C3, C5 | Coordination tool that agents call |
| `src/tools/delegation/delegate-task.ts` | C3, C5 | Delegation tool that agents call |
| `src/tools/config/configure-primitive.ts` | C1, C5 | Config tool that agents call |
| `src/features/session-tracker/hooks/` | C2, C4 | Session tracker has its own hooks |
| `src/features/session-tracker/capture/` | C2, C5 | Session tracker captures tool events |
| `src/hooks/guards/tool-guard-hooks.ts` | C1, C4 | Governance guard is a hook |
| `src/shared/runtime-policy.ts` | ALL | Runtime policy used by ALL clusters |
| `src/shared/types.ts` | ALL | Leaf type contract used by ALL clusters |
| `src/plugin.ts` | ALL | Composition root wires ALL surfaces |

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

## Open Questions

1. Should `src/shared/` be its own "Foundation" cluster or part of C1?
2. Should `tests/` (292 files) be an 8th cluster or sub-dimension of existing clusters?
3. Should `src/plugin.ts` (composition root) be in C1 or a cross-cluster reference?
4. How to handle tools that span multiple clusters (C3 vs C5)?
5. How to handle features that span multiple clusters (C2 session-tracker has hooks → C4)?

---

*Inventory in progress — 2026-06-06*
