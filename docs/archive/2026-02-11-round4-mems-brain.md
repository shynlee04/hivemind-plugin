# Round 4: The Mems Brain — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Add a persistent cross-session memory system ("Mems Brain") with organized shelves, unique IDs, and just-in-time recall — giving agents long-term memory that survives compactions, sessions, and context resets.

**Architecture:** Single JSON store (`.hivemind/mems.json`) with shelf-organized memories. 3 new tools (`save_mem`, `recall_mems`, `list_shelves`) following 10 Commandments. Hook integrations: auto-mem on compaction + system prompt mem count + compaction context preservation. Keyword search (no embeddings) for lightweight recall.

**Tech Stack:** TypeScript, `@opencode-ai/plugin/tool`, existing pure function patterns from `src/lib/`.

**Baseline:** 278 tests passing, TypeScript clean, 9 test files, 8 tools, 4 hooks.

**Key difference from Anchors:** Anchors are immutable, always-injected key-value facts. Mems are rich, tagged, searchable memories across sessions with just-in-time recall (agent chooses when to search).

---

## Task 1: Mems Persistence Layer (Pure Functions)

**Files:**
- Create: `src/lib/mems.ts`
- Create: `tests/round4-mems.test.ts`

### Step 1: Create `src/lib/mems.ts`

```typescript
/**
 * Mems — Persistent cross-session memory with organized shelves.
 *
 * Stored in .hivemind/mems.json.
 * Survives compactions, session resets, and context boundaries.
 *
 * Design: Pure functions + IO wrappers (same pattern as anchors.ts).
 */
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { dirname, join } from "path";

// ─── Types ────────────────────────────────────────────────────────────

/** Built-in shelf categories. Custom strings also allowed. */
export type BuiltinShelf = "decisions" | "patterns" | "errors" | "solutions" | "context";

export interface Mem {
  id: string;
  shelf: string;
  content: string;
  tags: string[];
  session_id: string;
  created_at: number;
}

export interface MemsState {
  mems: Mem[];
  version: string;
}

// ─── Constants ────────────────────────────────────────────────────────

const MEMS_VERSION = "1.0.0";

export const BUILTIN_SHELVES: readonly BuiltinShelf[] = [
  "decisions",
  "patterns",
  "errors",
  "solutions",
  "context",
] as const;

// ─── ID Generation ───────────────────────────────────────────────────

/** Generate unique mem ID: mem_<timestamp>_<random4> */
export function generateMemId(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 6);
  return `mem_${ts}_${rand}`;
}

// ─── IO ──────────────────────────────────────────────────────────────

function getMemsPath(projectRoot: string): string {
  return join(projectRoot, ".hivemind", "mems.json");
}

export async function loadMems(projectRoot: string): Promise<MemsState> {
  const path = getMemsPath(projectRoot);
  try {
    if (existsSync(path)) {
      const data = await readFile(path, "utf-8");
      return JSON.parse(data) as MemsState;
    }
  } catch {
    // Fall through to default
  }
  return { mems: [], version: MEMS_VERSION };
}

export async function saveMems(
  projectRoot: string,
  state: MemsState
): Promise<void> {
  const path = getMemsPath(projectRoot);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(state, null, 2));
}

// ─── Pure Functions ──────────────────────────────────────────────────

/** Add a mem to state. Pure function. */
export function addMem(
  state: MemsState,
  shelf: string,
  content: string,
  tags: string[],
  sessionId: string
): MemsState {
  const mem: Mem = {
    id: generateMemId(),
    shelf,
    content,
    tags,
    session_id: sessionId,
    created_at: Date.now(),
  };
  return {
    ...state,
    mems: [...state.mems, mem],
  };
}

/** Remove a mem by ID. Pure function. */
export function removeMem(state: MemsState, memId: string): MemsState {
  return {
    ...state,
    mems: state.mems.filter((m) => m.id !== memId),
  };
}

/**
 * Search mems by keyword query. Case-insensitive substring match
 * against content + tags. Optionally filter by shelf.
 * Returns newest first.
 */
export function searchMems(
  state: MemsState,
  query: string,
  shelf?: string
): Mem[] {
  const q = query.toLowerCase();
  return state.mems
    .filter((m) => {
      if (shelf && m.shelf !== shelf) return false;
      const inContent = m.content.toLowerCase().includes(q);
      const inTags = m.tags.some((t) => t.toLowerCase().includes(q));
      return inContent || inTags;
    })
    .sort((a, b) => b.created_at - a.created_at);
}

/** Get mems filtered by shelf. Returns newest first. */
export function getMemsByShelf(state: MemsState, shelf: string): Mem[] {
  return state.mems
    .filter((m) => m.shelf === shelf)
    .sort((a, b) => b.created_at - a.created_at);
}

/** Get shelf summary: { shelf: count } */
export function getShelfSummary(
  state: MemsState
): Record<string, number> {
  const summary: Record<string, number> = {};
  for (const m of state.mems) {
    summary[m.shelf] = (summary[m.shelf] || 0) + 1;
  }
  return summary;
}

/** Format mems count for system prompt. Lightweight — no content. */
export function formatMemsForPrompt(state: MemsState): string {
  if (state.mems.length === 0) return "";
  const summary = getShelfSummary(state);
  const parts = Object.entries(summary)
    .map(([shelf, count]) => `${shelf}(${count})`)
    .join(", ");
  return `🧠 Mems Brain: ${state.mems.length} memories [${parts}]. Use recall_mems to search.`;
}
```

