# Session Journal Output Audit

**Date:** 2026-03-31
**Scope:** Session journal system - hooks firing, file quality, time-machine readiness
**Git Commit:** (current worktree state)

---

## 1. File Analysis

### ses_2bca

| Metric | Value | Assessment |
|--------|-------|------------|
| File | `ses_2bca.md` | 22,827 lines — LARGE |
| File | `ses_2bca.json` | 25 lines — NEARLY EMPTY |
| Updated | 5:41:14 PM | Recent |
| turnCount (JSON) | 57 | Counter present |
| assistantOutputCount | 102 | Counter present |
| toolCallCount | 173 | Counter present |
| **toc** | **empty `[]`** | **BROKEN — never populated** |
| **parentSessionId** | **null** | **NOT LINKED** |
| **subsessionIds** | **empty `[]`** | **NOT LINKED** |

**Content quality (MD):** The markdown file DOES contain actual events — skill loads, tool calls, assistant outputs. It is NOT empty.

**Content quality (JSON):** The JSON only has metadata/counters. The `toc` array is never populated despite the markdown having thousands of lines of events.

---

### ses_2bcb

| Metric | Value | Assessment |
|--------|-------|------------|
| File | `ses_2bcb.md` | 434 lines |
| File | `ses_2bcb.json` | 25 lines — NEARLY EMPTY |
| Updated | 4:50:14 PM | Recent |
| turnCount (JSON) | 6 | Counter present |
| **toc** | **empty `[]`** | **BROKEN — never populated** |
| **parentSessionId** | **null** | **NOT LINKED** |

**Content quality (MD):** Contains actual session resumption content — reading previous artifacts, tool invocations.

**Content quality (JSON):** Same problem — metadata/counters present, but `toc` never populated.

---

### ses_2bb3 (Reference - Larger Session)

| Metric | Value | Assessment |
|--------|-------|------------|
| File | `ses_2bb3.md` | 21,601 lines |
| File | `ses_2bb3.json` | 25 lines |
| turnCount | 31 | Counter present |
| assistantOutputCount | 49 | Counter present |
| toolCallCount | 181 | Counter present |
| **toc** | **empty `[]`** | **BROKEN — never populated** |

**Pattern confirmed:** Across ALL sessions, the markdown is written but the JSON `toc` is NEVER populated.

---

## 2. Hook Firing Verification

### Which Hooks Fire

| Hook | Registered At | Handler Function | Calls Markdown Writer | Status |
|------|---------------|-----------------|----------------------|--------|
| `chat.message` | `opencode-plugin.ts:136` | `handleChatMessage` | YES (`appendTurnToMarkdown`) | ✅ FIRES |
| `tool.execute.after` | `opencode-plugin.ts:226` | `handleToolExecution` | YES (`appendTurnToMarkdown`) | ✅ FIRES |
| `experimental.text.complete` | `opencode-plugin.ts:232` | `createTextCompleteHandler` | YES (`appendTurnToMarkdown`) | ✅ FIRES |
| `experimental.session.compacting` | `opencode-plugin.ts:246` | `createCompactionJournalHandler` | YES (`appendTurnToMarkdown`) | ✅ FIRES |

**Evidence:** `src/hooks/chat-message-handler.ts:18` imports from `markdown-writer.js`. Same for all 4 handlers.

### What the Hooks Write

| Hook | JSON Writer Called | Markdown Writer Called |
|------|-------------------|----------------------|
| `chat.message` | `addTurn` (consolidated-writer) | `appendTurnToMarkdown` |
| `tool.execute.after` | `addEvent` + `incrementCounter` | `appendTurnToMarkdown` |
| `text.complete` | `addTurn` + `addEvent` + `addDiagnostic` + `incrementCounter` | `appendTurnToMarkdown` |
| `compaction` | `addEvent` + `incrementCounter` | `appendTurnToMarkdown` |

**Both writers ARE called.** The dual-write architecture IS functioning.

---

## 3. Tool vs Feature Analysis

### hivemind_journal Tool

**File:** `src/tools/hivemind-journal.ts:1-196`

**Purpose:** "the ONLY write-side entry point for session journaling" (per its own comment line 5)

**Reality:** This is **MISLEADING**. The tool is a **thin wrapper with direct file I/O**, NOT the sole writer:

| Aspect | Tool | Hooks |
|--------|------|-------|
| Write path | Direct `appendFile` to `.md` | `markdown-writer.ts` → `appendFile` to `.md` |
| JSON writes | None | `consolidated-writer.ts` → atomic write to `.json` |
| Path | `getJourneyEventsMarkdownPath()` | `ensureEventsMarkdown()` → same path |
| Import | `appendDiagnosticToMarkdown` from `markdown-writer.js` | Full `markdown-writer.js` |

