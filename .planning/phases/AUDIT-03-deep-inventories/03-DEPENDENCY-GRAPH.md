# Dependency Graph: C1–C8 Cluster Interconnection Map [AUDIT-03]

**Analysis Date:** 2026-06-06
**Source:** Actual `import` analysis via grep across all `src/` directories, cross-referenced with 8 cluster inventories
**Methodology:** Trace every `from ".../cluster/"` import edge across 223+ source files in 8 clusters

---

## 1. Dependency Matrix

### 1.1 Consumer → Provider (Direct Import Edges)

| Consumer → Provider | C1 Gov/CLI/Config | C2 Task Mgmt | C3 Coordination | C4 Hooks | C5 Tools | C6 Assets | C7 Sidecar | C8 Foundation |
|---|---|---|---|---|---|---|---|---|
| **C1 Governance** | — | imports continuity for governance persistence | — | — | imports tool-response, tool-helpers | — | — | imports types, validation, state, session-api, session-naming |
| **C2 Task Management** | — | — | imports delegation types, completion-detector, notification-handler, delegation-manager | — | — | — | — | imports types, session-api, state, session-naming, path-scope, redaction |
| **C3 Coordination** | — | imports continuity delegation-persistence, session-tracker streaming | — | — | — | — | — | imports types, session-api, helpers, state, session-naming, app-api, runtime-policy, tool-response, tool-helpers |
| **C4 Hooks** | imports governance-engine evaluator, routing behavioral-profile (via C8) | imports continuity, lifecycle-manager | imports completion-detector, notification-handler, delegation-manager (via lifecycle) | — | imports tool-intelligence, prompt-packet | — | — | imports types, session-api, helpers, state, runtime-policy, runtime |
| **C5 Tools** | imports command-engine routing, config workflow, schema-kernel | imports continuity, trajectory, sdk-supervisor, session-tracker, agent-work-contracts, runtime-pressure | — | — | — | — | — | imports types, session-api, helpers, state, app-api, errors, tool-response, tool-helpers, path-scope, redaction |
| **C6 Assets** | — | — | — | — | — | — | — | — (no src imports — primitive files only) |
| **C7 Sidecar** | — | imports session-tracker, trajectory types | imports delegation-manager | — | — | — | — | imports session-api |
| **C8 Foundation** | imports routing behavioral-profile (violation) | — | — | — | — | — | — | — |

### 1.2 Import Intensity (Number of Direct Import Edges)

| Consumer | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | Total Outbound |
|---|---|---|---|---|---|---|---|---|---|
| C1 | — | 1 | — | — | — | — | — | 6 | **7** |
| C2 | — | — | 4 | — | — | — | — | 7 | **11** |
| C3 | — | 2 | — | — | — | — | — | 33 | **35** |
| C4 | 2 | 3 | 1 | — | 2 | — | — | 16 | **24** |
| C5 | 3 | 7 | — | — | — | — | — | 62 | **72** |
| C6 | — | — | — | — | — | — | — | — | **0** |
| C7 | — | 2 | 1 | — | — | — | — | 1 | **4** |
| C8 | 2 | — | — | — | — | — | — | — | **2** |
| **Total Inbound** | **7** | **15** | **6** | **0** | **2** | **0** | **0** | **125** | **155** |

### 1.3 Key Insights from the Matrix

1. **C8 (Foundation) is THE hub** — 125 inbound imports from every other cluster. `session-api.ts` alone accounts for 47 of those. No cluster can function without C8.

2. **C5 has the most outbound dependencies (72)** — every tool imports from C8 (tool-response, tool-helpers, types, session-api), and feature modules import from C2, C1, and C4. This reflects C5's "heterogeneous bucket" identity crisis.

3. **C6 (Assets) has zero source-code dependencies** — it's purely declarative primitives (JSON/YAML). It depends on C1 for discovery/loading, but at the source-code level it's independent.

