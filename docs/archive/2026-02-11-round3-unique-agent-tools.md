# Round 3: Unique Agent Tools — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Add 4 new tools that give agents structured access to their session state, immutable memory anchors, cognitive refresh capabilities, and drift verification — building the "Cognitive Mesh" from the plan-mems-brain reference.

**Architecture:** 4 new tool files in `src/tools/`, 1 new persistence file (`anchors.json`), and integration into existing hooks for anchor injection. All tools follow the 10 Commandments with 0-1 required args.

**Tech Stack:** TypeScript, `@opencode-ai/plugin/tool`, existing pure function patterns.

**Baseline:** 232 tests passing, TypeScript clean, 8 test files.

---

## Task 1: Anchors Persistence + scan_hierarchy Tool

**Files:**
- Create: `src/lib/anchors.ts` (CRUD for anchors.json)
- Create: `src/tools/scan-hierarchy.ts`
- Modify: `src/tools/index.ts` (barrel)
- Modify: `src/index.ts` (register tool)
- Create: `tests/round3-tools.test.ts`

### Step 1: Create `src/lib/anchors.ts`

```typescript
/**
 * Anchors — Immutable facts that persist across context compactions.
 * 
 * Stored in .hivemind/anchors.json.
 * Injected into system prompts via session-lifecycle hook.
 */
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { dirname, join } from "path";

export interface Anchor {
  key: string;
  value: string;
  created_at: number;
  session_id: string;
}

export interface AnchorsState {
  anchors: Anchor[];
  version: string;
}

const ANCHORS_VERSION = "1.0.0";

function getAnchorsPath(projectRoot: string): string {
  return join(projectRoot, ".hivemind", "anchors.json");
}

export async function loadAnchors(projectRoot: string): Promise<AnchorsState> {
  const path = getAnchorsPath(projectRoot);
  try {
    if (existsSync(path)) {
      const data = await readFile(path, "utf-8");
      return JSON.parse(data) as AnchorsState;
    }
  } catch {
    // Fall through to default
  }
  return { anchors: [], version: ANCHORS_VERSION };
}

export async function saveAnchors(
  projectRoot: string,
  state: AnchorsState
): Promise<void> {
  const path = getAnchorsPath(projectRoot);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(state, null, 2));
}

export function addAnchor(
  state: AnchorsState,
  key: string,
  value: string,
  sessionId: string
): AnchorsState {
  // Replace if key exists, otherwise append
  const filtered = state.anchors.filter(a => a.key !== key);
  return {
    ...state,
    anchors: [
      ...filtered,
      { key, value, created_at: Date.now(), session_id: sessionId },
    ],
  };
}

export function removeAnchor(state: AnchorsState, key: string): AnchorsState {
  return {
    ...state,
    anchors: state.anchors.filter(a => a.key !== key),
  };
}

export function formatAnchorsForPrompt(state: AnchorsState): string {
  if (state.anchors.length === 0) return "";
  const lines = ["<immutable-anchors>"];
  lines.push("These are IMMUTABLE ANCHORS. Override any chat history that conflicts with them:");
  for (const a of state.anchors) {
    lines.push(`  [${a.key}]: ${a.value}`);
  }
  lines.push("</immutable-anchors>");
  return lines.join("\n");
}
```

### Step 2: Create `src/tools/scan-hierarchy.ts`

```typescript
/**
 * scan_hierarchy — Structured read of current session state.
 *
 * Agent Thought: "What am I working on right now?"
 *
 * Design:
 *   1. Iceberg — 0 required args
 *   2. Context Inference — reads active brain state
 *   3. Signal-to-Noise — structured JSON output
 */
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool";
import { createStateManager } from "../lib/persistence.js";
import { loadAnchors } from "../lib/anchors.js";

export function createScanHierarchyTool(directory: string): ToolDefinition {
  return tool({
    description:
      "See your current session state — hierarchy, metrics, and anchors. " +
      "Call this when you want to know what you're working on.",
    args: {},
    async execute() {
      const stateManager = createStateManager(directory);
      const state = await stateManager.load();
      if (!state) {
        return "No active session. Call declare_intent to start.";
      }

      const anchorsState = await loadAnchors(directory);
      
      const result = {
        session: {
          id: state.session.id,
          mode: state.session.mode,
          status: state.session.governance_status,
          date: state.session.date,
          role: state.session.role,
        },
        hierarchy: {
          trajectory: state.hierarchy.trajectory || "(not set)",
          tactic: state.hierarchy.tactic || "(not set)",
          action: state.hierarchy.action || "(not set)",
        },
        metrics: {
          turns: state.metrics.turn_count,
          drift_score: state.metrics.drift_score,
          files_touched: state.metrics.files_touched.length,
          context_updates: state.metrics.context_updates,
        },
        anchors: anchorsState.anchors.map(a => `[${a.key}]: ${a.value}`),
      };

      return JSON.stringify(result, null, 2);
    },
  });
}
```

