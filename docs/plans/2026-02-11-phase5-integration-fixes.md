# Phase 5: Integration Reality Check — Fix Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all critical bugs discovered in Phase 5 research so HiveMind actually works when installed as an npm plugin.

**Architecture:** Fix 6 confirmed bugs in priority order. Each task is atomic and independently testable. The tool registration fix (Task 1) is the most impactful — without it, zero tools are callable by name.

**Tech Stack:** TypeScript, @opencode-ai/plugin SDK, Node.js test runner (tsx --test)

**Research:** `.planning/phases/05-integration-reality-check/05-RESEARCH.md`

---

## Task 1: Fix Tool Registration — Array → Named Record (SHOWSTOPPER)

**Files:**
- Modify: `src/index.ts:80-92`

**Problem:** Tools registered as array `tool: [...]` but SDK expects `tool: { [key: string]: ToolDefinition }`. Tools get named "0", "1", "2"... instead of "declare_intent", "map_context" etc. Agents CANNOT call any tool by name.

**Evidence:** SDK type at `node_modules/@opencode-ai/plugin/dist/index.d.ts` — `tool?: { [key: string]: ToolDefinition; }`

**Step 1: Fix the registration**

Change `src/index.ts` lines 80-92 from:

```typescript
tool: [
  createDeclareIntentTool(effectiveDir),
  createMapContextTool(effectiveDir),
  createCompactSessionTool(effectiveDir),
  createSelfRateTool(effectiveDir),
  createScanHierarchyTool(effectiveDir),
  createSaveAnchorTool(effectiveDir),
  createThinkBackTool(effectiveDir),
  createCheckDriftTool(effectiveDir),
  createSaveMemTool(effectiveDir),
  createListShelvesTool(effectiveDir),
  createRecallMemsTool(effectiveDir),
],
```

To:

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

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (Record and array both accept ToolDefinition values)

**Step 3: Run tests**

