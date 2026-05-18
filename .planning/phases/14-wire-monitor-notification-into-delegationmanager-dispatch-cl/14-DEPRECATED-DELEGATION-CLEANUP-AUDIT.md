# Deprecated Delegation Cleanup Audit — Plan 14-04

**Created:** 2026-05-19T00:00:00Z
**Executor:** gsd-executor (subagent)
**Phase:** 14-wire-monitor-notification-into-delegationmanager-dispatch-cl
**Plan:** 14-04

## 1. Deprecated Targets (BLOCKLIST — remove)

### 1.1 `safetyCeilingMs` — delegation dispatch parameter

| File | Line(s) | Context |
|------|---------|---------|
| `src/coordination/delegation/types.ts` | 173 | `export const DEFAULT_SAFETY_CEILING_MS = 30 * 60 * 1000` |
| `src/coordination/delegation/state-machine.ts` | 26, 310, 438 | Import + 2 usage sites (timeout check, transition message) |
| `src/shared/types.ts` | 351 | Re-export from coordination/delegation/types |
| `src/coordination/concurrency/queue.ts` | 34, 47-57 | `category` param in queue key builder (not safetyCeiling but delegation category) |
| `src/coordination/spawner/concurrency-key.ts` | 7 | `category?: string` in interface |
| `tests/tools/delegation/delegation-status-v2.test.ts` | 21, 222 | `safetyCeilingMs: 300_000` in test fixtures |
| `tests/tools/delegation/delegate-task-v2.test.ts` | 58-62 | `safetyCeilingMs` default assertion |
| `tests/tools/delegate-task.test.ts` | 103-194 | Multiple `safetyCeilingMs` assertions |
| `tests/lib/delegation-manager.test.ts` | 15, 90, 207, 913-939, 1239, 1329, 1353, 1373, 1400, 1678-1855, 2585-2661 | Extensive `safetyCeilingMs` usage |
| `tests/lib/coordination/delegation/full-pipeline.test.ts` | 69 | `safetyCeilingMs: 300_000` in dispatch call |
| `tests/tools/run-background-command.test.ts` | 49 | `safetyCeilingMs: 180_000` |

### 1.2 Delegation `category` — gate params and queue keys

| File | Line(s) | Context |
|------|---------|---------|
| `src/coordination/concurrency/queue.ts` | 34, 47-57 | `category?: string` param; queue key encoding `agent:${agent}:category:${category}` |
| `src/coordination/spawner/concurrency-key.ts` | 7 | `category?: string` in interface |
| `tests/lib/coordination/delegation/full-pipeline.test.ts` | 69 | `category: "implementation"` in dispatch call |

### 1.3 `ESCALATION_*` compatibility aliases

| File | Line(s) | Context |
|------|---------|---------|
| `src/coordination/delegation/types.ts` | 133 | `export const ESCALATION_THRESHOLDS = FAILURE_CHECKPOINTS` |
| `src/coordination/delegation/types.ts` | 141 | `export const ESCALATION_ICONS = ["⚠", "⚠", "🔴", "⛔", "🛑"]` |

**Verification:** `rg "ESCALATION_THRESHOLDS|ESCALATION_ICONS" src/` — 0 imports outside types.ts. Safe to remove.

### 1.4 Stale `classifications` references

No active `classifications` references found in `src/` — already cleaned in prior waves.

### 1.5 Deprecated files (already deleted)

- `src/coordination/delegation/category-gates.ts` — already deleted
- `src/coordination/delegation/category-gate-audit.ts` — already deleted

## 2. Allowlist (KEEP — non-delegation category usage)

| File | Pattern | Rationale |
|------|---------|-----------|
| `src/shared/helpers.ts` | `purpose_category` in prompt packets | Prompt metadata — not delegation |
| `src/tools/delegation/delegate-task.ts` | `categoryHint` in input schema | User hint for agent selection, not gate |
| `src/features/bootstrap/primitive-category.ts` | `primitiveCategory` type | Bootstrap primitive classification |
| `src/shared/types.ts` | `category` in various non-delegation types | Shared type definitions unrelated to delegation gates |
| `tests/` various | `category` in validation/language tests | Test fixtures for non-delegation domains |
| `src/config/` | `category` in subscriber config | Config categorization |
| `src/routing/` | `category` in behavioral profile | Routing classification |
| `src/tools/prompt-enhance/` | `purpose_category` | Prompt enhancement metadata |
| `src/shared/security/redact.ts` | `REDACTION_KEYS` includes category key | Security redaction pattern |
| `src/features/doc-intelligence/` | `language` script category | Language detection |
| `src/coordination/delegation/AGENTS.md` | "category gates" in docs | Documentation — update text after code cleanup |
| `src/coordination/AGENTS.md` | "category gates" in docs | Documentation — update text after code cleanup |

## 3. Grep Commands for Verification

### Blocklist (should return 0 after cleanup)

```bash
# safetyCeiling in src/
rg "safetyCeilingMs|DEFAULT_SAFETY_CEILING_MS" src/

# ESCALATION aliases in src/
rg "ESCALATION_THRESHOLDS|ESCALATION_ICONS" src/

# Delegation category in queue key builder
rg "category.*delegation|delegation.*category" src/coordination/concurrency/queue.ts

# Delegation category in spawner
rg "category" src/coordination/spawner/concurrency-key.ts

# DelegationCategory type usage
rg "DelegationCategory" src/
```

### Allowlist (should remain unchanged)

```bash
# Non-delegation category usage — should still exist
rg "purpose_category" src/
rg "categoryHint" src/
rg "primitiveCategory" src/
rg "language.*category" src/
```

## 4. Impact Assessment

- **src/ files to modify:** 5 files
  - `src/coordination/delegation/types.ts` — remove `DEFAULT_SAFETY_CEILING_MS`, `ESCALATION_THRESHOLDS`, `ESCALATION_ICONS`
  - `src/coordination/delegation/state-machine.ts` — remove `DEFAULT_SAFETY_CEILING_MS` import + 2 usage sites
  - `src/shared/types.ts` — remove `DEFAULT_SAFETY_CEILING_MS` re-export
  - `src/coordination/concurrency/queue.ts` — remove `category` param and category-based queue key branches
  - `src/coordination/spawner/concurrency-key.ts` — remove `category` from interface

- **test/ files to modify:** 6 files
  - `tests/tools/delegation/delegation-status-v2.test.ts`
  - `tests/tools/delegation/delegate-task-v2.test.ts`
  - `tests/tools/delegate-task.test.ts`
  - `tests/lib/delegation-manager.test.ts`
  - `tests/lib/coordination/delegation/full-pipeline.test.ts`
  - `tests/tools/run-background-command.test.ts`

- **docs/ files to update:** 2 files
  - `src/coordination/delegation/AGENTS.md`
  - `src/coordination/AGENTS.md`

## 5. Risk Assessment

| Risk | Mitigation |
|------|------------|
| Removing `category` from queue key builder may break existing queue keys | Queue keys are runtime-generated; removing category branch simplifies to `agent:${agent}` or `command:${command}` — existing keys with category will still match prefix |
| Removing `DEFAULT_SAFETY_CEILING_MS` may break state-machine timeout | State-machine timeout logic should be replaced with progressive checkpoint thresholds (60→120→180→300→600) from Plans 01-03 |
| Test file changes may cascade | TDD approach: write failing tests first (RED), then fix implementation (GREEN) |
