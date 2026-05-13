---
phase: CP-ST-02-session-tracker-deep-fix-remaining
plan: 03
type: execute
wave: 3
depends_on:
  - CP-ST-02-01
  - CP-ST-02-02
files_modified:
  - src/features/session-tracker/capture/tool-capture.ts
  - src/features/session-tracker/index.ts
autonomous: true
requirements:
  - AC-01
  - AC-03
  - AC-06
  - AC-08
  - AC-09
must_haves:
  truths:
    - "Child session records have delegatedBy.agentName = actual subagent_type from task tool args"
    - "handleTask reads subagentType from PendingDispatchRegistry when available"
    - "Orphan child directories in .hivemind/session-tracker/ are cleaned up on init"
    - "project-continuity.json contains all known sessions (main + children)"
    - "Existing test suite passes with correct agentName values"
    - "Recovery script ensures completeness of project index"
  artifacts:
    - path: "src/features/session-tracker/capture/tool-capture.ts"
      provides: "Delegator attribution from pending registry"
      contains: "pendingRegistry?.getSubagentType"
      contains: "subagentType"
    - path: "src/features/session-tracker/index.ts"
      provides: "Orphan directory cleanup + project-continuity completeness check"
      contains: "cleanupOrphanDirectories"
      contains: "ensureProjectContinuityCompleteness"
  key_links:
    - from: "tool-capture.handleTask subagentType capture"
      to: "pendingRegistry.getSubagentType(childSessionID)"
      via: "delegator attribution flow"
      pattern: "pendingRegistry\\?.getSubagentType"
    - from: "delegatedBy.agentName in child record"
      to: "task tool args.subagent_type"
      via: "PendingDispatchRegistry entry"
      pattern: "\"agentName\":\\s*subagentType"
    - from: "cleanup"
      to: ".hivemind/session-tracker/"
      via: "directory removal"
      pattern: "cleanupOrphanDirectories"
</must_haves>
---

<objective>
Implement correct delegator attribution by flowing `subagent_type` from PendingDispatchRegistry into child session records, replacing the hardcoded `"unknown"`. Clean up existing orphan directories from the live `.hivemind/session-tracker/` bug. Ensure `project-continuity.json` completeness. Verify that all tests still pass and PostToolUse flow continues to work.

Purpose: Close the final gap in CP-ST-02 — correct delegation lineage tracking, cleanup of legacy orphan state, and project index completeness.

Output:
- Modified: `src/features/session-tracker/capture/tool-capture.ts` — delegator attribution from pending registry
- Modified: `src/features/session-tracker/index.ts` — orphan directory cleanup + project-continuity completeness
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/CP-ST-02-session-tracker-deep-fix-remaining/CP-ST-02-SPEC.md
@.planning/phases/CP-ST-02-session-tracker-deep-fix-remaining/CP-ST-02-CONTEXT.md
@.planning/phases/CP-ST-02-session-tracker-deep-fix-remaining/CP-ST-02-RESEARCH.md
@.planning/codebase/ARCHITECTURE.md

<interfaces>
<!-- Key types and patterns the executor needs -->

From src/features/session-tracker/capture/tool-capture.ts (handleTask — current state):
```typescript
// Line 251-271: ChildMetadata with hardcoded "unknown" agentName
const childMetadata: ChildSessionRecord = {
  sessionID: childSessionID,
  parentSessionID: input.sessionID,
  delegationDepth: depth,
  delegatedBy: {
    agentName: "unknown",  // ← HARDCODED — needs fix
    model: "unknown",
    tool: "task",
    description,
    subagentType,
  },
  // ...
}
```

From src/features/session-tracker/persistence/pending-dispatch-registry.ts (created in Plan 01):
```typescript
export class PendingDispatchRegistry {
  getSubagentType(sessionID: string): string | undefined  // plan to add this method
  has(sessionID: string): boolean
}
```

From src/features/session-tracker/index.ts (SessionTracker public fields):
```typescript
// Line 88-91:
private hierarchyIndex!: HierarchyIndex
private pendingRegistry!: PendingDispatchRegistry  // added in Plan 01
private bootstrappedSessions: Set<string>
```

