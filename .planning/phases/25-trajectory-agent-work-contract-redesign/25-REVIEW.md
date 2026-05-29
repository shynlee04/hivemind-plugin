---
status: issues_found
files_reviewed: 11
critical: 0
warning: 3
info: 3
total: 6
---

# Phase 25 Code Review

**Date:** 2026-05-29
**Depth:** standard
**Files:** 11
**Status:** issues_found

## Summary

Reviewed 8 created and 3 modified source files covering the agent-work-contract lifecycle state machine, unified compaction bounds, trajectory cross-linking, and associated tests. All 54 tests pass and TypeScript compiles cleanly. The architecture is sound — single-source-of-truth constants in `bounds.ts`, clean Zod schema integration, and a well-structured state machine in `lifecycle.ts`. Three warnings were found: an off-by-one in text truncation, a double-persistence pattern in lifecycle transitions that risks data loss on crash, and missing `.max()` validation on the tool input schema. Three info items cover test hygiene issues.

## Findings

### WR-001: Off-by-one in `boundText` truncation (Warning)

**File:** `src/features/agent-work-contracts/operations.ts:109`
**Issue:** `boundText` slices to `limit - 1` characters when the value exceeds the limit, but no truncation marker is appended. This means a value of 1201 characters gets truncated to 1199 instead of 1200, creating an off-by-one inconsistency with the Zod `.max(1200)` constraint in `AgentWorkCompactionSchema`. The `limit - 1` appears to be leftover from an intended-but-unimplemented truncation marker (the JSDoc says "visible truncation marker").

```typescript
// Current (line 109):
return value.slice(0, Math.max(0, limit - 1)).trimEnd()

// A 1201-char string becomes 1199 chars, but Zod allows 1200
```

**Fix:** Either add the truncation marker as documented, or remove the `- 1`:
```typescript
function boundText(value: string, limit: number): string {
  if (value.length <= limit) return value
  return value.slice(0, limit).trimEnd()
}
```

---

### WR-002: Double-persistence in lifecycle transitions risks data loss (Warning)

**File:** `src/features/agent-work-contracts/lifecycle.ts:48-51, 63-68, 80-83`
**Issue:** `blockContract`, `completeContract`, and `cancelContract` each perform two separate store writes. The first write happens inside `transitionContract` (which calls `upsertAgentWorkContract`), persisting the status change. The second write (in the caller) adds the reason/proof to the evidence and persists again. If the process crashes between the two writes, the contract ends up in the new status (blocked/completed/cancelled) but without the associated reason or proof — a data integrity gap.

```typescript
// blockContract — two writes:
export function blockContract(projectRoot: string, contractId: string, reason: string) {
  const contract = transitionContract(projectRoot, contractId, "blocked") // ← FIRST WRITE (status only)
  contract.evidence.blockedStateRules = [...contract.evidence.blockedStateRules, reason]
  return upsertAgentWorkContract(projectRoot, contract) // ← SECOND WRITE (status + reason)
}
```

**Fix:** Refactor to apply the evidence mutation before the persist. Either extend `transitionContract` to accept an optional mutation callback, or restructure to read → mutate → persist once:
```typescript
export function blockContract(projectRoot: string, contractId: string, reason: string) {
  const contract = getAgentWorkContract(projectRoot, contractId)
  if (!contract) throw new Error(`[Harness] agent work contract not found: ${contractId}`)
  const allowed = ALLOWED_TRANSITIONS[contract.status]
  if (!allowed.includes("blocked")) {
    throw new Error(`[Harness] invalid contract transition: ${contract.status}→blocked (contract ${contractId})`)
  }
  contract.status = "blocked"
  contract.updatedAt = Date.now()
  contract.evidence.blockedStateRules = [...contract.evidence.blockedStateRules, reason]
  return upsertAgentWorkContract(projectRoot, contract) // single write
}
```

---

### WR-003: Missing `.max()` validation on tool input schema (Warning)

