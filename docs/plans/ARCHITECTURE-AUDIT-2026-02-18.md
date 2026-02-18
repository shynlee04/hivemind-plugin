# Architecture Audit Report - HiveMind v3.0

**Date:** 2026-02-18
**Auditor:** hiveminder agent
**Scope:** Full codebase architecture review

---

## Executive Summary

| Domain | Files | Compliance | Critical Issues |
|--------|-------|------------|-----------------|
| **src/lib/** | 46 | 85% | 2 SDK violations, 7 files >500 LOC |
| **src/hooks/** | 13 | 54% | 9 CQRS violations (state writes) |
| **src/tools/** | 6 | 33% | 4 tools contain business logic |
| **src/schemas/** | 8 | 75% | Missing Zod for brain-state, config |
| **.hivemind/** | 20 files | N/A | Dual-memory, concurrency hotspots |

**Overall Architecture Health: 62%** - Requires remediation before production.

---

## Critical Violations

### 1. CQRS Violations in Hooks (9 state writes)

Hooks should be READ-ONLY. These write to state:

| File | Line | Operation | Severity |
|------|------|-----------|----------|
| soft-governance.ts | 464 | stateManager.save() | 🔴 HIGH |
| messages-transform.ts | 286 | stateManager.save() | 🔴 HIGH |
| messages-transform.ts | 345 | stateManager.save() | 🔴 HIGH |
| tool-gate.ts | 220 | stateManager.save() | 🟡 MEDIUM |
| tool-gate.ts | 259 | stateManager.save() | 🟡 MEDIUM |
| session-lifecycle.ts | 75 | stateManager.save() | 🟡 MEDIUM |
| compaction.ts | 73 | stateManager.save() | 🟢 LOW |
| event-handler.ts | 83 | stateManager.save() | 🟡 MEDIUM |
| event-handler.ts | 97 | stateManager.save() | 🟢 LOW |

**Solution:** Wire `state-mutation-queue.ts` into all hooks.

### 2. SDK Dependencies in lib/ (Architecture Violation)

lib/ should be pure TypeScript with NO SDK dependencies:

| File | Violation |
|------|-----------|
| compaction-engine.ts | Imports `getClient` from hooks/sdk-context |
| auto-commit.ts | Imports `getShell` from hooks/sdk-context |

**Solution:** Move SDK session creation to tool layer or hooks layer.

### 3. Business Logic in Tools (Dumb Tool Violation)

Tools should be "dumb wrappers" (Zod schema → lib call → output):

| Tool | Lines of Business Logic | Should Move To |
|------|------------------------|----------------|
| hivemind-session.ts | 83 (syncTrajectoryToGraph) | lib/trajectory-sync.ts |
| hivemind-memory.ts | 55 (searchGraphMems) | lib/mem-search.ts |
| hivemind-cycle.ts | 120 (handleList/handlePrune) | lib/cycle-handlers.ts |
| hivemind-hierarchy.ts | 34 (tree traversal) | lib/hierarchy-tree.ts |

---

## Oversized Files (>500 LOC)

Strategic limit is ~300 LOC. These need splitting:

| File | Lines | Recommendation |
|------|-------|----------------|
| planning-fs.ts | 1031 | Split: session-template.ts, session-manifest.ts, session-io.ts |
| hierarchy-tree.ts | 906 | Split: hierarchy-types.ts, hierarchy-crud.ts, hierarchy-render.ts |
| detection.ts | 881 | Split: detection-types.ts, detection-keywords.ts, detection-escalation.ts |
| graph-io.ts | 651 | Split: graph-io-core.ts, graph-fk-validation.ts |
| session_coherence.ts | 604 | Split: session-context-loader.ts, session-confidence.ts |
| session-engine.ts | 578 | Split: session-start.ts, session-update.ts, session-close.ts |
| cognitive-packer.ts | 501 | Split: packer-core.ts, packer-xml.ts |

---

## Schema Gaps

Zod schemas missing runtime validation:

| Domain | Current State | Required |
|--------|--------------|----------|
| brain-state.ts | TypeScript interfaces | Zod schemas |
| config.ts | TypeScript interfaces | Zod schemas |
| anchors | Legacy interface | AnchorNodeSchema |
| sessions | No schema | SessionNodeSchema |

---

## Data Flow Analysis

### Current (Problematic)
```
HOOKS (read-auto) ────WRITE────▶ brain.json  ← CQRS VIOLATION
TOOLS (write-only) ───WRITE────▶ brain.json
```

### Target (CQRS Compliant)
```
HOOKS (read-only) ──queue──▶ state-mutation-queue
                                    │
                                    ▼
TOOLS (write-only) ─flush────▶ brain.json
```

### Concurrency Hotspots

| File | Writers | Protection |
|------|---------|------------|
| brain.json | persistence.ts, soft-governance.ts, compaction.ts | file-lock.ts ✅ |
| graph/mems.json | graph-io.ts, session-swarm.ts | file-lock.ts ✅ |
| graph/tasks.json | graph-io.ts | file-lock.ts ✅ |

---

## Remediation Phases

### PHASE A: CQRS Enforcement (CRITICAL)
1. Wire `state-mutation-queue.ts` into soft-governance.ts
2. Wire into messages-transform.ts
3. Wire into tool-gate.ts
4. Wire into event-handler.ts
5. Wire into compaction.ts
6. Add flushMutations() call in hivemind-session tools

### PHASE B: SDK Dependency Removal (CRITICAL)
1. Move SDK session creation from compaction-engine.ts to hooks/
2. Move SDK shell access from auto-commit.ts to hooks/
3. Verify lib/ has zero SDK imports

### PHASE C: Tool Refactoring (HIGH)
1. Create lib/trajectory-sync.ts, move syncTrajectoryToGraph
2. Create lib/mem-search.ts, move searchGraphMems
3. Create lib/cycle-handlers.ts, move handleList/handlePrune
4. Extend lib/hierarchy-tree.ts with tree traversal

### PHASE D: Schema Hardening (HIGH)
1. Add BrainStateSchema with Zod
2. Add HiveMindConfigSchema with Zod
3. Add AnchorNodeSchema with FK
4. Export all schemas from index.ts

### PHASE E: File Splitting (MEDIUM)
1. Split planning-fs.ts (1031→3 files)
2. Split hierarchy-tree.ts (906→3 files)
3. Split detection.ts (881→3 files)

---

## Dependency Rules (To Enforce)

```
lib/      → imports from: schemas/, Node builtins, npm packages
          → NEVER imports from: hooks/, tools/, cli/, dashboard/

hooks/    → imports from: lib/, schemas/, SDK
          → NEVER imports from: tools/, cli/

tools/    → imports from: lib/, schemas/
          → NEVER contains: business logic, SDK calls

schemas/  → imports from: zod, nothing else
          → PURE type definitions
```

---

## Verification Commands

```bash
# Type check
npx tsc --noEmit

# Tests
npm test

# SDK dependency check (should return nothing)
grep -r "@opencode" src/lib/

# CQRS violation check (should return nothing)
grep -r "stateManager.save" src/hooks/

# Business logic in tools check (should be minimal)
grep -r "function.*{" src/tools/*.ts | grep -v "create\|export"
```

---

*Generated by hiveminder architecture audit - 2026-02-18*