From SPEC §4 (Delegator Attribution):
```
§4.1 Capture Point: tool.execute.before output args.subagent_type
§4.2 Flow: PreToolUse args.subagent_type = "gsd-planner"
  → stored in PendingDispatchRegistry entry
PostToolUse: output.metadata.sessionId = "ses_child123"
  → create child record with delegatedBy.agentName = "gsd-planner"
§4.3 Fallback: WHEN subagent_type is empty → store "unknown"
```

From SPEC §5 AC-06 (Delegator Attribution Correct):
```
GIVEN hm-l1-coordinator dispatches task tool with subagent_type: "hm-l2-researcher"
WHEN child session record created
THEN delegatedBy.agentName = "hm-l2-researcher"
```

From CONTEXT §D-06 (Existing State Cleanup):
```
Remove orphan child directories from .hivemind/session-tracker/
Run recovery script to ensure project-continuity.json completeness
Preserve existing child .json files under parent directories
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Wire delegator attribution from PendingDispatchRegistry into ToolCapture.handleTask</name>
  <files>src/features/session-tracker/capture/tool-capture.ts</files>

  <read_first>
Read before implementing:
- `src/features/session-tracker/capture/tool-capture.ts` (full file — especially `handleTask()` lines 223-330, constructor lines 71-85)
- SPEC §4 (Delegator Attribution: capture point, flow, fallback)
- SPEC §5 AC-06 (Delegator Attribution Correct acceptance criterion)
- `src/features/session-tracker/persistence/pending-dispatch-registry.ts` (the `getSubagentType()` method from Plan 01)
- CONTEXT §D-04 (Delegator Attribution decision)
  </read_first>

  <behavior>
  - Test 1: handleTask creates child record with delegatedBy.agentName from PendingDispatchRegistry when entry exists
  - Test 2: handleTask falls back to args.subagent_type when PendingDispatchRegistry has no entry
  - Test 3: handleTask falls back to "unknown" when both registry AND args are empty/undefined
  - Test 4: Child record delegatedBy.agentName matches the subagent_type captured at PreToolUse time
  - Test 5: delegatedBy.model remains "unknown" (model info not available in PreToolUse args)
  - Test 6: delegatedBy.tool remains "task" (unchanged)
  - Test 7: delegatedBy.subagentType field preserved in child record
  </behavior>

  <action>

Modify `src/features/session-tracker/capture/tool-capture.ts` to use PendingDispatchRegistry for delegator attribution.

**Step 1: Add import**

After the existing import line `import type { HierarchyIndex } from "../persistence/hierarchy-index.js"` (line 21), add:
```typescript
import type { PendingDispatchRegistry } from "../persistence/pending-dispatch-registry.js"
```

**Step 2: Add pendingRegistry field**

After `private hierarchyIndex: HierarchyIndex` (line 61), add:
```typescript
  private pendingRegistry: PendingDispatchRegistry | undefined
```

**Step 3: Update constructor to accept pendingRegistry**

In the constructor deps type (after `hierarchyIndex: HierarchyIndex`, around line 78), add:
```typescript
    pendingRegistry?: PendingDispatchRegistry
```

In the constructor body (after `this.hierarchyIndex = deps.hierarchyIndex`, around line 84), add:
```typescript
    this.pendingRegistry = deps.pendingRegistry
