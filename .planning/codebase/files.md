# File Registry

**Analysis Date:** 2026-02-18

## Summary

| Layer | Files | Lines |
|-------|-------|-------|
| src/tools/ | 7 | 1,124 |
| src/lib/ | 42 | 10,247 |
| src/hooks/ | 13 | 2,377 |
| src/schemas/ | 8 | 1,140 |
| src/dashboard/ | 16 | 1,070 |
| src/cli/ | 5 | 1,748 |
| src/types/ | 2 | 39 |
| src/utils/ | 1 | 37 |
| src/ (root) | 1 | 166 |
| **Total** | **95** | **19,953** |

---

## src/tools/ (7 files)

| File | Lines | Purpose |
|------|-------|---------|
| `hivemind-memory.ts` | 368 | Knowledge persistence (save, recall, list) |
| `hivemind-session.ts` | 231 | Session lifecycle (start, update, close, status, resume) |
| `hivemind-cycle.ts` | 210 | Session export (export, list, prune) |
| `hivemind-hierarchy.ts` | 204 | Tree management (prune, migrate, status) |
| `hivemind-anchor.ts` | 139 | Immutable anchors (save, list, get) |
| `hivemind-inspect.ts` | 54 | State inspection (scan, deep, drift) |
| `index.ts` | 18 | Barrel exports |

---

## src/lib/ (42 files)

### Core Infrastructure
| File | Lines | Purpose |
|------|-------|---------|
| `planning-fs.ts` | 1,031 | Planning filesystem operations |
| `detection.ts` | 881 | Framework detection utilities |
| `hierarchy-tree.ts` | 873 | Trajectory → Tactic → Action tree |
| `session-engine.ts` | 578 | Session state machine |
| `graph-io.ts` | 651 | Graph read/write operations |
| `session_coherence.ts` | 603 | Session coherence logic |
| `manifest.ts` | 488 | Manifest file handling |
| `paths.ts` | 465 | Single source of truth for paths |
| `graph-migrate.ts` | 450 | Graph migration utilities |
| `compaction-engine.ts` | 445 | Session compaction logic |
| `cognitive-packer.ts` | 444 | Deterministic XML context compiler |
| `brownfield-scan.ts` | 397 | Legacy code scanning |
| `persistence.ts` | 376 | Atomic file I/O |
| `dual-read.ts` | 354 | Dual-source file reading |
| `migrate.ts` | 333 | Migration utilities |
| `session-swarm.ts` | 314 | Swarm session management |
| `session-governance.ts` | 305 | Session governance enforcement |
| `inspect-engine.ts` | 261 | State inspection engine |
| `watcher.ts` | 217 | fs.watch with debouncing |
| `session-split.ts` | 207 | Session splitting logic |
| `project-scan.ts` | 203 | Project scanning utilities |
| `session-export.ts` | 179 | Session export utilities |
| `mems.ts` | 176 | Memory persistence layer |
| `framework-context.ts` | 173 | Framework context management |
| `anchors.ts` | 75 | Anchor persistence layer |
| `auto-commit.ts` | 102 | Automatic git commit logic |
| `chain-analysis.ts` | 85 | Context chain validation |
| `event-bus.ts` | 125 | In-process EventEmitter pub/sub |
| `file-lock.ts` | 52 | File locking mechanism |
| `staleness.ts` | 128 | Context staleness detection |
| `toast-throttle.ts` | 162 | Toast notification throttling |
| `session-boundary.ts` | 110 | Session boundary detection |
| `onboarding.ts` | 113 | Onboarding flow logic |
| `tool-activation.ts` | 100 | Tool activation logic |
| `governance-instruction.ts` | 88 | Governance instruction parser |
| `logging.ts` | 65 | Logging utilities |
| `long-session.ts` | 30 | Long session management |
| `tool-response.ts` | 36 | Tool response formatting |
| `commit-advisor.ts` | 36 | Git commit message generation |
| `complexity.ts` | 70 | Code complexity analysis |
| `index.ts` | 30 | Library registry exports |

---

## src/hooks/ (13 files)

| File | Lines | Purpose |
|------|-------|---------|
| `soft-governance.ts` | 524 | Governance enforcement |
| `messages-transform.ts` | 477 | Message transformation |
| `compaction.ts` | 218 | Session archiving |
| `event-handler.ts` | 160 | Event dispatching hooks |
| `session-lifecycle-helpers.ts` | 386 | Session helper utilities |
| `session-lifecycle.ts` | 165 | Context injection every turn |
| `tool-gate.ts` | 329 | Tool access control |
| `swarm-executor.ts` | 75 | Swarm agent execution |
| `sdk-context.ts` | 117 | SDK context injection |
| `session_coherence/main_session_start.ts` | 189 | Session start logic |
| `session_coherence/types.ts` | 111 | Coherence type definitions |
| `session_coherence/index.ts` | 7 | Coherence main export |
| `index.ts` | 20 | Hook registry exports |

---

## src/schemas/ (8 files)

