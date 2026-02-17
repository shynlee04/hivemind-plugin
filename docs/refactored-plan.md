# HiveMind v3.0 — Relational Cognitive Engine Master Plan

> **Last Updated:** 2026-02-17
> **Status:** Phase 1-4 COMPLETE | Phase 5 IN PROGRESS | Phase 6-7 PENDING

Transform HiveMind from a passive "Flat-File Markdown Logger" into an active **Relational Cognitive Engine** powered by CQRS, Graph-RAG, the Actor Model, and a strict architectural taxonomy.

---

## Part 1: The Architectural Taxonomy (The Biological Model)

### 1. Tools (`src/tools/`): The Conscious Limbs (Write-Only)

- **What**: LLM-facing API wrappers. Just Zod schemas and descriptions.
- **Purpose**: Constrained, predictable way to **mutate** state.
- **The Rule**: Zero complex business logic. Parse LLM's JSON args → call Library → return JSON. **>100 lines = architecturally flawed.**

### 2. Libraries (`src/lib/`): The Subconscious Engine (RAM/CPU)

- **What**: Pure, deterministic TypeScript logic. *LLMs do not know these exist.*
- **Purpose**: State manipulation, Graph traversal, TTS calculations, file I/O, XML compression.
- **The Rule**: Never returns conversational natural language. Returns strict JSON, Booleans, or dense XML strings.

### 3. Hooks (`src/hooks/`): The Autonomic Nervous System (Read-Auto)

- **What**: OpenCode SDK event listeners (`messages.transform`, `session.compacting`, `tool.execute.after`).
- **Purpose**: Programmatically *force* context upon the LLM without tool calls.
- **The Rule**: Call Libraries to compile `.hivemind` state into purified XML → inject as `synthetic: true` parts.

### 4. Schemas (`src/schemas/`): The DNA (Zod Validation Layer)

- **What**: Zod schemas for all graph nodes, config, and state.
- **The Rule**: Every graph node MUST have UUID `id` + explicit FK fields. Orphaned nodes quarantined (not crashed).

### Enforcement Paradigms

- **CQRS**: Tools = Write-Only Commands. Hooks + Libs = Read-Only Queries.
- **Graph-RAG**: All `graph/` entities are UUID-keyed JSON with FKs. Cognitive Packer traverses deterministically.
- **Actor Model**: Sessions are isolated containers. Sub-agent "swarms" run in headless child sessions via `client.session.create()` + `noReply: true`.

---

## Part 2: The `.hivemind` Relational Directory Tree

```text
.hivemind/
├── system/                            # CORE GOVERNANCE
│   ├── config.json                    # TTS thresholds, 80% split limits, governance mode
│   ├── manifest.json                  # Master Index (Maps all active UUIDs)
│   └── cmd_queue.jsonl                # IPC queue for Dashboard→Node.js (Phase 7)
│
├── graph/                             # THE RELATIONAL DATABASE
│   ├── trajectory.json                # The "Read-Head" (active_plan_id, phase_id, task_ids[])
│   ├── plans.json                     # Epics & Phases
│   ├── tasks.json                     # Execution Graph (Main→Sub→File locks)
│   ├── mems.json                      # Multi-shelf knowledgebase
│   └── orphans.json                   # Quarantined invalid FK nodes
│
├── state/                             # HOT SESSION STATE
│   ├── brain.json                     # Slim: session metadata + metrics only
│   ├── anchors.json                   # Immutable anchors (survive compaction)
│   └── hierarchy.json                 # Legacy tree (deprecated)
│
├── sessions/                          # SDK CONTAINERS (Actor Model)
│   ├── active/
│   │   ├── session_main.json          # Primary orchestrator metadata
│   │   └── swarms/                    # Headless delegation sessions
│   └── archive/
│       ├── compacted/                 # Immutable /compact history
│       └── splits/                    # Context XML exports
│
└── artifacts/                         # HUMAN-READABLE OUTPUTS
    ├── dashboards/                    # TUI snapshot data
    └── synthesis/                     # Reports, markdown summaries
```