### Step 2: Write tests in `tests/round4-mems.test.ts` (20 assertions)

```
Test groups:
--- mems: persistence + CRUD (10) ---
  1. loadMems returns empty state for new project
  2. addMem adds to state
  3. addMem generates unique ID
  4. addMem preserves tags
  5. removeMem removes by ID
  6. removeMem no-ops for unknown ID
  7. saveMems + loadMems roundtrip
  8. generateMemId format is mem_<digits>_<chars>
  9. generateMemId generates unique IDs
  10. getShelfSummary counts correctly

--- mems: search (6) ---
  11. searchMems matches content substring (case-insensitive)
  12. searchMems matches tags
  13. searchMems filters by shelf
  14. searchMems returns empty for no match
  15. searchMems returns newest first
  16. getMemsByShelf filters correctly

--- mems: prompt formatting (4) ---
  17. formatMemsForPrompt returns empty for 0 mems
  18. formatMemsForPrompt shows count and shelf breakdown
  19. formatMemsForPrompt includes "recall_mems" suggestion
  20. formatMemsForPrompt handles multiple shelves
```

Follow the same harness pattern from `tests/round3-tools.test.ts`:
- `let passed = 0; let failed_ = 0;` counter
- `function assert(cond, name)` helper
- `makeTmpDir()` / `cleanTmpDir()` helpers
- Main function with process.exit

### Step 3: Run tests + typecheck

Run: `npm test && npm run typecheck`
Expected: All existing 278 + 20 new = 298 assertions passing, typecheck clean.

### Step 4: Commit

```bash
git add src/lib/mems.ts tests/round4-mems.test.ts
git commit -m "feat: add Mems Brain persistence layer with search and shelf organization"
```

---

## Task 2: save_mem + list_shelves Tools

**Files:**
- Create: `src/tools/save-mem.ts`
- Create: `src/tools/list-shelves.ts`
- Modify: `src/tools/index.ts` (barrel — add exports)
- Modify: `src/index.ts` (register 2 new tools)
- Add tests to: `tests/round4-mems.test.ts`

### Step 1: Create `src/tools/save-mem.ts`