```

**Step 4: Resolve agentName in handleTask()**

In the `handleTask()` method (line 223), change the agentName resolution. Currently at line 256:
```typescript
        delegatedBy: {
          agentName: "unknown",
```

Change the resolution logic BEFORE creating `childMetadata`. After line 248 (`await this.sessionIndexWriter.updateToolSummary(...)`), add:

```typescript
      // Resolve delegator agentName — priority order per D-04:
      // 1. PendingDispatchRegistry (captured at PreToolUse time, most accurate)
      // 2. args.subagent_type from tool.execute.after (fallback)
      // 3. "unknown" (no attribution available)
      let delegatorAgentName = "unknown"
      if (this.pendingRegistry) {
        const pendingEntry = this.pendingRegistry.get(childSessionID)
        if (pendingEntry) {
          delegatorAgentName = pendingEntry.subagentType || "unknown"
        }
      }
      // Fallback: use args.subagent_type if registry didn't have it
      if (delegatorAgentName === "unknown" && subagentType) {
        delegatorAgentName = subagentType
      }
```

Then update the `childMetadata` delegationBy block (lines 256-261):
```typescript
        delegatedBy: {
          agentName: delegatorAgentName,
          model: "unknown",
          tool: "task",
          description,
          subagentType,
        },
```

The complete updated block reads:
```typescript
      // Resolve delegator agentName — priority order per D-04:
      // 1. PendingDispatchRegistry (captured at PreToolUse time, most accurate)
      // 2. args.subagent_type from tool.execute.after (fallback)
      // 3. "unknown" (no attribution available)
      let delegatorAgentName = "unknown"
      if (this.pendingRegistry) {
        const pendingEntry = this.pendingRegistry.get(childSessionID)
        if (pendingEntry) {
          delegatorAgentName = pendingEntry.subagentType || "unknown"
        }
      }
      // Fallback: use args.subagent_type if registry didn't have it
      if (delegatorAgentName === "unknown" && subagentType) {
        delegatorAgentName = subagentType
      }

      // Create child session record
      const childMetadata: ChildSessionRecord = {
        sessionID: childSessionID,
        parentSessionID: input.sessionID,
        delegationDepth: depth,
        delegatedBy: {
          agentName: delegatorAgentName,
          model: "unknown",
          tool: "task",
          description,
          subagentType,
        },
        created: now,
        updated: now,
        status: "active",
        mainAgent: {
          name: subagentType || "unknown",
          model: "unknown",
        },
        turns: [],
        children: [],
      }
```

**Step 5: Clean up pending registry entry**

After the child `.json` file is created and all indices are updated (after line 311 `this.projectIndexWriter.addSession(...)`), add cleanup:
```typescript
      // Clean up pending dispatch registry entry (AC-05: entry removed at PostToolUse)
      if (this.pendingRegistry) {
        this.pendingRegistry.remove(childSessionID)
      }
```

This ensures that even if the `tool.execute.before` → `updateWithChildID()` path didn't fire (due to polling failure), the PostToolUse `handleTask()` path cleans up any remaining pending entry for this child session.

  </action>

  <verify>
    <automated>npx vitest run tests/features/session-tracker/tool-capture.test.ts -t "agentName" --reporter=verbose</automated>
  </verify>

  <acceptance_criteria>
- [ ] `ToolCapture` has `private pendingRegistry: PendingDispatchRegistry | undefined` field
- [ ] `ToolCapture` constructor accepts and assigns `pendingRegistry` from deps
- [ ] `handleTask()` resolves `delegatorAgentName` from PendingDispatchRegistry first
- [ ] `handleTask()` falls back to `args.subagent_type` when registry has no entry
- [ ] `handleTask()` falls back to `"unknown"` only when both sources are empty
- [ ] `delegatedBy.agentName` in child record is the resolved value (not hardcoded)
- [ ] `delegatedBy.subagentType` field still contains the raw subagent_type value
- [ ] Pending registry entry is cleaned up after child record creation (`this.pendingRegistry.remove(childSessionID)`)
- [ ] grep: `grep -n "delegatorAgentName" src/features/session-tracker/capture/tool-capture.ts` shows the resolution
- [ ] grep: `grep -n "pendingRegistry" src/features/session-tracker/capture/tool-capture.ts` shows proper usage
- [ ] TypeScript compiles: `npx tsc --noEmit` passing
  </acceptance_criteria>

  <done>ToolCapture.handleTask now resolves delegator agentName from PendingDispatchRegistry (captured at PreToolUse time), falling back to subagent_type from args, and finally to "unknown". Pending entry cleaned up after child record creation.</done>
</task>

<task type="auto">
  <name>Task 2: Add orphan directory cleanup and project-continuity completeness to SessionTracker</name>
  <files>src/features/session-tracker/index.ts</files>

  <read_first>
Read before implementing:
- `src/features/session-tracker/index.ts` (full file — especially `initialize()` lines 516-607, `cleanup()` lines 618-632, `cleanupOrphanedTmpFiles()` lines 642-663)
- CONTEXT §D-06 (Existing State Cleanup decision)
- SPEC §5 AC-01 (No Orphan Directories), AC-08 (project-continuity.json Completeness)
  </read_first>

  <action>

Add orphan directory cleanup and project-continuity completeness logic to `SessionTracker` in `src/features/session-tracker/index.ts`.

**Step 1: Add orphan directory cleanup method**

After the existing `cleanupOrphanedTmpFiles()` private method (after line 663, before `removeLegacyStateFiles()`), add:

```typescript
  /**
   * Removes orphan child session directories from `.hivemind/session-tracker/`.
   *
   * An orphan is a directory that contains session files but whose session ID
   * is registered as an L1/L2 child in another directory's session-continuity.json.
   * These directories were created by the race condition CP-ST-02 fixes.
   *
   * Only removes directories for sessions classified as children under a parent's
   * hierarchy index. Preserves child .json files that already exist under the parent.
   *
   * Best-effort: individual failures are silently skipped.
   */
  private async cleanupOrphanDirectories(): Promise<void> {
    const { readdir, rm } = await import("node:fs/promises")
    const { resolve } = await import("node:path")
    const trackerRoot = sessionTrackerRoot(this.projectRoot)

    let entries: { name: string; isDirectory(): boolean }[]
    try {
      entries = (await readdir(trackerRoot, { withFileTypes: true })) as unknown as {
        name: string
        isDirectory(): boolean
      }[]
    } catch {
      // Root directory doesn't exist yet — nothing to clean
      return
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const sessionID = entry.name

      // Skip non-session directories (e.g., .gitkeep-created dirs)
      if (!isValidSessionID(sessionID)) continue

      // Check if this session is a CHILD of any known parent.
      // If the hierarchy index classifies it as a child, the directory
      // is an orphan — the child should only exist as a .json file.
      if (this.hierarchyIndex?.isChild(sessionID)) {
        const dirPath = resolve(trackerRoot, sessionID)
        try {
          await rm(dirPath, { recursive: true, force: true })
          void this.client.app?.log?.({
            body: {
              service: "session-tracker",
              level: "info",
              message: `[Harness] Session tracker: removed orphan child directory "${sessionID}"`,
            },
          })
        } catch {
          // Best-effort: skip directories that can't be removed (permissions, etc.)
        }
      }
    }
  }
```

**Step 2: Add project-continuity completeness check**

After the `cleanupOrphanDirectories()` method, add:

```typescript
  /**
   * Ensures project-continuity.json contains ALL known sessions.
   *
   * Walks the session-tracker directory tree and checks that every session
   * (main .md files AND child .json files) is registered in the project index.
   * Missing entries are added. This fixes CP-ST-02's AC-08 requirement.
   *
   * Best-effort: individual failures are silently skipped.
   */
  private async ensureProjectContinuityCompleteness(): Promise<void> {
    if (!this.projectIndexWriter) return

    const { readdir } = await import("node:fs/promises")
    const { resolve } = await import("node:path")
    const trackerRoot = sessionTrackerRoot(this.projectRoot)

    let entries: { name: string; isDirectory(): boolean; isFile(): boolean }[]
    try {
      entries = (await readdir(trackerRoot, { withFileTypes: true })) as unknown as {
        name: string
        isDirectory(): boolean
        isFile(): boolean
      }[]
    } catch {
      return
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const parentID = entry.name
      if (!isValidSessionID(parentID)) continue

      const parentDir = resolve(trackerRoot, parentID)

      // Register the main session if not already in the index
      try {
        await this.projectIndexWriter.addSession(
          parentID,
          `${parentID}/`,
          `${parentID}.md`,
        )
      } catch {
        // Already registered or can't register — skip
      }

      // Scan for child .json files under this directory
      let childEntries: { name: string; isFile(): boolean }[]
      try {
        childEntries = (await readdir(parentDir, { withFileTypes: true })) as unknown as {
          name: string
          isFile(): boolean
        }[]
      } catch {
        continue
      }

      for (const child of childEntries) {
        if (!child.isFile()) continue
        if (!child.name.endsWith(".json")) continue
        // Skip session-continuity.json (internal index file, not a child session)
        if (child.name === "session-continuity.json") continue

        // Extract child session ID from filename (e.g., "ses_abc123.json" → "ses_abc123")
        const childID = child.name.slice(0, -5) // remove ".json" suffix
        if (!isValidSessionID(childID)) continue

        // Register child session in project index
        try {
          await this.projectIndexWriter.addSession(
            childID,
            `${parentID}/`,
            `${childID}.json`,
          )
        } catch {
          // Already registered or can't register — skip
        }
      }
    }
  }
```

**Step 3: Call cleanup methods in initialize()**

In the `initialize()` method, after the existing `cleanupOrphanedTmpFiles()` call (line 588), add:

```typescript
      // Clean up orphan child session directories (CP-ST-02, D-06).
      // This fixes the live bug where L1 child sessions have their own
      // directories instead of existing only as .json files under the parent.
      await this.cleanupOrphanDirectories()

      // Ensure project-continuity.json contains ALL sessions (main + children).
      // Fills any gaps from before CP-ST-02 fix (AC-08).
      await this.ensureProjectContinuityCompleteness()
```

Place this after `await this.cleanupOrphanedTmpFiles()` and before the toast notification.

  </action>

  <verify>
    <automated>npm run typecheck && npx vitest run tests/features/session-tracker/ --reporter=verbose 2>&1 | tail -30</automated>
  </verify>

  <acceptance_criteria>
- [ ] `SessionTracker.cleanupOrphanDirectories()` private method exists
- [ ] Method reads `.hivemind/session-tracker/` directories, checks `hierarchyIndex.isChild()`
- [ ] Child session directories are removed with `rm(dirPath, { recursive: true, force: true })`
- [ ] `SessionTracker.ensureProjectContinuityCompleteness()` private method exists
- [ ] Method scans all main session directories for child .json files
- [ ] Missing entries in project-continuity.json are added via `projectIndexWriter.addSession()`
- [ ] Both methods called in `initialize()` after `cleanupOrphanedTmpFiles()`
- [ ] Best-effort: individual failures logged, never thrown
- [ ] grep: `grep -n "cleanupOrphanDirectories" src/features/session-tracker/index.ts` shows the method
- [ ] grep: `grep -n "ensureProjectContinuityCompleteness" src/features/session-tracker/index.ts` shows the method
- [ ] `npm run typecheck` passes
- [ ] All existing tests (≥256) continue to pass
  </acceptance_criteria>

  <done>SessionTracker now cleans up orphan child directories on init and ensures project-continuity.json completeness. All sessions (main + children) are registered in the index.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| SessionTracker → `.hivemind/session-tracker/` | Directory removal for orphan cleanup crosses filesystem boundary |
| PendingDispatchRegistry → child record | Agent name flow from in-memory to durable JSON |
| Plugin init → Recovery | Scans existing disk state; must not delete valid files |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-09 | Tampering | cleanupOrphanDirectories | mitigate | Only removes directories for sessions classified as children by HierarchyIndex; validates sessionID with `isValidSessionID()` before any filesystem operation |
| T-02-10 | Denial of Service | ensureProjectContinuityCompleteness | mitigate | Best-effort per entry; single file failure doesn't block others; no unbounded loops (directory scan bounded by filesystem entries) |
| T-02-11 | Spoofing | delegatorAgentName from registry | mitigate | Only uses registry entries created by internal `handleToolExecuteBefore()` method; entries auto-purge after 30s; fallback chain ensures resilience |
| T-02-12 | Information Disclosure | subagentType in child record | accept | Agent name is not sensitive; stored in child .json under `.hivemind/session-tracker/` with standard file permissions |
</threat_model>

<verification>
```bash
# Type check
npm run typecheck

# Full test suite
npx vitest run tests/features/session-tracker/

# Verify delegator attribution
grep -n "delegatorAgentName" src/features/session-tracker/capture/tool-capture.ts
grep -n '"agentName"' src/features/session-tracker/capture/tool-capture.ts

# Verify cleanup methods
grep -n "cleanupOrphanDirectories" src/features/session-tracker/index.ts
grep -n "ensureProjectContinuityCompleteness" src/features/session-tracker/index.ts

# Verify existing test count
npx vitest run tests/features/session-tracker/ --reporter=verbose 2>&1 | grep "Tests"
```
</verification>

<success_criteria>
1. `handleTask()` resolves `delegatedBy.agentName` from PendingDispatchRegistry → args.subagent_type → "unknown" fallback
2. Orphan child directories removed on plugin init
3. `project-continuity.json` completeness ensured on plugin init
4. All 256+ existing tests continue to pass
5. TypeScript compiles cleanly
6. PostToolUse flow continues to work (AC-09)
</success_criteria>

<output>
After completion, create `.planning/phases/CP-ST-02-session-tracker-deep-fix-remaining/CP-ST-02-03-SUMMARY.md`
</output>
