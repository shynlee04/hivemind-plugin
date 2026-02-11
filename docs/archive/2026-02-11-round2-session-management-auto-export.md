# Round 2: Session Management & Auto-Export — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Enhance sessions with structured metadata, living plan functionality, auto-export on compaction, and long session detection — making sessions first-class traceable entities.

**Architecture:** Extend existing schemas (BrainState, SessionState) with new metadata fields. Create pure functions for export generation and long session detection. Modify `compact_session` tool and `declare_intent` tool to use new fields. Integrate long session warnings into existing `soft-governance.ts` hook.

**Tech Stack:** TypeScript, Node.js native test runner (`tsx --test`), existing `@opencode-ai/plugin` SDK patterns.

**Baseline:** 175 tests passing, TypeScript clean, v1.4.0 (Round 1 complete but not version-bumped yet).

---

## Task 1: Session Structure Enhancement (Schema + Pure Functions)

**Files:**
- Modify: `src/schemas/brain-state.ts` (extend SessionState with new fields)
- Modify: `src/schemas/config.ts` (no changes needed — `auto_compact_on_turns` already exists)
- Modify: `src/lib/persistence.ts` (add migration defaults for new fields)
- Create: `tests/session-structure.test.ts`

### Step 1: Extend SessionState interface

In `src/schemas/brain-state.ts`, add to `SessionState`:

```typescript
export interface SessionState {
  id: string;
  mode: SessionMode;
  governance_mode: GovernanceMode;
  governance_status: GovernanceStatus;
  start_time: number;
  last_activity: number;
  /** ISO date string (YYYY-MM-DD) of session creation */
  date: string;
  /** User-defined key for session categorization */
  meta_key: string;
  /** Agent role/identity for this session */
  role: string;
  /** Whether session was initiated by AI (true) or human (false) */
  by_ai: boolean;
}
```

### Step 2: Update `createBrainState` factory

Add defaults for the new fields:

```typescript
session: {
  // ...existing fields...
  date: new Date(now).toISOString().split("T")[0],
  meta_key: "",
  role: "",
  by_ai: true,
},
```

### Step 3: Update persistence migration

In `src/lib/persistence.ts`, add migration defaults in the `load()` function:

```typescript
// Migration: ensure fields added in Round 2 exist
parsed.session.date ??= new Date(parsed.session.start_time).toISOString().split("T")[0];
parsed.session.meta_key ??= "";
parsed.session.role ??= "";
parsed.session.by_ai ??= true;
```

### Step 4: Write tests `tests/session-structure.test.ts`

Test the following (12 assertions):

**Session creation (4):**
- `createBrainState` sets date to today's YYYY-MM-DD
- `createBrainState` sets empty meta_key
- `createBrainState` sets empty role
- `createBrainState` sets by_ai to true

**Session metadata (4):**
- Date format is YYYY-MM-DD
- Can update meta_key via spread
- Can update role via spread
- by_ai defaults to true

**Migration (4):**
- Old state without date gets migrated
- Old state without meta_key gets empty string
- Old state without role gets empty string
- Old state without by_ai gets true

### Step 5: Run tests + typecheck

```bash
npm test && npm run typecheck
```

### Step 6: Commit

```bash
git add -A && git commit -m "feat: extend SessionState with date, meta_key, role, by_ai fields"
```

---

## Task 2: Living Plan in active.md

**Files:**
- Modify: `src/lib/planning-fs.ts` (extend `ActiveMdContent.frontmatter`, update template)
- Modify: `src/tools/declare-intent.ts` (write structured active.md with new fields)
- Modify: `src/tools/map-context.ts` (update active.md with plan progress sections)

### Step 1: Extend `ActiveMdContent` frontmatter

In `src/lib/planning-fs.ts`, update the interface:

```typescript
export interface ActiveMdContent {
  frontmatter: {
    session_id?: string;
    mode?: string;
    governance_status?: string;
    start_time?: number;
    last_updated?: number;
    date?: string;
    meta_key?: string;
    role?: string;
    by_ai?: boolean;
  };
  body: string;
}
```

### Step 2: Update active template

In `generateActiveTemplate()`, add the new frontmatter fields:

```typescript
export function generateActiveTemplate(): string {
  return `---
session_id: ""
mode: ""
governance_status: "LOCKED"
start_time: 0
last_updated: 0
date: ""
meta_key: ""
role: ""
by_ai: true
---

