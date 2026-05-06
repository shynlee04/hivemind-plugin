# Product Feature Catalog — Phases 48-52
**Research Date:** 2026-04-30
**Investigated:** 3 codebases (product-detox ~37K LOC, main hivemind-plugin ~3.5K LOC, harness-experiment ~8-13K LOC)
**Status:** Synthesis Complete

---

## Investigation Scope

Surveyed 3 codebases for code-intelligence tools, doc-related tools, and engine libraries:
- `/Users/apple/hivemind-plugin/.worktrees/product-detox` — Legacy, ~37K LOC TypeScript. 10 features, doc intelligence engine, event tracker, agent work contracts, control plane, CLI, recovery engine.
- `/Users/apple/hivemind-plugin` — Old main repo, ~3.5K LOC. WaiterModel delegation, prompt-enhance pipeline. Mostly superseded.
- `/Users/apple/hivemind-plugin/.worktrees/harness-experiment` — Current cleaned architecture. CQRS, 11 tools, 40+ lib modules, 51 skills, 97 agents.

---

## What harness-experiment ALREADY Has (Don't Re-implement)

| Feature | Location | Status |
|---------|----------|--------|
| CQRS Architecture (tools=write, hooks=read) | `src/plugin.ts`, `src/hooks/hook-cqrs-boundary.ts` | Clean |
| DelegationManager (WaiterModel, dual-signal completion) | `src/lib/delegation-manager.ts` (656 LOC) | Mature |
| Continuity Store (JSON persistence, deep-clone-on-read) | `src/lib/continuity.ts` | Mature |
| Schema Kernel (Zod: agents, commands, skills, tools, permissions, MCP) | `src/schema-kernel/` | Growing |
| Framework Detector | `src/lib/framework-detector.ts` | Done |
| Primitive Loader + Config Compiler | `src/lib/primitive-loader.ts`, `src/lib/config-compiler.ts` | Done |
| Prompt Skim/Analyze/Patch Tools | `src/tools/prompt-skim/`, `src/tools/prompt-analyze/`, `src/tools/session-patch/` | Done |
| Concurrency (Keyed Semaphore FIFO) | `src/lib/concurrency.ts` | Done |
| Session Journal + Execution Lineage | `src/lib/session-journal.ts`, `src/lib/execution-lineage.ts` | Done |
| PTY Background Command Execution | `src/lib/pty/` | Done |
| Security (Path-scope, Redaction) | `src/lib/security/` | Done |
| 30 hm-* Skills (research chain, spec-driven, TDD, debug, refactor) | `.opencode/skills/hm-*` | Rich |
| 11 hf-* Skills (meta-builder: agent, command, skill, tool authoring) | `.opencode/skills/hf-*` | Rich |
| Quality Gate Triad (lifecycle → spec → evidence) | `.opencode/skills/gate-*` | Done |
| 6 stack-* Reference Skills (bun-pty, json-render, nextjs, opencode, vitest, zod) | `.opencode/skills/stack-*` | Done |

---

## CRITICAL GAPS — What harness-experiment is MISSING

### Gap 1: NO Structured Session Intake
Every session starts blind. No purpose classification. No language resolution. No profile gates. No readiness checks. The plugin boots, the delegation manager runs, but there's no structured front door.

**Source:** `product-detox/src/features/session-entry/` (13 files, ~1.2K LOC)

### Gap 2: NO Control Plane
No gatekeeper that runs before user messages. No detection of init/doctor/harness/settings primitives. No blocking entry when prerequisites are missing.

**Source:** `product-detox/src/control-plane/` (6 files, ~1K LOC)

### Gap 3: NO Session-Spanning Work Tracking
No trajectory ledger. No checkpoints. No way to know if a user is continuing prior work or starting fresh. Every session is blind to prior sessions.

**Source:** `product-detox/src/core/trajectory/` (9 files, ~1.5K LOC)

### Gap 4: NO Recovery from Corrupted State
No failure classification. No state repair. No checkpoint creation for corrupted `.hivemind/` state.

**Source:** `product-detox/src/recovery/` (3 files, ~200 LOC)

### Gap 5: NO AST-Based Document Intelligence
No markdown AST parsing. No heading hierarchy extraction. No document skimming, section reading, chunking, or search. Only regex-based prompt analysis.

**Source:** `product-detox/src/intelligence/doc/` (6 files, ~350 LOC) + `product-detox/src/tools/doc/` (3 files, ~100 LOC)

### Gap 6: NO Structured Event Journaling
No event classification pipeline. No delegation evidence tracking (partial/blocked/complete). No consolidated JSON + Markdown dual persistence. Session journal exists but is basic.

