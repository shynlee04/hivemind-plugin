# Ecosystem Rationale — Utility-Based Phase Sequencing

**Ngày:** 2026-05-18
**Bằng chứng:** L5 (synthesized từ TOOL-CLASSIFICATION-MATRIX + 3 Cluster Analyses + Deep Audit + SDK research)
**Phạm vi:** Toàn bộ src/ ecosystem — tools, engines, features, hooks, shared libs, coordination, task-management
**Mục đích:** Frame ecosystem thành cụm dependency → tạo phase plan có thứ tự xử lý đúng

---

## 1) Ecosystem Topology

Hivemind không chỉ là "15 tool surfaces" — nó là **7 cụm hệ sinh thái** (ecosystem clusters) với dependency DAG:

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOOL LAYER (write-side)                       │
│  delegate-task  delegation-status  execute-slash-command        │
│  run-background-command  hivemind-command-engine                │
│  session-tracker  prompt-packet                                  │
└────────────┬──────────────┬──────────────┬─────────────────────┘
             │              │              │
     ┌───────▼──────┐ ┌────▼─────┐ ┌──────▼──────────┐
     │ COORDINATION │ │ FEATURES │ │   ROUTING        │
     │  ENGINES     │ │          │ │                  │
     │ • manager    │ │ • PTY    │ │ • command-engine │
     │ • state-mach │ │ • bg-cmd │ │ • cmd-execution  │
     │ • completion │ │ • sess-  │ │ • behavioral    │
     │ • spawner    │ │   tracker│ │   profile        │
     │ • concurrency│ │ • prompt │ │ • session-entry  │
     │ • SDK/cmd    │ │   packets│ │                  │
     │   handlers   │ │ • pres-  │ │                  │
     │              │ │   sure   │ │                  │
     └──────┬───────┘ └────┬─────┘ └──────┬──────────┘
            │              │               │
     ┌──────▼──────────────▼───────────────▼──────────┐
     │            SHARED LIBS (leaf layer)             │
     │  types.ts  task-status.ts  tool-response.ts     │
     │  helpers.ts  session-api.ts  sdk-wrapper.ts     │
     │  security.ts  runtime-policy.ts                 │
     └──────────────────────┬─────────────────────────┘
                            │
     ┌──────────────────────▼─────────────────────────┐
     │         TASK MANAGEMENT (persistence)          │
     │  continuity/  journal/  recovery/              │
     │  trajectory/  lifecycle/  delegation-persist   │
     └────────────────────────────────────────────────┘
```

### 7 Cụm Hệ sinh thái

| Cụm | Directory | Surfaces | Vai trò | Score Range |
|-----|-----------|----------|---------|-------------|
| **C1: Shared Contracts** | `src/shared/` | types, task-status, tool-response, helpers | **Leaf dependencies** — mọi surface khác consume | N/A (infrastructure) |
| **C2: Coordination Engines** | `src/coordination/` | manager, state-machine, completion, spawner, concurrency, SDK/cmd handlers | **Core orchestration** — dispatch, state, completion | 12-19 |
| **C3: Tool Surfaces** | `src/tools/` | delegate-task, delegation-status, session, config, hivemind, prompt | **Write-side entry points** — agent-facing API | 15-17 |
| **C4: Feature Modules** | `src/features/` | background-command, session-tracker, prompt-packets, pressure, SDK-supervisor | **Self-contained features** — independent subsystems | 17-18 |
| **C5: Routing & Session** | `src/routing/` | command-engine, command-execution, behavioral-profile, session-entry | **Request routing** — behavioral dispatch | 12-19 |
| **C6: Task Management** | `src/task-management/` | continuity, journal, recovery, trajectory, lifecycle | **State persistence** — durable state across sessions | N/A (persistence) |
| **C7: Hooks & Composition** | `src/hooks/` | lifecycle, guards, observers, transforms, composition | **Read-side observers** — event-driven CQRS | N/A (hooks) |

---

## 2) Dependency DAG — Thứ tự xử lý

**Nguyên tắc cumulative:** Fix leaf trước → fix consumers sau → fix cross-cutting cuối.

```
Phase 1: SHARED CONTRACTS (C1)
  ├── task-status unification (UC-1: dual status → single)
  ├── error contract standardization (UC-2: divergent → unified)
  └── deriveSurface deduplication (UC-5: duplicate → single)

