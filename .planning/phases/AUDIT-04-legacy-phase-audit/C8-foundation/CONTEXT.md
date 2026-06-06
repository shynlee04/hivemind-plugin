# C8 Foundation — Context Document

**Analysis Date:** 2026-06-06
**Cluster:** C8 — Foundation (shared module layer, plugin composition root, public API surface)
**Phase:** AUDIT-04 (Legacy Phase Audit)

---

## 1. Purpose and Role

C8 is the **most cross-cutting cluster** in the Hivemind harness. Every other cluster imports from `src/shared/` — it provides shared types, SDK wrappers, state management, runtime policy, security primitives, and tool infrastructure. The cluster also includes the **composition root** (`src/plugin.ts`) which instantiates and wires every other cluster's modules, and the **public API surface** (`src/index.ts`) which re-exports selected modules to npm consumers.

### C8's Dual Role

1. **Foundation Library (`src/shared/`)**: Leaf or near-leaf utility modules providing shared contracts and infrastructure. Zero or minimal imports from other clusters.
2. **Composition Root (`src/plugin.ts` + `src/index.ts`)**: Orchestration code that imports from EVERY cluster to assemble the plugin. Inherently cross-cutting by design.

---

## 2. Current State (from AUDIT-03 Inventory)

### 2.1 Files at a Glance

| Layer | Files | LOC | Role |
|-------|-------|-----|------|
| Shared library | 16 files | ~2,369 | Foundation contracts, SDK wrappers, state, security |
| Composition root | `src/plugin.ts` | 1,076 | Wires all clusters together |
| Public API | `src/index.ts` | 30 | npm package entry point |

**Total C8 source files:** 18
**Total C8 test files:** 16
**Total C8 LOC:** 3,475

### 2.2 Key Modules

| Module | LOC | Consumers | Role |
|--------|-----|-----------|------|
| `src/shared/types.ts` | 422 | 28 | Canonical type definitions |
| `src/shared/session-api.ts` | 432 | 47 | OpenCode SDK wrappers |
| `src/shared/helpers.ts` | 334 | 16 | Utility functions |
| `src/shared/state.ts` | 251 | 12 | In-process state manager |
| `src/shared/tool-response.ts` | 71 | 23 | Tool response envelope |
| `src/shared/tool-helpers.ts` | 9 | 25 | Tool result renderer |
| `src/shared/task-status.ts` | 22 | 1 | Status transitions (dead at runtime) |
| `src/shared/session-naming.ts` | 156 | 8 | Session title generation/parsing |
| `src/shared/runtime-policy.ts` | 236 | 4 | Policy resolvers |
| `src/shared/runtime.ts` | 95 | 5 | Status inference |
| `src/shared/security/path-scope.ts` | 105 | 6 | Path traversal protection |
| `src/shared/security/redaction.ts` | 118 | 2 | Credential redaction |
| `src/shared/app-api.ts` | 24 | 4 | SDK thin wrapper |
| `src/shared/errors/commands.ts` | 34 | 3 | Command error classes |
| `src/shared/workspace-runtime-policy.ts` | 38 | 1 | Policy file reader |
| `src/shared/plugin-tool-output-summary.ts` | 22 | 1 | Output summarizer |
| `src/plugin.ts` | 1,076 | — | Composition root |
| `src/index.ts` | 30 | — | Public API |

### 2.3 Test Coverage

| Module | Dedicated Tests? | Coverage Quality |
|--------|-----------------|-----------------|
| `types.ts` | ❌ No | Indirect only |
| `helpers.ts` | ✅ Yes | Good (9 of 13 functions) |
| `session-api.ts` | ✅ Yes | Good (~20 indirect tests) |
| `state.ts` | ✅ Yes | Good |
| `tool-response.ts` | ❌ No | Indirect only |
| `tool-helpers.ts` | ❌ No | Indirect only |
| `task-status.ts` | ✅ Yes | Good |
| `session-naming.ts` | ✅ Yes | Good |
| `runtime-policy.ts` | ✅ Yes | Good |
| `runtime.ts` | ✅ Yes | Good |
| `path-scope.ts` | ✅ Yes | Minimal (5 cases) |
| `redaction.ts` | ✅ Yes | Minimal (4 cases) |
| `app-api.ts` | ✅ Yes | Good |
| `errors/commands.ts` | ✅ Yes | Good |
| `workspace-runtime-policy.ts` | ✅ Yes | Good |
| `plugin-tool-output-summary.ts` | ✅ Yes | Good |
| `plugin.ts` | ⚠️ Partial | 1,076 LOC barely tested |
| `index.ts` | ❌ No | Untested |