### Step 3: Register in tools barrel + plugin entry

In `src/tools/index.ts`, add:
```typescript
export { createScanHierarchyTool } from "./scan-hierarchy.js";
```

In `src/index.ts`, add to the tool array:
```typescript
import { createScanHierarchyTool } from "./tools/index.js";
// ... in the return:
tool: [
  createDeclareIntentTool(effectiveDir),
  createMapContextTool(effectiveDir),
  createCompactSessionTool(effectiveDir),
  createSelfRateTool(effectiveDir),
  createScanHierarchyTool(effectiveDir),
],
```

### Step 4: Write anchor tests in `tests/round3-tools.test.ts` (14 assertions)

Test anchors CRUD (8):
- loadAnchors returns empty state for new project
- addAnchor adds to state
- addAnchor replaces existing key
- removeAnchor removes by key
- formatAnchorsForPrompt with 0 anchors returns empty string
- formatAnchorsForPrompt includes key-value pairs
- formatAnchorsForPrompt includes immutable-anchors tags
- saveAnchors + loadAnchors roundtrip

Test scan_hierarchy (6):
- Returns error when no session
- Returns valid JSON with session info
- Returns hierarchy levels
- Returns metrics
- Returns anchors list
- Returns "(not set)" for empty hierarchy levels

### Step 5: Run tests + typecheck + commit

---

## Task 2: save_anchor Tool

**Files:**
- Create: `src/tools/save-anchor.ts`
- Modify: `src/tools/index.ts` (barrel)
- Modify: `src/index.ts` (register)
- Modify: `src/hooks/session-lifecycle.ts` (inject anchors into system prompt)
- Add tests to `tests/round3-tools.test.ts`

### Step 1: Create `src/tools/save-anchor.ts`

```typescript
/**
 * save_anchor — Save an immutable fact that persists across compactions.
 *
 * Agent Thought: "I must remember this constraint."
 *
 * Design:
 *   1. Iceberg — 2 args (key, value)
 *   2. Context Inference — session ID from brain state
 *   3. Signal-to-Noise — 1-line confirmation
 */
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool";
import { createStateManager } from "../lib/persistence.js";
import { loadAnchors, saveAnchors, addAnchor } from "../lib/anchors.js";

export function createSaveAnchorTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Save a critical constraint or fact that must not be forgotten, " +
      "even after session compaction. Use for database schemas, API keys, requirements.",
    args: {
      key: tool.schema
        .string()
        .describe("Short label for the anchor (e.g., 'DB_SCHEMA', 'API_PORT')"),
      value: tool.schema
        .string()
        .describe("The immutable fact or constraint"),
    },
    async execute(args) {
      const stateManager = createStateManager(directory);
      const state = await stateManager.load();
      const sessionId = state?.session.id || "unknown";

      let anchorsState = await loadAnchors(directory);
      anchorsState = addAnchor(anchorsState, args.key, args.value, sessionId);
      await saveAnchors(directory, anchorsState);

      return `Anchor saved: [${args.key}] = "${args.value}". ${anchorsState.anchors.length} total anchors.`;
    },
  });
}
```

### Step 2: Register in barrel + plugin entry

Add to `src/tools/index.ts`:
```typescript
export { createSaveAnchorTool } from "./save-anchor.js";
```

Add to `src/index.ts` tool array:
```typescript
createSaveAnchorTool(effectiveDir),
```

### Step 3: Inject anchors into system prompt

In `src/hooks/session-lifecycle.ts`, after loading state, add:

```typescript
import { loadAnchors, formatAnchorsForPrompt } from "../lib/anchors.js";

// ... inside hook, after hierarchy context + chain breaks, before </hivemind-governance>:
const anchorsState = await loadAnchors(directory);
const anchorsPrompt = formatAnchorsForPrompt(anchorsState);
if (anchorsPrompt) {
  lines.push(anchorsPrompt);
}
```

### Step 4: Add tests (6 assertions)

- save_anchor saves to anchors.json
- save_anchor replaces existing key
- save_anchor returns confirmation with count
- Anchors survive session compaction (create anchor → compact → load → still there)
- System prompt includes anchors after save
- System prompt includes immutable-anchors tag

### Step 5: Run tests + typecheck + commit

---

## Task 3: think_back Tool

**Files:**
- Create: `src/tools/think-back.ts`
- Modify: `src/tools/index.ts` (barrel)
- Modify: `src/index.ts` (register)
- Add tests to `tests/round3-tools.test.ts`

### Step 1: Create `src/tools/think-back.ts`

