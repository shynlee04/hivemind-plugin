# Phase 23.2 Surgical Remediation Plan

**Date:** 2026-05-24
**Status:** READY FOR EXECUTION
**Source:** `23.2-DEBUG-2026-05-24.md` (4 confirmed root causes)
**Scope:** Fix 4 bugs that failed live UAT — no redesign, no architecture changes
**Target Files:** 7 files in `src/features/session-tracker/`

---

## Goal

Fix 4 confirmed root causes from the debug report so that live UAT passes for all 5 original SPEC requirements (REQ-23.2-01 through REQ-23.2-05).

## Summary of Bugs

| Bug | Symptom | Root Cause | SPEC Req |
|-----|---------|------------|----------|
| **D** | `actor: "unknown"`, `model: ""` in child turns | Registry race: `remove()` fires on PostToolUse before child creation; hook payload lacks delegation metadata | REQ-23.2-03, REQ-23.2-05 |
| **A** | Root `.md` `children: []` — never populated | No code path updates root `.md` frontmatter `children` after init | REQ-23.2-04 |
| **C** | Manifest `turnCount: 0` for all children | `addChild()` and `generateFromContinuity()` hardcode `turnCount: 0`; no update method | REQ-23.2-04 |
| **B** | Compaction shows "summary unavailable" | `resolveCompactionFromMessages` fails for child sessions; no fallback to child `.json` | REQ-23.2-02 |

---

## Plans

### Plan 1: Fix Bug D — Registry Race Condition + Actor Attribution (HIGH)

**SPEC Requirements:** REQ-23.2-03, REQ-23.2-05
**Depends on:** None (first plan)
**Wave:** 1

**Files to modify:**
- `src/features/session-tracker/persistence/pending-dispatch-registry.ts` — `remove()` at line 218
- `src/features/session-tracker/child-recorder.ts` — lines 105, 120
- `src/features/session-tracker/capture/event-capture.ts` — `writeImmediateChildFile` at line 457

**What:**

#### Fix D-1: Stop premature registry removal

The `remove()` method at `pending-dispatch-registry.ts:218` is called on PostToolUse. But child session creation (`session.created`) fires AFTER PostToolUse, so by the time `writeImmediateChildFile` calls `find()`, the entry is already deleted.

**Fix:** Do NOT call `remove()` on PostToolUse. Instead, rely on the existing `cleanupStale()` TTL mechanism (already implemented at line 239, using `STALE_THRESHOLD_MS = 30_000`). The entry will naturally expire after 30 seconds.

Specific change:
- In `pending-dispatch-registry.ts:218` — Add a `reason` parameter to `remove()`. When `reason === "postToolUse"`, do NOT delete the entry — just update its `timestamp` to extend TTL by 30s. Only actually delete when `reason === "completed"` or during `cleanupStale()`.
- Alternative simpler fix: Add `keepForChildSession(sessionID: string)` method that marks an entry as "do not remove until TTL expires". Called from `writeImmediateChildFile` after a successful lookup.

#### Fix D-2: Propagate agent/model to child-recorder

The `child-recorder.ts:105` uses `input.agent` from the hook payload, which does NOT carry delegation metadata. The `child-recorder.ts:120` uses `input.model` which is often undefined.

**Fix:** When `writeImmediateChildFile` succeeds in looking up the pending entry (or using the explicit params), store the delegation context (agentName, model) into a new in-memory map keyed by child session ID. `ChildRecorder` reads from this map on each message.

Specific changes:
- In `event-capture.ts` — After `writeImmediateChildFile` creates the child file, call a new method `childWriter.setChildDelegationContext(sessionID, { agentName, model })`.
- In `child-writer.ts` — Add `private childContext: Map<string, { agentName: string; model: string }>` and `setChildDelegationContext()` / `getChildDelegationContext()` methods.
- In `child-recorder.ts:105` — Change `actor: input.agent || "unknown"` to `actor: this.childWriter.getChildDelegationContext(sessionID)?.agentName || input.agent || "unknown"`.
- In `child-recorder.ts:120` — Change model similarly: `model: this.childWriter.getChildDelegationContext(sessionID)?.model || (typeof input.model === "string" ? input.model : input.model?.modelID)`.