4. **C4 bridges C2 and C3** — hooks import from both C2 (continuity, lifecycle) and C3 (completion-detector, via lifecycle) plus C5 (tool-intelligence, prompt-packet). It's the middleware layer.

5. **C7 is the most isolated** — only 4 outbound imports (C8 session-api, C3 delegation-manager, C2 session-tracker + trajectory). It's a thin HTTP layer.

6. **C1→C2 dependency** is minimal (governance/persistence buys continuity) but C2→C1 is zero — C1 is a net producer.

---

## 2. Critical Path Map

### 2.1 CRITICAL Paths (5)

| ID | Issue | Affected Clusters | Blocked Phases | Risk | Description |
|----|-------|-------------------|----------------|------|-------------|
| **CP-01** | hivemind-session-view discards st.get() result | C7 → C2 → C3 | SC-02, SC-03, SC-04 | **DATA LOSS** | `st.get(args.sessionId)` on L39 called but result discarded. Session explorer cannot function. Sidecar tool-proxy returns empty session data. |
| **CP-02** | API key in opencode.json:36 | C1 → ALL | BOOT-* | **SECURITY** | Hardcoded CrofAI API key (`nahcrof_oXTVoayMHBLpXrNPqWTI`). If committed to public repo, attacker gains API access. |
| **CP-03** | Dual completion-detector fragmentation | C3 (both detectors) → C2 (lifecycle) → C4 (hooks) | 14, 15, 22, 39 | **STUCK/TIMEOUT** | Two detectors with different models. Lifecycle imports both. If detectors disagree, sessions either hang or complete prematurely. |
| **CP-04** | Tool-intelligence warn-only (never blocks) | C5 (defines) → C4 (enforces) → C8 (output metadata) | P44, 23 | **BYPASS** | All 4 rules return `warn`. Rule 2 (recursive child-session) designed as security boundary but is advisory-only. |
| **CP-05** | No cross-cluster error taxonomy | ALL (56/125 throws lack `[Harness]`) | P39, C5-Error-Handling | **UNTRIAGEABLE** | Errors propagating through C2→C3→C8 have no machine-readable cluster/code. Manual stack-trace reading required. |

### 2.2 HIGH Paths (14)

| ID | Issue | Affected Clusters | Blocked Phases | Risk |
|----|-------|-------------------|----------------|------|
| **HP-01** | 5/7 sidecar tool-proxy handlers are stubs | C7 → C2, C3 | SC-02, SC-03 | Non-functional dashboard |
| **HP-02** | 13 `as any` casts across C1, C7, C8 | C1, C7, C8 | 33, SC-02, SR-09 | Silent SDK breakage |
| **HP-03** | No cross-cluster E2E integration test | ALL | 36, 39, P39 | Untrusted pipeline |
| **HP-04** | Session-tracker classification circular deprecation | C2 | CP-ST-* | Confusing developer experience |
| **HP-05** | `isPathAllowed` path traversal weakness (startsWith/includes) | C4 → C1, C2, C5 | 28, SR-07 | Security bypass |
| **HP-06** | `plugin.ts` 1,076 LOC — 115% over 500 cap | C8 → ALL | 33, SR-09 | Refactoring impedance |
| **HP-07** | 21 hm-l2-* skills remain (not archived) | C6 | MCM-01, MCM-02 | Outdated naming shipped |
| **HP-08** | GSD agents in wrong `.opencode/agents/` path | C6 → C1 | BOOT-04, BOOT-08 | Agent discovery pollution |
| **HP-09** | No shared logger — 30+ `console.*` | ALL | P39, C5-Error-Handling | Untriagable logs |
| **HP-10** | No cross-cluster coverage threshold | ALL (C8, C2 worst) | C7-Test-Coverage | Undetected regressions |
| **HP-11** | C1/C4 governance hook boundary unresolved | C1 ↔ C4 | SR-07, 28 | Wrong cluster ownership |
| **HP-12** | `session-api.ts` cross-cluster coupling (imports C1 routing) | C8 → C1 → 47 consumers | SR-01 | Foundation → gov dependency |
| **HP-13** | `delegation-consumer.ts` missing try/catch | C4 → C3 | 28 | Breaks observer chain |
| **HP-14** | 12 pre-existing test failures | ALL | 39, P39 | Invisible regressions |

