# Phase 5: Integration Reality Check — Research

**Researched:** 2026-02-11
**Domain:** OpenCode plugin SDK integration, npm distribution, runtime behavior
**Confidence:** HIGH (based on direct SDK source code analysis at `@opencode-ai/plugin@1.1.53`)

## Summary

HiveMind v1.5.0 has **4 critical bugs** that prevent it from functioning correctly when installed as an npm package into a real OpenCode project. The most severe is the tool registration format: tools are registered as an array instead of a `Record<string, ToolDefinition>`, causing all 11 tools to be named "0" through "10" instead of their intended names like `declare_intent`. The agent literally cannot call any tool by name.

Beyond the showstopper, there are SDK signature mismatches (missing `model` parameter in the system transform hook), a file path bug that crashes `hivemind init` when installed from npm (the `10-commandments.md` file is not included in the package), a legacy path reference in `self-rate.ts`, a zod version mismatch between the plugin and SDK, and double-counting of turn increments across two hooks.

**Primary recommendation:** Fix the 4 critical bugs (tool registration format, missing `model` parameter, 10-commandments file path, legacy `.opencode` path), then address the HIGH-severity issues (double-counting, zod mismatch, unused `ToolContext`). The plugin is architecturally sound but has never been integration-tested against the actual SDK runtime.

---

## Critical Bugs (must fix before shipping)

### Bug 1: Tool Registration Uses Array Instead of Record — SHOWSTOPPER

**Severity:** CRITICAL
**Evidence:** `src/index.ts:80-92` vs SDK `Hooks` interface at `node_modules/@opencode-ai/plugin/dist/index.d.ts:113-115`

**SDK expects:**
```typescript
// From @opencode-ai/plugin/dist/index.d.ts line 113-115
tool?: {
    [key: string]: ToolDefinition;
};
```

**SDK example (node_modules/@opencode-ai/plugin/dist/example.js):**
```javascript
tool: {
    mytool: tool({...})  // key "mytool" becomes the tool name
}
```

**HiveMind currently does (WRONG):**
```typescript
// src/index.ts lines 80-92
tool: [
    createDeclareIntentTool(effectiveDir),    // Array index "0"
    createMapContextTool(effectiveDir),        // Array index "1"
    createCompactSessionTool(effectiveDir),    // Array index "2"
    createSelfRateTool(effectiveDir),          // Array index "3"
    ...
]
```

**Impact:** When OpenCode iterates `Object.entries(hooks.tool)`, tools get named `"0"`, `"1"`, `"2"`... instead of `"declare_intent"`, `"map_context"` etc. TypeScript doesn't catch this because arrays satisfy `{ [key: string]: any }` structurally.

**Fix:**
```typescript
tool: {
    declare_intent: createDeclareIntentTool(effectiveDir),
    map_context: createMapContextTool(effectiveDir),
    compact_session: createCompactSessionTool(effectiveDir),
    self_rate: createSelfRateTool(effectiveDir),
    scan_hierarchy: createScanHierarchyTool(effectiveDir),
    save_anchor: createSaveAnchorTool(effectiveDir),
    think_back: createThinkBackTool(effectiveDir),
    check_drift: createCheckDriftTool(effectiveDir),
    save_mem: createSaveMemTool(effectiveDir),
    list_shelves: createListShelvesTool(effectiveDir),
    recall_mems: createRecallMemsTool(effectiveDir),
},
```

**Confidence:** HIGH — verified against SDK source code and official example.

---

### Bug 2: `experimental.chat.system.transform` Missing `model` Parameter

**Severity:** CRITICAL
**Evidence:** `src/hooks/session-lifecycle.ts:53-54` vs SDK `Hooks` interface at `index.d.ts:194-199`

**SDK expects:**
```typescript
// From @opencode-ai/plugin/dist/index.d.ts lines 194-199
"experimental.chat.system.transform"?: (input: {
    sessionID?: string;
    model: Model;     // <-- REQUIRED field
}, output: {
    system: string[];
}) => Promise<void>;
```

