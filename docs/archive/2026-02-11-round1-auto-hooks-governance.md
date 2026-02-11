# Round 1: Auto-Hooks & Governance Layer — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Add 4 automated governance features to HiveMind — Time-to-Stale, Hierarchy Chain Breaking, Git Atomic Commit advisor, and Tool Activation advisor — all integrated into existing hooks via pure functions.

**Architecture:** Each feature is a pure function in `src/lib/` that computes from existing BrainState. These functions are called by the existing `session-lifecycle.ts` hook (system prompt injection) and `soft-governance.ts` hook (tracking). No new hooks are created — OpenCode only allows one handler per hook key.

**Tech Stack:** TypeScript, Node.js native test runner (`tsx --test`), existing `@opencode-ai/plugin` SDK patterns.

**Baseline:** 136 tests passing, TypeScript clean, v1.4.0.

---

## Task 1: Config Extensions + Pure Functions

**Files:**
- Modify: `src/schemas/config.ts` (add 2 config fields)
- Modify: `src/schemas/brain-state.ts` (add `last_commit_suggestion_turn` field)
- Create: `src/lib/staleness.ts`
- Create: `src/lib/chain-analysis.ts`
- Create: `src/lib/commit-advisor.ts`
- Create: `src/lib/tool-activation.ts`
- Modify: `src/lib/index.ts` (barrel exports)
- Create: `tests/auto-hooks-pure.test.ts`

### Step 1: Add config fields

In `src/schemas/config.ts`, add to `HiveMindConfig`:

```typescript
/** Days of inactivity before auto-archiving session */
stale_session_days: number;
/** Files touched threshold before suggesting a commit */
commit_suggestion_threshold: number;
```

Add to `DEFAULT_CONFIG`:

```typescript
stale_session_days: 3,
commit_suggestion_threshold: 5,
```

### Step 2: Add BrainState field

In `src/schemas/brain-state.ts`, add to `BrainState`:

```typescript
/** Turn number when last commit suggestion was shown */
last_commit_suggestion_turn: number;
```

Add to `createBrainState` return:

```typescript
last_commit_suggestion_turn: 0,
```

Add pure function:

```typescript
export function setLastCommitSuggestionTurn(state: BrainState, turn: number): BrainState {
  return {
    ...state,
    last_commit_suggestion_turn: turn,
  };
}
```

### Step 3: Create `src/lib/staleness.ts`

```typescript
/**
 * Staleness detection — pure function.
 * Checks if a session has been idle beyond the configured threshold.
 */
import type { BrainState } from "../schemas/brain-state.js";

const MS_PER_DAY = 86_400_000;

/**
 * Returns true if the session's last_activity is older than maxDays from now.
 */
export function isSessionStale(state: BrainState, maxDays: number, now: number = Date.now()): boolean {
  if (maxDays <= 0) return false;
  const elapsed = now - state.session.last_activity;
  return elapsed > maxDays * MS_PER_DAY;
}

/**
 * Returns human-readable staleness info.
 */
export function getStalenessInfo(state: BrainState, maxDays: number, now: number = Date.now()): {
  isStale: boolean;
  idleDays: number;
  threshold: number;
} {
  const elapsed = now - state.session.last_activity;
  const idleDays = Math.floor(elapsed / MS_PER_DAY);
  return {
    isStale: isSessionStale(state, maxDays, now),
    idleDays,
    threshold: maxDays,
  };
}
```

### Step 4: Create `src/lib/chain-analysis.ts`