**Coverage gap:** 3 of 18 C8 files have zero dedicated tests (`types.ts`, `tool-response.ts`, `tool-helpers.ts`). Two security modules have minimal coverage (5 and 4 test cases). `plugin.ts` at 1,076 LOC has only 2 test files.

---

## 3. Key Issues and Gaps

### 3.1 CRITICAL (0)

No CRITICAL issues in C8.

### 3.2 HIGH (3)

| ID | Issue | Impact |
|----|-------|--------|
| HI-06 | `plugin.ts` 1,076 LOC — 115% over 500 cap | Refactoring impedance, largest file in codebase |
| HI-12 | `session-api.ts` cross-cluster coupling (imports C1 routing) | Foundation → governance dependency, 47 consumers affected |
| HP-06 | 2 `as any` casts in `plugin.ts` | Silent SDK breakage risk |

### 3.3 MEDIUM (6)

| ID | Issue | Impact |
|----|-------|--------|
| MD-04 | 12 dead types in `shared/types.ts` | ~80 lines bloat, developer confusion |
| MD-05 | `task-status.ts` dead at runtime | Dead API surface |
| MD-06 | `tool-response.ts` no dedicated tests | Fragile contract (23 consumers) |
| MP-06 | `session-api.ts` close to 500 LOC cap (432 LOC) | Growing complexity |
| CF-01 | `path-scope.ts` and `redaction.ts` minimal test coverage | Security modules under-tested |
| XC-08 | `any[]` type leak from C1→C4→C8 | Untyped governance data in tool metadata |

### 3.4 LOW (7)

| ID | Issue | Impact |
|----|-------|--------|
| LO-06 | `index.ts` exposes internal modules as public API | Leaks C3/C2 internals |
| LO-07 | `runtime-policy.ts` has no-op `validateTrustedRuntimePolicy` | Dead code |
| LO-08 | `session-naming.ts` type asymmetry | `ParsedNaming.classification` is `string` instead of literal union |
| LO-10 | `state.ts` module-level singleton test pollution | Shared mutable state across test suites |
| LO-11 | `helpers.ts` missing `getPromptToolCompatibility` test | Untested export |
| MP-03 | `plugin.ts` exceeds 500 LOC module cap | Maintainability debt |
| HP-02 | 2 `as any` casts in `plugin.ts` | Type unsafety |

---

## 4. Locked Decisions

### 4.1 SR-02 Journal → REVAMP

**Decision:** Wire journal write path into the shared layer (~50 lines).
**Rationale:** The journal module in C2 needs a clean write path through C8's shared layer.
**Impact:** C8 gains ~50 LOC of journal write integration.

### 4.2 SR-03 Concurrency Queue → KEEP

**Decision:** Keep the concurrency queue as-is (fully integrated).
**Rationale:** The queue is well-integrated and functional. No changes needed.
**Impact:** No C8 changes.

### 4.3 C8 Priority Order

**Decision:** 33 → SR-01 → 35 → SR-00/SR-04 → 34

**Execution sequence:**
1. **Phase 33** — Split `plugin.ts` (1,076 → ~600 LOC)
2. **SR-01** — Extract `session-api.ts` coupling to C4
3. **Phase 35** — Remove dead code (12 types + `task-status.ts`)
4. **SR-00 / SR-04** — Archive (no-op)
5. **Phase 34** — Async I/O + typed errors

### 4.4 Phase 33: plugin.ts Split