---

## Part 3: Current State Audit (Updated 2026-02-17)

### ✅ A. Canonical Tool Registry — 6 Tools Wired

| Tool | Lines | Status | Notes |
|------|-------|--------|-------|
| `hivemind-session.ts` | 231 | ✅ ACTIVE | start/update/close/status/resume |
| `hivemind-inspect.ts` | 54 | ✅ ACTIVE | scan/deep/drift |
| `hivemind-memory.ts` | 368 | ✅ ACTIVE | save/recall/list |
| `hivemind-anchor.ts` | 139 | ✅ ACTIVE | save/list/get |
| `hivemind-hierarchy.ts` | 204 | ✅ ACTIVE | prune/migrate/status |
| `hivemind-cycle.ts` | 210 | ✅ ACTIVE | export/list/prune |

**Legacy tools deleted:** declare-intent, map-context, compact-session, scan-hierarchy, save-anchor, think-back, save-mem, recall-mems, export-cycle, self-rate (10 files removed)

### ✅ B. Library Files — Business Logic Extracted

| Library | Lines | Status |
|---------|-------|--------|
| `session-engine.ts` | 577 | ✅ COMPLETE |
| `graph-io.ts` | 627 | ✅ COMPLETE |
| `cognitive-packer.ts` | 444 | ✅ COMPLETE |
| `compaction-engine.ts` | 445 | ✅ COMPLETE |
| `inspect-engine.ts` | 261 | ✅ COMPLETE |

### ✅ C. Schema Files

| Schema | Lines | Status |
|--------|-------|--------|
| `graph-nodes.ts` | 111 | ✅ COMPLETE |
| `graph-state.ts` | 33 | ✅ COMPLETE |

### ✅ D. Hook Files — Refactored

| Hook | Lines | Status | Target |
|------|-------|--------|--------|
| `session-lifecycle.ts` | 165 | ✅ COMPLETE | ≤200 ✅ |
| `messages-transform.ts` | 477 | ✅ COMPLETE | Packer wired |

### ✅ E. Split-Brain Chimera Fixes — ALL COMPLETE

| Chimera | Status | Evidence |
|---------|--------|----------|
| CHIMERA-1: Wire tools to graph-io | ✅ FIXED | hivemind-memory.ts imports loadGraphMems, addGraphMem |
| CHIMERA-2: FK validation on happy path | ✅ FIXED | validateTasksWithFKValidation called at line 549, 593 |
| CHIMERA-3: JSON responses enforced | ✅ FIXED | toSuccessOutput() used, no args.json conditionals |
| CHIMERA-4: Swarm SDK execution | ✅ FIXED | client.session.create() + noReply: true implemented |
| CHIMERA-5: Cursor restore | ✅ FIXED | Session continuity maintained |
| CHIMERA-6: Zombie toast | ✅ FIXED | Drift toast removed from soft-governance.ts |

### ✅ F. P0/P1 Architectural Patches — ALL COMPLETE

| Patch | Status | Evidence |
|-------|--------|----------|
| P0-1: Concurrency (proper-lockfile) | ✅ FIXED | Commit 06d2a7f |
| P0-3: Read-time Zod fault tolerance | ✅ FIXED | .catch() + quarantine to orphans.json |
| P1-1: 80% splitter amnesia fix | ✅ FIXED | Last 6 messages captured in <recent_dialogue> |
| P1-2: Anti-pattern preservation | ✅ FIXED | false_path → <anti_patterns> (commits 5c8fcd3, 9658d78) |
| P1-3: Tool ID echo | ✅ FIXED | toSuccessOutput(entityId) (commit 965f8c4) |
| P1-4: Dynamic XML budget | ✅ FIXED | 12% context window ~15360 chars (commit fff5e01) |