**Source:** `product-detox/src/features/event-tracker/` (30 files, ~3K LOC)

### Gap 7: NO Agent Work Contracts
No Zod-validated machine-readable contracts for agent tasks. No intent classification. No chain execution. No compaction preservation.

**Source:** `product-detox/src/features/agent-work-contract/` (20 files, ~3K LOC)

### Gap 8: NO Prompt Packet Compiler
No XML-like structured context packets. No main/sub-session packet differentiation. No `todo_authority` or `return_contract` concepts in context injection.

**Source:** `product-detox/src/context/prompt-packet/` (5 files, ~200 LOC)

---

## Product Feature Catalog — 9 Features to Port

### TIER 1: CRITICAL — Foundation Layer (Phase 48-49)

#### Feature 1: Session Entry Intake
- **Source:** `product-detox/src/features/session-entry/` (13 files, ~1.2K LOC)
- **Concept:** Structured bootstrap for every session. 8 purpose classes (`discovery → brainstorming → research → planning → implementation → gatekeeping → tdd → course-correction`). Multi-language detection via Unicode ranges (en, vi, zh, ko, ja). Intake gate resolution with blocking/non-blocking decisions. Profile resolution. Settings delta detection.
- **Key files:** `intake.gates.ts`, `purpose-classifier.ts`, `language-resolution.ts`, `readiness-gates.ts`, `start-work-types.ts`
- **Dependencies:** Control plane (for gate decisions)

#### Feature 2: Control Plane + Primitive Registry
- **Source:** `product-detox/src/control-plane/` (6 files, ~1K LOC)
- **Concept:** Gatekeeper running BEFORE user messages. Primitive detection: hm-init (no .hivemind), hm-doctor (unhealthy .hivemind), hm-harness (high-control purpose class), hm-settings (keywords). Each primitive carries: `initiationMode` (programmatic-required), `manualStateWritesForbidden` (CQRS enforcement), `requiredRuntimeTool`, `pressureContract`. Blocking vs non-blocking gate decisions.
- **Key files:** `control-plane-registry.ts`, `control-plane-types.ts`, `intake-gate-detection.ts`, `gate-resolution.ts`
- **Dependencies:** Session entry intake (purpose class)

#### Feature 3: Trajectory Ledger + Assessment
- **Source:** `product-detox/src/core/trajectory/` (9 files, ~1.5K LOC)
- **Concept:** Session-spanning work tracking. `TrajectoryRecord` composed of Core + Bindings + Evidence + Planning intersections. `TrajectoryCheckpoint` save points with resume targets. `assessTrajectoryEntry()` decision tree: attach to active trajectory, resume closed, create new, or refuse conflict. Continuation intent detection via regex (`continue|resume|pick up|last time|validated`).
- **Key files:** `trajectory-types.ts`, `trajectory-assessment.ts`, `trajectory-ledger.ts`, `trajectory-store.operations.ts`
- **Dependencies:** Workflow authority (for health inspection)

---

### TIER 2: HIGH — Intelligence Layer (Phase 50)

#### Feature 4: Doc Intelligence Engine
- **Source:** `product-detox/src/intelligence/doc/` (6 files, ~350 LOC)
- **Concept:** Pure, read-only markdown parsing engine using **remark** (unified.js ecosystem) + **mdast** types for AST-based heading parsing. Operations:
  - `skimDocument()` → DocumentSkim (path, metadata, heading outline, line count, token estimate)
  - `skimDirectory()` → DocumentSkim[] (recursive markdown discovery)
  - `readSection()` → content under a named heading
  - `readChunked()` → token-budgeted chunks (maxTokens × 4 chars per chunk)
  - `searchDocuments()` → regex search across all markdown files with heading context
- **Key data structures:** `HeadingHierarchy` (recursive tree), `DocumentChunk` (token-budgeted), `DocumentSearchResult` (heading-contextualized)
- **Safety:** `safePath()` path traversal protection, `isMarkdownDocument()` extension whitelist
- **Key files:** `read-ops.ts`, `formats/md.ts`, `safety.ts`, `types.ts`, `doc-surface-router.ts`
- **Dependencies:** `remark`, `unist-util-visit`, `mdast` (npm packages)

#### Feature 5: Hivemind Doc Tool
- **Source:** `product-detox/src/tools/doc/` (3 files, ~100 LOC)
- **Concept:** OpenCode plugin tool wrapping the doc intelligence engine. 5 actions: `skim`, `skim_directory`, `read`, `chunk`, `search`. Clean layered architecture: tool → feature (`doc-intelligence`) → engine (`intelligence/doc`). Pressure contracts (`steady-state`). Result envelope: `{kind: 'error'|'success', message, data}`.
- **Key files:** `tools.ts`, `types.ts`
- **Dependencies:** Doc intelligence engine