# Active Session

## Current Focus
<!-- Updated via map_context -->

## Plan
<!-- Living plan — tracks trajectory/tactic/action hierarchy -->

## Completed
<!-- Items marked [x] get archived -->

## Notes
<!-- Scratchpad - anything goes -->
`;
}
```

### Step 3: Update `declare-intent.ts` to write structured active.md

Modify the active.md body in `declare-intent.ts` to include plan sections:

```typescript
activeMd.frontmatter = {
  session_id: state.session.id,
  mode: args.mode,
  governance_status: "OPEN",
  start_time: state.session.start_time,
  last_updated: Date.now(),
  date: state.session.date,
  meta_key: state.session.meta_key,
  role: state.session.role,
  by_ai: state.session.by_ai,
};
activeMd.body = [
  "# Active Session",
  "",
  "## Current Focus",
  `**Mode**: ${args.mode}`,
  `**Focus**: ${args.focus}`,
  args.reason ? `**Reason**: ${args.reason}` : "",
  "",
  "## Plan",
  `- [ ] ${args.focus}`,
  "",
  "## Completed",
  "<!-- Items marked [x] get archived -->",
  "",
  "## Notes",
  "<!-- Scratchpad - anything goes -->",
]
  .filter(Boolean)
  .join("\n");
```

### Step 4: Update `map-context.ts` to update plan section

In `map-context.ts`, when level is "tactic" or "action", add a plan item to active.md:

Read the current `src/tools/map-context.ts` first to understand the pattern. After the hierarchy update and active.md write, append a plan line:

```typescript
// After writing hierarchy to active.md, add plan line
const activeMd = await readActiveMd(directory);
const planMarker = "## Plan";
if (activeMd.body.includes(planMarker)) {
  const statusMark = args.status === "complete" ? "x" : " ";
  const planLine = `- [${statusMark}] [${args.level}] ${args.content}`;
  // Append plan line after the ## Plan section
  activeMd.body = activeMd.body.replace(
    planMarker,
    `${planMarker}\n${planLine}`
  );
  await writeActiveMd(directory, activeMd);
}
```

### Step 5: Run tests + typecheck

```bash
npm test && npm run typecheck
```

### Step 6: Commit

```bash
git add -A && git commit -m "feat: extend active.md as living plan with session metadata"
```

---

## Task 3: Auto-Export on Compaction

**Files:**
- Create: `src/lib/session-export.ts`
- Modify: `src/tools/compact-session.ts` (add export generation)
- Modify: `src/lib/planning-fs.ts` (add `getExportDir` helper)
- Modify: `src/lib/index.ts` (barrel export)
- Create: `tests/session-export.test.ts`

### Step 1: Create `src/lib/session-export.ts`