**Duplicate paths:** Both the tool AND the hooks write to the same markdown files via `markdown-writer.js` functions. The tool only handles diagnostic appends directly; hooks handle turn/event appends.

### Key Finding: generateTOC is NEVER Called

**Location:** `src/features/event-tracker/markdown-writer.ts:257`

The `generateTOC` function exists and has comprehensive tests, but it is **NEVER called** in the actual codebase:

```
$ grep -r "generateTOC" src/ --include="*.ts" | grep -v ".test.ts"
src/features/event-tracker/markdown-writer.ts:257:export async function generateTOC
```

**Impact:** The JSON's `toc` array remains `[]` forever. The markdown's Table of Contents section is never updated with entries.

---

## 4. Time-Machine Readiness

### What WORKS

| Capability | Status | Evidence |
|------------|--------|----------|
| Session file creation | ✅ | Files created at `journey-events/{id}.md` and `.json` |
| Event content capture | ✅ | Markdown contains full tool calls, outputs, skill loads |
| Counter tracking | ✅ | JSON has turnCount, assistantOutputCount, toolCallCount |
| Compaction events | ✅ | Captured via `session.compacting` hook |
| Diagnostic events | ✅ | Via `appendDiagnosticToMarkdown` |

### What is BROKEN / MISSING

| Capability | Status | Impact |
|------------|--------|--------|
| **toc population** | ❌ NEVER BUILT | Cannot quickly navigate session events via JSON |
| **parentSessionId linking** | ❌ All `null` | Cannot trace session lineage/forks |
| **subsessionIds tracking** | ❌ All `[]` | Cannot find child sessions |
| **resumable flag** | ❌ Always `false` | Cannot determine if session can be resumed |
| **summary field** | ❌ Always empty | No human-readable session summary |
| **keyFindings array** | ❌ Always empty | No captured findings |
| **Markdown TOC generation** | ❌ Never called | Table of Contents in MD is stale/empty |

### Time-Machine Trace: ses_2bca → ses_2bcb

The user expected these sessions to be linked as parent-child:

```
ses_2bcb.md:4:38 PM - "Resuming from Previous Session"
ses_2bca.md:4:55 PM - Continued work after ses_2bcb
```

**Reality:** Both sessions show:
- `parentSessionId: null` — NO linkage
- `subsessionIds: []` — NO children tracked
- Cannot programmatically determine which is the parent

---

## 5. Verdict

### The Session Journal System is PARTIALLY FUNCTIONAL

| Component | Status | Notes |
|-----------|--------|-------|
| Hooks firing | ✅ WORKS | All 4 hooks correctly call writers |
| Markdown file writes | ✅ WORKS | Full content captured |
| JSON file writes | ⚠️ PARTIAL | Metadata/counters written, but `toc` is dead |
| `toc` population | ❌ BROKEN | `generateTOC` never called |
| Session lineage | ❌ BROKEN | No parent-child linkage |
| Time-machine navigation | ❌ BLOCKED | Cannot traverse sessions programmatically |

### Root Causes

1. **Dead code:** `generateTOC` function exists but is never invoked anywhere in the codebase
2. **Missing linkage:** `linkSubSession` exists in `consolidated-writer.ts` but is never called by any hook
3. **No TOC update on events:** The hooks append to markdown but never call `generateTOC` to rebuild the TOC
4. **Misleading documentation:** The tool claims to be "the ONLY write-side entry point" but hooks also write

### What Needs Fixing (Priority Order)

1. **Call `generateTOC` after events** — Add TOC rebuild call in `text-complete` handler after appending turns
2. **Wire `linkSubSession`** — Call when creating new sessions to establish lineage
3. **Populate summary/keyFindings** — Add summarization step on session end
4. **Fix `hivemind_journal` docs** — Clarify it handles DIAGNOSTICS only, hooks handle TURNS/EVENTS

---

## Evidence References

| Claim | File | Line |
|-------|------|------|
| Hooks call markdown-writer | `src/hooks/chat-message-handler.ts` | 18 |
| Hooks call markdown-writer | `src/hooks/tool-execution-handler.ts` | 19 |
| Hooks call markdown-writer | `src/hooks/text-complete-handler.ts` | 26 |
| Hooks call markdown-writer | `src/hooks/compaction-handler.ts` | 19 |
| generateTOC exists | `src/features/event-tracker/markdown-writer.ts` | 257 |
| generateTOC never called | `grep -r "generateTOC" src/ --include="*.ts"` | (zero non-test calls) |
| linkSubSession exists | `src/features/event-tracker/consolidated-writer.ts` | 412 |
| toc never populated | `ses_2bca.json:24` | `toc: []` |
| parentSessionId null | `ses_2bca.json:5` | `parentSessionId: null` |

---

*Audit conducted: 2026-03-31*