### 2.3 MEDIUM Paths (18)

| ID | Issue | Affected Clusters | Blocked Phases | Risk |
|----|-------|-------------------|----------------|------|
| **MP-01** | 19 TODO-2 markers unresolved | C2 | CP-ST-* | Unplanned tech debt |
| **MP-02** | Dual-write non-atomicity (child+manifest) | C2 → C3 | P41, CP-ST-05 | Inconsistent state |
| **MP-03** | 9 files exceeding 500 LOC cap | C1, C2, C3, C7, C8 | 33, 34, 35 | Maintainability debt |
| **MP-04** | 12 dead types in shared/types.ts | C8 → ALL consumers | SR-01 | Bloat, confusion |
| **MP-05** | `task-status.ts` dead at runtime | C8 | 35 | Dead API surface |
| **MP-06** | `tool-response.ts` no dedicated tests | C8 → 23 tool files | C7-Test-Coverage | Fragile contract |
| **MP-07** | No agent-level `tools:` frontmatter | C6 → C1, C4 | MCM-01 | No tool restrictions |
| **MP-08** | SC-03 Next.js verification failed (36/41 tests) | C7 | SC-03 | Broken dashboard build |
| **MP-09** | Sidecar frozen catalog drifts from tools | C7 → C3, C5 | SC-02 | Stale listings |
| **MP-10** | 30+ `any` annotations beyond casts | ALL | C5-Error-Handling | Type unsafety |
| **MP-11** | Hardcoded timing constants fragmented | ALL (C3 worst) | 22, 26, 42 | Inconsistent behavior |
| **MP-12** | Doc-intelligence sync I/O blocks event loop | C5 | 23 | Performance risk |
| **MP-13** | bootstrap-recover misclassifies all symlinks as broken | C5 → C1 | BOOT-04 | Wrong diagnosis |
| **MP-14** | Overlapping continuity state sources (CF-05) | C2 ↔ C3 | P41 | Ambiguous authority |
| **MP-15** | `createKernelPacket` hardcodes parent_session_id=null | C5 → C4 | 23 | Lost parent identity |
| **MP-16** | Unbounded observer caches (memory leak) | C4 → C2 | 28 | OOM on long sessions |
| **MP-17** | Sidecar tool-proxy mirrors C3/C5 without sync | C7 → C3, C5 | SC-02 | Manual mirror drift |
| **MP-18** | `any[]` type leak C1→C4→C8 | C1 → C4 → C8 | ALL | Untyped governance data |

---

## 3. Gap → Phase Mapping

Each of the 48 priority findings mapped to the phase(s) that own the affected cluster. Cross-cutting gaps list all affected phases. Phase references from `.planning/phases/AUDIT-02-cluster-inventory/02-MASTER-PLAN-ASSET.md`.

### 3.1 CRITICAL Gaps

| Gap | Cluster | Severity | Owning Phase(s) | Type |
|-----|---------|----------|-----------------|------|
| hivemind-session-view discards query result (CR-01) | C7 | CRITICAL | SC-02, SC-03 | Runtime Bug |
| API key in opencode.json:36 (CR-02) | C1 | CRITICAL | BOOT-01, BOOT-05 | Security |
| Dual completion-detector fragmentation (CR-03/XC-01) | C3 → C2 | CRITICAL | CP-DT-01, 14, 15, P39 | Architecture |
| Tool-intelligence warn-only never blocks (CR-04/XC-02) | C5 → C4 | CRITICAL | P44, 23 | Design Flaw |
| No cross-cluster error taxonomy (CR-05/MG-01) | ALL | CRITICAL | P39, C5-Error-Handling, 34 | Architecture |