**File:** `src/schema-kernel/agent-work-contract.schema.ts:102-106`
**Issue:** `AgentWorkCreateToolInputSchema` defines `briefing`, `summary`, `anchors`, `reinjectionPayload`, and `sourceRefs` without `.max()` constraints from `bounds.ts`. The `AgentWorkCompactionSchema` (line 53-59) correctly applies these limits, but the tool input schema — which is the first validation layer for untrusted tool arguments — does not. This creates a defense-in-depth gap: very large strings or arrays pass Zod validation and consume memory during processing before `boundCompaction` truncates them.

```typescript
// Current (tool input schema, no bounds):
briefing: z.string().default(""),
summary: z.string().default(""),
anchors: z.array(z.string().min(1)).default([]),
reinjectionPayload: z.string().default(""),
sourceRefs: z.array(z.string().min(1)).default([]),
```

**Fix:** Add `.max()` constraints to the tool input schema:
```typescript
briefing: z.string().max(BRIEFING_LIMIT).default(""),
summary: z.string().max(SUMMARY_LIMIT).default(""),
anchors: z.array(z.string().min(1)).max(ANCHOR_LIMIT).default([]),
reinjectionPayload: z.string().max(REINJECTION_LIMIT).default(""),
sourceRefs: z.array(z.string().min(1)).max(ANCHOR_LIMIT).default([]),
```

---

### IN-001: CJS `require()` mixed with ESM imports in test (Info)

**File:** `tests/task-management/trajectory/ledger.test.ts:103`
**Issue:** Uses `require("node:fs").readdirSync(stateDir) as string[]` instead of importing `readdirSync` from the existing ESM import at line 1. The `as string[]` assertion is also unnecessary since `readdirSync` already returns `string[]` with proper TypeScript types.

**Fix:** Add `readdirSync` to the existing import and remove the `require()`:
```typescript
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
// ...
const files = readdirSync(stateDir)
```

---

### IN-002: Unused imports in test files (Info)

**File:** `tests/features/agent-work-contracts/cross-linking.test.ts:1`, `tests/features/agent-work-contracts/lifecycle.test.ts:1`
**Issue:** `existsSync` is imported but never used in `cross-linking.test.ts`. Both `existsSync` and `readFileSync` are imported but never used in `lifecycle.test.ts`. The project's `tsconfig.json` has `noUnusedLocals: true`, so these should fail typecheck — they don't because vitest has its own tsconfig that may relax this rule.

**Fix:** Remove unused imports:
```typescript
// cross-linking.test.ts:
import { mkdtempSync, rmSync } from "node:fs"

// lifecycle.test.ts:
import { mkdtempSync, rmSync } from "node:fs"
```

---

### IN-003: Incomplete JSDoc on `startContract` (Info)

**File:** `src/features/agent-work-contracts/lifecycle.ts:28`
**Issue:** The JSDoc says "Transition a contract from created→running" but `startContract` also handles `blocked→running` (re-activation). The test at lifecycle.test.ts:105 explicitly validates this behavior, confirming it's intentional. The documentation should reflect the dual purpose.

**Fix:** Update the JSDoc:
```typescript
/**
 * Transition a contract from created→running or blocked→running (re-activate).
 *
 * @param projectRoot - Trusted project root.
 * @param contractId - Contract to transition.
 * @returns Updated contract.
 * @throws {Error} When the contract doesn't exist or the transition is invalid.
 */
```

## Clean Files

- `src/features/agent-work-contracts/bounds.ts` — Clean, minimal, well-documented constants
- `src/features/agent-work-contracts/index.ts` — Clean re-exports
- `tests/task-management/trajectory/types.test.ts` — Good type-level validation coverage
- `tests/task-management/trajectory/store-operations.test.ts` — Thorough edge case coverage
- `tests/task-management/trajectory/index.test.ts` — Clean re-export verification

## Recommendation

**Fix WR-001 and WR-002 before merging.** The off-by-one in `boundText` is a straightforward one-line fix. The double-persistence in lifecycle transitions is a data integrity risk that should be resolved by consolidating to a single write per transition. WR-003 (missing tool input bounds) is a defense-in-depth improvement that can be addressed in a follow-up. The info items are test hygiene — clean up if convenient but not blocking.
