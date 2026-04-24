# Detox Migration & Architecture Consolidation Plan

**Date:** 2026-04-24
**Author:** Devin (analysis session)
**Scope:** Migrate `v2.9.5-detox-dev` features into `feature/harness-implementation`, resolve delegation subsystem incidents, and establish a clean architecture that fronts the harness build.
**Status:** PROPOSAL — awaiting user review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Branch Forensics](#2-branch-forensics)
3. [Feature Inventory & Migration Eligibility](#3-feature-inventory--migration-eligibility)
4. [Architecture Assessment: What's Wrong Today](#4-architecture-assessment-whats-wrong-today)
5. [Proposed Target Architecture](#5-proposed-target-architecture)
6. [Migration Waves](#6-migration-waves)
7. [Delegation Subsystem Hardening (INC-01/03/06)](#7-delegation-subsystem-hardening)
8. [GSD Phase Resume Strategy](#8-gsd-phase-resume-strategy)
9. [Risk Register](#9-risk-register)
10. [Decision Log](#10-decision-log)

---

## 1. Executive Summary

### The Problem

Two divergent branches (`v2.9.5-detox-dev` and `feature/harness-implementation`) share the same merge-base (`77e43bf`) but have evolved in incompatible directions:

| Dimension | `feature/harness-implementation` | `v2.9.5-detox-dev` |
|-----------|----------------------------------|---------------------|
| **TS source files** | 46 (6,339 LOC) | 270+ (25,384 LOC) |
| **Architecture** | Thin composition root (plugin.ts), delegation-first, GSD-phased | Fat plugin with 11 feature domains, CLI, control-plane, SDK supervisor |
| **Delegation** | SDK-based DelegationManager with PTY fallback, WaiterModel, dual-signal completion | Delegation store (disk-based handoffs), delegation packets, evidence records |
| **Session tracking** | Continuity JSON store, lifecycle manager | Event tracker (classifier + writers), session journal, session-entry intake |
| **Task management** | taskState (in-memory), simple status | Full workflow-management (task-lifecycle, workflow-authority, workflow-router, continuity) |
| **Context engineering** | prompt-skim, prompt-analyze, session-patch tools | Prompt-packet compiler, context-renderer, tiered-injection, skill-injection |
| **Agent contracts** | None (agents configured via .opencode/ skills) | Full agent-work-contract engine (intent classifier, chain executor, anchor recorder) |
| **Recovery** | Continuity-based recovery in DelegationManager | Dedicated recovery engine + trajectory assessment |
| **Skills** | 30 hm-* skills in .opencode/skills/ (md files) | 20 skills in skills/ with references, templates, scripts, tests |
| **GSD integration** | Full get-shit-done embedded (commands, references, workflows) | Embedded get-shit-done subset |
| **Sidecar UI** | None | Next.js side-car app (apps/side-car) |
| **Tests** | 351 tests (vitest) | 19 test files (vitest) |
| **Phase progress** | 24 phases, 96% complete | Pre-phase (feature development) |

### The Recommendation

**Do NOT cherry-pick or merge detox into harness.** The branches have fundamentally different architectures. Instead:

1. **Use `feature/harness-implementation` as the target trunk** — it has proven architectural rigor (24 GSD phases, forensic verification, test coverage).
2. **Port detox features as new subsystems** in a layered architecture that preserves the harness as the single runtime authority.
3. **Organize the migration in 5 waves**, each producing a shippable increment.

---

## 2. Branch Forensics

### Merge-Base Analysis

Both branches diverge from `77e43bf` on `master` (v2.8.5). They share zero common commits post-divergence.

```
master (77e43bf) ─── v2.8.5
   ├──→ feature/harness-implementation (8ba3b08, 400+ commits)
   │      Focus: delegation runtime, GSD-phased cleanup, skills refactor
   │      
   └──→ v2.9.5-detox-dev (f04403c, 300+ commits)
          Focus: feature breadth, control-plane, event-tracker, agent-work-contract
```

### Conflict Surface

A direct merge would produce **massive conflicts** across:
- `src/` — completely different directory structures
- `package.json` — different dependency sets (detox has workspace + apps/)
- Skills — different naming conventions (`hivemind-*` vs `hm-*`)
- Tests — non-overlapping test suites

### Shared DNA

Despite divergence, both branches share conceptual patterns:
- Delegation as first-class primitive
- Disk-based state persistence
- OpenCode plugin API (`@opencode-ai/plugin`)
- Zod schema validation
- Session lifecycle hooks
- GSD workflow integration

---

## 3. Feature Inventory & Migration Eligibility

### Detox Features Rated for Migration

| Feature Domain | Key Files | LOC | Migration Priority | Refactor Needed | Notes |
|---|---|---|---|---|---|
| **Event Tracker** | `src/features/event-tracker/` (classifier, writers, parser) | ~2,500 | **HIGH** — solves INC-03/06 | MODERATE — must integrate with harness continuity, not standalone | The "session-journal" + "event-tracker" is the **turn-aware delegation manifest** the user wants |
| **Agent Work Contract** | `src/features/agent-work-contract/` (engine, hooks, tools, schema) | ~3,200 | **HIGH** — solves context rot | HEAVY — intent classifier and chain executor need to work with harness lifecycle | Core feature for "agents knowing what happened across turns" |
| **Workflow Management** | `src/core/workflow-management/` | ~1,200 | **MEDIUM** — enriches task tracking | MODERATE — harness has simpler taskState, needs clean merge | Task lifecycle with dependencies, verification contracts |
| **Trajectory System** | `src/core/trajectory/` | ~1,800 | **MEDIUM** — enables resumable sessions | MODERATE — ledger-based, fits alongside continuity | Trajectory assessment + recovery engine |
| **Session Entry / Intake** | `src/features/session-entry/` | ~1,500 | **MEDIUM** — provides lineage routing | MODERATE — language resolution, purpose classification, profile resolution | Clean decomposition, good for layering |
| **Control Plane** | `src/control-plane/` | ~800 | **LOW** — overlaps with harness plugin | HEAVY — registry + intake + handler pattern conflicts with composition root | Keep as reference, don't port directly |
| **Context / Prompt Packet** | `src/context/prompt-packet/` | ~1,000 | **LOW** — harness has prompt-skim/analyze | HEAVY — compiler + renderer + normalizer is a different approach | Extract useful patterns only |
| **CLI** | `src/cli/` (init, doctor, settings, harness) | ~600 | **LOW** — separate concern | LIGHT — can remain independent | Port last, as CLI wrapper |
| **Intelligence (Doc)** | `src/intelligence/doc/` | ~400 | **LOW** | LIGHT | Simple doc surface router |
| **Plugin Layer** | `src/plugin/` (context-renderer, skill-injection, etc.) | ~2,000 | **DO NOT PORT** — architecture conflict | N/A | Harness's composition root is deliberately thin; detox's plugin layer is fat |
| **Sidecar App** | `apps/side-car/` | ~300 | **DEFER** — GUI is separate concern | MODERATE | Next.js app, port when GUI layer is designed |
| **Recovery Engine** | `src/recovery/` | ~500 | **MEDIUM** | LIGHT — clean module | Trajectory-based recovery assessment |
| **SDK Supervisor** | `src/sdk-supervisor/` | ~400 | **LOW** | MODERATE | Health monitoring, session inspection |
| **Delegation Store** | `src/delegation/` | ~600 | **DO NOT PORT** — conflicts with DelegationManager | N/A | Harness uses DelegationManager (in-memory + continuity); detox's disk-based store is redundant |
| **Schema Kernel** | `src/schema-kernel/` | ~400 | **MEDIUM** | LIGHT | Agent templates, skill-injection records — useful for config |
| **Skills (md files)** | `skills/` (20 skills with refs/templates/tests) | N/A | **MEDIUM** | MODERATE — rename to hm-* convention | Port after architecture stabilizes |
| **GSD Integration** | `get-shit-done/`, `commands/` | N/A | **ALREADY PRESENT** in harness | LIGHT | Harness already has GSD; merge references only |

### Features NOT to Port

1. **`src/plugin/opencode-plugin.ts`** (fat plugin) — The harness's thin `plugin.ts` is architecturally correct. The detox plugin has 14 tool registrations, 8 hook handlers, slash-command routing, and governance toast wiring all in one file. This is the opposite of the harness philosophy.

2. **`src/delegation/delegation-store.ts`** (disk handoffs) — The harness manages delegations in-memory via `DelegationManager` with continuity persistence. The detox delegation-store creates separate handoff JSON files on disk. These are incompatible persistence models. The harness approach is correct (single source of truth).

3. **`src/control-plane/`** — Registry + intake + handler is a separate orchestration pattern that conflicts with the harness's direct-wiring composition root.

---

## 4. Architecture Assessment: What's Wrong Today

### 4.1 Delegation Lifecycle vs Conversation Lifecycle (INC-01/03/06)

**Root cause:** The harness dispatches and tracks delegations, but does not reconcile delegation lifecycle with conversation lifecycle across turns.

```
Current Flow (broken):
  Turn 1: Agent → delegate-task × 5 → returns IDs → stream ends
  Turn 2: User asks unrelated question → Agent answers
           ↳ system_reminder arrives mid-response (delegation X completed)
           ↳ Agent acknowledges inline, continues unrelated answer
  Turn 3: More system_reminders → User: "this is disruptive"
  Turn 4: New agent instance → zero delegation awareness → starts fresh
```

**What's missing:**
1. No delegation manifest (no turn-aware record of what's delegated)
2. No notification mediation (raw system_reminders hit conversation surface)
3. No inter-turn delegation awareness (new LLM instance doesn't know about prior delegations)
4. No stream lifecycle coordination (stream ends before tasks complete)

### 4.2 Scattered Feature Architecture (Detox)

The detox branch grew organically. Features are spread across 11 directories with overlapping responsibilities:

```
Responsibility overlap:
  "What happened in this session?"
    → event-tracker (classifier + writers)
    → session-journal (error-log + hierarchy)
    → trajectory (assessment + ledger)
    → agent-work-contract (anchor-recorder)
    → runtime-observability (status + sync)

  "What should the agent do next?"
    → session-entry (intake + purpose classifier)
    → agent-work-contract (intent classifier + response-mode resolver)
    → workflow-management (workflow-router)
    → control-plane (control-plane-handler)
```

### 4.3 Skill Ecosystem Fragmentation

- Detox: 20 skills named `hivemind-*` and `use-hivemind-*` with full reference/template/test structure
- Harness: 30 skills named `hm-*` in `.opencode/skills/` (flat md files, GSD-verified)
- Neither set is complete; both have overlapping coverage
- Playbook v2.0 mandates `hm-*` prefix and differential target set (4 group axes)

### 4.4 No Architecture-First Pipeline

Both branches started feature-first. The user's concern is correct: there's no layered architecture document that defines:
- Which subsystem owns which responsibility
- How data flows between subsystems
- What the persistence contract is
- How hooks/tools/skills compose at runtime

---

## 5. Proposed Target Architecture

### 5.1 Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PLUGIN COMPOSITION ROOT                   │
│  src/plugin.ts — thin, assembly-only, no business logic      │
│  Registers: hooks, tools, event observers                    │
└───────────┬─────────────┬──────────────────┬────────────────┘
            │             │                  │
   ┌────────▼────────┐   │    ┌─────────────▼──────────────┐
   │ HOOKS LAYER      │   │    │ TOOLS LAYER                │
   │ (read-side)      │   │    │ (write-side)               │
   │                  │   │    │                             │
   │ ∙ core-hooks     │   │    │ ∙ delegate-task             │
   │ ∙ session-hooks  │   │    │ ∙ delegation-status         │
   │ ∙ tool-guard     │   │    │ ∙ prompt-skim/analyze       │
   │ ∙ manifest-hooks │   │    │ ∙ session-patch             │
   │   (NEW)          │   │    │ ∙ run-background-command    │
   └────────┬─────────┘   │    │ ∙ work-contract (NEW)      │
            │             │    │ ∙ trajectory (NEW)          │
            │             │    │ ∙ task (NEW)                │
            │             │    └─────────────┬───────────────┘
            │             │                  │
   ┌────────▼─────────────▼──────────────────▼────────────────┐
   │              DOMAIN SERVICES LAYER                        │
   │  (business logic, orchestration, state machines)          │
   │                                                           │
   │  ┌──────────────────┐  ┌───────────────────────────┐     │
   │  │ Delegation Domain │  │ Session Domain             │     │
   │  │ ∙ DelegationMgr   │  │ ∙ SessionManifest (NEW)    │     │
   │  │ ∙ Concurrency     │  │ ∙ TurnTracker (NEW)        │     │
   │  │ ∙ Spawner         │  │ ∙ NotificationMediator NEW │     │
   │  │ ∙ Completion      │  │ ∙ IntakeGates (from detox) │     │
   │  └──────────────────┘  └───────────────────────────┘     │
   │                                                           │
   │  ┌──────────────────┐  ┌───────────────────────────┐     │
   │  │ Workflow Domain   │  │ Intelligence Domain        │     │
   │  │ ∙ TaskLifecycle   │  │ ∙ EventTracker (from detox)│     │
   │  │   (from detox)    │  │ ∙ TrajectoryEngine         │     │
   │  │ ∙ WorkflowRouter  │  │   (from detox)             │     │
   │  │   (from detox)    │  │ ∙ AgentWorkContract        │     │
   │  │ ∙ WorkflowAuth    │  │   (from detox)             │     │
   │  └──────────────────┘  │ ∙ RecoveryEngine            │     │
   │                        │   (from detox)              │     │
   │                        └───────────────────────────┘     │
   └──────────────────────────┬───────────────────────────────┘
                              │
   ┌──────────────────────────▼───────────────────────────────┐
   │              PERSISTENCE LAYER                            │
   │                                                           │
   │  ∙ Continuity Store (existing) — session state, recovery  │
   │  ∙ Delegation Persistence (existing) — delegation records │
   │  ∙ Event Journal (NEW from detox event-tracker)           │
   │  ∙ Trajectory Ledger (NEW from detox)                     │
   │  ∙ Task Store (NEW from detox workflow-management)        │
   │  ∙ Manifest Store (NEW) — delegation manifest per session │
   └──────────────────────────────────────────────────────────┘
```

### 5.2 Key Architectural Principles

1. **Harness is the single runtime authority.** All state mutations flow through the plugin → domain services → persistence pipeline. No tool or hook directly writes to disk.

2. **Continuity remains the canonical store.** The existing continuity.ts is the single-file persistence backbone. New stores (event journal, trajectory ledger, task store) are **additive**, not replacements.

3. **Notification mediation, not raw delivery.** A new `NotificationMediator` sits between delegation completion events and the conversation surface. It batches, defers, and formats notifications instead of injecting raw `system_reminder` messages.

4. **Session manifest is turn-aware.** A new `SessionManifest` tracks the current delegation set, their last known state, and whether results have been surfaced to the user. The manifest is read at turn-start by a pre-response hook.

5. **Event tracker is the intelligence layer, not the persistence layer.** The detox event-tracker's classifiers, parsers, and writers become an intelligence service that enriches the existing persistence (continuity + delegation records) with turn-level, delegation-level, and workflow-level context.

6. **Features compose via dependency injection.** Domain services receive their dependencies through constructor injection (as the harness already does with DelegationManager). No global singletons, no import-time side effects.

### 5.3 New Subsystems Required

| Subsystem | Source | Purpose | Depends On |
|-----------|--------|---------|------------|
| **SessionManifest** | NEW (inspired by detox event-tracker) | Turn-aware delegation tracking, briefing generation | DelegationManager, Continuity |
| **NotificationMediator** | NEW (INC-01 fix) | Batch/defer/format delegation notifications | SessionManifest, DelegationManager |
| **TurnTracker** | NEW (INC-03 fix) | Track turn boundaries, inject delegation context at turn-start | SessionManifest, Continuity |
| **EventJournal** | FROM detox event-tracker | Persistent session event log for cross-turn intelligence | Continuity |
| **TaskLifecycle** | FROM detox workflow-management | Task creation, status transitions, dependency tracking | Continuity |
| **TrajectoryEngine** | FROM detox core/trajectory | Long-running workflow tracking across sessions | Continuity, TaskLifecycle |
| **AgentWorkContract** | FROM detox features/agent-work-contract | Intent classification, response-mode resolution | SessionManifest, Continuity |
| **RecoveryEngine** | FROM detox recovery/ | Trajectory-based recovery assessment | TrajectoryEngine, Continuity |

---

## 6. Migration Waves

### Wave 0: Foundation & Quick Fixes (1-2 days)

**Goal:** Fix the delegation-status bug and establish the migration infrastructure.

**Tasks:**
1. Fix `delegation-status` list view to treat `status: "all"` or missing status as unfiltered query (INC-02). This is a one-line fix in `src/tools/delegation-status.ts`.
2. Create `.planning/proposals/` directory and commit this plan.
3. Add `src/lib/session-manifest.ts` stub with types.
4. Add `src/lib/notification-mediator.ts` stub with types.
5. Update `AGENTS.md` to reference the migration plan.

**Acceptance:** delegation-status bug fixed, stubs typed, plan committed.

### Wave 1: Notification Mediation Layer (3-5 days)

**Goal:** Solve INC-01 (system_reminder firehose) and INC-06 (stream lifecycle mismatch).

**Tasks:**
1. Implement `SessionManifest` — a per-session, in-memory structure (backed by continuity) that records:
   - Active delegations and their current status
   - Whether each delegation's result has been surfaced to the user
   - The turn number at which each delegation was dispatched
   - The turn number at which each delegation completed

2. Implement `NotificationMediator`:
   - Intercepts delegation completion events before they reach the conversation
   - Batches completions that arrive during the same turn
   - Generates a "delegation briefing" at turn-start if there are unsurfaced completions
   - Provides a `retrieved` flag to prevent double-reporting

3. Wire `SessionManifest` into the delegation lifecycle:
   - `PostToolUse` hook on `delegate-task` → append to manifest
   - `delegationManager.handleSessionIdle()` → update manifest status
   - `delegationManager.transitionToTerminal()` → update manifest status

4. Wire `NotificationMediator` into session hooks:
   - Replace raw `system_reminder` injection with mediator.queue()
   - At turn-start, mediator.flush() generates briefing if needed

**Acceptance:** Delegation completions no longer interrupt mid-conversation. New turn starts with a briefing of completed delegations. Tests verify batching behavior.

### Wave 2: Intelligence Layer — Event Tracker + Trajectory (5-7 days)

**Goal:** Port the detox event-tracker and trajectory system as the intelligence backbone, solving INC-03 (inter-turn delegation awareness) and INC-04 (context poison).

**Tasks:**
1. Port `src/features/event-tracker/` from detox as `src/intelligence/event-tracker/`:
   - Event classifier (user_message, assistant_output, tool_invocation, delegation_created, delegation_returned, etc.)
   - Writer adapter (appends structured events to journal)
   - Parser suite (turn-parser, delegation-extractor, meta-parser)
   - Markdown writer (human-readable journal output)
   
   **Refactor required:** Replace detox's standalone disk writes with writes through the persistence layer (continuity-backed event journal).

2. Port `src/core/trajectory/` from detox as `src/intelligence/trajectory/`:
   - Trajectory types (core, bindings, evidence, planning)
   - Trajectory store (ledger-based, operations, types)
   - Trajectory assessment (recovery decision logic)
   
   **Refactor required:** Trajectory bindings must reference harness delegation IDs (from DelegationManager), not detox delegation-store IDs.

3. Port `src/recovery/` from detox as `src/intelligence/recovery/`:
   - Recovery engine (assess recovery state, create checkpoints)
   - Recovery types
   
   **Refactor required:** Recovery assessment must use harness continuity for checkpoint data.

4. Wire event-tracker into harness hooks:
   - `event` observer → classify and record events
   - `chat.message` → record user messages
   - `tool.execute.after` → record tool invocations
   - Delegation lifecycle events → record delegation created/returned

5. Create `TurnTracker` that reads the event journal at turn-start to provide:
   - Summary of what happened in previous turns
   - List of active/completed delegations with their results
   - Workflow progress context

**Acceptance:** Event journal persists across turns. New LLM instance receives turn-aware context at start. Trajectory tracking enables resumable workflows. Tests verify event classification and turn-boundary detection.

### Wave 3: Workflow Management + Agent Work Contract (5-7 days)

**Goal:** Port task lifecycle and agent work contracts for structured workflow execution.

**Tasks:**
1. Port `src/core/workflow-management/` from detox as `src/domains/workflow/`:
   - Task lifecycle (create, activate, verify, complete, with dependency tracking)
   - Workflow authority (health checks, readiness probes)
   - Workflow router (intent → workflow resolution)
   - Workflow types
   - Continuity integration (workflow state in continuity store)

2. Port `src/features/agent-work-contract/` from detox as `src/domains/contracts/`:
   - Intent classifier (purpose classification: quick-action, research-brainstorm, project-driven)
   - Response-mode resolver
   - Contract store (CRUD + archive)
   - Chain executor (sequential tool chains)
   - Anchor recorder (checkpoint anchors)
   
   **Refactor required:** Intent classifier must use harness session context, not detox control-plane. Contract store must use continuity-backed persistence.

3. Register new tools in plugin.ts:
   - `hivemind_task` — task lifecycle operations
   - `hivemind_trajectory` — trajectory inspection/management
   - `hivemind_work_contract` — contract creation/export

4. Wire agent-work-contract hooks:
   - Event handler for contract lifecycle events
   - Compaction preservation (maintain contract data across context compactions)

**Acceptance:** Agents can create/track tasks with dependency graphs. Work contracts provide structured intent classification. Compaction preserves contract state. Full test coverage for task lifecycle state machine.

### Wave 4: Session Entry + Skills + CLI (3-5 days)

**Goal:** Port the session entry system, reconcile skills, and add CLI wrappers.

**Tasks:**
1. Port `src/features/session-entry/` from detox as `src/domains/session-entry/`:
   - Intake gates (readiness checks before session starts)
   - Language resolution (multi-language support)
   - Profile resolution (agent profile configuration)
   - Purpose classifier (session purpose detection)
   - Lineage router (hivefiver vs hiveminder routing)

2. Reconcile skills:
   - Map detox `hivemind-*` / `use-hivemind-*` skills to harness `hm-*` skills
   - Merge unique content from detox skills into harness skills
   - Port reference docs, templates, and test files that don't exist in harness
   - Follow Playbook v2.0 `hm-*` naming mandate

3. Port CLI (if needed):
   - `hm-init` — project initialization
   - `hm-doctor` — diagnostic health checks
   - `hm-settings` — configuration management
   
   These can remain as tool wrappers (as they already are in detox) rather than standalone CLI commands.

**Acceptance:** Session entry gates work. Skills reconciled under `hm-*` convention. CLI tools functional.

### Wave 5: Sidecar UI + Polish (deferred)

**Goal:** GUI layer for human-agent interaction.

**Tasks:**
1. Port `apps/side-car/` Next.js app
2. Wire to harness via OpenCode SDK
3. Settings dashboard, contract viewer, delegation monitor

**Acceptance:** Functional GUI showing delegation status, task progress, and agent contracts.

---

## 7. Delegation Subsystem Hardening

### INC-01: system_reminder Firehose → NotificationMediator (Wave 1)

**Current:** Raw `system_reminder` injected per delegation completion.
**Fix:** NotificationMediator batches completions, delivers as turn-start briefing.

```typescript
// New: src/lib/notification-mediator.ts
interface NotificationMediator {
  queue(delegationId: string, result: DelegationResult): void
  hasPending(): boolean
  flush(): DelegationBriefing  // Returns batched summary for turn-start injection
  markRetrieved(delegationId: string): void
}
```

### INC-03: No Inter-Turn Delegation Awareness → SessionManifest + TurnTracker (Wave 1 + 2)

**Current:** New LLM instance has zero knowledge of prior delegations.
**Fix:** SessionManifest persists delegation state in continuity. TurnTracker reads manifest at turn-start and injects context.

```typescript
// New: src/lib/session-manifest.ts
interface SessionManifest {
  delegations: Map<string, ManifestEntry>
  addDelegation(id: string, meta: DelegationMeta): void
  updateStatus(id: string, status: DelegationStatus, result?: unknown): void
  getUnsurfaced(): ManifestEntry[]
  markSurfaced(id: string): void
  serialize(): ContinuityCompatible
}
```

### INC-06: Stream Lifecycle Mismatch → Coordinated Completion (Wave 1)

**Current:** Stream ends before background tasks complete; no mechanism to hold or resume.
**Fix:** NotificationMediator + manifest ensures that even if the stream ends, the next turn starts with full delegation context. The manifest persists across stream boundaries via continuity.

### INC-02: delegation-status List View Bug → Quick Fix (Wave 0)

**Current:** `status: "all"` filters to empty because `"all"` doesn't match any delegation status.
**Fix:** In `src/tools/delegation-status.ts`, treat missing status or `"all"` as unfiltered:

```typescript
// Current (broken):
const filtered = args.status
  ? allDelegations.filter(d => d.status === args.status)
  : allDelegations

// Fixed:
const filtered = args.status && args.status !== "all"
  ? allDelegations.filter(d => d.status === args.status)
  : allDelegations
```

### INC-08: No Save-to-Disk → Event Journal (Wave 2)

**Current:** No mechanism to export delegation results to human-readable files.
**Fix:** Event journal (from detox event-tracker) automatically persists all delegation events to disk in markdown format. Additionally, delegation-status tool can accept an `export: true` option.

---

## 8. GSD Phase Resume Strategy

### Current Phase State

```
Phase 16.3: COMPLETE (4/4 plans) — delegation hardening gaps identified
Phase 17-24: COMPLETE — skills refactor cycle
Phase 3-5: PENDING — schema definition, migration gate, integration verification
Phase 9.2-9.3: PARTIAL/PENDING — completion detection, module restructuring
Phase 11: PENDING — clean architecture restructuring (replaces Phase 6+7)
Phase 13: PENDING — async result capture + persistence
```

### Recommended Resume Order

**Do NOT resume from Phase 3 (schema definition).** The migration changes the shape of what needs schema definition.

Instead:

```
1. Phase 25 (NEW): Migration Wave 0 — quick fixes + migration infrastructure
   → delegation-status bug, plan commit, stubs

2. Phase 26 (NEW): Migration Wave 1 — Notification Mediation
   → SessionManifest, NotificationMediator, TurnTracker stubs
   → Addresses INC-01, INC-06

3. Phase 27 (NEW): Migration Wave 2 — Intelligence Layer
   → Event tracker, trajectory, recovery ported from detox
   → Addresses INC-03, INC-04

4. Phase 28 (NEW): Migration Wave 3 — Workflow + Contracts
   → Task lifecycle, agent-work-contract from detox

5. Phase 11 (EXISTING): Clean Architecture Restructuring
   → Now informed by the actual architecture from Waves 1-3
   → Module boundaries, dependency direction enforcement

6. Phase 3 (EXISTING): Schema Definition
   → Now covers the full domain model (delegation + session + workflow + trajectory)

7. Phase 4 (EXISTING): Migration Gate
   → Verification that all ported features work end-to-end

8. Phase 5 (EXISTING): Integration Verification
   → Live runtime verification with real OpenCode sessions

9. Phase 29 (NEW): Migration Wave 4 — Session Entry + Skills + CLI

10. Phase 30 (NEW, deferred): Migration Wave 5 — Sidecar UI
```

### Why This Order

1. **Waves 0-1 are immediately user-visible** — they fix the delegation UX issues the user experienced in ses_2413.
2. **Wave 2 provides the intelligence backbone** that all subsequent features depend on (event tracking, trajectory, recovery).
3. **Wave 3 adds structured workflow management** that enables proper project-driven workflows.
4. **Phase 11 comes AFTER we know the actual shape** of the architecture, not before.
5. **Phase 3 (schema) comes after the domains exist** so the schema covers everything.
6. **Wave 4 (session entry + skills) is lower priority** because the harness's existing skill system works, and session entry is a refinement.

---

## 9. Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Detox features don't integrate cleanly with harness continuity | HIGH | MEDIUM | Each wave includes explicit continuity integration tests. Wave 1 validates the pattern before larger ports. |
| Migration introduces regressions in existing 351-test suite | HIGH | LOW | CI must remain green after each wave. No wave merges without full test pass. |
| Scope creep from detox features pulling in more dependencies | MEDIUM | HIGH | Strict eligibility table (Section 3). Each wave has a defined feature set. |
| Agent-work-contract's intent classifier conflicts with harness session hooks | MEDIUM | MEDIUM | Wave 3 explicitly refactors the classifier to use harness session context. |
| Skills reconciliation creates confusion about which skills are canonical | MEDIUM | MEDIUM | Playbook v2.0 `hm-*` naming is mandatory. Detox skills are renamed during port. |
| User's product-detox worktree continues diverging during migration | LOW | HIGH | This plan supersedes further detox development. New features go to harness. |

---

## 10. Decision Log

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| D-01 | Use `feature/harness-implementation` as target trunk, not detox | Harness has proven verification rigor (24 phases, forensic audits, 351 tests). Detox has feature breadth but architectural debt. | 2026-04-24 |
| D-02 | Port features as new subsystems, not cherry-pick | Branches have completely different directory structures and architectural patterns. Cherry-picking would create Frankenstein code. | 2026-04-24 |
| D-03 | Do NOT port detox's fat plugin or delegation-store | Harness's thin composition root and DelegationManager are architecturally correct. Detox's patterns are the ones that caused the problems. | 2026-04-24 |
| D-04 | New GSD phases (25-30) for migration, existing phases resume after | Migration changes what needs to happen in Phases 3, 4, 5, 11. Better to do migration first, then resume with accurate scope. | 2026-04-24 |
| D-05 | Notification mediation before intelligence layer | INC-01 (firehose) is the most user-visible problem. Fixing it first demonstrates immediate value while larger ports proceed. | 2026-04-24 |
| D-06 | Event tracker becomes intelligence service, not persistence layer | Harness already has continuity as persistence. Event tracker's value is in classification and turn-aware context, not in writing files. | 2026-04-24 |
| D-07 | Skills follow Playbook v2.0 `hm-*` convention | Already mandated by Phase 19 (completed). Detox skills must be renamed during port to maintain consistency. | 2026-04-24 |

---

## Appendix A: File Mapping (Detox → Harness)

```
DETOX                                    → HARNESS TARGET
─────────────────────────────────────────────────────────────
src/features/event-tracker/              → src/intelligence/event-tracker/
src/features/event-tracker/classifier/   → src/intelligence/event-tracker/classifier/
src/features/event-tracker/parser/       → src/intelligence/event-tracker/parser/
src/features/event-tracker/writers/      → src/intelligence/event-tracker/writers/
src/core/trajectory/                     → src/intelligence/trajectory/
src/recovery/                            → src/intelligence/recovery/
src/core/workflow-management/            → src/domains/workflow/
src/features/agent-work-contract/        → src/domains/contracts/
src/features/session-entry/              → src/domains/session-entry/
src/features/session-journal/            → src/intelligence/event-tracker/ (merge)
src/schema-kernel/                       → src/schema/ (selective)
src/intelligence/doc/                    → src/intelligence/doc/
src/features/handoff/                    → src/domains/delegation/ (merge with DelegationManager)
src/sdk-supervisor/                      → src/lib/supervisor/ (if needed)
src/cli/                                 → src/cli/ (Wave 4)
src/shared/                              → src/shared/ (selective merge)
skills/                                  → .opencode/skills/ (renamed to hm-*)
apps/side-car/                           → apps/side-car/ (Wave 5)
```

## Appendix B: Detox Features Cross-Referenced Against User Concerns

| User Concern | Detox Feature | Harness Gap | Migration Wave |
|---|---|---|---|
| "agents not knowing nor distinguish between session and subsession" | Event tracker + session-entry lineage router | No turn-aware context | Wave 2 |
| "context loss and loss in tasks focus" | Agent-work-contract (compaction preservation) | No compaction-aware contract | Wave 3 |
| "programatic auto parser and writer of the session" | Event tracker (classifier + writer) | No event classification | Wave 2 |
| "selective relevant and selective filtered assigned data is output" | Event tracker (hierarchy writer, synthesizer) | No selective data filtering | Wave 2 |
| "specialist of tools and engines for task managements" | Workflow management (task-lifecycle) | Simple taskState only | Wave 3 |
| "hooks and injections to context to guide the agents" | Session-entry intake gates, agent-work-contract hooks | Minimal context injection | Wave 3-4 |
| "agents can keep track of its saved context" | Trajectory system + recovery engine | No trajectory tracking | Wave 2 |
| "the combination of event-tracker and session-journal" | Event tracker + session journal | Neither exists in harness | Wave 2 |
| "intelligence, agent-work-contract, trajectory" | All three feature domains | None exist in harness | Wave 2-3 |
| "session-entry, runtime-entry, task, delegation, workflow-management" | Session-entry, workflow-management | Partial coverage | Wave 3-4 |
| "users setting, configurations" | Session-entry (language resolution, profile resolution) | No user config system | Wave 4 |
| "GUI as sidecar loader" | apps/side-car (Next.js) | No GUI | Wave 5 |