### 📊 G. Test Suite Status

| Metric | Value |
|--------|-------|
| Total Tests | 126 |
| Passing | 125 |
| Failing | 1 |
| Pass Rate | 99.2% |

**Failing Test:** `tests/integration.test.ts` - references legacy tool patterns

---

## Part 4: Execution Phases — Progress Tracker

### Phase 1: Graph Schemas & Dumb Tool Diet ✅ COMPLETE

| US | Title | Status |
|----|-------|--------|
| US-001 | Graph node Zod schemas | ✅ COMPLETE |
| US-002 | Graph state aggregates | ✅ COMPLETE |
| US-003 | Paths for graph directory | ✅ COMPLETE |
| US-004 | Compaction engine extraction | ✅ COMPLETE |
| US-005 | Session engine extraction | ✅ COMPLETE |
| US-006 | Inspect engine extraction | ✅ COMPLETE |
| US-007 | Brownfield scan extraction | ✅ COMPLETE |
| US-008 | Session split extraction | ✅ COMPLETE |
| US-009 | Tool response helper | ✅ COMPLETE |

---

### Phase 2: Cognitive Packer ✅ COMPLETE

| US | Title | Status |
|----|-------|--------|
| US-010 | Cognitive packer core | ✅ COMPLETE |
| US-011 | Time Machine filter | ✅ COMPLETE |
| US-012 | TTS (Time-To-Stale) filter | ✅ COMPLETE |
| US-013 | XML compression with budget | ✅ COMPLETE |
| US-014 | Graph I/O layer | ✅ COMPLETE |

---

### Phase 3: SDK Hook Injection ✅ COMPLETE

| US | Title | Status |
|----|-------|--------|
| US-015 | Wire packer to messages-transform | ✅ COMPLETE |
| US-016 | Pre-Stop Gate checklist | ✅ COMPLETE |
| US-017 | Refactor session-lifecycle | ✅ COMPLETE |

---

### Phase 4: Graph Migration & Session Swarms ✅ COMPLETE

| US | Title | Status |
|----|-------|--------|
| US-018 | Graph migration script | ✅ COMPLETE |
| US-019 | Dual-read backward compat | ✅ COMPLETE |
| US-020 | 80% session splitter | ✅ COMPLETE |
| US-021 | Headless researcher swarms | ✅ COMPLETE |
| US-022 | Trajectory write-through | ✅ COMPLETE |

---

### Phase 5: Tool Consolidation 🔄 IN PROGRESS

| US | Title | Status | Notes |
|----|-------|--------|-------|
| US-023 | Wire 6 canonical tools | ✅ COMPLETE | Tools registered in index.ts |
| US-024 | Delete 13 old tool files | ✅ COMPLETE | 10 legacy files deleted |
| US-025 | Update documentation | ⏳ PENDING | AGENTS.md, README.md |

**Remaining:** Update documentation with new tool names

---

### Phase 6: Testing & Verification 🔄 IN PROGRESS

| US | Title | Status |
|----|-------|--------|
| US-026 | Graph schema tests | ✅ COMPLETE |
| US-027 | Cognitive packer tests | ✅ COMPLETE |
| US-028 | Graph I/O tests | ✅ COMPLETE |
| US-029 | Migration tests | ✅ COMPLETE |
| US-030 | Session swarm tests | ✅ COMPLETE |
| US-031 | Full regression test | ⏳ 125/126 |

**Remaining:** Fix 1 failing test in `tests/integration.test.ts`

---

### Phase 7: OpenTUI Dashboard ⏳ PENDING

> **Proposal:** See `docs/plans/2026-02-17-phase-6-7-master-plan.md` for detailed implementation plan