```typescript
/**
 * save_mem — Save a memory to the Mems Brain.
 *
 * Agent Thought: "I should remember this for future sessions."
 *
 * Design:
 *   1. Iceberg — 2 required args (shelf, content)
 *   2. Context Inference — session ID from brain state
 *   3. Signal-to-Noise — 1-line confirmation
 */
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool";
import { createStateManager } from "../lib/persistence.js";
import { loadMems, saveMems, addMem, BUILTIN_SHELVES } from "../lib/mems.js";

export function createSaveMemTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Save a memory to the Mems Brain — decisions, patterns, errors, solutions. " +
      "These persist across sessions and compactions. Use for lessons learned, architecture decisions, error patterns.",
    args: {
      shelf: tool.schema
        .string()
        .describe(
          `Category: ${BUILTIN_SHELVES.join(", ")} (or custom)`
        ),
      content: tool.schema
        .string()
        .describe("The memory content to save"),
      tags: tool.schema
        .string()
        .optional()
        .describe("Comma-separated tags for searchability (e.g., 'auth,jwt,middleware')"),
    },
    async execute(args) {
      const stateManager = createStateManager(directory);
      const state = await stateManager.load();
      const sessionId = state?.session.id || "unknown";

      const tagList = args.tags
        ? args.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [];

      let memsState = await loadMems(directory);
      memsState = addMem(memsState, args.shelf, args.content, tagList, sessionId);
      await saveMems(directory, memsState);

      return `Memory saved to [${args.shelf}]. ${memsState.mems.length} total memories. Tags: ${tagList.length > 0 ? tagList.join(", ") : "(none)"}`;
    },
  });
}
```

### Step 2: Create `src/tools/list-shelves.ts`

```typescript
/**
 * list_shelves — Show Mems Brain shelf summary.
 *
 * Agent Thought: "What's in my long-term memory?"
 *
 * Design:
 *   1. Iceberg — 0 required args
 *   2. Context Inference — reads mems.json
 *   3. Signal-to-Noise — structured shelf overview
 */
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool";
import { loadMems, getShelfSummary, BUILTIN_SHELVES } from "../lib/mems.js";

export function createListShelvesTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Show what's stored in the Mems Brain — shelf counts and recent entries. " +
      "Use this to check what long-term memories exist before searching.",
    args: {},
    async execute() {
      const memsState = await loadMems(directory);

      if (memsState.mems.length === 0) {
        return "Mems Brain is empty. Use save_mem to store decisions, patterns, errors, or solutions.";
      }

      const summary = getShelfSummary(memsState);
      const lines: string[] = [];
      lines.push("=== MEMS BRAIN ===");
      lines.push("");
      lines.push(`Total memories: ${memsState.mems.length}`);
      lines.push("");

      // Show all shelves with counts
      lines.push("## Shelves");
      for (const shelf of BUILTIN_SHELVES) {
        const count = summary[shelf] || 0;
        lines.push(`  ${shelf}: ${count}`);
      }
      // Show custom shelves
      for (const [shelf, count] of Object.entries(summary)) {
        if (!(BUILTIN_SHELVES as readonly string[]).includes(shelf)) {
          lines.push(`  ${shelf}: ${count} (custom)`);
        }
      }
      lines.push("");

      // Show 3 most recent mems
      const recent = memsState.mems
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, 3);

      lines.push("## Recent Memories");
      for (const m of recent) {
        const date = new Date(m.created_at).toISOString().split("T")[0];
        const preview = m.content.length > 60
          ? m.content.slice(0, 57) + "..."
          : m.content;
        lines.push(`  [${m.shelf}] ${date}: ${preview}`);
      }
      lines.push("");
      lines.push("Use recall_mems to search memories by keyword.");
      lines.push("=== END MEMS BRAIN ===");

      return lines.join("\n");
    },
  });
}
```

### Step 3: Register in tools barrel + plugin entry

In `src/tools/index.ts`, add:
```typescript
export { createSaveMemTool } from "./save-mem.js"
export { createListShelvesTool } from "./list-shelves.js"
```

In `src/index.ts`, add imports and to tool array:
```typescript
import { createSaveMemTool, createListShelvesTool } from "./tools/index.js"
// In tool array:
createSaveMemTool(effectiveDir),
createListShelvesTool(effectiveDir),
```