### 3.2 HIGH Gaps

| Gap | Cluster | Severity | Owning Phase(s) | Type |
|-----|---------|----------|-----------------|------|
| 5/7 sidecar tool-proxy stubs (HI-01) | C7 | HIGH | SC-02 | Missing Implementation |
| `as any` casts across 3 clusters (HI-02/XC-03) | C1, C7, C8 | HIGH | SR-09, SC-02, 33 | Code Quality |
| No cross-cluster integration test (HI-03/MG-04) | ALL | HIGH | 36, 39, P39 | Missing Test |
| Session-tracker circular deprecation (HI-04) | C2 | HIGH | CP-ST-04, 13 | Documentation |
| `isPathAllowed` path traversal weakness (HI-05) | C4 | HIGH | 28, SR-07 | Security |
| `plugin.ts` 1,076 LOC (HI-06) | C8 | HIGH | 33, SR-09 | Module Cap |
| 21 hm-l2-* skills remain (HI-07) | C6 | HIGH | MCM-01, MCM-02 | Migration |
| GSD agents in wrong path (HI-08) | C6 → C1 | HIGH | BOOT-04, MCM-01 | Constitutional |
| No shared logger (HI-09/MG-02) | ALL | HIGH | P39, C5-Error-Handling | Architecture |
| No cross-cluster coverage threshold (HI-10/MG-03) | ALL | HIGH | C7-Test-Coverage | Governance |
| C1/C4 governance hook boundary (HI-11/XC-06) | C1 ↔ C4 | HIGH | SR-07, 28 | Architecture |
| `session-api.ts` cross-cluster coupling (HI-12/XC-05) | C8 → C1 | HIGH | SR-01 | Architecture Violation |
| `delegation-consumer.ts` missing try/catch (HI-13) | C4 | HIGH | 28 | Runtime Bug |
| 12 pre-existing test failures (HI-14) | ALL | HIGH | 39, P39 | Test Infrastructure |

### 3.3 MEDIUM Gaps

| Gap | Cluster | Severity | Owning Phase(s) | Type |
|-----|---------|----------|-----------------|------|
| 19 TODO-2 markers (MD-01) | C2 | MEDIUM | CP-ST-*, 21 | Tech Debt |
| Dual-write non-atomicity (MD-02) | C2 → C3 | MEDIUM | P41, CP-ST-05 | Design Flaw |
| 9 files exceeding 500 LOC cap (MD-03) | C1, C2, C3, C7, C8 | MEDIUM | 33, 34, 35, SR-03, SR-04 | Module Cap |
| 12 dead types in shared/types.ts (MD-04) | C8 | MEDIUM | SR-01 | Dead Code |
| `task-status.ts` dead at runtime (MD-05) | C8 | MEDIUM | 35 | Dead Code |
| `tool-response.ts` no dedicated tests (MD-06) | C8 | MEDIUM | C7-Test-Coverage | Missing Test |
| No agent-level `tools:` frontmatter (MD-07) | C6 | MEDIUM | MCM-01, BOOT-08 | Missing Config |
| SC-03 verification failed (MD-08) | C7 | MEDIUM | SC-03 | Build Failure |
| Sidecar frozen catalog drifts (MD-09) | C7 | MEDIUM | SC-02 | Design Flaw |
| `any` type proliferation (MD-10/MG-05) | ALL | MEDIUM | C5-Error-Handling, 34 | Code Quality |
| Hardcoded timing constants (MD-11/MG-06) | ALL | MEDIUM | 22, 26, 42 | Architecture |
| Doc-intelligence sync I/O (MD-12) | C5 | MEDIUM | 23 | Performance |
| bootstrap-recover symlink misclassification (MD-13) | C5 | MEDIUM | BOOT-04 | Logic Bug |
| Overlapping continuity sources (MD-14/CF-05) | C2 ↔ C3 | MEDIUM | P41 | Architecture |
| `createKernelPacket` null parent_session_id (MD-15) | C5 | MEDIUM | 23 | Logic Bug |
| Unbounded observer caches (MD-16) | C4 | MEDIUM | 28 | Memory Leak |
| Sidecar tool-proxy mirror sync (MD-17/XC-07) | C7 → C3, C5 | MEDIUM | SC-02 | Design Flaw |
| `any[]` type leak C1→C4→C8 (MD-18/XC-08) | C1, C4, C8 | MEDIUM | ALL | Type Leak |

