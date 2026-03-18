# Roadmap: HiveMind Runtime Refactor and Deterministic Execution Migration

## Overview

This brownfield roadmap corrects HiveMind into a single-runtime, evidence-first OpenCode governance layer without rewriting proven package surfaces. The sequence follows the migration risk profile: establish one authoritative runtime, consolidate tool-governed mutation and deterministic routing, prove behavior against live OpenCode boundaries, then stabilize the terminal UI on top of that backend truth.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Runtime Authority Baseline** - Align managed and attached runtime ownership to the official SDK lifecycle. (completed 2026-03-17)
- [x] **Phase 2: Unified Runtime Operations** - Bring status, bootstrap, doctor, harness, and workflow inspection behind one additive authority seam. (completed 2026-03-18)
- [ ] **Phase 2.1: Feature Architecture Migration (INSERTED)** - Migrate to a hybrid feature structure to solve discoverability issues and isolate behavior.
- [ ] **Phase 2.2: TUI End-to-End Server Connection (INSERTED)** - Extract the OpenTUI dashboard into a proper app boundary and establish a working end-to-end connection with the OpenCode server.
- [ ] **Phase 3: Tool-Governed Mutation Foundation** - Route governed workflow writes through registered tools and official permission surfaces.
- [ ] **Phase 4: Deterministic Routing and Receipts** - Make routed execution budgets, policy defaults, and approval outcomes auditable.
- [ ] **Phase 5: Continuity and Recovery Contract** - Preserve deterministic continuation through compaction, attach, fork, and repair flows.
- [ ] **Phase 6: Inspection and Evidence Separation** - Keep runtime inspection read-only and clearly separate diagnostics from live proof.
- [ ] **Phase 7: Live Official-Boundary Proof** - Prove deterministic behavior against real OpenCode server, client, and plugin paths.
- [ ] **Phase 8: TUI Stabilization on Backend Truth** - Finish the operator terminal UI as a consumer of the authoritative runtime contract.

## Phase Details

### Phase 1: Runtime Authority Baseline
**Goal**: User can launch or attach HiveMind to the authoritative OpenCode runtime without split-brain ownership.
**Depends on**: Nothing (first phase)
**Requirements**: CTRL-01, CTRL-02
**Success Criteria** (what must be TRUE):
  1. User can start a HiveMind-managed runtime through the official SDK server/client lifecycle.
  2. User can attach HiveMind to an existing OpenCode runtime without spawning a competing instance.
  3. User sees one consistent runtime identity across the backend surfaces involved in start and attach flows.
**Plans**: 2 plans

Plans:
- [ ] 01-01: Establish authoritative runtime ownership and lifecycle entrypoints
- [ ] 01-02: Normalize attach semantics and prevent competing runtime instances

### Phase 2: Unified Runtime Operations
**Goal**: User can operate and inspect the runtime from one backend-owned authority seam.
**Depends on**: Phase 1
**Requirements**: CTRL-03, CTRL-04, INSP-03
**Success Criteria** (what must be TRUE):
  1. User can inspect authoritative runtime status from a single backend-owned source of truth.
  2. User can run bootstrap, doctor, and harness flows against that same runtime contract and get consistent results.
  3. User can inspect current runtime authority, active workflow state, and last significant runtime events from one additive inspection seam.
**Plans**: 4 plans

Plans:
- [x] 02-00-PLAN.md — Establish Bun/OpenTUI app boundary and shared runtime-status contracts
- [x] 02-01-PLAN.md — Consolidate runtime status and authority reporting
- [x] 02-02-PLAN.md — Rebind bootstrap, doctor, and harness flows to the shared runtime contract
- [x] 02-03-PLAN.md — Expose workflow and event inspection through one additive seam