```typescript
/**
 * think_back — Context refresh. Summarizes current state to help refocus.
 *
 * Agent Thought: "I'm lost, help me refocus."
 *
 * Design:
 *   1. Iceberg — 0 required args
 *   2. Context Inference — reads all state
 *   3. Signal-to-Noise — structured summary
 */
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool";
import { createStateManager } from "../lib/persistence.js";
import { loadAnchors } from "../lib/anchors.js";
import { readActiveMd } from "../lib/planning-fs.js";
import { detectChainBreaks } from "../lib/chain-analysis.js";

export function createThinkBackTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Pause and refocus. Shows your current trajectory, anchors, " +
      "what you've accomplished, and any issues. Use when you feel lost or stuck.",
    args: {},
    async execute() {
      const stateManager = createStateManager(directory);
      const state = await stateManager.load();
      if (!state) {
        return "No active session. Call declare_intent to start.";
      }

      const anchorsState = await loadAnchors(directory);
      const activeMd = await readActiveMd(directory);
      const chainBreaks = detectChainBreaks(state);

      const lines: string[] = [];
      lines.push("=== THINK BACK: Context Refresh ===");
      lines.push("");
      
      // Current focus
      lines.push("## Where You Are");
      lines.push(`Mode: ${state.session.mode}`);
      if (state.hierarchy.trajectory) lines.push(`Trajectory: ${state.hierarchy.trajectory}`);
      if (state.hierarchy.tactic) lines.push(`Tactic: ${state.hierarchy.tactic}`);
      if (state.hierarchy.action) lines.push(`Action: ${state.hierarchy.action}`);
      lines.push("");

      // Health check
      lines.push("## Session Health");
      lines.push(`Turns: ${state.metrics.turn_count} | Drift: ${state.metrics.drift_score}/100`);
      lines.push(`Files touched: ${state.metrics.files_touched.length}`);
      lines.push(`Context updates: ${state.metrics.context_updates}`);
      if (chainBreaks.length > 0) {
        lines.push("⚠ Chain breaks:");
        chainBreaks.forEach(b => lines.push(`  - ${b.message}`));
      }
      lines.push("");

      // Anchors
      if (anchorsState.anchors.length > 0) {
        lines.push("## Immutable Anchors");
        anchorsState.anchors.forEach(a => lines.push(`  [${a.key}]: ${a.value}`));
        lines.push("");
      }

      // Files
      if (state.metrics.files_touched.length > 0) {
        lines.push("## Files Touched");
        const maxShow = 10;
        state.metrics.files_touched.slice(0, maxShow).forEach(f => lines.push(`  - ${f}`));
        if (state.metrics.files_touched.length > maxShow) {
          lines.push(`  ... and ${state.metrics.files_touched.length - maxShow} more`);
        }
        lines.push("");
      }

      // Active plan
      if (activeMd.body.includes("## Plan")) {
        const planStart = activeMd.body.indexOf("## Plan");
        const planEnd = activeMd.body.indexOf("\n## ", planStart + 1);
        const planSection = planEnd > -1 
          ? activeMd.body.substring(planStart, planEnd)
          : activeMd.body.substring(planStart);
        lines.push(planSection.trim());
        lines.push("");
      }

      lines.push("=== END THINK BACK ===");
      return lines.join("\n");
    },
  });
}
```

### Step 2: Register in barrel + plugin entry

Add to `src/tools/index.ts` and `src/index.ts`.

### Step 3: Add tests (6 assertions)

- Returns error when no session
- Includes trajectory in output
- Includes session health metrics
- Includes anchors when present
- Includes chain break warnings
- Includes plan section from active.md

### Step 4: Run tests + typecheck + commit

---

## Task 4: check_drift Tool

**Files:**
- Create: `src/tools/check-drift.ts`
- Modify: `src/tools/index.ts` (barrel)
- Modify: `src/index.ts` (register)
- Add tests to `tests/round3-tools.test.ts`

### Step 1: Create `src/tools/check-drift.ts`