**HiveMind has:**
```typescript
// src/hooks/session-lifecycle.ts lines 53-55
return async (
    input: { sessionID?: string },  // <-- Missing `model: Model`
    output: { system: string[] }
): Promise<void> => {
```

**Impact:** The hook will work at runtime (JavaScript doesn't enforce types), but:
1. TypeScript type mismatch — the hook type doesn't conform to SDK `Hooks` interface
2. The `model` property is available but unused — this could be valuable for model-specific governance (e.g., different token budgets per model)
3. Future SDK versions that validate hook signatures may reject this

**Fix:** Add `model` to the input type:
```typescript
import type { Model } from "@opencode-ai/plugin"
// ...
return async (
    input: { sessionID?: string; model: Model },
    output: { system: string[] }
): Promise<void> => {
```

**Confidence:** HIGH — verified against SDK source code.

---

### Bug 3: `hivemind init` Crashes on npm Install — 10 Commandments File Path

**Severity:** CRITICAL
**Evidence:** `src/cli/init.ts:184-186` and `package.json:12-18`

**The code:**
```typescript
// src/cli/init.ts line 184
const commandmentsSource = join(__dirname, "..", "..", "docs", "10-commandments.md")
// At runtime in dist/cli/init.js this resolves to:
// dist/cli/../../docs/10-commandments.md → docs/10-commandments.md
```

**The package.json `files` field:**
```json
"files": ["dist", "src", "README.md", "LICENSE", "CHANGELOG.md"]
```

The `docs/` directory is **NOT** included in `files`. When installed via npm, `docs/10-commandments.md` does not exist. The `copyFile` call at line 186 will throw `ENOENT`, crashing `hivemind init`.

**Fix (two options, use option A):**

**Option A — Include docs in package:**
```json
"files": ["dist", "src", "docs", "README.md", "LICENSE", "CHANGELOG.md"]
```

**Option B — Embed content inline:** Generate the file content from a template string instead of copying from disk. This avoids the file dependency entirely.

**Confidence:** HIGH — verified by checking `package.json` files array and confirming `docs/` is not listed.

---

### Bug 4: `self-rate.ts` Uses Legacy `.opencode/planning/logs` Path

**Severity:** CRITICAL
**Evidence:** `src/tools/self-rate.ts:42-44`

**The code:**
```typescript
// src/tools/self-rate.ts lines 42-44
const log = await createLogger(
    join(directory, ".opencode", "planning", "logs"),  // WRONG - legacy path
    "self-rate"
)
```

**Context:** The project migrated from `.opencode/planning/` to `.hivemind/` in v1.4.0 (documented in `docs/migration-guide-v1.3-to-v1.4.md`). Every other tool and hook uses `.hivemind/` paths. This is the sole remaining reference to the old path.

**Impact:** Creates a rogue `.opencode/planning/logs/self-rate.log` file in the project. Logs end up in the wrong directory. If `.opencode` doesn't exist, the log write silently fails (due to catch block in logger), so the tool works but loses observability.

**Fix:**
```typescript
const log = await createLogger(
    join(directory, ".hivemind", "logs"),
    "self-rate"
)
```

**Confidence:** HIGH — grep confirms only 2 references to `.opencode` in entire `src/` directory. The other is a stale comment in `cli/init.ts:5`.

---

## SDK Compatibility Issues

### Issue 1: Plugin Input Destructuring is Incomplete

**Severity:** MEDIUM
**Evidence:** `src/index.ts:60-63` vs SDK `PluginInput` at `index.d.ts:10-17`

**SDK provides:**
```typescript
export type PluginInput = {
    client: ReturnType<typeof createOpencodeClient>;
    project: Project;
    directory: string;
    worktree: string;
    serverUrl: URL;
    $: BunShell;
};
```

**HiveMind uses:**
```typescript
export const HiveMindPlugin: Plugin = async ({
    directory,
    worktree,
}) => {
```

**Impact:** The plugin ignores `client`, `project`, `serverUrl`, and `$`. This is not a bug — destructuring only what you need is valid. But `project` could provide useful context (project name, root), and `$` could replace manual `child_process` usage if needed in future.

**Fix:** No fix needed now. Document as enhancement opportunity.

---

### Issue 2: All 11 Tools Ignore the `ToolContext` Second Parameter

**Severity:** MEDIUM
**Evidence:** SDK `tool()` type at `tool.d.ts:33-36` vs all tool execute functions

**SDK provides:**
```typescript
execute(args: z.infer<z.ZodObject<Args>>, context: ToolContext): Promise<string>;
```

Where `ToolContext` includes:
```typescript
export type ToolContext = {
    sessionID: string;      // ← Could replace custom session tracking
    messageID: string;
    agent: string;
    directory: string;      // ← Duplicates closure-captured directory
    worktree: string;
    abort: AbortSignal;     // ← Could support cancellation
    metadata(input: {...}): void;  // ← Could set tool result metadata
    ask(input: AskInput): Promise<void>;  // ← Could ask permissions
};
```

**HiveMind's tools all do:**
```typescript
async execute(args) {    // no second parameter
    // Uses closure-captured `directory` instead of context.directory
    // Ignores context.sessionID, context.abort, etc.
}
```

**Impact:**
1. `directory` is captured in closure but also available via `context.directory` — potential inconsistency if OpenCode changes directory mid-session
2. `context.abort` (AbortSignal) is ignored — long-running tool calls can't be cancelled
3. `context.metadata()` is ignored — tool results don't have structured metadata for OpenCode UI
4. `context.sessionID` is ignored — plugin manages its own session IDs instead of using OpenCode's

**Fix:** Add `context` parameter to critical tools:
```typescript
async execute(args, context) {
    const effectiveDir = context.directory || directory;
    // Use context.sessionID for correlation
    // Check context.abort.aborted before long operations
}
```

**Confidence:** HIGH — verified all 11 tool files, none accept `context`.

---

### Issue 3: Zod Version Mismatch

**Severity:** MEDIUM
**Evidence:** `package.json:54` vs `node_modules/@opencode-ai/plugin/package.json:26`

**HiveMind declares:**
```json
"dependencies": {
    "zod": "^3.22.4"
}
```

**SDK uses:**
```json
"dependencies": {
    "zod": "4.1.8"
}
```

**Impact:** The plugin imports `tool.schema` (which is `z` from the SDK's zod 4.x), but also declares `zod@^3.22.4` as its own dependency. Since HiveMind code never directly imports `zod` (grep confirms 0 `from "zod"` imports), the zod in `dependencies` is dead weight. However, having zod v3 in the dependency tree while the SDK uses zod v4 could cause:
1. npm deduplication confusion
2. Type incompatibilities if a future change imports zod directly
3. Unnecessary ~200KB in `node_modules`

**Fix:** Remove `zod` from `dependencies` entirely. The plugin uses `tool.schema` which re-exports the SDK's zod instance:
```json
"dependencies": {
    "yaml": "^2.3.4"
}
```

**Confidence:** HIGH — grep confirmed zero `from "zod"` imports in src/.

---

## npm Distribution Issues

### Issue 1: Missing Shebang Preservation Check

**Severity:** LOW
**Evidence:** `dist/cli.js:1` shows `#!/usr/bin/env node` — correctly preserved.

The shebang IS present in the compiled output. No issue here. TypeScript preserves it from `src/cli.ts`.

### Issue 2: `src/` Included in Package But Unused

**Severity:** LOW
**Evidence:** `package.json:14`

```json
"files": ["dist", "src", "README.md", "LICENSE", "CHANGELOG.md"]
```

Including `src/` doubles the package size. The `main` and `types` fields point to `dist/`. Unless users need source maps for debugging, `src/` is unnecessary.

**Fix:** Consider removing `src` from `files` to reduce package size. Or keep it for source debugging — this is a tradeoff.

### Issue 3: ESM Compatibility

**Severity:** LOW

Both `package.json` and `tsconfig.json` are configured correctly for ESM:
- `"type": "module"` in package.json
- `"module": "NodeNext"` and `"moduleResolution": "NodeNext"` in tsconfig
- All imports use `.js` extensions

The SDK is also ESM (`"type": "module"`). No compatibility issue found.

**Confidence:** HIGH — verified both configs.

---

## Tool Design Issues

### Issue 1: 11 Tools Is Excessive — Context Token Budget

**Severity:** HIGH
**Evidence:** All 11 tool files analyzed

Each tool definition includes description, args schema, and metadata. At ~150-200 tokens per tool definition, 11 tools consume **~1,650-2,200 tokens** of context per turn. This is injected into every LLM request.

**Tool frequency analysis:**

| Tool | Frequency | Essential? | Notes |
|------|-----------|-----------|-------|
| `declare_intent` | Once per session | YES | Core lifecycle |
| `map_context` | Multiple per session | YES | Core lifecycle |
| `compact_session` | Once per session | YES | Core lifecycle |
| `scan_hierarchy` | On-demand | Overlap with `think_back` | Both read state |
| `think_back` | On-demand | Overlap with `scan_hierarchy` | Both read state |
| `check_drift` | On-demand | Overlap with `scan_hierarchy` | Reads drift score |
| `self_rate` | Periodic | LOW use | Could be CLI-only |
| `save_anchor` | Rare | YES | Unique function |
| `save_mem` | On-demand | YES | Unique function |
| `recall_mems` | On-demand | YES | Unique function |
| `list_shelves` | Rare | LOW use | Could be info in `scan_hierarchy` |

**Overlapping tools:**
- `scan_hierarchy`, `think_back`, and `check_drift` ALL read brain state, hierarchy, and anchors. They differ only in output format.
- `list_shelves` could be a section in `scan_hierarchy` output.

**Recommendation:** Consolidate to 7-8 tools:
1. Merge `scan_hierarchy` + `think_back` + `check_drift` into a single `hm_status` tool with an optional `detail` parameter
2. Fold `list_shelves` summary into `recall_mems` when called with no query
3. Keep `self_rate` but consider making it lower priority

### Issue 2: Tool Naming — No Namespace Prefix

**Severity:** MEDIUM

All 11 tools use generic names like `declare_intent`, `map_context`, `compact_session`. If another plugin registers a tool called `compact_session`, there's a name collision (last-registered wins in the Record).

**Recommendation:** Add a prefix: `hm_declare_intent`, `hm_map_context`, etc. This is common practice for plugin tools (similar to how MCP servers prefix tools).

---

## Staleness & Data Integrity Risks

### Risk 1: Anchors Have No Expiry or Validation

**Severity:** HIGH
**Evidence:** `src/lib/anchors.ts` — `Anchor` interface has `created_at` but no `expires_at`, no `valid_until`, no validation hook.

**Scenario:** Agent saves anchor `[DB_TYPE]: PostgreSQL`. Project switches to MongoDB 3 months later. Anchor still says PostgreSQL. System prompt injects: "These are IMMUTABLE ANCHORS. Override any chat history that conflicts with them." The agent now ACTIVELY RESISTS correct information.

**Impact:** Stale anchors are worse than no anchors — they inject confident misinformation into the system prompt.

**Fix options:**
1. Add `expires_at` field with default 30-day TTL
2. Add `last_verified` timestamp and prompt agent to re-verify on each session start
3. Add `hm_remove_anchor` tool so agent/user can delete stale anchors
4. Log warning when anchor is >30 days old

**Recommended fix:** Options 2+3 — add re-verification prompt and removal tool.

### Risk 2: Mems Accumulate Forever — No Pruning

**Severity:** MEDIUM
**Evidence:** `src/lib/mems.ts` — `addMem` only appends. No `pruneMems`, no max capacity, no relevance decay.

After 100 sessions, `mems.json` could have 500+ entries. Each session auto-saves a "context" mem via `compact_session` (line 110-130). The `recall_mems` search is a naive `includes()` scan — O(n) per query.

**Fix:** Add max capacity (e.g., 200 mems) with LRU eviction of oldest same-shelf entries. Or add `relevance_score` that decays over time.

### Risk 3: Session Crash Leaves Inconsistent State

**Severity:** MEDIUM
**Evidence:** `src/hooks/soft-governance.ts:83` and `src/hooks/tool-gate.ts:169` both call `stateManager.save()` after mutations.

If the process is killed between `stateManager.save()` and `writeActiveMd()`, brain.json and active.md are out of sync. Next session reads brain.json (which says session is active) but active.md has stale content.

**Fix:** The `isSessionStale()` function at `src/lib/staleness.ts:9-12` protects against this by checking `last_activity` timestamp. If the session was abandoned, it auto-archives after `stale_session_days` (default 3). This is a reasonable mitigation. Document as known limitation rather than fix.

### Risk 4: System Prompt Injection With Stale Context

**Severity:** MEDIUM
**Evidence:** `src/hooks/session-lifecycle.ts:103-210`

Every turn injects: hierarchy, anchors, mems count, drift score, agent config, commit suggestions, long session warnings. If any of these are stale (old hierarchy from crashed session, outdated anchors), the agent receives misleading context.

The staleness check at line 71 only fires on session START, not on every turn. Within a single session, no staleness detection occurs.

**Fix:** Add a lightweight "last verified" check to the system prompt injection. If `last_activity` is >1 hour stale from a different process, flag it.

---

## Performance & Conflict Risks

### Risk 1: Double-Counting Turn Increments

**Severity:** HIGH
**Evidence:** Both `tool.execute.before` (tool-gate.ts:158) AND `tool.execute.after` (soft-governance.ts:61) call `incrementTurnCount(state)`.

**The flow:**
1. Agent calls any tool
2. `tool.execute.before` fires → loads state → `incrementTurnCount` → saves state
3. Tool executes
4. `tool.execute.after` fires → loads state → `incrementTurnCount` → saves state
5. **Turn count increases by 2 for every single tool call**

**Impact:** Drift score degrades 2x faster than intended. A 5-tool sequence shows turn_count=10 instead of 5. The `max_turns_before_warning` of 5 triggers after only 2-3 actual tool calls.

**Fix:** Remove `incrementTurnCount` from `tool.execute.before` (tool-gate.ts). Only track in `tool.execute.after`:
```typescript
// tool-gate.ts: REMOVE lines 158-169 (the increment + file tracking block)
// Keep only governance checks in before hook
// Let soft-governance.ts handle all metrics tracking
```

### Risk 2: Disk I/O on Every Tool Call

**Severity:** MEDIUM
**Evidence:** Both hooks perform `stateManager.load()` + `stateManager.save()`. Each is a `readFile` + `JSON.parse` + `JSON.stringify` + `writeFile`.

**Per tool call:** 4 disk operations minimum (2 loads + 2 saves from two hooks).
**In a typical session:** 50 tool calls × 4 = 200 disk I/O operations just for governance tracking.

**Mitigation already in place:** The `try/catch` in both hooks ensures disk errors don't break tool execution. The async operations don't block the tool call itself.

**Fix:** Add in-memory caching to `StateManager`:
```typescript
// Cache brain state for the duration of a session
let cachedState: BrainState | null = null;
let dirty = false;
// Flush to disk every N tool calls or on session events
```

### Risk 3: No Infinite Loop Risk

**Severity:** NONE (investigated, no issue found)

HiveMind tools (declare_intent, map_context, etc.) are registered as plugin tools, not OpenCode innate tools. When a HiveMind tool calls `stateManager.save()`, this is a direct filesystem write — NOT a tool call. Therefore, `tool.execute.before/after` hooks do NOT fire recursively. No infinite loop risk.

### Risk 4: System Prompt Growth

**Severity:** LOW
**Evidence:** `session-lifecycle.ts:200-204` — budget enforcement at 1000 chars.

The system prompt injection is capped at `BUDGET_CHARS = 1000` characters. If it exceeds this, it's truncated. However, the truncation is naive (hard slice) which could break the XML tags (`</agent-configuration>` is appended but the opening tag might be truncated).

**Fix:** Use structured truncation — omit optional sections (mems, commit suggestions) before truncating.

---

## Recommended Tool Grouping

Based on analysis, consolidate from 11 tools to 8 with namespace prefix:

| Current Tool(s) | Proposed | Rationale |
|-----------------|----------|-----------|
| `declare_intent` | `hm_declare_intent` | Core, keep |
| `map_context` | `hm_map_context` | Core, keep |
| `compact_session` | `hm_compact_session` | Core, keep |
| `scan_hierarchy` + `think_back` + `check_drift` | `hm_status` | All read state — merge with `mode` param |
| `save_anchor` | `hm_save_anchor` | Unique, keep |
| `save_mem` | `hm_save_mem` | Unique, keep |
| `recall_mems` + `list_shelves` | `hm_recall_mems` | Merge — empty query = show shelves |
| `self_rate` | `hm_self_rate` | Keep but lower priority |

**Estimated token savings:** ~600-800 tokens per turn (3 fewer tool definitions).

---

## Don't Hand-Roll (use existing solutions)

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session ID generation | `generateSessionId()` with `Math.random()` | `crypto.randomUUID()` | Node 18+ built-in, cryptographically random, no collisions |
| YAML frontmatter parsing | Custom parse with `yaml` package | `gray-matter` | Battle-tested, handles edge cases, used by Hugo/Jekyll/Astro |
| File-based state management | Custom `StateManager` with raw JSON | `conf` or `lowdb` | Atomic writes, corruption protection, schema migration |
| Disk I/O caching | Building from scratch | Keep current + add simple TTL cache | Complexity not justified for current scale |

**Key insight:** The current `StateManager` is simple and works. The `yaml` dependency is legitimate (used in `planning-fs.ts` for frontmatter). Don't over-engineer — fix the bugs first.

---

## Common Pitfalls

### Pitfall 1: TypeScript Structural Typing Hiding Array/Record Mismatch
**What goes wrong:** Arrays pass as `Record<string, T>` because arrays have string-indexed properties ("0", "1", etc.)
**Why it happens:** TypeScript uses structural typing, not nominal typing. `Array<T>` satisfies `{ [key: string]: T }`.
**How to avoid:** Use `satisfies Hooks` on the return object in `src/index.ts` to get better type checking. Or use a branded type.
**Warning signs:** Tests pass but tools have numeric names at runtime.

### Pitfall 2: Closure-Captured Variables vs Runtime Context
**What goes wrong:** `directory` is captured at plugin initialization time. If OpenCode changes directory (e.g., git worktree), the closure still uses the old value.
**Why it happens:** Plugin factory runs once, tools use captured closure value.
**How to avoid:** Use `context.directory` from `ToolContext` at execution time.
**Warning signs:** Files created in wrong directory when using worktrees.

### Pitfall 3: Stale System Prompt Poisoning
**What goes wrong:** Old anchors/hierarchy inject wrong context into every turn.
**Why it happens:** Anchors are "immutable" by design — no expiry, no validation.
**How to avoid:** Add TTL or re-verification to anchors. Staleness check on every turn, not just session start.
**Warning signs:** Agent confidently states wrong facts that contradict recent changes.

### Pitfall 4: Double Metrics from Before+After Hooks
**What goes wrong:** Metrics increment twice per tool call.
**Why it happens:** Both `tool.execute.before` and `tool.execute.after` independently load, mutate, and save state.
**How to avoid:** Single source of truth — only track metrics in ONE hook.
**Warning signs:** Turn count is 2x expected, drift warnings trigger too early.

---

## Architecture Patterns (recommended fixes)

### Pattern 1: Tool Record Registration
**What:** Register tools as a keyed Record, not an array.
**When to use:** Always — this is the SDK contract.
```typescript
// Correct pattern from SDK example.js
return {
    tool: {
        hm_declare_intent: createDeclareIntentTool(effectiveDir),
        hm_map_context: createMapContextTool(effectiveDir),
        // ...
    },
};
```

### Pattern 2: Hook Responsibility Separation
**What:** Each hook owns specific concerns with no overlap.
**When to use:** When using both `tool.execute.before` and `tool.execute.after`.
```
tool.execute.before → Governance enforcement ONLY (check locked, check exempt)
tool.execute.after  → Metrics tracking ONLY (increment turns, drift, violations)
```
**Never:** Both hooks loading/saving state independently.

### Pattern 3: Defensive System Prompt Injection
**What:** Budget-capped, structured truncation with priority ordering.
**When to use:** In `experimental.chat.system.transform`.
```
Priority 1: Session status (LOCKED/OPEN, mode)
Priority 2: Hierarchy (trajectory/tactic/action)
Priority 3: Anchors
Priority 4: Metrics
Priority 5: Suggestions (commit, long session) — OMIT if over budget
Priority 6: Agent config — OMIT if over budget
```

### Anti-Patterns to Avoid
- **Double state loading:** Loading brain.json in both before and after hooks → race condition + wasted I/O
- **Closure-only directory:** Capturing `directory` in closure instead of using `context.directory` → wrong dir in worktrees
- **Array as Record:** TypeScript won't warn, but runtime behavior is completely wrong
- **Unbounded accumulation:** Mems, sentiment_signals, files_touched arrays grow forever

---

## Code Examples (fix patterns)

### Fix 1: Correct Tool Registration

```typescript
// src/index.ts — FIXED
return {
    tool: {
        hm_declare_intent: createDeclareIntentTool(effectiveDir),
        hm_map_context: createMapContextTool(effectiveDir),
        hm_compact_session: createCompactSessionTool(effectiveDir),
        hm_self_rate: createSelfRateTool(effectiveDir),
        hm_scan_hierarchy: createScanHierarchyTool(effectiveDir),
        hm_save_anchor: createSaveAnchorTool(effectiveDir),
        hm_think_back: createThinkBackTool(effectiveDir),
        hm_check_drift: createCheckDriftTool(effectiveDir),
        hm_save_mem: createSaveMemTool(effectiveDir),
        hm_list_shelves: createListShelvesTool(effectiveDir),
        hm_recall_mems: createRecallMemsTool(effectiveDir),
    },
    // hooks stay the same...
} satisfies Hooks;
```

### Fix 2: Remove Double-Counting in tool-gate.ts

```typescript
// src/hooks/tool-gate.ts — REMOVE the metrics tracking block
// Lines 157-169 should be removed entirely:

// DELETE THIS BLOCK:
//   if (state) {
//     state = incrementTurnCount(state)
//     if (isWriteTool(toolName)) {
//       state = addFileTouched(state, `[via ${toolName}]`)
//     }
//     state.metrics.drift_score = calculateDriftScore(state)
//     await stateManager.save(state)
//     // ... drift warning check
//   }

// KEEP only the governance checks (locked session, exempt tools)
// All metrics tracking stays in soft-governance.ts (tool.execute.after)
```

### Fix 3: Add model to System Transform Hook

```typescript
// src/hooks/session-lifecycle.ts line 53-56
return async (
    input: { sessionID?: string; model: Model },  // Add model
    output: { system: string[] }
): Promise<void> => {
    // Can use input.model for model-specific token budgets
```

### Fix 4: Fix self-rate.ts Legacy Path

```typescript
// src/tools/self-rate.ts line 42-44
const log = await createLogger(
    join(directory, ".hivemind", "logs"),  // Fixed from .opencode/planning/logs
    "self-rate"
)
```

### Fix 5: Include docs/ in npm Package

```json
// package.json
"files": ["dist", "src", "docs", "README.md", "LICENSE", "CHANGELOG.md"]
```

### Fix 6: Remove Unused Zod Dependency

```json
// package.json — dependencies section
"dependencies": {
    "yaml": "^2.3.4"
}
// Remove "zod": "^3.22.4" — never imported directly, SDK provides it
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.opencode/planning/` directory | `.hivemind/` directory | v1.4.0 (Feb 2026) | Migration incomplete — self-rate.ts still uses old path |
| 3 tools (R0) | 11 tools (R4) | v1.5.0 (Feb 2026) | Tool bloat risk, needs consolidation |
| `tool.execute.before` could block | Cannot block (void return) | OpenCode v1.1+ | HiveMind correctly adapted, but `ToolGateResult.allowed: false` is dead code |
| Zod v3 | Zod v4 in SDK | @opencode-ai/plugin@1.1.53 | Plugin still declares zod v3 dependency |

**Deprecated/outdated:**
- `ToolGateResult.allowed: false` — functionally meaningless since OpenCode v1.1+ can't block. The internal hook returns `{ allowed: false }` but the outer hook just logs it. Remove the `allowed` concept entirely.
- `.opencode/planning/` paths — fully deprecated since v1.4.0, one reference remains.

---

## Open Questions

1. **Tool Naming Convention — Prefix or Not?**
   - What we know: SDK example uses bare name `mytool`. No prefix convention established.
   - What's unclear: Does OpenCode have a tool namespace mechanism? Do other plugins use prefixes?
   - Recommendation: Add `hm_` prefix to prevent collisions. Low risk, high safety.

2. **Token Budget for System Prompt**
   - What we know: 1000 char budget (~250 tokens). Agent config adds ~500 chars.
   - What's unclear: How much of the total context window does OpenCode allocate to system prompt? Is 250 tokens significant?
   - Recommendation: Keep budget, but add priority-based truncation instead of hard slice.

3. **OpenCode Plugin Loading Order**
   - What we know: Plugins are loaded from `opencode.json` `plugin` array.
   - What's unclear: If two plugins register the same hook (e.g., `tool.execute.after`), does the last one win? Are they chained?
   - Recommendation: Test with a second plugin to verify hook chaining behavior.

4. **Performance Under Load**
   - What we know: 4 disk I/O ops per tool call (2 hooks × load + save).
   - What's unclear: At what point does this degrade agent response time?
   - Recommendation: Benchmark with 100 tool calls. If >10ms per save, add in-memory caching.

---

## Sources

### Primary (HIGH confidence)
- `@opencode-ai/plugin@1.1.53` SDK source code at `node_modules/@opencode-ai/plugin/dist/` — all type definitions, example plugin
- `src/index.ts` — plugin entry point, tool registration
- `src/hooks/` — all 4 hook implementations
- `src/tools/` — all 11 tool implementations
- `package.json` — build config, dependencies, files field

### Secondary (MEDIUM confidence)
- `docs/migration-guide-v1.3-to-v1.4.md` — migration history
- `AGENTS.md` — architecture documentation

### Tertiary (LOW confidence)
- Token budget estimates (150-200 per tool definition) — based on typical zod schema serialization, not measured

---

## Confidence Levels

| Area | Level | Reason |
|------|-------|--------|
| Tool Registration Bug | HIGH | Verified against SDK source code + example.js |
| SDK Hook Signatures | HIGH | Verified against SDK type definitions |
| npm Distribution Issues | HIGH | Verified `package.json` files field + file existence |
| Double-Counting | HIGH | Verified both hooks independently call incrementTurnCount |
| Staleness Risks | MEDIUM | Architectural analysis, not runtime-verified |
| Performance Impact | LOW | Estimated, not benchmarked |
| Tool Consolidation | MEDIUM | Based on overlap analysis, usability is subjective |

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (stable SDK, unlikely to change rapidly)