Run: `npm test`
Expected: All 331 assertions still pass (tests don't test the plugin entry shape)

**Step 4: Commit**

```bash
git add src/index.ts
git commit -m "fix: tool registration uses named Record instead of array

SDK expects { [key: string]: ToolDefinition } but tools were registered
as an array, causing them to be named '0', '1', '2' instead of
'declare_intent', 'map_context', etc. Agents could not call any tool."
```

---

## Task 2: Fix 10-Commandments Path Crash on npm Install

**Files:**
- Modify: `src/cli/init.ts:184`
- Modify: `package.json:12-18` (files field)

**Problem:** `join(__dirname, "..", "..", "docs", "10-commandments.md")` resolves relative to `dist/cli/init.js` → needs `docs/` at package root. But `docs/` is NOT in `package.json#files`, so it's not included in npm tarball. `hivemind init` crashes with ENOENT.

**Step 1: Add docs to package.json files**

In `package.json`, change:

```json
"files": [
  "dist",
  "src",
  "README.md",
  "LICENSE",
  "CHANGELOG.md"
],
```

To:

```json
"files": [
  "dist",
  "docs",
  "src",
  "README.md",
  "LICENSE",
  "CHANGELOG.md"
],
```

**Step 2: Also fix the comment at top of `src/cli/init.ts`**

Change line 5 from:
```
 *   - .opencode/planning/ directory structure
```
To:
```
 *   - .hivemind/ directory structure
```

**Step 3: Run tests**

Run: `npm test`
Expected: All pass

**Step 4: Verify path resolves correctly**

Run: `node -e "const {dirname,join} = require('path'); const d = join('dist','cli'); console.log(join(d, '..', '..', 'docs', '10-commandments.md'))"`
Expected: `docs/10-commandments.md` (relative to package root)

**Step 5: Commit**

```bash
git add src/cli/init.ts package.json
git commit -m "fix: include docs/ in npm package files for hivemind init

The 10-commandments.md file is copied during 'hivemind init' but docs/
was not in package.json#files, causing ENOENT crash on npm installs.
Also fixed stale .opencode reference in init.ts doc comment."
```

---

## Task 3: Fix Legacy `.opencode` Path in self-rate.ts

**Files:**
- Modify: `src/tools/self-rate.ts:42-44`

**Problem:** `createLogger(join(directory, ".opencode", "planning", "logs"), "self-rate")` — sole remaining `.opencode` reference. Should use `.hivemind/logs`.

**Step 1: Fix the path**

Change lines 42-44 from:

```typescript
const log = await createLogger(
  join(directory, ".opencode", "planning", "logs"),
  "self-rate"
)
```

To:

```typescript
const log = await createLogger(
  join(directory, ".hivemind", "logs"),
  "self-rate"
)
```

**Step 2: Verify no more legacy references**

Run: `rg "\.opencode" src/ --line-number`
Expected: Zero matches (the init.ts comment was fixed in Task 2)

**Step 3: Run tests**

Run: `npm test`
Expected: All pass

**Step 4: Commit**

```bash
git add src/tools/self-rate.ts
git commit -m "fix: self-rate tool uses .hivemind/logs instead of legacy .opencode path"
```

---

## Task 4: Fix Missing `model` Parameter in System Transform Hook

**Files:**
- Modify: `src/hooks/session-lifecycle.ts:53-54`

**Problem:** SDK sends `input: { sessionID?: string; model: Model }` but hook only declares `input: { sessionID?: string }`. The `model` parameter is silently dropped. While not crashing, it doesn't match the SDK contract.

**Step 1: Fix the hook signature**

Change line 53-54 from:

```typescript
  return async (
    input: { sessionID?: string },
```

To:

```typescript
  return async (
    input: { sessionID?: string; model?: any },
```

Note: We use `model?: any` because `Model` is an internal SDK type not exported for plugin use. The parameter is accepted but not used.

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: Run tests**

Run: `npm test`
Expected: All pass

**Step 4: Commit**

```bash
git add src/hooks/session-lifecycle.ts
git commit -m "fix: accept model parameter in system transform hook signature

SDK sends { sessionID, model } but hook only declared { sessionID }.
Now accepts model parameter to match SDK contract."
```

---

## Task 5: Fix Double-Counting Turn Increments

**Files:**
- Modify: `src/hooks/tool-gate.ts:158` and `src/hooks/tool-gate.ts:322`

**Problem:** Both `tool.execute.before` (tool-gate.ts) AND `tool.execute.after` (soft-governance.ts) call `incrementTurnCount()` on every tool call. This doubles all turn metrics — drift warnings fire 2x too early, commit suggestions at half threshold, long session detection at half turn count.

**Decision:** Remove `incrementTurnCount` from `tool-gate.ts` (the `before` hook). Keep it only in `soft-governance.ts` (the `after` hook) because `after` is the correct place to count completed tool calls.

**Step 1: Remove incrementTurnCount from tool-gate.ts**

In `src/hooks/tool-gate.ts`, the internal hook (around line 158) has:
```typescript
state = incrementTurnCount(state)
```

Remove this line. Also remove it from the `createToolGateHookInternal` function (around line 322).

But keep the file tracking (`addFileTouched`), drift score calculation (`calculateDriftScore`), and drift warning check — those should remain so the `before` hook can still warn about drift. The turn count itself should NOT be incremented here though.

Actually, wait — if we remove `incrementTurnCount` from tool-gate but keep `calculateDriftScore` and `shouldTriggerDriftWarning`, those still work because they read the current state's `turn_count` (which was incremented by soft-governance on the PREVIOUS call). The drift detection still functions correctly.

Change lines ~156-170 in the internal hook from:

```typescript
      // Session is open — track activity
      if (state) {
        state = incrementTurnCount(state)

        // Track file touches for write tools (tool name used as proxy)
        if (isWriteTool(toolName)) {
          state = addFileTouched(state, `[via ${toolName}]`)
        }

        // Update drift score
        state.metrics.drift_score = calculateDriftScore(state)

        // Save updated state
        await stateManager.save(state)
```

To:

```typescript
      // Session is open — track activity (turn count incremented in tool.execute.after only)
      if (state) {
        // Track file touches for write tools (tool name used as proxy)
        if (isWriteTool(toolName)) {
          state = addFileTouched(state, `[via ${toolName}]`)
        }

        // Update drift score
        state.metrics.drift_score = calculateDriftScore(state)

        // Save updated state (only if file was touched)
        if (isWriteTool(toolName)) {
          await stateManager.save(state)
        }
```

Apply the same change to the `createToolGateHookInternal` function (lines ~320-334).

Also remove `incrementTurnCount` from the import if it's no longer used:

```typescript
import {
  isSessionLocked,
  shouldTriggerDriftWarning,
  addFileTouched,
  calculateDriftScore,
  setComplexityNudgeShown,
} from "../schemas/brain-state.js"
```

**Step 2: Run tests**

Run: `npm test`
Expected: tool-gate tests may need adjustment if they assert specific turn counts. Check and fix.

**Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 4: Commit**

```bash
git add src/hooks/tool-gate.ts
git commit -m "fix: remove double-counting of turn increments

Both tool.execute.before and tool.execute.after were calling
incrementTurnCount(), doubling all metrics. Now only the after
hook (soft-governance) increments turns."
```

---

## Task 6: Accept ToolContext in All Tool Execute Functions

**Files:**
- Modify: `src/tools/declare-intent.ts`
- Modify: `src/tools/map-context.ts`
- Modify: `src/tools/compact-session.ts`
- Modify: `src/tools/self-rate.ts`
- Modify: `src/tools/scan-hierarchy.ts`
- Modify: `src/tools/save-anchor.ts`
- Modify: `src/tools/think-back.ts`
- Modify: `src/tools/check-drift.ts`
- Modify: `src/tools/save-mem.ts`
- Modify: `src/tools/list-shelves.ts`
- Modify: `src/tools/recall-mems.ts`

**Problem:** SDK's `tool()` execute signature is `execute(args, context: ToolContext)` but all 11 tools only declare `execute(args)` or `execute()`, ignoring the context parameter. While TypeScript allows this (fewer params is OK), it means tools can't access `context.sessionID`, `context.directory`, `context.abort`, etc.

**Step 1: Add `_context` parameter to all tools with args**

For tools with args (7 tools), change:
```typescript
async execute(args) {
```
To:
```typescript
async execute(args, _context) {
```

For tools without args (4 tools), change:
```typescript
async execute() {
```
To:
```typescript
async execute(_args, _context) {
```

The underscore prefix marks them as intentionally unused. This matches the SDK contract and future-proofs tools for when they need session context.

Files to change:
- `src/tools/declare-intent.ts:48` — `execute(args)` → `execute(args, _context)`
- `src/tools/map-context.ts:47` — `execute(args)` → `execute(args, _context)`
- `src/tools/compact-session.ts:45` — `execute(args)` → `execute(args, _context)`
- `src/tools/self-rate.ts:40` — `execute(args)` → `execute(args, _context)`
- `src/tools/save-anchor.ts:18` — `execute(args)` → `execute(args, _context)`
- `src/tools/save-mem.ts:34` — `execute(args)` → `execute(args, _context)`
- `src/tools/recall-mems.ts:31` — `execute(args)` → `execute(args, _context)`
- `src/tools/scan-hierarchy.ts:15` — `execute()` → `execute(_args, _context)`
- `src/tools/think-back.ts:17` — `execute()` → `execute(_args, _context)`
- `src/tools/check-drift.ts:17` — `execute()` → `execute(_args, _context)`
- `src/tools/list-shelves.ts:20` — `execute()` → `execute(_args, _context)`

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: Run tests**

Run: `npm test`
Expected: All pass (test invocations may need a second arg but since tests call the tool's execute directly, they should work — TypeScript won't complain about providing fewer args to a function that expects optional ones via underscore)

**Step 4: Commit**

```bash
git add src/tools/*.ts
git commit -m "fix: accept ToolContext parameter in all tool execute functions

SDK signature is execute(args, context: ToolContext) but all 11 tools
ignored the context parameter. Now accept it as _context for SDK
contract compliance and future use."
```

---

## Task 7: Remove Unused `zod` Dependency

**Files:**
- Modify: `package.json:54`

**Problem:** `zod` is listed in `dependencies` but never imported in production code. The `@opencode-ai/plugin/tool` module re-exports zod schemas via `tool.schema.*`, so HiveMind doesn't need zod directly. This adds unnecessary install weight.

**Step 1: Verify zod is not imported**

Run: `rg "from ['\"]zod['\"]" src/ --line-number`
Expected: Zero matches

**Step 2: Remove from dependencies**

In `package.json`, change:

```json
"dependencies": {
  "yaml": "^2.3.4",
  "zod": "^3.22.4"
},
```

To:

```json
"dependencies": {
  "yaml": "^2.3.4"
},
```

**Step 3: Run tests**

Run: `npm test`
Expected: All pass (zod is still available via @opencode-ai/plugin devDep)

**Step 4: Commit**

```bash
git add package.json
git commit -m "chore: remove unused zod dependency

Zod was listed in dependencies but never imported in production code.
The plugin SDK re-exports zod schemas via tool.schema.* internally."
```

---

## Task 8: Version Bump + Final Verification

**Files:**
- Modify: `package.json:3`
- Modify: `CHANGELOG.md`

**Step 1: Bump version**

Change `package.json` version from `"1.5.0"` to `"1.6.0"`.

**Step 2: Update CHANGELOG**

Add to top of CHANGELOG.md:

```markdown
## 1.6.0 — Integration Reality Check

### Fixed
- **SHOWSTOPPER**: Tool registration changed from array to named Record — tools were being registered as "0", "1", "2" instead of "declare_intent", "map_context", etc.
- **CRITICAL**: `hivemind init` crash on npm install — `docs/` directory now included in package files
- **CRITICAL**: System transform hook now accepts `model` parameter matching SDK contract
- **CRITICAL**: Legacy `.opencode` path in self-rate tool changed to `.hivemind`
- **HIGH**: Double-counting turn increments — removed from tool.execute.before hook (kept only in .after)
- **MEDIUM**: All 11 tools now accept `ToolContext` parameter matching SDK execute signature
- **CHORE**: Removed unused `zod` dependency from package.json
```

**Step 3: Final verification**

Run: `npx tsc --noEmit && npm test`
Expected: Typecheck clean, all tests pass

**Step 4: Commit and tag**

```bash
git add package.json CHANGELOG.md
git commit -m "release: v1.6.0 — Integration Reality Check

Fixed 6 bugs preventing plugin from working when installed via npm:
tool registration, init crash, hook signature, legacy path, double-counting,
ToolContext compliance. Removed unused zod dependency."
git tag v1.6.0
```

---

## Summary

| Task | Priority | Bug | Impact |
|------|----------|-----|--------|
| 1 | SHOWSTOPPER | Tool registration array→Record | Agents can't call ANY tool |
| 2 | CRITICAL | 10-commandments path + package.json files | `hivemind init` crashes |
| 3 | CRITICAL | Legacy `.opencode` in self-rate | Logger writes to wrong dir |
| 4 | CRITICAL | Missing `model` in system hook | SDK contract mismatch |
| 5 | HIGH | Double incrementTurnCount | All metrics 2x inflated |
| 6 | MEDIUM | Missing ToolContext param | SDK contract, no context access |
| 7 | LOW | Unused zod dependency | Unnecessary install weight |
| 8 | — | Version bump + changelog | Release tracking |

**Expected outcome:** v1.6.0 with all 331+ tests passing, typecheck clean, plugin fully functional when installed via npm.