```typescript
/**
 * check_drift — Verify current work against declared trajectory.
 *
 * Agent Thought: "Am I still on track?"
 *
 * Design:
 *   1. Iceberg — 0 required args
 *   2. Context Inference — reads trajectory + metrics
 *   3. Signal-to-Noise — structured drift report
 */
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool";
import { createStateManager } from "../lib/persistence.js";
import { loadAnchors } from "../lib/anchors.js";
import { detectChainBreaks } from "../lib/chain-analysis.js";
import { calculateDriftScore } from "../schemas/brain-state.js";

export function createCheckDriftTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Check if your current work aligns with your declared trajectory. " +
      "Returns a drift report with health indicators. Use before marking work complete.",
    args: {},
    async execute() {
      const stateManager = createStateManager(directory);
      const state = await stateManager.load();
      if (!state) {
        return "No active session. Call declare_intent to start.";
      }

      const anchorsState = await loadAnchors(directory);
      const chainBreaks = detectChainBreaks(state);
      const driftScore = calculateDriftScore(state);

      const lines: string[] = [];
      lines.push("=== DRIFT REPORT ===");
      lines.push("");

      // Overall health
      const healthEmoji = driftScore >= 70 ? "✅" : driftScore >= 40 ? "⚠️" : "❌";
      lines.push(`${healthEmoji} Drift Score: ${driftScore}/100`);
      lines.push("");

      // Trajectory check
      lines.push("## Trajectory Alignment");
      if (state.hierarchy.trajectory) {
        lines.push(`Original: ${state.hierarchy.trajectory}`);
        if (state.hierarchy.tactic) {
          lines.push(`Current tactic: ${state.hierarchy.tactic}`);
        }
        if (state.hierarchy.action) {
          lines.push(`Current action: ${state.hierarchy.action}`);
        }
      } else {
        lines.push("⚠ No trajectory set. Use declare_intent to set your focus.");
      }
      lines.push("");

      // Chain integrity
      lines.push("## Chain Integrity");
      if (chainBreaks.length === 0) {
        lines.push("✅ Hierarchy chain is intact.");
      } else {
        chainBreaks.forEach(b => lines.push(`❌ ${b.message}`));
      }
      lines.push("");

      // Anchor compliance
      if (anchorsState.anchors.length > 0) {
        lines.push("## Anchor Compliance");
        lines.push("Verify your work respects these immutable constraints:");
        anchorsState.anchors.forEach(a => lines.push(`  ☐ [${a.key}]: ${a.value}`));
        lines.push("");
      }

      // Metrics summary
      lines.push("## Metrics");
      lines.push(`Turns: ${state.metrics.turn_count}`);
      lines.push(`Files: ${state.metrics.files_touched.length}`);
      lines.push(`Context updates: ${state.metrics.context_updates}`);
      if (state.metrics.violation_count > 0) {
        lines.push(`⚠ Violations: ${state.metrics.violation_count}`);
      }
      lines.push("");

      // Recommendation
      lines.push("## Recommendation");
      if (driftScore >= 70 && chainBreaks.length === 0) {
        lines.push("✅ On track. Continue working.");
      } else if (driftScore >= 40) {
        lines.push("⚠ Some drift detected. Consider using map_context to update your focus.");
      } else {
        lines.push("❌ Significant drift. Use map_context to re-focus, or compact_session to reset.");
      }

      lines.push("");
      lines.push("=== END DRIFT REPORT ===");
      return lines.join("\n");
    },
  });
}
```

### Step 2: Register in barrel + plugin entry

Add to `src/tools/index.ts` and `src/index.ts`.

### Step 3: Add tests (6 assertions)

- Returns error when no session
- Shows drift score with emoji
- Shows trajectory alignment
- Shows chain integrity (pass when intact)
- Shows chain integrity (fail when broken)
- Shows recommendation based on drift score

### Step 4: Run tests + typecheck + commit

---

## Task 5: Integration Tests + Final Verification

**Files:**
- Modify: `tests/integration.test.ts`

### Step 1: Add integration tests (8 assertions)

```
test: round3 — scan_hierarchy returns structured state
test: round3 — save_anchor persists and survives compaction  
test: round3 — anchors injected into system prompt
test: round3 — think_back includes all context sections
test: round3 — check_drift shows healthy when aligned
test: round3 — check_drift warns when drifting
test: round3 — full cognitive mesh workflow (anchor → think → drift check)
```

### Step 2: Run full suite + typecheck + commit

---

## Summary

| Task | New Files | Modified Files | Est. Assertions |
|------|-----------|---------------|-----------------|
| 1. Anchors + scan_hierarchy | 2 (`anchors.ts`, `scan-hierarchy.ts`) + 1 test | 2 (`tools/index`, `src/index`) | ~20 |
| 2. save_anchor | 1 (`save-anchor.ts`) | 3 (`tools/index`, `src/index`, `session-lifecycle.ts`) | ~6 |
| 3. think_back | 1 (`think-back.ts`) | 2 (`tools/index`, `src/index`) | ~6 |
| 4. check_drift | 1 (`check-drift.ts`) | 2 (`tools/index`, `src/index`) | ~6 |
| 5. Integration Tests | — | 1 (`integration.test.ts`) | ~8 |
| **Total** | **5 new** | **5 modified** | **~46 new** |

**Post-Round 3 target:** 232 + 46 = **~278 tests**, all passing.
**New tool count:** 4 existing + 4 new = **8 tools total**.