#### Feature 6: Event Tracker (Enhanced)
- **Source:** `product-detox/src/features/event-tracker/` (30 files, ~3K LOC)
- **Concept:** Full session event journaling system. 10 event types: `user_message`, `assistant_output`, `tool_invocation`, `delegation_created`, `delegation_returned`, `compaction`, `session_start`, `session_end`, `injection`, `error`. Event classification pipeline (parser → classifier → consolidated writer). Delegation evidence tracking: `partial`, `blocked`, `complete` with `evidenceSnapshot` and `blockedReason`. ADR-017 Session V3 schema. Dual persistence: atomic JSON writes (write-to-temp → rename) + append-only Markdown events.md. Parent-child session linking. TOC generation.
- **Key files:** `event-classifier.ts`, `consolidated-writer.ts`, `markdown-writer.ts`, `delegation-returned-evidence.ts`, `types.ts`
- **Dependencies:** Shared paths, runtime attachment

#### Feature 7: Prompt Packet Compiler
- **Source:** `product-detox/src/context/prompt-packet/` (5 files, ~200 LOC)
- **Concept:** Compiles runtime context into XML-like structured packets injected into system and user messages. Two packet types: `hivemind-kernel-packet` (main session: session_scope, lineage, trajectory, workflow, guardrails, delegation_posture) and `hivemind-delegation-packet` (sub-session: adds parent_session_id, delegation_inheritance, todo_authority, return_contract). 33 normalized fields with defaults. Compaction-safe context preservation.
- **Key files:** `prompt-packet-renderers.ts`, `prompt-packet-normalize.ts`, `prompt-packet-types.ts`, `prompt-compiler.ts`
- **Dependencies:** Session entry (purpose class, profile)

---

### TIER 3: MEDIUM — Contracts & Recovery (Phase 51-52)

#### Feature 8: Recovery Engine
- **Source:** `product-detox/src/recovery/` (3 files, ~200 LOC)
- **Concept:** First-class recovery from corrupted state. 9 failure classes: `missing-hivemind`, `missing-planning-root`, `missing-state-tasks`, `missing-graph-tasks`, `missing-trajectory-ledger`, `corrupt-trajectory-ledger`, `missing-task-link`, `unknown-task-link`, `active-trajectory-conflict`. Three operations: `assessRecoveryState()` (inspections → failure classification), `createRecoveryCheckpoint()` (save resume point), `repairRecoveryState()` (bootstrap missing structures, record outcomes). Runs before work begins.
- **Key files:** `recovery-engine.ts`, `recovery-types.ts`
- **Dependencies:** Trajectory ledger, workflow authority

#### Feature 9: Agent Work Contract
- **Source:** `product-detox/src/features/agent-work-contract/` (20 files, ~3K LOC)
- **Concept:** Zod-validated machine-readable contracts for agent tasks. `AgentWorkContract` schema: contractId, sessionId, userIntent (raw, confidence, purposeClass, requiresPlan, requiresGovernance), responseMode (broad-search-execute, interactive-qa, deep-research), workflow (planningPath, phase, tasks[]), chainActions (onTaskComplete, onWorkflowEnd, onDelegation, onCompaction80), briefing, anchors. `IntentClassifier` with keyword-pattern matching + confidence scoring + priority resolution. `ChainExecutor` with event-driven handler registration for 4 triggers. `CompactionPreservationPacket` for surviving context compaction (purposeClass, responseMode, workflowPhase, active/pending task IDs, briefing, follow-ups, recent anchor descriptions).
- **Key files:** `schema/contract.ts`, `engine/intent-classifier.ts`, `engine/chain-executor.ts`, `engine/contract-store.ts`, `tools/create-contract-tool.ts`
- **Dependencies:** Zod, session entry (purpose class)

---

## Proposed Phase Roadmap