| US | Title | Status | Priority |
|----|-------|--------|----------|
| US-032 | Migrate from Ink to OpenTUI | ⏳ PENDING | P0 |
| US-033 | TelemetryHeader component | ⏳ PENDING | P1 |
| US-034 | TrajectoryPane component | ⏳ PENDING | P1 |
| US-035 | MemoryPane component | ⏳ PENDING | P1 |
| US-036 | AutonomicLog component | ⏳ PENDING | P1 |
| US-037 | InteractiveFooter component | ⏳ PENDING | P1 |
| US-038 | Dashboard IPC boundary | ⏳ PENDING | P0 |
| US-039-050 | Additional dashboard components | ⏳ PENDING | P2 |

**Critical Path:**
1. US-032 (OpenTUI migration) → requires Bun runtime
2. US-038 (IPC boundary) → cmd_queue.jsonl for safe Bun↔Node.js communication

---

## Part 5: Remaining Work Summary

### Immediate (Phase 5-6)

| Task | Scope | Duration | Risk |
|------|-------|----------|------|
| Fix integration.test.ts | 1 test file | 30 min | Low |
| Update documentation | AGENTS.md, README.md | 1 hour | Low |

### Next Phase (Phase 7)

| Task | Scope | Duration | Risk |
|------|-------|----------|------|
| US-032: OpenTUI migration | Dashboard framework | 4 hours | High |
| US-038: IPC Queue | cmd_queue.jsonl | 2 hours | Medium |
| Dashboard components | 5 views | 8 hours | Medium |

**Total Phase 7 Estimate:** 14 hours

---

## Part 6: Dependency Graph

```
Phase 1 (Schemas) ✅
    ↓
Phase 2 (Packer) ✅
    ↓
Phase 3 (Hooks) ✅
    ↓
Phase 4 (Migration) ✅
    ↓
Phase 5 (Tool Consolidation) 🔄 99% complete
    ↓
Phase 6 (Testing) 🔄 99% complete
    ↓
Phase 7 (Dashboard) ⏳ PENDING
    ├── US-032 (OpenTUI) ─────► US-038 (IPC)
    └── US-033-037 (Components) ─► US-039-050 (Features)
```

---

## Part 7: Quality Gates

| Gate | Command | Status |
|------|---------|--------|
| Type Check | `npx tsc --noEmit` | ✅ PASS |
| Test Suite | `npm test` | 🔄 125/126 |
| Source Audit | `node bin/hivemind-tools.cjs source-audit` | ✅ PASS |

---

## Part 8: Communication Pad (Project Architect)

### Current Status Summary

**What's Done:**
- 6 canonical tools wired and functional
- All legacy tools deleted
- Graph-RAG structure with UUID FKs operational
- Cognitive Packer producing XML context
- Session swarms via SDK with noReply: true
- All P0/P1 architectural patches applied

**What's Pending:**
- 1 failing test (integration.test.ts)
- Documentation updates
- OpenTUI Dashboard (Phase 7)

### Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Bun runtime for Dashboard | Medium | Isolated process via child_process.spawn |
| IPC race conditions | Medium | Append-only JSONL queue |
| Test regression | Low | 99.2% pass rate |

### Next Architect Decision Required

1. **OpenTUI vs Ink:** Proceed with OpenTUI migration or stabilize on Ink?
2. **IPC Priority:** Implement cmd_queue.jsonl before or after dashboard components?
3. **Documentation:** Should US-025 block Phase 7 start?

---

## Appendix: Related Documents

| Document | Location | Purpose |
|----------|----------|---------|
| PRD | `docs/plans/prd-hivemind-v3-relational-engine-2026-02-16.md` | Full user story catalog |
| Beads | `.beads/beads.jsonl` | Task tracking (ralph-tui) |
| Phase 6-7 Plan | `docs/plans/2026-02-17-phase-6-7-master-plan.md` | Detailed implementation plan |
| Stitch Screens | `docs/stitch-screens/` | UI mockups (11 screens) |

---

*Last Updated: 2026-02-17*
*Consolidated from: PRD, beads.jsonl, scanner reports*
