# Sector Responsibility Matrix

**Generated**: 2026-03-12
**Scope**: Sector-level ownership and concern mapping
**Purpose**: Clear accountability for each code sector

---

## Matrix

| Sector | File Count | Phase 1 Concerns | Restricted | Dead Code | Runtime Phase | Lineage | State Files | Hooks | Tools |
|--------|------------|------------------|------------|-----------|---------------|---------|-------------|-------|-------|
| `hooks/` | 9 | 4 | 2 | 0 | Every turn | Core | 0 | 9 | 0 |
| `lib/` | 50+ | 8 | 0 | 6 | Continuous | Core | 0 | 0 | 0 |
| `lib/code-intel/` | 18 | 6 | 0 | 0 | On-demand | Core | 0 | 0 | 0 |
| `lib/graph/` | 6 | 0 | 0 | 0 | Continuous | Core | 3 | 0 | 0 |
| `schemas/` | 13 | 2 | 0 | 0 | Validation | Core | 0 | 0 | 0 |
| `tools/` | 23 | 2 | 0 | 0 | On-demand | Core | 0 | 0 | 23 |
| `agents/` | 9 | 1 | 0 | 0 | Delegation | Framework | 0 | 0 | 0 |
| `commands/` | 35 | 3 | 0 | 0 | On-demand | Framework | 0 | 0 | 0 |
| `skills/` | 12 | 8 | 0 | 0 | On-demand | Framework | 0 | 0 | 0 |
| `workflows/` | 21 | 0 | 0 | 0 | On-demand | Framework | 0 | 0 | 0 |

---

## Sector Details

### `hooks/` — Runtime Injection Layer

**Responsibility**: Per-turn context injection and session lifecycle
**Owner**: Core runtime team
**Risk Level**: CRITICAL (2 restricted files)

| File | Phase 1 Concern | Restricted |
|------|-----------------|------------|
| `session-lifecycle.ts` | System 2a injection | YES |
| `messages-transform.ts` | System 2b injection | YES |
| `event-handler.ts` | Bootstrap authority | NO |
| `tool-gate.ts` | Advisory gate | NO |
| `soft-governance.ts` | Counter tracking | NO |