### 3.4 LOW Gaps (11 issues — omitted for brevity, details in CROSS-AUDIT-EXTREME.md §6)

---

## 4. Cluster Health Dashboard

### 4.1 Source File Inventory

| Cluster | Name | Source Files | Test Files | Total Files | LOC (src) | Gaps | CRITICAL | HIGH | Health |
|---------|------|-------------|------------|-------------|-----------|------|----------|------|--------|
| C1 | Governance + CLI + Config | 89 | ~47 | 136 | ~8,200 | 15 | 1 | 4 | 🟡 |
| C2 | Session & Task Management | 65 | 114 | 179 | ~7,500 | 20 | 1 | 3 | 🟡 |
| C3 | Delegation + Coordination | 72 | ~60 | 132 | ~8,900 | 12 | 2 | 2 | 🟠 |
| C4 | Hooks | 17 | 30 | 47 | ~3,200 | 14 | 1 | 4 | 🟡 |
| C5 | Tool Surfaces | 21 | 13 | 34 | ~3,800 | 12 | 1 | 2 | 🟡 |
| C6 | Assets (Primitives) | 472+ | — | 472+ | — (declarative) | 10 | 0 | 2 | 🟢 |
| C7 | Sidecar | 27 | ~2 | 29 | ~2,450 | 10 | 1 | 2 | 🔴 |
| C8 | Foundation | 18 | 16 | 34 | ~3,475 | 16 | 0 | 3 | 🟡 |

### 4.2 Test Coverage by Cluster

| Cluster | Test Files | Coverage Estimate | Key Gaps |
|---------|-----------|-------------------|----------|
| C1 | ~47 (schema + CLI + features) | ~55% | Bootstrap control plane, behavioral profile, governance engine untested |
| C2 | 114 (incl. 54 session-tracker) | ~65% | Session-patch tool, SDK supervisor, hierarchy-manifest untested |
| C3 | ~60 | ~60% | Coordinator (746 LOC), manager-runtime (616 LOC) have thin coverage |
| C4 | 30 | ~50% | `delegation-consumer.ts` no error-path test, pane-monitor untested |
| C5 | 13 | ~40% | Doc-intelligence, configure-primitive-paths (45 LOC, zero tests) |
| C6 | — | N/A | N/A (declarative primitives) |
| C7 | ~2 | ~5% | 768 LOC of routes + tool-proxy handlers have zero tests |
| C8 | 16 | ~50% | `types.ts`, `tool-response.ts`, `tool-helpers.ts` have zero dedicated tests; `path-scope.ts` and `redaction.ts` minimal |

### 4.3 Module Cap Violations (Files > 500 LOC)

| File | Cluster | LOC | Over |
|------|---------|-----|------|
| `src/plugin.ts` | C8 | 1,076 | 115% |
| `src/tools/delegation/delegation-status.ts` | C5 | 906 | 81% |
| `src/tools/session/execute-slash-command.ts` | C5 | 863 | 73% |
| `src/config/defaults.ts` | C1 | 832 | 66% |
| `src/coordination/delegation/coordinator.ts` | C3 | 746 | 49% |
| `src/features/session-tracker/persistence/child-writer.ts` | C2 | 685 | 37% |
| `src/features/session-tracker/index.ts` | C2 | 671 | 34% |
| `src/coordination/delegation/manager-runtime.ts` | C3 | 616 | 23% |
| `src/features/tmux/tmux-multiplexer.ts` | C3 | 606 | 21% |