```typescript
/**
 * Hierarchy Chain Analysis — pure function.
 * Detects structural breaks in the trajectory→tactic→action chain.
 */
import type { BrainState } from "../schemas/brain-state.js";

export interface ChainBreak {
  level: "trajectory" | "tactic" | "action";
  issue: "orphaned" | "missing_parent" | "empty_chain";
  message: string;
}

/**
 * Detects chain breaks in the hierarchy.
 *
 * Rules:
 * 1. If action is set but tactic is empty → "orphaned" action (missing parent)
 * 2. If tactic is set but trajectory is empty → "orphaned" tactic (missing parent)
 * 3. If all three are empty and session is OPEN → "empty_chain" (no hierarchy set)
 */
export function detectChainBreaks(state: BrainState): ChainBreak[] {
  const breaks: ChainBreak[] = [];
  const { trajectory, tactic, action } = state.hierarchy;

  // Rule 1: Action without tactic
  if (action && !tactic) {
    breaks.push({
      level: "action",
      issue: "missing_parent",
      message: `Action "${truncate(action)}" has no parent tactic. Use map_context to set a tactic.`,
    });
  }

  // Rule 2: Tactic without trajectory
  if (tactic && !trajectory) {
    breaks.push({
      level: "tactic",
      issue: "missing_parent",
      message: `Tactic "${truncate(tactic)}" has no parent trajectory. Use declare_intent to set focus.`,
    });
  }

  // Rule 3: Empty chain with open session
  if (!trajectory && !tactic && !action && state.session.governance_status === "OPEN") {
    breaks.push({
      level: "trajectory",
      issue: "empty_chain",
      message: "Session is OPEN but no hierarchy is set. Use map_context to set your focus.",
    });
  }

  return breaks;
}

function truncate(s: string, max: number = 40): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}
```

### Step 5: Create `src/lib/commit-advisor.ts`

```typescript
/**
 * Git Atomic Commit Advisor — pure function.
 * Suggests commit points based on session state.
 */
import type { BrainState } from "../schemas/brain-state.js";

export interface CommitSuggestion {
  reason: string;
  files: number;
}

/**
 * Returns a commit suggestion if conditions are met, or null.
 *
 * Triggers:
 * 1. Files touched >= threshold since last suggestion
 * 2. Don't repeat suggestion within 3 turns of last one
 */
export function shouldSuggestCommit(
  state: BrainState,
  threshold: number
): CommitSuggestion | null {
  const fileCount = state.metrics.files_touched.length;

  // Not enough files touched
  if (fileCount < threshold) return null;

  // Don't repeat too frequently (within 3 turns of last suggestion)
  const turnsSinceLastSuggestion = state.metrics.turn_count - state.last_commit_suggestion_turn;
  if (state.last_commit_suggestion_turn > 0 && turnsSinceLastSuggestion < 3) return null;

  return {
    reason: `${fileCount} files touched — consider committing your work.`,
    files: fileCount,
  };
}
```

### Step 6: Create `src/lib/tool-activation.ts`

```typescript
/**
 * Tool Activation Advisor — pure function.
 * Suggests which HiveMind tools are most relevant for the current state.
 */
import type { BrainState } from "../schemas/brain-state.js";

export interface ToolHint {
  tool: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

/**
 * Returns contextual tool hints based on current brain state.
 * Only returns the single most relevant hint to minimize noise.
 */
export function getToolActivation(state: BrainState): ToolHint | null {
  // Priority 1: Session locked → must declare intent
  if (state.session.governance_status === "LOCKED") {
    return {
      tool: "declare_intent",
      reason: "Session is LOCKED. Declare your intent to start working.",
      priority: "high",
    };
  }

  // Priority 2: High drift → map context
  if (state.metrics.drift_score < 50 && state.metrics.turn_count >= 5) {
    return {
      tool: "map_context",
      reason: "Drift detected. Update your focus to stay on track.",
      priority: "high",
    };
  }

  // Priority 3: Long session → suggest compact or self-rate
  if (state.metrics.turn_count >= 15) {
    return {
      tool: "compact_session",
      reason: "Long session detected. Consider archiving and resetting.",
      priority: "medium",
    };
  }

  // Priority 4: No hierarchy set → suggest map_context
  if (!state.hierarchy.trajectory && !state.hierarchy.tactic && !state.hierarchy.action) {
    return {
      tool: "map_context",
      reason: "No hierarchy set. Define your trajectory for better tracking.",
      priority: "medium",
    };
  }

  return null;
}
```