**Verification:**
```bash
npm run typecheck  # Must pass
npm test           # All tests pass + new test for registry TTL
```

**Live UAT check:**
1. Dispatch child via `delegate-task`
2. Inspect child `.json` — turns must show correct `actor` (agent name) and `model`
3. Dispatch child via `task` — same verification, no regression

**Test:**
- Unit test: registry entry survives PostToolUse removal attempt
- Unit test: `setChildDelegationContext` / `getChildDelegationContext` round-trip
- Integration test: child `.json` turns show propagated agent name and model

---

### Plan 2: Fix Bug A — Root `.md` Children Array (HIGH)

**SPEC Requirements:** REQ-23.2-04
**Depends on:** None (independent of Plan 1)
**Wave:** 1 (parallel with Plan 1)

**Files to modify:**
- `src/features/session-tracker/capture/event-capture.ts` — `writeImmediateChildFile` after line 489
- `src/features/session-tracker/persistence/session-writer.ts` — `updateFrontmatter` at line 213

**What:**

#### Fix A-1: Add `children` update to root `.md` after child creation

The `writeImmediateChildFile` method (event-capture.ts:442-536) creates a child `.json` file and updates `hierarchy-manifest.json`, but NEVER updates the root `.md` frontmatter `children` array.

**Fix:** After the child `.json` is successfully created (after line 489), call `updateFrontmatter` on the ROOT session (parentID) to push a new `ChildRef` into the `children` array.

Specific changes:
- In `event-capture.ts` — After the `manifestWriter.addChild()` call at line 522, add:
  ```typescript
  // Bug A fix: Update root .md frontmatter children array
  const childRef: ChildRef = {
    sessionID,
    status: "active",
    depth: delegationDepth,
    file: `${sessionID}.json`,
  }
  // sessionWriter operates on root .md files
  await this.sessionWriter.addChildRef(parentID, childRef)
  ```
- In `session-writer.ts` — Add new method `addChildRef(sessionID: string, childRef: ChildRef)`:
  ```typescript
  async addChildRef(sessionID: string, childRef: ChildRef): Promise<void> {
    const filePath = this.getSessionFilePath(sessionID)
    const raw = await readFile(filePath, "utf-8")
    const parsed = matter(raw)
    const existing: ChildRef[] = parsed.data.children ?? []
    // Avoid duplicates
    if (!existing.some(c => c.sessionID === childRef.sessionID)) {
      existing.push(childRef)
    }
    await this.updateFrontmatter(sessionID, { children: existing })
  }
  ```
- In `types.ts` — Verify `ChildRef` type exists with `sessionID`, `status`, `depth`, `file` fields (already defined at line 63: `children: ChildRef[]`).

**Verification:**
```bash
npm run typecheck  # Must pass
npm test           # All tests pass
```

**Live UAT check:**
1. Dispatch child via `delegate-task`
2. Read root `.md` file — `children` array must contain entry for the child
3. Dispatch another child — array must have 2 entries

**Test:**
- Unit test: `addChildRef` correctly appends to existing `children` array
- Unit test: `addChildRef` does not duplicate entries
- Integration test: child creation → root `.md` children populated

---

### Plan 3: Fix Bug C — Manifest turnCount (MEDIUM)

**SPEC Requirements:** REQ-23.2-04
**Depends on:** None (independent)
**Wave:** 1 (parallel with Plan 1 and Plan 2)

**Files to modify:**
- `src/features/session-tracker/persistence/hierarchy-manifest.ts` — `addChild()` at line 84, add `updateTurnCount()` method
- `src/features/session-tracker/persistence/child-writer.ts` — after `appendChildTurn`

**What:**

#### Fix C-1: Add `updateTurnCount` method to HierarchyManifest

The `addChild()` at `hierarchy-manifest.ts:84` hardcodes `turnCount: 0`. `generateFromContinuity()` at line 204 also hardcodes `turnCount: 0`. No update method exists.

**Fix:**