### 4.4 Cross-Cluster Coupling Hotspots

```
C8 (Foundation)
  ├── 47 consumers ← session-api.ts (most imported file)
  ├── 28 consumers ← types.ts (shared contract)
  ├── 25 consumers ← tool-helpers.ts (tiny utility)
  ├── 23 consumers ← tool-response.ts (tool envelope)
  └── 16 consumers ← helpers.ts (utility toolbox)
        │
        ▼
C2 (Task Mgmt) ← C3, C4, C5 import continuity/lifecycle
  ├── 13 consumers ← session-tracker (from C3, C4, C5, C7)
  └── 8+ consumers ← continuity store (from C3, C4, C5)
        │
        ▼
C4 (Hooks) ← bridges C2 and C3 at runtime
  ├── imports from C2: continuity, lifecycle-manager, trajectory
  ├── imports from C3: completion-detector, notification-handler
  └── imports from C5: tool-intelligence, prompt-packet
        │
        ▼
C5 (Tools) ← heterogeneous bucket — 72 outbound imports
  ├── imports from C2: continuity, trajectory, session-tracker, contracts
  ├── imports from C1: command-engine, config-workflow, schema-kernel
  └── imports from C8 (62): ALL shared modules
```

### 4.5 Dependency Cycle Risk Zones

1. **C8 ↔ C3 (re-export cycle):** `shared/types.ts` re-exports from `coordination/delegation/types`. C3 imports from `shared/types.ts` which re-exports C3's own types. At module evaluation time, TypeScript/ESM handles this gracefully (already-evaluated modules don't re-execute), but it creates fragile coupling.

2. **C8 → C1 → C4 (functional cycle):** `session-api.ts` (C8) imports `resolveBehavioralProfile` from C1 routing. C4 hooks import `getSessionBehavioralProfile` from C8's `session-api.ts`. The call chain: C4 → C8 → C1. This is not a circular dependency at import level but IS a circular dependency at the functional level.

3. **C2 ↔ C3 (state overlap):** C2's `delegation-persistence.ts` writes delegation records. C3's `delegation-manager` reads them. C3's `state-machine` calls `persistDelegations()` in C2. C2's `continuity/index.ts` calls into session-tracker (C2 own). The dual-write (C2 writes + C3 reads) creates implicit state coupling.

---

## 5. Integration Topology

### 5.1 Runtime Call Chain (Normal Tool Execution)

```
OpenCode SDK event
    │
    ▼
C4: core-hooks.ts ───────────────────→ C2: lifecycle/index.ts
    │  (session-hooks.ts)                   │
    │                                       ├─→ C3: completion/detector.ts
    │                                       └─→ C3: notification-handler.ts
    │
    ├─→ C4: tool-guard-hooks.ts
    │       ├─→ C5: tool-intelligence/index.ts
    │       ├─→ C8: runtime-policy.ts
    │       ├─→ C8: helpers.ts (makeToolSignature)
    │       └─→ C8: state.ts (getDelegationMeta)
    │
    ├─→ C4: event-observers.ts ─────────→ C2: session-tracker
    │
    └─→ C4: transforms/*.ts
            └─→ C8: helpers.ts, session-api.ts
```

### 5.2 Plugin Startup Sequence (plugin.ts)

```
plugin.ts (C8)
    │
    ├─→ C1: config/getConfig, routing/resolveBehavioralProfile
    ├─→ C2: lifecycle/HarnessLifecycleManager
    ├─→ C3: delegation/DelegationManager, DelegationCoordinator
    ├─→ C4: createCoreHooks, createSessionHooks, createToolGuardHooks
    ├─→ C5: createDelegationTools, createSessionTools, etc. (24 tool factories)
    ├─→ C7: createSidecarServer, SidecarDependencyRegistry
    └─→ C8: ALL shared modules (helpers, state, types, session-api, runtime-policy)
```

### 5.3 Delegation Dispatch Chain

