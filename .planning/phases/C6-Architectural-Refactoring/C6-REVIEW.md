---
phase: C4-C6
reviewed: 2026-05-28T10:00:00Z
depth: deep
files_reviewed: 9
files_reviewed_list:
  - src/tools/delegation/delegation-status.ts
  - src/tools/config/bootstrap-init.ts
  - src/coordination/completion/detector.ts
  - src/features/governance-engine/create-governance-session.ts
  - src/coordination/delegation/coordinator.ts
  - src/features/session-tracker/capture/event-capture.ts
  - src/features/session-tracker/capture/handlers/types.ts
  - src/tools/delegation/readers/types.ts
  - src/plugin.ts
findings:
  critical: 1
  warning: 7
  info: 2
  total: 10
status: issues_found
---

# Phase C4-C6: Code Review Report

**Reviewed:** 2026-05-28T10:00:00Z
**Depth:** deep
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Cross-file analysis of performance optimization (C4), error handling/code quality (C5), and architectural refactoring (C6) phases identified 1 critical bug, 7 warnings, and 2 informational findings. The most severe issue is an infinite loop risk in hierarchy traversal logic that can cause process hangs. Additionally, three modules exceed the project's 500 LOC architectural limit, degrading maintainability.

## Critical Issues

### CR-01: Infinite Loop Risk in Hierarchy Traversal

**File:** `src/tools/delegation/delegation-status.ts:327-338`
**Issue:** The descendant counting loop in `getHierarchyContext` traverses parent references without cycle detection. If a circular parent reference exists (e.g., a child pointing to itself as parent), the `while (checkParent)` loop will never terminate, causing a process hang. The loop uses `checkParent = parentValidated ? (parentValidated.parentSessionID ?? null) : null` but doesn't track visited nodes.

**Fix:**
```typescript
let descendantCount = 0
for (const [, child] of Object.entries(allChildren)) {
  const parsed = HierarchyManifestChildSchema.safeParse(child)
  if (!parsed.success) continue
  const childMeta = parsed.data as HierarchyManifestChildValidated
  let checkParent: string | null = childMeta.parentSessionID
  const visited = new Set<string>() // Add cycle detection
  while (checkParent) {
    if (visited.has(checkParent)) break // Prevent infinite loop
    visited.add(checkParent)
    if (checkParent === currentSessionId) {
      descendantCount++
      break
    }
    const parentEntry: unknown = allChildren[checkParent]
    const parentParseResult = parentEntry ? HierarchyManifestChildSchema.safeParse(parentEntry) : undefined
    const parentValidated: HierarchyManifestChildValidated | undefined = parentParseResult?.success ? parentParseResult.data as HierarchyManifestChildValidated : undefined
    checkParent = parentValidated ? (parentValidated.parentSessionID ?? null) : null
  }
}
```

## Warnings

### WR-01: Architecture Violation — Module Exceeds 500 LOC Limit

**File:** `src/tools/delegation/delegation-status.ts:1-720`
**Issue:** Module contains 720 lines of code, exceeding the project's architectural limit of 500 LOC. This reduces maintainability and violates the project's coding standards. The file mixes tool definition, data merging, hierarchy traversal, and access control logic.

**Fix:** Split into focused modules:
- `delegation-status-tool.ts` — tool definition and input parsing
- `delegation-merger.ts` — data merging from multiple sources
- `hierarchy-traversal.ts` — hierarchy context construction
- `access-control.ts` — delegation access validation

### WR-02: Architecture Violation — Module Exceeds 500 LOC Limit

**File:** `src/coordination/delegation/coordinator.ts:1-556`
**Issue:** Module contains 556 lines of code, exceeding the project's architectural limit of 500 LOC. The coordinator class handles dispatch, monitoring, completion, chain execution, and cleanup responsibilities.

**Fix:** Extract chain execution logic to a separate `chain-executor.ts` module and move cleanup logic to a `cleanup-handler.ts`.

### WR-03: Architecture Violation — Composition Root Exceeds 500 LOC Limit

**File:** `src/plugin.ts:1-653`
**Issue:** The composition root contains 653 lines, exceeding the 500 LOC limit. While composition roots are expected to be larger, the current implementation mixes domain registration, hook wiring, and migration logic.

**Fix:** Extract domain registration functions to separate files under `src/plugin/` (e.g., `delegation-registration.ts`, `session-registration.ts`).

### WR-04: Unsafe Merge Logic May Mask Valid Zero Values

**File:** `src/tools/delegation/delegation-status.ts:398-401`
**Issue:** The merge logic uses logical OR (`||`) for numeric fields like `messageCount`, `toolCallCount`, and `actionCount`. This masks valid zero values: if `existing.messageCount` is 0 (falsy), it gets replaced by `record.messageCount`. Zero is a valid count for delegations that haven't started processing.

**Fix:**
```typescript
messageCount: existing.messageCount ?? record.messageCount,
toolCallCount: existing.toolCallCount ?? record.toolCallCount,
actionCount: existing.actionCount ?? record.actionCount,
```

### WR-05: Unsafe Type Assertion Without Runtime Validation

**File:** `src/tools/delegation/delegation-status.ts:145`
**Issue:** The line `status: childRecord.status as DelegationStatus` performs an unsafe type assertion. If `childRecord.status` contains a string not in the `DelegationStatus` union, this creates a runtime type violation that could cause downstream errors.

**Fix:** Add runtime validation:
```typescript
status: validateDelegationStatus(childRecord.status),
```

### WR-06: Module-Level Cache May Leak Across Tool Invocations

**File:** `src/tools/delegation/delegation-status.ts:18-20`
**Issue:** The `manifestCache` is a module-level Map that persists across tool invocations. While the 5-second TTL and 10-entry limit prevent unbounded growth, the cache is never explicitly cleared between tool executions. This could cause stale data issues if the same tool is called rapidly with different project roots.

**Fix:** Consider clearing the cache at the start of each tool execution or using a WeakMap with appropriate keying.

### WR-07: Potential Command Injection via Session Title

**File:** `src/features/governance-engine/create-governance-session.ts:121`
**Issue:** The session title is generated from user input (`args.title || args.brief`) with character replacement. While the current sanitization removes non-alphanumeric characters, it doesn't prevent shell injection if the title is used in shell commands. The git commit command uses the title in the commit message (line 144), which could contain shell metacharacters.

**Fix:** Ensure the title is properly escaped or use a whitelist of allowed characters. Consider using `--` to terminate git options before the message.

## Info

### IN-01: Synchronous File System Operations in Async Context

**File:** `src/tools/config/bootstrap-init.ts:185-218`
**Issue:** The `resolveBootstrapScope` function uses synchronous `mkdirSync` and `accessSync` (lines 201-202) within an otherwise async flow. While acceptable for initialization, this blocks the event loop during global config directory checks.

**Fix:** Replace with async equivalents:
```typescript
await mkdir(globalRoot, { recursive: true })
await fs.access(globalRoot, constants.W_OK)
```

### IN-02: Missing Error Context in Swallowed Exceptions

**File:** `src/features/governance-engine/create-governance-session.ts:126-147`
**Issue:** The git commit try-catch (line 126) swallows all errors without logging. While intentional for best-effort behavior, this makes debugging difficult when git operations fail unexpectedly.

**Fix:** Add debug-level logging:
```typescript
} catch (err) {
  void client.app?.log?.({
    body: { service: "governance", level: "debug", message: `[Harness] Git commit failed: ${err instanceof Error ? err.message : String(err)}` }
  })
}
```

---

Reviewed: 2026-05-28T10:00:00Z
Reviewer: the agent (gsd-code-reviewer)
Depth: deep