Update the JSDoc comment in `src/index.ts` to show "10 Tools" and list the new ones.

### Step 4: Add tests to `tests/round4-mems.test.ts` (8 assertions)

```
--- save_mem: tool tests (5) ---
  1. save_mem saves to mems.json
  2. save_mem with tags stores tag array
  3. save_mem returns confirmation with shelf and count
  4. save_mem assigns unique IDs to each memory
  5. mems survive session compaction (save mem → reset brain state → load mems → still there)

--- list_shelves: tool tests (3) ---
  6. list_shelves returns empty message for no mems
  7. list_shelves shows shelf counts
  8. list_shelves shows recent memories
```

### Step 5: Run tests + typecheck + commit

Run: `npm test && npm run typecheck`
Expected: 298 + 8 = 306 assertions passing.

```bash
git add src/tools/save-mem.ts src/tools/list-shelves.ts src/tools/index.ts src/index.ts tests/round4-mems.test.ts
git commit -m "feat: add save_mem and list_shelves tools for Mems Brain"
```

---

## Task 3: recall_mems Tool

**Files:**
- Create: `src/tools/recall-mems.ts`
- Modify: `src/tools/index.ts` (barrel)
- Modify: `src/index.ts` (register)
- Add tests to: `tests/round4-mems.test.ts`

### Step 1: Create `src/tools/recall-mems.ts`

```typescript
/**
 * recall_mems — Search the Mems Brain for relevant memories.
 *
 * Agent Thought: "Have I seen this problem/pattern before?"
 *
 * Design:
 *   1. Iceberg — 1 required arg (query)
 *   2. Context Inference — reads mems.json, optional shelf filter
 *   3. Signal-to-Noise — structured search results
 */
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool";
import { loadMems, searchMems } from "../lib/mems.js";

const MAX_RESULTS = 5;

export function createRecallMemsTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Search the Mems Brain for relevant memories by keyword. " +
      "Returns matching decisions, patterns, errors, and solutions from all sessions. " +
      "Use when you encounter a familiar problem or need past context.",
    args: {
      query: tool.schema
        .string()
        .describe("Search keyword (matches content and tags, case-insensitive)"),
      shelf: tool.schema
        .string()
        .optional()
        .describe("Optional: filter results to a specific shelf (e.g., 'errors', 'decisions')"),
    },
    async execute(args) {
      const memsState = await loadMems(directory);

      if (memsState.mems.length === 0) {
        return "Mems Brain is empty. No memories to search.";
      }

      const results = searchMems(memsState, args.query, args.shelf);

      if (results.length === 0) {
        const filterNote = args.shelf ? ` in shelf "${args.shelf}"` : "";
        return `No memories found for "${args.query}"${filterNote}. Try a broader search or different keywords.`;
      }

      const shown = results.slice(0, MAX_RESULTS);
      const lines: string[] = [];
      lines.push(`=== RECALL: ${results.length} memories found for "${args.query}" ===`);
      lines.push("");

      for (const m of shown) {
        const date = new Date(m.created_at).toISOString().split("T")[0];
        lines.push(`[${m.shelf}] ${m.id} (${date})`);
        lines.push(`  ${m.content}`);
        if (m.tags.length > 0) {
          lines.push(`  Tags: ${m.tags.join(", ")}`);
        }
        lines.push("");
      }

      if (results.length > MAX_RESULTS) {
        lines.push(`... and ${results.length - MAX_RESULTS} more. Narrow your search or filter by shelf.`);
      }

      lines.push("=== END RECALL ===");
      return lines.join("\n");
    },
  });
}
```

### Step 2: Register in barrel + plugin entry

In `src/tools/index.ts`, add:
```typescript
export { createRecallMemsTool } from "./recall-mems.js"
```

In `src/index.ts`, add to tool array:
```typescript
createRecallMemsTool(effectiveDir),
```

Update JSDoc to "11 Tools".

### Step 3: Add tests (6 assertions)