Phase 2: COORDINATION ENGINES (C2) — consumes C1
  ├── manager.ts decomposition (god-object → sub-modules)
  ├── CommandDelegationHandler CQRS fix (observe vs dispatch)
  └── notification delivery guarantee (fire-and-forget → retry)

Phase 3: TOOL SURFACES (C3) — consumes C1 + C2
  ├── execute-slash-command guardrails (validation + pressure + schema)
  ├── delegation-status type unification
  └── delegate-task dispatch strategy extraction

Phase 4: ROUTING (C5) — consumes C1 + C3
  └── behavioral profile guardrail propagation

Phase 5: CROSS-CUTTING VERIFICATION
  ├── Hook integration tests (C7 observes C2-C5 correctly)
  ├── Task-management persistence tests (C6 writes match C2 state)
  └── E2E delegation lifecycle proof
```

**Tại sao thứ tự này:**
- Phase 1 sửa **shared contracts** → mọi consumer tự động hưởng lợi
- Phase 2 sửa **engines** → dựa vào contracts đã chuẩn hóa ở P1
- Phase 3 sửa **tools** → dựa vào engines đã decompose ở P2
- Phase 4 sửa **routing** → dựa vào tools đã có guardrails ở P3
- Phase 5 verify **cross-cutting** → toàn bộ ecosystem đã stable

---

## 3) 5 Utility Conflicts — Mapping vào Phases

| Conflict | Mô tả | Ảnh hưởng | Phase fix |
|----------|--------|-----------|-----------|
| **UC-1** | Dual status system (TaskStatus ↔ DelegationStatus) | Consumers phải handle 2 type systems, semantic gap | **P1** (shared) |
| **UC-2** | Triple dispatch errors (SDK throw / PTY null / headless catch-all) | Agents không thể handle errors uniformly | **P1** (shared) → **P2** (engine) |
| **UC-3** | execute-slash-command: no pre-dispatch validation | Agent dispatches nonexistent command silently | **P3** (tool) |
| **UC-4** | notification-handler: fire-and-forget, no retry/TTL | Stale notifications sau process restart | **P2** (engine) |
| **UC-5** | `deriveSurface()` duplicate in 2 files | Maintenance burden, divergence risk | **P1** (shared) |

---

## 4) 6 REWORK Surfaces — Tackle Order

| Surface | Score | Phase | Lý do thứ tự |
|---------|-------|-------|---------------|
| `task-status.ts` | 12 | **P1** | Leaf dependency — mọi consumer hưởng lợi |
| `delegation-persistence.ts` | 12 | **P1** | Depends on unified status types |
| `DelegationManager` | 13 | **P2** | Depends on unified error contracts |
| `CommandDelegationHandler` | 12 | **P2** | Depends on manager decomposition |
| `execute-slash-command` | 12 | **P3** | Depends on engine guardrails |
| `notification-handler` | 12 | **P2** | Depends on retry infrastructure |

---

## 5) Pattern Propagation — Session-Tracker as Reference

Session-tracker (`src/features/session-tracker/`) là **reference "done right"** — pattern cần propagate ra toàn ecosystem:

| Pattern | Session-Tracker | Cần propagate tới |
|---------|-----------------|-------------------|
| **CQRS observer** | Hooks chỉ observe, không write | CommandDelegationHandler (P2) |
| **Constructor DI** | Config injected qua constructor | PtyManager singleton → DI (P3) |
| **Modular subdirectory** | capture/, hooks/, persistence/, recovery/, transform/ | manager.ts god-object → sub-modules (P2) |
| **Structured error types** | Typed error classes per module | Triple dispatch errors → unified (P1) |
| **Retry with backoff** | ChildWriteRetryQueue với exponential backoff | notification-handler (P2) |

---

## 6) Relationship với Existing Runway

| Existing Phase | Status | Overlap với Ecosystem Fix |
|----------------|--------|---------------------------|
| CP-PTY-01 | 🔵 READY | **UC-2 overlap**: PTY error contract nên unify trong P1 trước khi CP-PTY-01 implement |
| CP-PTY-02 | ⬜ NOT PLANNED | SDK session delegation — **không overlap**, riêng biệt |
| BOOT-09 | 🟡 IN PROGRESS | Config schema — **UC-5 overlap**: deriveSurface dedup ảnh hưởng config |
| HER-3..5 | 📋 READY | **Complement**: HER fix docs/SDK/agents, Ecosystem Fix fix runtime code |

**Recommendation:** Ecosystem Fix phases (P1-P5) nên chạy **trước** CP-PTY-01 vì:
1. CP-PTY-01 phụ thuộc unified error contracts (UC-2)
2. CP-PTY-01 phụ thuộc task-status unification (UC-1)
3. Session-tracker pattern propagation cần hoàn thành trước khi viết PTY code mới

---

## 7) Phase Plan Skeleton

### Phase HER-6: Shared Contract Standardization (P1)

**Scope:**
- Unify TaskStatus ↔ DelegationStatus → single `DelegationStatus` enum
- Create `DelegationError` typed error hierarchy (replacing divergent throw/null/catch)
- Deduplicate `deriveSurface()` → single source in `src/shared/`
- Update all consumers (tools, engines, features) để dùng unified contracts

**Dependencies:** None (leaf layer)
**Evidence required:** L2: unit tests cho new contracts + consumer migration tests
**Estimated impact:** 6 REWORK surfaces affected, 3 UC conflicts resolved

### Phase HER-7: Coordination Engine Decomposition (P2)

**Scope:**
- Decompose `manager.ts` (~580 LOC) → sub-modules theo session-tracker pattern
- Fix CommandDelegationHandler CQRS violation (observe vs dispatch separation)
- Add notification retry with backoff (matching session-tracker ChildWriteRetryQueue pattern)
- Wire DI cho engines hiện dùng singletons

**Dependencies:** HER-6 (unified contracts)
**Evidence required:** L2: integration tests cho decomposition + notification delivery

### Phase HER-8: Tool Surface Guardrails (P3)

**Scope:**
- Add pre-dispatch validation to execute-slash-command (Zod schema + command existence check)
- Add pressure gate to execute-slash-command
- Extract dispatch strategy from delegate-task tool
- Unify delegation-status type output

**Dependencies:** HER-7 (decomposed engines)
**Evidence required:** L2: tool contract tests + guardrail verification

### Phase HER-9: Routing Guardrail Propagation (P4)

**Scope:**
- Behavioral profile guardrail checks in session-entry
- Pressure score propagation through routing layer
- Cross-validation giữa routing config và tool guardrails

**Dependencies:** HER-8 (tool guardrails)
**Evidence required:** L2: routing + behavioral integration tests

### Phase HER-10: Cross-Cutting Verification (P5)

**Scope:**
- Hook integration tests: lifecycle observers không mutate state
- Persistence consistency: delegation records match state machine transitions
- E2E delegation lifecycle proof: dispatch → run → complete → persist → recover

**Dependencies:** HER-9 (all layers fixed)
**Evidence required:** L1: E2E test pass, L2: integration suite

---

## 8) Decision Required

**Cần user authorization trước khi proceed:**

1. **Approve HER-6..HER-10 phase skeleton** → sau đó tôi sẽ:
   - Dùng `execute-slash-commands` để tạo phase HER-6 trong ROADMAP.md
   - Update STATE.md và AGENTS.md
   - Delegate `gsd-spec-phase` cho HER-6

2. **OR** modify skeleton nếu user muốn khác:
   - Khác thứ tự?
   - Khác scope?
   - Gộp/tách phases?

---

## 9) Key Insights

1. **Hivemind = extension layer, never replacement** — verified across 15 surfaces, 0 REPLACE verdicts
2. **9/15 KEEP, 6/15 REWORK** — ecosystem fundamentally sound, needs structural polish
3. **Session-tracker = propagation source** — its patterns should flow outward to other modules
4. **Shared contracts first** — fixing leaf dependencies creates cascade improvement
5. **UC-1 through UC-5** are the 5 utility-impacting conflicts that block ecosystem harmony
6. **DelegationManager decomposition** is the single highest-impact rework (touches 4 conflicts)
7. **CP-PTY-01 should wait** until HER-6/7 complete for unified contracts

---

## Artifacts Referenced

| Artifact | Role |
|----------|------|
| `TOOL-CLASSIFICATION-MATRIX-AND-TACKLE-ORDER-2026-05-18.md` | Surface scoring + tackle order |
| `DELEGATE-TASK-DEEP-ARCHITECTURAL-AUDIT-2026-05-18.md` | 14 problems evidence base |
| `COMMAND-EXECUTION-ANALYSIS-2026-05-18.md` | Cluster A analysis |
| `PTY-BACKGROUND-COMMAND-ANALYSIS-2026-05-18.md` | Cluster B analysis |
| `DELEGATION-QUEUE-ANALYSIS-2026-05-18.md` | Cluster C analysis |