```
Agent calls delegate-task tool
    │
    ▼
C5: delegation-status.ts/delegate-task.ts ───→ C8: tool-response.ts, tool-helpers.ts
    │
    ▼
C8: plugin.ts (dispatch handler)
    │
    ▼
C3: DelegationManager.ensureDispatch()
    ├─→ C3: dispatcher.ts (concurrency+depth check)
    ├─→ C3: state-machine.ts (persist → C2: delegation-persistence.ts)
    ├─→ C3: sdk-child-session-starter.ts (create child → C8: session-api.ts)
    └─→ C3: manager-runtime.ts (monitor → C8: runtime-policy.ts)
          │
          ▼
    C3: CompletionDetector (waits for terminal)
    └─→ C3: notification-handler.ts → C2: continuity store
          │
          ▼
    C4: event-observers.ts → C2: session-tracker capture
```

---

## 6. Recommendations by Impact Order

### Immediate Fixes (< 1 hour, unblocks downstream)

| Priority | Fix | Cluster | Phase | Effort |
|----------|-----|---------|-------|--------|
| 1 | Fix hivemind-session-view.ts:39 — assign+return session data | C7 | SC-02 | 15 min |
| 2 | Replace API key with `{env:CROFAI_API_KEY}` | C1 | BOOT-01 | 10 min |
| 3 | Fix delegation-consumer.ts missing try/catch | C4 | 28 | 20 min |
| 4 | Add try/catch to preamble transforms (silent failures) | C4 | 28 | 20 min |

### Short-term (< 1 day, structural improvements)

| Priority | Fix | Cluster | Phase | Effort |
|----------|-----|---------|-------|--------|
| 5 | Merge dual completion-detector under unified surface | C3 | CP-DT-01 | 2-4 hr |
| 6 | Add `[Harness]` prefix to all 56 missing error sites | ALL | P39 | 1-2 hr |
| 7 | Extract `getSessionBehavioralProfile` from session-api.ts | C8 → C4 | SR-01 | 1 hr |
| 8 | Add cross-cluster E2E test (smoke.test.ts) | ALL | 36 | 2-3 hr |
| 9 | Fix isPathAllowed in contract-enforcement.ts | C4 | 28 | 30 min |

### Medium-term (next 3 phases, architectural)

| Priority | Fix | Cluster | Phase | Effort |
|----------|-----|---------|-------|--------|
| 10 | Split plugin.ts (1,076 LOC → ~600 LOC) | C8 | 33 | 4-6 hr |
| 11 | Add shared logger (replace 30+ console.*) | ALL | P39 | 3-4 hr |
| 12 | Archive 21 hm-l2-* skills, move gsd-* agents | C6 | MCM-01 | 2-3 hr |
| 13 | Resolve C1/C4 cluster boundary (4 hook files) | C1 ↔ C4 | SR-07 | 2 hr |
| 14 | Replace 13 `as any` casts with typed accessors | C1, C7, C8 | SR-09, SC-02 | 3-4 hr |

---

## 7. Dependency Count Summary

| Metric | Value |
|--------|-------|
| Total cross-cluster import edges traced | 155 |
| Files analyzed | 223+ source files across 8 clusters |
| Most imported file | `session-api.ts` (C8) — 47 consumers |
| Most importing cluster | C5 (Tools) — 72 outbound imports |
| Most imported cluster | C8 (Foundation) — 125 inbound imports |
| Most isolated cluster | C6 (Assets) — 0 source-code imports |
| Cluster with most cross-cutting gaps | C8 (Foundation) — affects ALL clusters |
| Circular dependency risk zones | 3 (C8↔C3 re-export, C8→C1→C4 functional, C2↔C3 state overlap) |
| Critical paths blocking execution | 5 |
| High paths requiring attention | 14 |
| Medium paths (technical debt) | 18 |

---

*Dependency graph analysis: 2026-06-06 — source-code trace via grep across src/ directories, 155 import edges documented*