```
--- recall_mems: tool tests (6) ---
  1. recall_mems returns empty message when no mems
  2. recall_mems finds matching content
  3. recall_mems finds matching tags
  4. recall_mems returns no-match message for unknown query
  5. recall_mems filters by shelf when provided
  6. recall_mems caps results at MAX_RESULTS (5)
```

### Step 4: Run tests + typecheck + commit

Run: `npm test && npm run typecheck`
Expected: 306 + 6 = 312 assertions passing.

```bash
git add src/tools/recall-mems.ts src/tools/index.ts src/index.ts tests/round4-mems.test.ts
git commit -m "feat: add recall_mems tool for just-in-time memory search"
```

---

## Task 4: Hook Integrations

**Files:**
- Modify: `src/tools/compact-session.ts` (auto-mem on compaction)
- Modify: `src/hooks/session-lifecycle.ts` (system prompt mem count)
- Modify: `src/hooks/compaction.ts` (preserve mem count in compaction context)
- Add tests to: `tests/round4-mems.test.ts`

### Step 1: Auto-mem on compaction (`compact-session.ts`)

After the export generation block (line ~107) and before resetActiveMd, add:

```typescript
import { loadMems, saveMems, addMem } from "../lib/mems.js";

// ... inside execute(), after export generation try/catch:

// Auto-save session summary as a "context" mem
try {
  let memsState = await loadMems(directory);
  const autoContent = [
    `Session ${state.session.id}:`,
    args.summary || `${state.metrics.turn_count} turns, ${state.metrics.files_touched.length} files`,
    state.hierarchy.trajectory ? `Trajectory: ${state.hierarchy.trajectory}` : "",
    state.hierarchy.tactic ? `Tactic: ${state.hierarchy.tactic}` : "",
  ].filter(Boolean).join(" | ");

  memsState = addMem(
    memsState,
    "context",
    autoContent,
    ["auto-compact", "session-summary"],
    state.session.id
  );
  await saveMems(directory, memsState);
} catch {
  // Auto-mem failure is non-fatal
}
```

### Step 2: System prompt mem count (`session-lifecycle.ts`)

After the anchors injection block (line ~135), add:

```typescript
import { loadMems, formatMemsForPrompt } from "../lib/mems.js";

// ... inside the hook, after anchorsPrompt injection:

// Mems Brain count
const memsState = await loadMems(directory);
const memsPrompt = formatMemsForPrompt(memsState);
if (memsPrompt) {
  lines.push(memsPrompt);
}
```

### Step 3: Compaction context mem count (`compaction.ts`)

After the Files section (line ~80), before the closing `=== End HiveMind Context ===`:

```typescript
import { loadMems } from "../lib/mems.js";

// ... inside the hook, after files section:

// Mems Brain summary
const memsState = await loadMems(directory);
if (memsState.mems.length > 0) {
  lines.push(`Mems Brain: ${memsState.mems.length} memories stored. Use recall_mems to search.`);
}
```

### Step 4: Add tests (6 assertions)

```
--- hook integrations (6) ---
  1. compact_session auto-saves context mem
  2. auto-saved mem has shelf "context"
  3. auto-saved mem has "auto-compact" tag
  4. system prompt includes mems count after save_mem
  5. system prompt includes "recall_mems" hint
  6. mems count shown after compaction context injection
```

### Step 5: Run tests + typecheck + commit

Run: `npm test && npm run typecheck`
Expected: 312 + 6 = 318 assertions passing.

```bash
git add src/tools/compact-session.ts src/hooks/session-lifecycle.ts src/hooks/compaction.ts tests/round4-mems.test.ts
git commit -m "feat: integrate Mems Brain into hooks — auto-mem on compaction, system prompt, compaction context"
```

---

## Task 5: Integration Tests + Final Verification

**Files:**
- Modify: `tests/integration.test.ts` (Round 4 integration tests)
- Modify: `AGENTS.md` (update test coverage table, version, tool count)
- Modify: `src/index.ts` (final JSDoc cleanup)

### Step 1: Add integration tests (10 assertions)