**State Dependencies**: None (hooks read state, don't write)

---

### `lib/` — Core Library Layer

**Responsibility**: Business logic, state management, utilities
**Owner**: Core runtime team
**Risk Level**: HIGH (8 concern files, 6 dead code)

**Concern Files**:
| File | Role | Concern Type |
|------|------|--------------|
| `injection-orchestrator.ts` | Budget allocation | Injection pipeline |
| `governance-instruction.ts` | HIVE-MASTER block | Injection pipeline |
| `context-escalation.ts` | Escalation levels | Injection pipeline |
| `cognitive-packer.ts` | XML compilation | Injection pipeline |
| `session-governance.ts` | Line compilation | Injection pipeline |
| `session_coherence.ts` | Context retrieval | Injection pipeline |
| `budget.ts` | Budget constants | Injection pipeline |
| `state-mutation-queue.ts` | CQRS enforcement | Authority surface |

**Dead Code**:
| File | Status |
|------|--------|
| `file-lock.ts` | No consumers |
| `orphan-quarantine.ts` | No integration |
| `project-snapshot.ts` | Never imported |
| `session-memory-classifier.ts` | No tool/hook |
| `skill-registry.ts` | Superseded |
| `tool-activation.ts` | Corrupted |

---

### `lib/code-intel/` — AST Processing

**Responsibility**: Code analysis, Tree-sitter integration
**Owner**: Core runtime team
**Risk Level**: MEDIUM (Tree-sitter WASM dependency)

| File | Lines | WASM Required |
|------|-------|---------------|
| `tree-sitter-loader.ts` | ~150 | YES (7 languages) |
| `signature-extractor.ts` | 821 | YES |
| `compressed-codemap.ts` | ~200 | Optional |
| `ast-surgeon.ts` | ~300 | YES |
| `incremental-updater.ts` | ~150 | Optional |
| `watch-integration.ts` | ~100 | Optional |
| `doc-weaver.ts` | ~200 | NO (remark only) |

---

### `lib/graph/` — Graph Operations

**Responsibility**: Hierarchy tree, graph traversal, state I/O
**Owner**: Core runtime team
**Risk Level**: LOW (no Phase 1 concerns)

| File | State File |
|------|------------|
| `hierarchy-tree.ts` | `hierarchy.json` |
| `graph-operations.ts` | `graph/*.json` |
| `node-operations.ts` | — |
| `edge-operations.ts` | — |
| `traversal.ts` | — |
| `persistence.ts` | `brain.json` |

---

### `schemas/` — Validation Layer

**Responsibility**: Zod schemas for type safety
**Owner**: Core runtime team
**Risk Level**: MEDIUM (2 concern files)

| File | Concern |
|------|---------|
| `brain-state.ts` | Detox applied, monitoring |
| `session-profile.ts` | Agent resolution model |

---

### `tools/` — CQRS Write Layer

**Responsibility**: All state mutations via tools
**Owner**: Core runtime team
**Risk Level**: HIGH (2 CQRS violations)

| File | Concern |
|------|---------|
| `hivemind-context.ts` | Direct write in handlePurge() |
| `hivemind-plan.ts` | Direct write bypassing queue |

**All Other Tools**: Compliant with CQRS pattern

---

### `agents/` — Agent Profiles

**Responsibility**: Agent definitions and delegation
**Owner**: Framework team
**Risk Level**: MEDIUM (1 contract mismatch)

| File | Concern |
|------|---------|
| `hivefiver.md` | Profile scope != AGENTS.md scope |

---

### `commands/` — Slash Commands

**Responsibility**: User-facing command interfaces
**Owner**: Framework team
**Risk Level**: MEDIUM (3 enforcement block commands)

| File | Enforcement |
|------|-------------|
| `hivefiver.md` | 7 script references |
| `hivefiver-start.md` | Gate-check block |
| `hivefiver-doctor.md` | Dead reference scan |

---

### `skills/` — Agent Skills

**Responsibility**: Domain-specific agent capabilities
**Owner**: Framework team
**Risk Level**: HIGH (8 Phase 1 critical skills)

| Skill | Role |
|-------|------|
| `entry-resolution` | ROOT GATEWAY |
| `delegation-framework` | Delegation guard |
| `platform-adapter` | Platform mapping |
| `context-integrity` | Context repair |
| `evidence-discipline` | Proof enforcement |
| `verification-methodology` | Goal-backward analysis |
| `agent-role-boundary` | Role separation |
| `meta-builder-governance` | Framework evolution |

---

### `workflows/` — Workflow Definitions

**Responsibility**: Multi-step process definitions
**Owner**: Framework team
**Risk Level**: LOW (no Phase 1 concerns)

21 workflow files, all YAML-based, no runtime concerns.

---

## Ownership Legend

| Lineage | Owner | Scope |
|---------|-------|-------|
| Core | Core runtime team | `src/**`, `tests/**` |
| Framework | Framework team | `agents/**`, `commands/**`, `skills/**`, `workflows/**` |

---

## Runtime Phase Legend

| Phase | When | Files |
|-------|------|-------|
| Every turn | Each LLM invocation | `hooks/session-lifecycle.ts`, `hooks/messages-transform.ts` |
| Continuous | Always active | `lib/state-mutation-queue.ts`, `lib/graph/*` |
| On-demand | Tool/skill invocation | `tools/*`, `skills/*`, `commands/*` |
| Validation | Schema checks | `schemas/*` |

---

## Summary

| Metric | Count |
|--------|-------|
| Total Sectors | 10 |
| Sectors with Phase 1 Concerns | 7 |
| Sectors with Restricted Files | 1 |
| Sectors with Dead Code | 1 |
| Core Lineage Sectors | 6 |
| Framework Lineage Sectors | 4 |

---

*Maintained by: hivefiver meta-builder*
*Next review: 2026-03-19*