### Phase 2.1: Feature Architecture Migration (INSERTED)
**Goal**: Migrate to a hybrid feature structure to solve discoverability issues and isolate behavior.
**Depends on**: Phase 2
**Requirements**: ARCH-01 (Architecture Migration)
**Success Criteria** (what must be TRUE):
  1. The codebase is reorganized to use `src/features/*` for ownership.
  2. `src/tools/`, `src/hooks/`, `src/commands/`, and `src/plugin/` act as thin OpenCode adapter or assembly surfaces.
  3. Runtime-entry, session-entry, workflow, trajectory, handoff, doc-intelligence, and runtime-observability behavior are consolidated into `src/features/*`.
  4. CLI and slash-command runtime-entry flows delegate through feature-owned modules and shared contracts instead of owning orchestration directly.
**Plans**: 7 plans

Plans:
- [ ] 2.1-01-PLAN.md — Establish `src/features/` directories and shared contracts boundary
- [ ] 2.1-02-PLAN.md — Migrate runtime-entry, session-entry, and handoff to features
- [ ] 2.1-03-PLAN.md — Convert trajectory and workflow tool authority files into thin feature-backed adapters
- [ ] 2.1-04-PLAN.md — Convert runtime-observability and doc-intelligence tool authority files into thin feature-backed adapters
- [ ] 2.1-05-PLAN.md — Migrate CLI and slash-command runtime flows and finalize hook/plugin assembly wiring
- [ ] 2.1-06-PLAN.md — Migrate control-plane handler and runtime surface sync to features
- [ ] 2.1-07-PLAN.md — Migrate hook helpers to session-entry and finalize recovery handler integration

### Phase 2.2: TUI End-to-End Server Connection (INSERTED)
**Goal**: Extract the OpenTUI dashboard into a proper app boundary and establish a working end-to-end connection with the OpenCode server.
**Depends on**: Phase 2.1
**Requirements**: INT-01 (TUI Integration), FLOW-01 (Innate OpenCode Functionality)
**Success Criteria** (what must be TRUE):
  1. The dashboard is fully extracted into an isolated `apps/opentui` Bun app boundary.
  2. The TUI is wired to the OpenCode server using shared runtime-status contracts.
  3. Innate OpenCode work functions without communication problems between the client and server.
**Plans**: 3 plans

Plans:
- [ ] 2.2-01: Extract the OpenTUI dashboard into `apps/opentui`
- [ ] 2.2-02: Wire the TUI client to the OpenCode server via shared contracts
- [ ] 2.2-03: Establish an end-to-end test proving innate OpenCode capability across the boundary

### Phase 3: Tool-Governed Mutation Foundation
**Goal**: User can run governed workflows where critical state changes go through registered tools and official mutation gates.
**Depends on**: Phase 2
**Requirements**: EXEC-01, SAFE-01, SAFE-02
**Success Criteria** (what must be TRUE):
  1. User can run governed agent workflows whose critical state changes route through registered tools instead of prompt-only control.
  2. User can enforce mutation policy through official permission and tool-hook surfaces.
  3. User can rely on brownfield-safe defaults that restrict dangerous runtime actions until explicitly approved.
**Plans**: 3 plans

Plans:
- [ ] 03-01: Consolidate mutation entrypoints behind registered tools
- [ ] 03-02: Enforce permission-aware mutation policy at the official hook boundary
- [ ] 03-03: Apply brownfield-safe runtime defaults and remove hidden write paths

### Phase 4: Deterministic Routing and Receipts
**Goal**: User can govern routed execution with deterministic budgets, policy defaults, and auditable receipts.
**Depends on**: Phase 3
**Requirements**: EXEC-02, EXEC-03, SAFE-03
**Success Criteria** (what must be TRUE):
  1. User can apply deterministic execution budgets and policy defaults to routed agents.
  2. User can capture structured receipts for tool selection, tool invocation, and workflow progression during governed runs.
  3. User can see whether a risky action was allowed, denied, or escalated and why.
**Plans**: 2 plans

Plans:
- [ ] 04-01: Introduce deterministic routing budgets and policy resolution
- [ ] 04-02: Record approval outcomes and workflow receipts as first-class runtime artifacts