```typescript
/**
 * Session Export — Pure functions for generating exportable session data.
 * Produces both markdown and JSON formats.
 */
import type { BrainState } from "../schemas/brain-state.js";
import type { ActiveMdContent } from "./planning-fs.js";

export interface SessionExportData {
  id: string;
  date: string;
  mode: string;
  meta_key: string;
  role: string;
  by_ai: boolean;
  started: string;
  archived: string;
  turns: number;
  drift_score: number;
  files_touched: string[];
  context_updates: number;
  hierarchy: {
    trajectory: string;
    tactic: string;
    action: string;
  };
  ratings: Array<{ score: number; reason?: string; turn_number: number }>;
  summary: string;
}

/**
 * Generate structured export data from brain state.
 */
export function generateExportData(
  state: BrainState,
  summary: string
): SessionExportData {
  return {
    id: state.session.id,
    date: state.session.date,
    mode: state.session.mode,
    meta_key: state.session.meta_key,
    role: state.session.role,
    by_ai: state.session.by_ai,
    started: new Date(state.session.start_time).toISOString(),
    archived: new Date().toISOString(),
    turns: state.metrics.turn_count,
    drift_score: state.metrics.drift_score,
    files_touched: state.metrics.files_touched,
    context_updates: state.metrics.context_updates,
    hierarchy: { ...state.hierarchy },
    ratings: state.metrics.ratings.map(r => ({
      score: r.score,
      reason: r.reason,
      turn_number: r.turn_number,
    })),
    summary,
  };
}

/**
 * Generate JSON export string.
 */
export function generateJsonExport(data: SessionExportData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Generate markdown export string.
 */
export function generateMarkdownExport(
  data: SessionExportData,
  sessionBody: string
): string {
  const lines: string[] = [];
  lines.push(`# Session Export: ${data.id}`);
  lines.push("");
  lines.push("## Metadata");
  lines.push(`| Field | Value |`);
  lines.push(`|-------|-------|`);
  lines.push(`| ID | ${data.id} |`);
  lines.push(`| Date | ${data.date} |`);
  lines.push(`| Mode | ${data.mode} |`);
  lines.push(`| Role | ${data.role || "(none)"} |`);
  lines.push(`| Meta Key | ${data.meta_key || "(none)"} |`);
  lines.push(`| By AI | ${data.by_ai} |`);
  lines.push(`| Started | ${data.started} |`);
  lines.push(`| Archived | ${data.archived} |`);
  lines.push("");
  lines.push("## Metrics");
  lines.push(`- **Turns**: ${data.turns}`);
  lines.push(`- **Drift Score**: ${data.drift_score}/100`);
  lines.push(`- **Files Touched**: ${data.files_touched.length}`);
  lines.push(`- **Context Updates**: ${data.context_updates}`);
  lines.push("");
  lines.push("## Hierarchy");
  if (data.hierarchy.trajectory) lines.push(`- **Trajectory**: ${data.hierarchy.trajectory}`);
  if (data.hierarchy.tactic) lines.push(`- **Tactic**: ${data.hierarchy.tactic}`);
  if (data.hierarchy.action) lines.push(`- **Action**: ${data.hierarchy.action}`);
  lines.push("");
  if (data.files_touched.length > 0) {
    lines.push("## Files Touched");
    data.files_touched.forEach(f => lines.push(`- ${f}`));
    lines.push("");
  }
  if (data.ratings.length > 0) {
    lines.push("## Self-Ratings");
    data.ratings.forEach(r =>
      lines.push(`- Turn ${r.turn_number}: ${r.score}/10${r.reason ? ` — ${r.reason}` : ""}`)
    );
    lines.push("");
  }
  lines.push("## Summary");
  lines.push(data.summary);
  lines.push("");
  lines.push("## Session Content");
  lines.push(sessionBody);
  return lines.join("\n");
}
```

### Step 2: Add export directory helper to `planning-fs.ts`

```typescript
export function getExportDir(projectRoot: string): string {
  return join(getPlanningPaths(projectRoot).archiveDir, "exports");
}
```

### Step 3: Modify `compact-session.ts` to generate exports

After archiving the session, add export generation:

```typescript
import { generateExportData, generateJsonExport, generateMarkdownExport } from "../lib/session-export.js";
import { getExportDir } from "../lib/planning-fs.js";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

// ... inside execute(), after archiveSession() call:

// Generate auto-export
try {
  const exportData = generateExportData(state, summaryLine);
  const exportDir = getExportDir(directory);
  await mkdir(exportDir, { recursive: true });
  
  const timestamp = new Date().toISOString().split("T")[0];
  const baseName = `session_${timestamp}_${state.session.id}`;
  
  // Write JSON export
  await writeFile(
    join(exportDir, `${baseName}.json`),
    generateJsonExport(exportData)
  );
  
  // Write markdown export
  await writeFile(
    join(exportDir, `${baseName}.md`),
    generateMarkdownExport(exportData, activeMd.body)
  );
} catch (exportError) {
  // Export failure is non-fatal
}
```

### Step 4: Update barrel exports

In `src/lib/index.ts`, add:

```typescript
export * from "./session-export.js";
```

### Step 5: Write tests `tests/session-export.test.ts`

Test (14 assertions):

**Export data generation (6):**
- `generateExportData` sets correct session ID
- `generateExportData` sets correct date
- `generateExportData` sets correct mode
- `generateExportData` includes hierarchy
- `generateExportData` includes ratings
- `generateExportData` uses provided summary

**JSON export (3):**
- `generateJsonExport` returns valid JSON
- JSON includes all metadata fields
- JSON includes session metrics

**Markdown export (5):**
- `generateMarkdownExport` includes metadata table
- Markdown includes hierarchy section
- Markdown includes files touched section (when files exist)
- Markdown skips files section when empty
- Markdown includes summary

### Step 6: Run tests + typecheck

```bash
npm test && npm run typecheck
```

### Step 7: Commit

```bash
git add -A && git commit -m "feat: add auto-export on session compaction (JSON + markdown)"
```

---

## Task 4: Long Session Detection + Integration

**Files:**
- Create: `src/lib/long-session.ts`
- Modify: `src/hooks/soft-governance.ts` (add long session warning)
- Modify: `src/hooks/session-lifecycle.ts` (inject long session warning in system prompt)
- Modify: `src/lib/index.ts` (barrel export)
- Add tests to `tests/session-structure.test.ts`

### Step 1: Create `src/lib/long-session.ts`

```typescript
/**
 * Long Session Detection — pure function.
 * Detects when sessions exceed auto-compact threshold.
 */