### Step 7: Update barrel exports

In `src/lib/index.ts`, add:

```typescript
export { isSessionStale, getStalenessInfo } from "./staleness.js";
export { detectChainBreaks, type ChainBreak } from "./chain-analysis.js";
export { shouldSuggestCommit, type CommitSuggestion } from "./commit-advisor.js";
export { getToolActivation, type ToolHint } from "./tool-activation.js";
```

### Step 8: Write tests `tests/auto-hooks-pure.test.ts`

Test the following (35+ assertions):

**Staleness (8 assertions):**
- `isSessionStale` returns false for fresh state
- `isSessionStale` returns true for state older than 3 days
- `isSessionStale` returns false for state exactly at boundary
- `isSessionStale` with custom maxDays
- `isSessionStale` with maxDays=0 returns false
- `getStalenessInfo` returns correct idleDays
- `getStalenessInfo` returns correct isStale
- `getStalenessInfo` returns correct threshold

**Chain Analysis (8 assertions):**
- Empty hierarchy + OPEN session → 1 break (empty_chain)
- Empty hierarchy + LOCKED session → 0 breaks
- Action without tactic → missing_parent break
- Tactic without trajectory → missing_parent break
- Action without tactic AND tactic without trajectory → 2 breaks
- Full chain → 0 breaks
- Trajectory only → 0 breaks
- Tactic + trajectory but no action → 0 breaks

**Commit Advisor (6 assertions):**
- Below threshold → null
- At threshold → suggestion
- Recently suggested (within 3 turns) → null
- Not recently suggested → suggestion
- Zero files → null
- Threshold exactly met → suggestion

**Tool Activation (8 assertions):**
- LOCKED session → declare_intent (high)
- High drift → map_context (high)
- Long session (15+ turns) → compact_session (medium)
- No hierarchy + OPEN → map_context (medium)
- Normal state → null
- Priority ordering: LOCKED > drift > long session > no hierarchy
- After declaring intent (OPEN, low turns) → null
- With hierarchy set, moderate turns → null

### Step 9: Run tests

```bash
npx tsx --test tests/auto-hooks-pure.test.ts
```

Expected: 30+ assertions PASS.

### Step 10: Run full test suite + typecheck

```bash
npm test && npm run typecheck
```

Expected: 136+ existing tests still pass, 0 TypeScript errors.

### Step 11: Commit

```bash
git add src/schemas/config.ts src/schemas/brain-state.ts src/lib/staleness.ts src/lib/chain-analysis.ts src/lib/commit-advisor.ts src/lib/tool-activation.ts src/lib/index.ts tests/auto-hooks-pure.test.ts
git commit -m "feat: add pure functions for auto-hooks governance layer"
```

---

## Task 2: Time-to-Stale Hook Integration

**Files:**
- Modify: `src/hooks/session-lifecycle.ts`
- Test: `tests/auto-hooks-pure.test.ts` (add integration section)

### Step 1: Import staleness + archival functions

Add to `session-lifecycle.ts` imports:

```typescript
import { isSessionStale } from "../lib/staleness.js";
import {
  archiveSession,
  readActiveMd,
  resetActiveMd,
  updateIndexMd,
} from "../lib/planning-fs.js";
import { lockSession } from "../schemas/brain-state.js";
```

### Step 2: Add staleness check before system prompt injection

Inside the hook function, after loading state (`let state = await stateManager.load()`), add:

```typescript
// Time-to-Stale: auto-archive if session idle > configured days
if (state && isSessionStale(state, config.stale_session_days)) {
  try {
    const activeMd = await readActiveMd(directory);
    const archiveContent = [
      `# Auto-Archived (Stale): ${state.session.id}`,
      "",
      `**Reason**: Session idle > ${config.stale_session_days} days`,
      `**Mode**: ${state.session.mode}`,
      `**Last Activity**: ${new Date(state.session.last_activity).toISOString()}`,
      `**Archived**: ${new Date().toISOString()}`,
      `**Turns**: ${state.metrics.turn_count}`,
      "",
      "## Session Content",
      activeMd.body,
    ].filter(Boolean).join("\n");

    await archiveSession(directory, state.session.id, archiveContent);
    await updateIndexMd(directory, `[auto-archived: stale] ${state.session.id}`);
    await resetActiveMd(directory);

    // Create fresh session
    const newId = generateSessionId();
    state = createBrainState(newId, config);
    await stateManager.save(state);

    await log.info(`Auto-archived stale session ${state.session.id}`);
  } catch (archiveError) {
    await log.error(`Failed to auto-archive stale session: ${archiveError}`);
  }
}
```

### Step 3: Test staleness integration

Add to `tests/auto-hooks-pure.test.ts` or `tests/integration.test.ts`:

```typescript
test("staleness: session-lifecycle auto-archives stale sessions", async (t) => {
  // Setup: create session with last_activity 4 days ago
  // Call session lifecycle hook
  // Verify: archive created, fresh session, system prompt mentions fresh start
});
```

### Step 4: Run tests + typecheck

```bash
npm test && npm run typecheck
```

### Step 5: Commit

```bash
git add src/hooks/session-lifecycle.ts tests/
git commit -m "feat: integrate time-to-stale auto-archive into session lifecycle hook"
```

---

## Task 3: Hierarchy Chain Breaking Integration

**Files:**
- Modify: `src/hooks/session-lifecycle.ts` (inject warnings into system prompt)
- Modify: `src/hooks/soft-governance.ts` (log chain breaks)

### Step 1: Add chain break detection to system prompt injection

In `session-lifecycle.ts`, after hierarchy context section, add:

```typescript
// Chain Break Detection
import { detectChainBreaks } from "../lib/chain-analysis.js";

// ... inside the hook, after hierarchy lines:
const chainBreaks = detectChainBreaks(state);
if (chainBreaks.length > 0) {
  lines.push("⚠ Chain breaks detected:");
  for (const brk of chainBreaks) {
    lines.push(`  - ${brk.message}`);
  }
}
```

### Step 2: Add chain break logging to soft-governance

In `soft-governance.ts`, after tracking tool calls, add:

```typescript
import { detectChainBreaks } from "../lib/chain-analysis.js";

// ... inside the hook, after incrementing turn count:
const chainBreaks = detectChainBreaks(newState);
if (chainBreaks.length > 0) {
  await log.warn(
    `Chain breaks: ${chainBreaks.map(b => b.message).join("; ")}`
  );
}
```

### Step 3: Run tests + typecheck

```bash
npm test && npm run typecheck
```

### Step 4: Commit

```bash
git add src/hooks/session-lifecycle.ts src/hooks/soft-governance.ts
git commit -m "feat: integrate hierarchy chain break detection into hooks"
```

---

## Task 4: Git Atomic Commit Advisor Integration

**Files:**
- Modify: `src/hooks/session-lifecycle.ts` (inject commit suggestions)
- Modify: `src/hooks/soft-governance.ts` (track commit suggestion timing)

### Step 1: Add commit suggestion to system prompt

In `session-lifecycle.ts`, after metrics summary, add:

```typescript
import { shouldSuggestCommit } from "../lib/commit-advisor.js";

// ... inside the hook, after metrics lines:
const commitSuggestion = shouldSuggestCommit(state, config.commit_suggestion_threshold);
if (commitSuggestion) {
  lines.push(`💡 ${commitSuggestion.reason}`);
}
```

### Step 2: Track commit suggestion in soft-governance

In `soft-governance.ts`, after saving state, add:

```typescript
import { shouldSuggestCommit } from "../lib/commit-advisor.js";
import { setLastCommitSuggestionTurn } from "../schemas/brain-state.js";