```
Phase 48: Session Intake Foundation
├── Port Session Entry Intake (purpose classification, language resolution, profile gates)
│   Key files: intake.gates.ts, purpose-classifier.ts, language-resolution.ts
├── Port Control Plane + Primitive Registry (init/doctor/harness/settings detection)
│   Key files: control-plane-registry.ts, gate-resolution.ts
└── Wire both into harness-experiment plugin startup (plugin.ts hooks)

Phase 49: State Tracking + Recovery
├── Port Trajectory Ledger (session-spanning work tracking, checkpoints)
│   Key files: trajectory-types.ts, trajectory-assessment.ts, trajectory-ledger.ts
├── Port Recovery Engine (failure classification, state repair)
│   Key files: recovery-engine.ts, recovery-types.ts
├── Integrate trajectory with existing continuity.ts
└── Wire trajectory assessment into session startup

Phase 50: Doc & Code Intelligence
├── Port Doc Intelligence Engine (remark/mdast AST parser, skim/read/chunk/search)
│   Key files: read-ops.ts, formats/md.ts, safety.ts
├── Port Hivemind Doc Tool (5-action OpenCode tool wrapper)
│   Key files: tools/doc/tools.ts
├── Port Prompt Packet Compiler (XML context packets for session identity)
│   Key files: prompt-packet-renderers.ts, prompt-packet-normalize.ts
├── Port Enhanced Event Tracker (event classification, delegation evidence)
│   Key files: event-classifier.ts, consolidated-writer.ts
└── Create hm-doc-intelligence skill (soft layer wrapping hard tools)

Phase 51: Agent Contracts + Observability
├── Port Agent Work Contract (Zod contracts, intent classification, chain execution)
│   Key files: schema/contract.ts, engine/intent-classifier.ts, engine/chain-executor.ts
├── Port Runtime Observability (health monitoring, capability matrices)
├── Integrate contracts with delegation-manager.ts
└── Create hm-agent-contract skill

Phase 52: Integration + Hardening
├── Full test suite across all ported modules
├── Plugin loads and wires all new tools + hooks
├── E2E session flows: intake → trajectory → delegate → track → recover
├── Spec compliance gates for all ported modules
└── Performance profiling on module sizes (target <500 LOC each)
```

---

## Codebase Comparison Matrix

| Concept | product-detox | main hivemind-plugin | harness-experiment | Action |
|---------|---------------|---------------------|-------------------|--------|
| CQRS Architecture | Hybrid (tools + hooks mixed) | Mixed | Clean (enforced boundary) | Keep |
| Schema Kernel | Zod + YAML | Zod (prompt-enhance only) | Zod (10+ schemas) | Keep |
| Delegation | Packet-based | WaiterModel in lifecycle-manager | DelegationManager (extracted) | Keep |
| Continuity | Distributed (event-tracker, delegation-store) | Single continuity.ts | Clean continuity.ts | Keep |
| **Session Intake** | **FULL** (purpose, language, profile, gates) | **NONE** | **NONE** | **PORT** |
| **Control Plane** | **FULL** (primitive registry, gate decisions) | **NONE** | **NONE** | **PORT** |
| **Trajectory Ledger** | **FULL** (checkpoints, assessment) | **NONE** | **NONE** | **PORT** |
| **Doc Intelligence** | **FULL** (remark AST, skim/read/chunk/search) | **NONE** | **NONE** | **PORT** |
| **Event Tracker** | **FULL** (10 event types, delegation evidence) | Basic (session journal) | Basic (session journal) | **ENHANCE** |
| **Recovery Engine** | **FULL** (9 failure classes, repair) | Partial (in lifecycle) | **NONE** | **PORT** |
| **Agent Contracts** | **FULL** (Zod contracts, chain exec, compaction) | **NONE** | **NONE** | **PORT** |
| **Prompt Packets** | **FULL** (XML packets, main/sub differentiation) | Basic (messages-transform) | Basic (messages-transform) | **ENHANCE** |
| CLI | Full (4 commands) | None | Placeholder (`.gitkeep`) | Port if needed |
| Runtime Observability | Full (capability matrices) | None | None | Port if needed |
| 30 hm-* Skills | 1-2 | 1 (coordinating-loop) | 30 | Keep |
| 3 gate-* Skills | 0 | 0 | 3 | Keep |

---

## Investigation Methodology

Three parallel `researcher` subagents investigated each codebase. Each agent:
1. Listed all directories and files using glob/ls
2. Read key source files (first 50-200 lines) to understand purpose
3. Grepped for patterns related to code intelligence and doc tools
4. Compared findings against harness-experiment baseline
5. Returned structured reports with file:line evidence

No `.opencode/`, `.hivemind/`, `skills/`, or `agents/` directories were consulted — investigation focused exclusively on `src/` TypeScript source code.

---

## Key Decisions Required

1. **Port vs Rewrite:** Do we port product-detox code directly (adapting to harness-experiment's CQRS patterns), or rewrite from scratch using the concepts?
2. **Tool Registration:** Should doc intelligence be a standalone tool (`hivemind_doc`) or merged into existing prompt-skim/analyze tools?
3. **State Root:** All ported modules must use `.hivemind/` (Q6 canonical) — product-detox used varied paths.
4. **Module Size:** Product-detox has modules up to 3K LOC. Harness-experiment targets <500 LOC per module. How to decompose?
5. **Soft Layer:** Which features should be hard harness tools vs hm-* skills?