| File | Lines | Purpose |
|------|-------|---------|
| `brain-state.ts` | 427 | Session state Zod schema |
| `config.ts` | 417 | Configuration Zod schema |
| `graph-nodes.ts` | 111 | Graph node schemas with FK |
| `events.ts` | 39 | Event Zod schemas |
| `manifest.ts` | 20 | Manifest Zod schema |
| `hierarchy.ts` | 44 | Hierarchy Zod schema |
| `graph-state.ts` | 33 | Graph state Zod schema |
| `index.ts` | 9 | Schema registry exports |

---

## src/dashboard/ (16 files)

### Root
| File | Lines | Purpose |
|------|-------|---------|
| `loader.ts` | 238 | Dashboard loader |
| `App.tsx` | 205 | Main dashboard application |
| `i18n.ts` | 122 | Internationalization |
| `types.ts` | 55 | Dashboard type definitions |
| `server.ts` | 27 | Dashboard server |
| `bin.ts` | 69 | Dashboard binary entry |
| `design-tokens.ts` | 48 | Design token definitions |

### components/
| File | Lines | Purpose |
|------|-------|---------|
| `TelemetryHeader.tsx` | 65 | Telemetry header |
| `TrajectoryPane.tsx` | 59 | Trajectory display pane |
| `AutonomicLog.tsx` | 39 | Autonomic log component |
| `MemCreationModal.tsx` | 32 | Memory creation modal |
| `InteractiveFooter.tsx` | 17 | Interactive footer |
| `SwarmMonitor.tsx` | 17 | Swarm monitoring component |

### views/
| File | Lines | Purpose |
|------|-------|---------|
| `SwarmOrchestratorView.tsx` | 19 | Swarm orchestrator view |
| `TimeTravelDebuggerView.tsx` | 19 | Time travel debugger |
| `ToolRegistryView.tsx` | 19 | Tool registry view |

---

## src/cli/ (5 files)

| File | Lines | Purpose |
|------|-------|---------|
| `init.ts` | 668 | Initialization command |
| `interactive-init.ts` | 332 | Interactive init flow |
| `sync-assets.ts` | 319 | Asset synchronization |
| `scan.ts` | 39 | Scan command |
| `cli.ts` | 390 | CLI entry point |

---

## src/types/ (2 files)

| File | Lines | Purpose |
|------|-------|---------|
| `react.d.ts` | 23 | React type declarations |
| `ink.d.ts` | 16 | Ink type declarations |

---

## src/utils/ (1 file)

| File | Lines | Purpose |
|------|-------|---------|
| `string.ts` | 37 | String utilities |

---

## src/ (root)

| File | Lines | Purpose |
|------|-------|---------|
| `index.ts` | 166 | Package main entry point |

---

## tests/ (41 files, 12,373 lines)

| File | Purpose |
|------|---------|
| `agent-behavior-prompt.test.ts` | Agent behavior tests |
| `auto-commit.test.ts` | Auto-commit tests |
| `auto-hooks-pure.test.ts` | Hook purity tests |
| `cli-scan.test.ts` | CLI scan tests |
| `compact-purification.test.ts` | Compaction tests |
| `complexity.test.ts` | Complexity analysis tests |
| `config-health.test.ts` | Config health tests |
| `cycle-intelligence.test.ts` | Cycle intelligence tests |
| `dashboard-tui.test.ts` | Dashboard TUI tests |
| `detection.test.ts` | Detection tests |
| `ecosystem-check.test.ts` | Ecosystem check tests |
| `entry-chain.test.ts` | Entry chain tests |
| `evidence-gate.test.ts` | Evidence gate tests |
| `framework-context.test.ts` | Framework context tests |
| `governance-stress.test.ts` | Governance stress tests |
| `graph-migrate.test.ts` | Graph migration tests |
| `hierarchy-tree.test.ts` | Hierarchy tree tests |
| `init-planning.test.ts` | Init planning tests |
| `integration.test.ts` | Integration tests |
| `manifest.test.ts` | Manifest tests |
| `messages-transform.test.ts` | Message transform tests |
| `migration.test.ts` | Migration tests |
| `orphan-quarantine.test.ts` | Orphan quarantine tests |
| `path-traversal-hardening.test.ts` | Security tests |
| `paths.test.ts` | Path resolution tests |
| `persistence-locking.test.ts` | Persistence locking tests |
| `persistence-logging.test.ts` | Persistence logging tests |
| `phase-a-verification.test.ts` | Phase A verification |
| `schemas.test.ts` | Schema validation tests |
| `sdk-context.test.ts` | SDK context tests |
| `sdk-foundation.test.ts` | SDK foundation tests |
| `session-boundary.test.ts` | Session boundary tests |
| `session-export.test.ts` | Session export tests |
| `session-lifecycle-boundary.test.ts` | Lifecycle boundary tests |
| `session-lifecycle-helpers.test.ts` | Lifecycle helper tests |
| `session-structure.test.ts` | Session structure tests |
| `soft-governance.test.ts` | Governance tests |
| `string-utils.test.ts` | String utility tests |
| `sync-assets.test.ts` | Asset sync tests |
| `toast-throttle.test.ts` | Toast throttle tests |
| `tool-gate.test.ts` | Tool gate tests |

---

*File registry: 2026-02-18*