1. Add `updateTurnCount(rootMainSessionID, childSessionID, count)` method to `HierarchyManifest`:
   ```typescript
   async updateTurnCount(
     rootMainSessionID: string,
     childSessionID: string,
     turnCount: number,
   ): Promise<void> {
     const manifest = await this.loadManifest(rootMainSessionID)
     const entry = manifest.children[childSessionID]
     if (entry) {
       entry.turnCount = turnCount
       entry.updatedAt = new Date().toISOString()
       manifest.lastUpdated = new Date().toISOString()
       await this.writeManifest(rootMainSessionID, manifest)
     }
     // Silently no-op if child not in manifest (may belong to different root)
   }
   ```

2. Call it from `child-writer.ts` — After each `appendChildTurn` increments the turns array, call `manifestWriter.updateTurnCount(rootMain, childID, newTurnCount)`.

3. Fix `generateFromContinuity()` at line 204 — Instead of hardcoding `turnCount: 0`, read the actual child `.json` file and count turns. Or mark it as "pending reconciliation" and defer to a `reconcileTurnCounts()` method that reads all child files.

**Verification:**
```bash
npm run typecheck  # Must pass
npm test           # All tests pass
```

**Live UAT check:**
1. Dispatch child, let it complete 4+ turns
2. Read `hierarchy-manifest.json` — child entry `turnCount` must match actual turns in child `.json`
3. Child with 12 turns must show `turnCount: 12`, not `turnCount: 0`

**Test:**
- Unit test: `updateTurnCount` correctly updates manifest entry
- Unit test: `updateTurnCount` no-ops for missing child
- Integration test: turn appended → manifest turnCount incremented

---

### Plan 4: Fix Bug B — Compaction Summary for Children (MEDIUM)

**SPEC Requirements:** REQ-23.2-02
**Depends on:** Plan 1 (needs correct child `.json` content with proper actor attribution)
**Wave:** 2

**Files to modify:**
- `src/features/session-tracker/capture/event-capture.ts` — `resolveCompactionFromMessages` at line 764

**What:**

#### Fix B-1: Add child `.json` fallback for compaction summary

The `resolveCompactionFromMessages` at `event-capture.ts:764` tries `getSessionMessages(client, sessionID)` which fails for child sessions because the SDK's message API operates on the parent session context. The catch block at line 789 silently swallows errors, and the function falls through to the hardcoded fallback at line 792.

**Fix:** After the `getSessionMessages` try/catch fails, add a fallback that reads the child `.json` file directly and extracts the last assistant turn content.

Specific changes in `resolveCompactionFromMessages`:
```typescript
private async resolveCompactionFromMessages(sessionID: string): Promise<string> {
  // Attempt 1: SDK message history (works for root sessions)
  try {
    const messages = await getSessionMessages(this.client, sessionID)
    if (messages && messages.length > 0) {
      // ... existing logic to extract last assistant message ...
    }
  } catch {
    // SDK failed — likely a child session, try fallback
  }

  // Attempt 2 (NEW): Read child .json file and extract last assistant turn
  try {
    const childData = await this.childWriter?.readChildData(sessionID)
    if (childData?.turns && childData.turns.length > 0) {
      // Find last assistant turn
      for (let i = childData.turns.length - 1; i >= 0; i--) {
        const turn = childData.turns[i]
        if (turn.role === "assistant" || turn.actor !== "user") {
          const text = typeof turn.content === "string"
            ? turn.content
            : JSON.stringify(turn.content)
          if (text && text.trim().length > 0) {
            return `**compact_summary:**\n\n${text}\n`
          }
        }
      }
    }
  } catch {
    // Child file read also failed — fall through to default
  }

  return "**Compaction occurred — summary unavailable.**\n"
}
```

Also add `readChildData(sessionID)` method to `child-writer.ts`:
```typescript
async readChildData(sessionID: string): Promise<ChildSessionData | null> {
  try {
    const dir = this.resolveWriteDir(sessionID)
    const filePath = join(dir, `${sessionID}.json`)
    const raw = await readFile(filePath, "utf-8")
    return JSON.parse(raw) as ChildSessionData
  } catch {
    return null
  }
}
```

**Verification:**
```bash
npm run typecheck  # Must pass
npm test           # All tests pass
```

**Live UAT check:**
1. Start session, trigger compaction on child
2. Read child `.json` journey — compaction entry must show actual summary text, NOT "summary unavailable"
3. Root session compaction must still work (no regression)

