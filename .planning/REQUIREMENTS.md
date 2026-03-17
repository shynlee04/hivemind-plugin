# Requirements: HiveMind Runtime Refactor and Deterministic Execution Migration

**Defined:** 2026-03-17
**Core Value:** At runtime, HiveMind must reliably steer OpenCode agents through deterministic, tool-using workflows that are provably aligned with the live OpenCode client/server/plugin contract.

## v1 Requirements

### Runtime Control

- [x] **CTRL-01**: User can start a HiveMind-managed OpenCode runtime through the official SDK server/client lifecycle
- [x] **CTRL-02**: User can attach HiveMind to an existing OpenCode runtime without creating a competing runtime instance
- [x] **CTRL-03**: User can inspect authoritative runtime status from a single backend-owned source of truth
- [ ] **CTRL-04**: User can run bootstrap, doctor, and harness flows against the same authoritative runtime contract

### Deterministic Execution

- [ ] **EXEC-01**: User can run governed agent workflows whose critical state changes route through registered tools
- [ ] **EXEC-02**: User can apply deterministic execution budgets and policy defaults to routed agents
- [ ] **EXEC-03**: User can capture structured receipts for tool selection, tool invocation, and workflow progression during governed runs
- [ ] **EXEC-04**: User can verify in a live runtime session that routed agents used the expected tools

### Governance and Permissions

- [ ] **SAFE-01**: User can enforce mutation policy through official permission and tool-hook surfaces instead of prompt-only instructions
- [ ] **SAFE-02**: User can apply brownfield-safe defaults that restrict dangerous runtime actions until explicitly approved
- [ ] **SAFE-03**: User can see whether a risky action was allowed, denied, or escalated and why

### Continuity and Recovery

- [ ] **FLOW-01**: User can resume a governed session after compaction without losing the active task, next step, or tool context
- [ ] **FLOW-02**: User can continue through attach or fork flows with consistent runtime state and session context
- [ ] **FLOW-03**: User can recover from damaged bootstrap or runtime state using a supported repair flow instead of manual file surgery
- [ ] **FLOW-04**: User can persist the minimum deterministic continuation record outside prompt memory

### Inspection and Evidence

- [ ] **INSP-01**: User can read and search runtime-relevant documents and artifacts through stable read-only inspection surfaces
- [ ] **INSP-02**: User can distinguish local diagnostics from live OpenCode proof in status, reports, and verification output
- [ ] **INSP-03**: User can inspect current runtime authority, active workflow state, and last significant runtime events from one additive inspection seam

### Operator UI

- [ ] **TUI-01**: User can view runtime status, approval state, and recovery hints from the terminal UI without relying on hidden logs
- [ ] **TUI-02**: User can trigger approved runtime actions from the terminal UI through backend-authoritative commands or tools
- [ ] **TUI-03**: User can observe live session events in the terminal UI without the UI becoming a second source of truth

### Live Verification

- [ ] **VERF-01**: Maintainer can run a live official-boundary proof suite that boots real OpenCode server, client, and plugin paths
- [ ] **VERF-02**: Maintainer can verify deterministic behavior for bootstrap, tool invocation, continuation, and recovery flows in that live suite
- [ ] **VERF-03**: Maintainer can report unit, integration, and live-proof evidence separately so runtime claims remain auditable

## v2 Requirements

### Replay and Audit

- **AUD-01**: User can replay a governed run as a deterministic audit timeline
- **AUD-02**: User can inspect why an agent route changed between governed runs

### Policy Packs

- **POL-01**: User can choose reusable governance policy packs such as brownfield-safe, recovery, and audit-only
- **POL-02**: User can customize policy packs per project without editing code

### Advanced Operations UI

- **OPS-01**: User can use a richer OpenTUI operations console as a first-class experience
- **OPS-02**: User can inspect parallel/worktree orchestration from the operator console

### Feature Expansion

- **REST-01**: User can access additional restored intelligence capabilities beyond the current read-only document surface
- **REST-02**: User can use safe parallel/worktree orchestration after single-session determinism is proven

## Out of Scope

| Feature | Reason |
|---------|--------|
| Shadow runtime or parallel orchestration engine outside OpenCode | Conflicts with the goal of converging on the official SDK/plugin contract |
| Broad legacy CLI or feature restoration before live proof exists | Expands surface area before runtime truth is trustworthy |
| Hosted SaaS dashboard or browser-first product expansion | Not part of the brownfield runtime-correctness milestone |
| PTY-heavy interactive shell control as a core dependency | Increases flake and portability risk before deterministic core flows are stable |
| New speculative intelligence features beyond read-only inspection | Distracts from the migration's core value of deterministic runtime control |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CTRL-01 | Phase 1 - Runtime Authority Baseline | Complete |
| CTRL-02 | Phase 1 - Runtime Authority Baseline | Complete |
| CTRL-03 | Phase 2 - Unified Runtime Operations | Complete |
| CTRL-04 | Phase 2 - Unified Runtime Operations | Pending |
| EXEC-01 | Phase 3 - Tool-Governed Mutation Foundation | Pending |
| EXEC-02 | Phase 4 - Deterministic Routing and Receipts | Pending |
| EXEC-03 | Phase 4 - Deterministic Routing and Receipts | Pending |
| EXEC-04 | Phase 7 - Live Official-Boundary Proof | Pending |
| SAFE-01 | Phase 3 - Tool-Governed Mutation Foundation | Pending |
| SAFE-02 | Phase 3 - Tool-Governed Mutation Foundation | Pending |
| SAFE-03 | Phase 4 - Deterministic Routing and Receipts | Pending |
| FLOW-01 | Phase 5 - Continuity and Recovery Contract | Pending |
| FLOW-02 | Phase 5 - Continuity and Recovery Contract | Pending |
| FLOW-03 | Phase 5 - Continuity and Recovery Contract | Pending |
| FLOW-04 | Phase 5 - Continuity and Recovery Contract | Pending |
| INSP-01 | Phase 6 - Inspection and Evidence Separation | Pending |
| INSP-02 | Phase 6 - Inspection and Evidence Separation | Pending |
| INSP-03 | Phase 2 - Unified Runtime Operations | Pending |
| TUI-01 | Phase 8 - TUI Stabilization on Backend Truth | Pending |
| TUI-02 | Phase 8 - TUI Stabilization on Backend Truth | Pending |
| TUI-03 | Phase 8 - TUI Stabilization on Backend Truth | Pending |
| VERF-01 | Phase 7 - Live Official-Boundary Proof | Pending |
| VERF-02 | Phase 7 - Live Official-Boundary Proof | Pending |
| VERF-03 | Phase 7 - Live Official-Boundary Proof | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0

---
*Requirements defined: 2026-03-17*
*Last updated: 2026-03-18 after roadmap mapping*