### Phase 5: Continuity and Recovery Contract
**Goal**: User can continue governed work across compaction and recovery without losing deterministic state.
**Depends on**: Phase 4
**Requirements**: FLOW-01, FLOW-02, FLOW-03, FLOW-04
**Success Criteria** (what must be TRUE):
  1. User can resume a governed session after compaction without losing the active task, next step, or tool context.
  2. User can continue through attach or fork flows with consistent runtime state and session context.
  3. User can recover from damaged bootstrap or runtime state using a supported repair flow instead of manual file surgery.
  4. User can persist the minimum deterministic continuation record outside prompt memory.
**Plans**: 3 plans

Plans:
- [ ] 05-01: Define and persist the minimum continuation record
- [ ] 05-02: Harden compact, resume, attach, and fork continuity flows
- [ ] 05-03: Align repair and recovery paths to the deterministic runtime contract

### Phase 6: Inspection and Evidence Separation
**Goal**: User can inspect runtime-relevant material safely while knowing what is local diagnostic output versus live proof.
**Depends on**: Phase 5
**Requirements**: INSP-01, INSP-02
**Success Criteria** (what must be TRUE):
  1. User can read and search runtime-relevant documents and artifacts through stable read-only inspection surfaces.
  2. User can distinguish local diagnostics from live OpenCode proof in status, reports, and verification output.
**Plans**: 2 plans

Plans:
- [ ] 06-01: Stabilize read-only inspection surfaces for runtime artifacts
- [ ] 06-02: Label and separate diagnostic evidence lanes from live proof lanes

### Phase 7: Live Official-Boundary Proof
**Goal**: Maintainer can prove deterministic HiveMind behavior against real OpenCode boundaries instead of mocks alone.
**Depends on**: Phase 6
**Requirements**: EXEC-04, VERF-01, VERF-02, VERF-03
**Success Criteria** (what must be TRUE):
  1. Maintainer can run a live official-boundary proof suite that boots real OpenCode server, client, and plugin paths.
  2. Maintainer can verify deterministic behavior for bootstrap, tool invocation, continuation, and recovery flows in that live suite.
  3. Maintainer can report unit, integration, and live-proof evidence separately so runtime claims remain auditable.
  4. Maintainer can verify in a live runtime session that routed agents used the expected tools.
**Plans**: 3 plans

Plans:
- [ ] 07-01: Build the live OpenCode proof harness and fixture discipline
- [ ] 07-02: Cover deterministic bootstrap, tool, continuation, and recovery assertions
- [ ] 07-03: Publish evidence outputs with separate unit, integration, and live-proof lanes

### Phase 8: TUI Stabilization on Backend Truth
**Goal**: User can operate HiveMind from the terminal UI without the UI becoming a second source of truth.
**Depends on**: Phase 7
**Requirements**: TUI-01, TUI-02, TUI-03
**Success Criteria** (what must be TRUE):
  1. User can view runtime status, approval state, and recovery hints from the terminal UI without relying on hidden logs.
  2. User can trigger approved runtime actions from the terminal UI through backend-authoritative commands or tools.
  3. User can observe live session events in the terminal UI without the UI becoming a second source of truth.
**Plans**: 3 plans

Plans:
- [ ] 08-01: Bind TUI views to authoritative runtime status and approval read models
- [ ] 08-02: Route TUI actions through backend-owned commands and tools
- [ ] 08-03: Stabilize live event rendering and recovery/operator feedback

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 2.1 → 2.2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Runtime Authority Baseline | 2/2 | Complete   | 2026-03-17 |
| 2. Unified Runtime Operations | 4/4 | Complete | 2026-03-18 |
| 2.1. Feature Architecture Migration | 0/7 | Not started | - |
| 2.2. TUI End-to-End Server Connection | 0/3 | Not started | - |
| 3. Tool-Governed Mutation Foundation | 0/3 | Not started | - |
| 4. Deterministic Routing and Receipts | 0/2 | Not started | - |
| 5. Continuity and Recovery Contract | 0/3 | Not started | - |
| 6. Inspection and Evidence Separation | 0/2 | Not started | - |
| 7. Live Official-Boundary Proof | 0/3 | Not started | - |
| 8. TUI Stabilization on Backend Truth | 0/3 | Not started | - |