```
--- round4: save_mem persists across sessions ---
  1. save_mem stores memory in mems.json
  2. memory survives session compaction

--- round4: recall_mems searches across sessions ---
  3. recall_mems finds mems from previous sessions
  4. recall_mems filters by shelf correctly

--- round4: list_shelves shows accurate overview ---
  5. list_shelves shows total count
  6. list_shelves shows shelf breakdown

--- round4: auto-mem on compaction ---
  7. compact_session creates context mem automatically
  8. auto-mem contains session summary

--- round4: system prompt includes mems count ---
  9. session lifecycle hook shows mems brain count

--- round4: full mems brain workflow ---
  10. full workflow: save → recall → compact (auto-mem) → recall across sessions
```

### Step 2: Update AGENTS.md

Update the test coverage table:
```markdown
| Component | Assertions | Status |
|-----------|-----------|--------|
| Schema (BrainState, Hierarchy) | 35 | ✅ Pass |
| Init + Planning FS | 30 | ✅ Pass |
| Tool Gate (governance) | 12 | ✅ Pass |
| Self-Rate Tool | 28 | ✅ Pass |
| Integration (E2E workflow) | 71 | ✅ Pass |
| Auto-Hooks Pure Functions | 30 | ✅ Pass |
| Session Export | 32 | ✅ Pass |
| Session Structure | 18 | ✅ Pass |
| Round 3 Tools (Cognitive Mesh) | 32 | ✅ Pass |
| Round 4 Mems Brain | 40 | ✅ Pass |
| **Total** | **328** | ✅ **All Pass** |
```

Update tool count from 8 → 11.
Update version references.

### Step 3: Run full test suite + typecheck

Run: `npm test && npm run typecheck`
Expected: 328 total assertions, 0 failures, typecheck clean.

### Step 4: Version bump + commit

```bash
# In package.json: bump to 1.5.0
git add -A
git commit -m "feat: complete Round 4 Mems Brain — 11 tools, 328 tests

- Mems Brain persistence (mems.json) with shelf-organized memories
- save_mem: store decisions, patterns, errors, solutions with tags
- recall_mems: just-in-time keyword search across all sessions
- list_shelves: overview of stored memories
- Auto-mem on compaction: session summaries auto-saved to context shelf
- System prompt shows mem count; compaction preserves mem reference
- 11 tools total, 4 hooks, 328 assertions passing"
```

---

## Summary

| Task | New Files | Modified Files | Est. Assertions |
|------|-----------|---------------|-----------------|
| 1. Mems persistence layer | 2 (`mems.ts`, test file) | — | ~20 |
| 2. save_mem + list_shelves | 2 (`save-mem.ts`, `list-shelves.ts`) | 2 (`tools/index`, `src/index`) | ~8 |
| 3. recall_mems | 1 (`recall-mems.ts`) | 2 (`tools/index`, `src/index`) | ~6 |
| 4. Hook integrations | — | 3 (`compact-session`, `session-lifecycle`, `compaction`) | ~6 |
| 5. Integration tests + final | — | 2 (`integration.test.ts`, `AGENTS.md`) | ~10 |
| **Total** | **5 new** | **9 modified** | **~50 new** |

**Post-Round 4 target:** 278 + 50 = **~328 tests**, all passing.
**New tool count:** 8 existing + 3 new = **11 tools total**.
**New `.hivemind/` file:** `mems.json` — Mems Brain store.

### .hivemind/ Structure After Round 4

```
.hivemind/
├── brain.json          # Session state
├── config.json         # Governance settings
├── anchors.json        # Immutable anchors (R3)
├── mems.json           # Mems Brain store (R4) ← NEW
├── 10-commandments.md  # Tool design reference
├── sessions/
│   ├── index.md        # Project trajectory
│   ├── active.md       # Current session
│   └── archive/
│       ├── session_*.md
│       └── exports/
│           ├── session_*.json
│           └── session_*.md
├── plans/
│   └── archive/
└── logs/
```