// ... inside the hook, after saving state:
const commitSuggestion = shouldSuggestCommit(newState, _config.commit_suggestion_threshold);
if (commitSuggestion) {
  newState = setLastCommitSuggestionTurn(newState, newState.metrics.turn_count);
  await stateManager.save(newState);
}
```

### Step 3: Run tests + typecheck

```bash
npm test && npm run typecheck
```

### Step 4: Commit

```bash
git add src/hooks/session-lifecycle.ts src/hooks/soft-governance.ts src/schemas/brain-state.ts
git commit -m "feat: integrate git atomic commit advisor into hooks"
```

---

## Task 5: Tool Activation Advisor Integration

**Files:**
- Modify: `src/hooks/session-lifecycle.ts` (inject tool hints)

### Step 1: Add tool activation to system prompt

In `session-lifecycle.ts`, after the drift warning section, add:

```typescript
import { getToolActivation } from "../lib/tool-activation.js";

// ... inside the hook, after drift warning:
const toolHint = getToolActivation(state);
if (toolHint) {
  lines.push(`🔧 Suggested: ${toolHint.tool} — ${toolHint.reason}`);
}
```

### Step 2: Run tests + typecheck

```bash
npm test && npm run typecheck
```

### Step 3: Commit

```bash
git add src/hooks/session-lifecycle.ts
git commit -m "feat: integrate tool activation advisor into session lifecycle hook"
```

---

## Task 6: Integration Tests + Final Verification

**Files:**
- Modify: `tests/integration.test.ts` (add Round 1 integration tests)

### Step 1: Add integration tests

Add the following test blocks to `tests/integration.test.ts`:

```typescript
test("round1: stale session auto-archived on lifecycle hook", async (t) => {
  // 1. Init project, create session
  // 2. Set last_activity to 4 days ago
  // 3. Call session lifecycle hook
  // 4. Assert: archive created, new session, old session gone
});

test("round1: chain breaks injected into system prompt", async (t) => {
  // 1. Init project, declare intent
  // 2. Set action without tactic (orphaned)
  // 3. Call session lifecycle hook
  // 4. Assert: system prompt contains chain break warning
});

test("round1: commit suggestion appears at file threshold", async (t) => {
  // 1. Init project, declare intent
  // 2. Add 5+ files to files_touched
  // 3. Call session lifecycle hook
  // 4. Assert: system prompt contains commit suggestion
});

test("round1: tool activation suggests declare_intent when locked", async (t) => {
  // 1. Init project in strict mode (LOCKED)
  // 2. Call session lifecycle hook
  // 3. Assert: system prompt contains declare_intent hint
});
```

### Step 2: Run full test suite

```bash
npm test
```

Expected: 136 + ~35 (Task 1) + ~8 (Task 6) = **~179 assertions**, all passing.

### Step 3: Run typecheck

```bash
npm run typecheck
```

Expected: 0 errors.

### Step 4: Commit

```bash
git add tests/
git commit -m "test: add Round 1 auto-hooks integration tests"
```

### Step 5: Version bump (optional — depends on user preference)

Update `package.json` version to `1.5.0`, update AGENTS.md, CHANGELOG.md.

---

## Summary

| Task | New Files | Modified Files | Est. Assertions |
|------|-----------|---------------|-----------------|
| 1. Pure Functions | 4 (`src/lib/`) + 1 test | 3 (`config.ts`, `brain-state.ts`, `lib/index.ts`) | ~30 |
| 2. Time-to-Stale | — | 1 (`session-lifecycle.ts`) | ~3 |
| 3. Chain Breaking | — | 2 (`session-lifecycle.ts`, `soft-governance.ts`) | ~2 |
| 4. Commit Advisor | — | 2 (`session-lifecycle.ts`, `soft-governance.ts`) | ~2 |
| 5. Tool Activation | — | 1 (`session-lifecycle.ts`) | ~1 |
| 6. Integration Tests | — | 1 (`integration.test.ts`) | ~8 |
| **Total** | **5 new** | **5 modified** | **~46 new** |

**Post-Round 1 target:** 136 + 46 = **~182 tests**, all passing.