import type { BrainState } from "../schemas/brain-state.js";

export interface LongSessionInfo {
  isLong: boolean;
  turnCount: number;
  threshold: number;
  suggestion: string;
}

/**
 * Checks if the current session exceeds the auto-compact threshold.
 */
export function detectLongSession(
  state: BrainState,
  autoCompactThreshold: number
): LongSessionInfo {
  const isLong = state.metrics.turn_count >= autoCompactThreshold;
  return {
    isLong,
    turnCount: state.metrics.turn_count,
    threshold: autoCompactThreshold,
    suggestion: isLong
      ? `Session has ${state.metrics.turn_count} turns (threshold: ${autoCompactThreshold}). Consider using compact_session to archive and reset.`
      : "",
  };
}
```

### Step 2: Integrate into session-lifecycle.ts

After the commit suggestion section, add:

```typescript
import { detectLongSession } from "../lib/long-session.js";

// ... inside hook, after commit suggestion:
const longSession = detectLongSession(state, config.auto_compact_on_turns);
if (longSession.isLong) {
  lines.push(`⏰ ${longSession.suggestion}`);
}
```

### Step 3: Integrate into soft-governance.ts

After the drift warning section, add:

```typescript
import { detectLongSession } from "../lib/long-session.js";

// ... inside hook, after drift warning check:
const longSession = detectLongSession(newState, config.auto_compact_on_turns);
if (longSession.isLong) {
  await log.warn(longSession.suggestion);
}
```

### Step 4: Update barrel exports

In `src/lib/index.ts`:

```typescript
export * from "./long-session.js";
```

### Step 5: Add tests to `tests/session-structure.test.ts`

Add (6 assertions):

**Long session detection:**
- Below threshold → `isLong: false`
- At threshold → `isLong: true`
- Above threshold → `isLong: true` with correct suggestion
- Threshold of 0 → `isLong: true` (immediately)
- Suggestion includes turn count
- Suggestion includes threshold

### Step 6: Run tests + typecheck

```bash
npm test && npm run typecheck
```

### Step 7: Commit

```bash
git add -A && git commit -m "feat: add long session detection and auto-compact warnings"
```

---

## Task 5: Integration Tests + Final Verification

**Files:**
- Modify: `tests/integration.test.ts`

### Step 1: Add integration tests

Add 4 integration tests:

```
test: session metadata persists through lifecycle
  1. Init → declare intent → verify state has date, meta_key, role, by_ai
  
test: active.md contains living plan section
  1. Init → declare intent → read active.md → verify contains "## Plan"
  
test: compact_session generates export files
  1. Init → declare intent → compact → verify export dir has .json and .md files
  
test: long session warning injected at threshold
  1. Init → declare intent → set turn_count to auto_compact_on_turns → call lifecycle hook → verify system prompt contains warning
```

### Step 2: Run full test suite

```bash
npm test
```

### Step 3: Run typecheck

```bash
npm run typecheck
```

### Step 4: Commit

```bash
git add tests/ && git commit -m "test: add Round 2 session management integration tests"
```

---

## Summary

| Task | New Files | Modified Files | Est. Assertions |
|------|-----------|---------------|-----------------|
| 1. Session Structure | 1 test | 2 (brain-state, persistence) | ~12 |
| 2. Living Plan | — | 3 (planning-fs, declare-intent, map-context) | (tested via integration) |
| 3. Auto-Export | 1 (`session-export.ts`) + 1 test | 3 (compact-session, planning-fs, lib/index) | ~14 |
| 4. Long Session | 1 (`long-session.ts`) | 3 (soft-governance, session-lifecycle, lib/index) | ~6 |
| 5. Integration Tests | — | 1 (integration.test.ts) | ~8 |
| **Total** | **4 new** | **8 modified** | **~40 new** |

**Post-Round 2 target:** 175 + 40 = **~215 tests**, all passing.