**Test:**
- Unit test: `readChildData` reads child `.json` and returns turns
- Unit test: `resolveCompactionFromMessages` falls back to child file when SDK fails
- Integration test: compaction on child → journey entry with real summary

---

## Execution Order

```
Wave 1 (parallel):
  ├── Plan 1: Fix Bug D — Registry Race + Actor Attribution
  ├── Plan 2: Fix Bug A — Root .md Children Array
  └── Plan 3: Fix Bug C — Manifest turnCount

Wave 2 (depends on Plan 1):
  └── Plan 4: Fix Bug B — Compaction Summary for Children
```

### Dependency Graph

```
Plan 1 (Bug D) ──────────────┐
Plan 2 (Bug A) ──────────────┤──→ Plan 4 (Bug B)
Plan 3 (Bug C) ──────────────┘
```

Plans 1, 2, 3 have NO file overlaps:
- Plan 1: `pending-dispatch-registry.ts`, `child-recorder.ts`, `event-capture.ts`, `child-writer.ts`
- Plan 2: `event-capture.ts` (different lines than Plan 1), `session-writer.ts`, `types.ts`
- Plan 3: `hierarchy-manifest.ts`, `child-writer.ts` (different methods than Plan 1)

**Wait — Plans 1 and 2 both touch `event-capture.ts`.** Plan 1 modifies lines ~457 (writeImmediateChildFile context propagation). Plan 2 adds code after line 522 (after manifestWriter.addChild call). These are different sections, so they can be applied sequentially in the same file without conflicts. Plan 1 should be applied first since Plan 4 depends on it.

**Plans 1 and 3 both touch `child-writer.ts`.** Plan 1 adds `setChildDelegationContext`/`getChildDelegationContext`. Plan 3 adds a call to `manifestWriter.updateTurnCount` after `appendChildTurn`. Different methods, no overlap.

**Resolution:** Apply sequentially in order Plan 1 → Plan 2 → Plan 3 → Plan 4. Same-wave plans are logically parallel but must be applied to separate code regions.

---

## Verification Gate

After all 4 plans complete:

### Automated Checks
```bash
npm run typecheck    # Must pass with 0 errors
npm test             # All existing tests must pass (454+ tests)
```

### Live UAT Test (matches original SPEC)
1. Start a root session
2. Dispatch child via `task` tool
3. Dispatch child via `delegate-task` tool
4. Let both children complete with 3-5 turns each
5. Trigger compaction on one child

### SPEC Requirement Verification

| REQ | Check | Expected |
|-----|-------|----------|
| REQ-23.2-01 | Root `.md` assistant text | Assistant text appears for every turn |
| REQ-23.2-02 | Compaction summary | Child journey shows real summary, not "unavailable" |
| REQ-23.2-03 | Tool attribution | Child metadata shows `delegatedBy.tool: "delegate-task"` (not `"task"`) |
| REQ-23.2-04 | Hierarchy manifest + root children | Both `hierarchy-manifest.json` and root `.md` `children` populated; `turnCount` matches actual turns |
| REQ-23.2-05 | Actor attribution | Child turns show actual agent name and model, not `"unknown"` / `""` |

### Files to Inspect Post-UAT
- `.hivemind/session-tracker/{rootSessionID}/` — root `.md`, `hierarchy-manifest.json`
- `.hivemind/session-tracker/{rootSessionID}/{childID}.json` — child turns, actor, model, journey

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Registry TTL change breaks existing delegation tracking | Low | Existing `STALE_THRESHOLD_MS = 30_000` already handles stale cleanup; just stop premature removal |
| `updateFrontmatter` race on root `.md` | Medium | `session-writer.ts` already uses atomic tmp+rename pattern (line 226-230) |
| `readChildData` reads stale data | Low | Compaction event fires after turns are written; serial queue in child-writer guarantees ordering |
| Turn count reconciliation on crash | Low | Turn count updates are best-effort; manifest can be rebuilt from child `.json` files |

---

## Out of Scope

- Architecture redesign of pending-dispatch-registry keying
- OpenCode SDK hook payload changes
- Adding `children` to root `.md` for sessions created before this fix (historical data)
- Phase 24-38 work
- PTY/background-command integration