**Decision:** Split by concern into 3 files:
- `plugin.ts` — composition root (~200 LOC after split)
- `plugin-registration.ts` — tool registration functions (~600 LOC)
- `one-shot-migrations.ts` — legacy file cleanup (~276 LOC)

**Rationale:** The 1,076 LOC plugin.ts exceeds the 500 LOC module cap by 115%. The 4 registration functions and 2 migration functions are self-contained and extractable.

### 4.5 SR-01: session-api Coupling Extraction

**Decision:** Extract `getSessionBehavioralProfile()` from `session-api.ts` to C4.
**Rationale:** A foundation module should NOT depend on C1 routing logic. The function is a thin wrapper adding zero value.
**Impact:** C8 becomes leaf-only (no cross-cluster imports).

### 4.6 Phase 35: Dead Code Cleanup

**Decision:** Remove entirely:
- 12 dead types from `shared/types.ts`
- `task-status.ts` (dead at runtime — no state machine uses it)

**Rationale:** These types and the task-status module are exported but never imported by any runtime module.

### 4.7 SR-00 / SR-04: Archive (No-Op)

**Decision:** Archive both — no changes needed.
**Rationale:** These sub-requirements are either already complete or no longer relevant.

### 4.8 Phase 34: Async I/O + Typed Errors

**Decision:** Implement:
- `HarnessError` base class with `code`, `cluster`, `module` properties
- `[Harness]` prefix on all error throws
- TUI-safe error suppression (errors don't surface in TUI toast)

**Rationale:** 56/125 throws lack `[Harness]` prefix. No machine-readable error taxonomy exists. TUI should suppress internal errors.

---

## 5. Dependencies on Other Clusters

### 5.1 C8 as Provider (Inbound: 125 imports)

C8 is THE hub — every other cluster imports from it:

| Consumer | Import Count | Key Modules |
|----------|-------------|-------------|
| C5 (Tools) | 62 | tool-response, tool-helpers, types, session-api, helpers |
| C3 (Coordination) | 33 | types, session-api, helpers, state, session-naming, app-api, runtime-policy |
| C4 (Hooks) | 16 | types, session-api, helpers, state, runtime-policy, runtime |
| C2 (Task Mgmt) | 7 | types, session-api, state, session-naming, path-scope, redaction |
| C1 (Governance) | 6 | types, validation, state, session-api, session-naming |
| C7 (Sidecar) | 1 | session-api |

### 5.2 C8 as Consumer (Outbound: 2 imports)

C8 has only 2 outbound imports — both to C1 routing (the coupling to be removed):

```
src/shared/session-api.ts:5-6 → src/routing/behavioral-profile/ (C1)
```

After SR-01 extraction, C8 becomes **leaf-only** (zero outbound imports).

### 5.3 Critical Dependency Paths

| Path | Risk | Mitigation |
|------|------|------------|
| C8 → C1 (session-api coupling) | Foundation depends on governance | SR-01 removes this |
| C8 ↔ C3 (re-export cycle in types.ts) | Fragile coupling | Document as backward-compat bridge |
| C8 → ALL (125 consumers) | Any type change cascades | Careful type evolution, deprecation notices |

---

## 6. Cross-Cluster Integration Map

### 6.1 Foundation Layer → Consumer Clusters

| Shared Module | C1 | C2 | C3 | C4 | C5 | C7 |
|---------------|----|----|----|----|----|-----|
| `types.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `helpers.ts` | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| `session-api.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `state.ts` | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `tool-response.ts` | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| `tool-helpers.ts` | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| `runtime-policy.ts` | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `runtime.ts` | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `path-scope.ts` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| `redaction.ts` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `session-naming.ts` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `app-api.ts` | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

### 6.2 Key Integration Insights

1. **`session-api.ts` is THE convergence point** — consumed by every cluster except C5. 47 consumers.
2. **`tool-response.ts` and `tool-helpers.ts` serve the exact same consumers** — could be merged.
3. **C7 (Sidecar) only imports `session-api.ts`** — isolated from most shared infrastructure.

---

*Context document: 2026-06-06 — sourced from AUDIT-03 inventories, dependency graph, and cross-audit*
