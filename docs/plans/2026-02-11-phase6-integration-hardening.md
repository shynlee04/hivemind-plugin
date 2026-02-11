# Phase 6: Integration Hardening — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Harden HiveMind to corporate-grade publication quality — every tool must be useful, every error instructive, every interaction guiding, every byte justified.

**Architecture:** 10 user stories organized by dependency order. Each story is a single atomic commit. Quality gates: `tsc --noEmit` + `npm test` must pass after every story.

**Tech Stack:** TypeScript, @opencode-ai/plugin SDK, Node.js test runner (tsx --test)

**Research:** Three parallel audit reports covering tools, hooks, and packaging.

---

## US-01: Fix System Prompt Injection Architecture

**Priority:** CRITICAL — malformed XML, token waste, wrong budget

**Files:**
- Modify: `src/hooks/session-lifecycle.ts`
- Modify: `src/lib/tool-activation.ts`

**Acceptance Criteria:**
- [ ] Budget increased from 1000 to 2500 chars (governance + agent-config combined)
- [ ] Truncation produces valid XML — closes `</hivemind>` not `</agent-configuration>`
- [ ] Truncation uses section-level removal (drop least important section) not naive char slice
- [ ] Redundant drift warning + tool activation hint collapsed to single line
- [ ] Commit suggestion removed from injection (user concern, not agent concern)
- [ ] Mems count line removed (advertising, not actionable context)
- [ ] Anchor entries include age indicator: `[DB_SCHEMA] (2h ago): PostgreSQL...`
- [ ] `tsc --noEmit` passes
- [ ] `npm test` passes (update any tests checking injection format)

**Implementation:**

### Step 1: Restructure the injection builder

Replace the current linear `lines.push()` approach with a priority-sectioned builder:

```typescript
// Priority sections (highest first — dropped last during truncation)
const sections = {
  status: [],      // Session OPEN/LOCKED, mode, governance — ALWAYS shown
  hierarchy: [],   // Trajectory/Tactic/Action — ALWAYS shown
  warnings: [],    // Drift, chain breaks — shown if present
  anchors: [],     // Immutable anchors with age — shown if present
  metrics: [],     // Turn count, drift score — shown if space
  agent_config: [] // Behavioral config — shown if space
}
```

### Step 2: Fix truncation

Replace naive `injection.slice(0, BUDGET_CHARS - 30)` with:

```typescript
const BUDGET_CHARS = 2500

// Build injection from highest to lowest priority
let injection = ''
for (const section of ['status', 'hierarchy', 'warnings', 'anchors', 'metrics', 'agent_config']) {
  const sectionText = sections[section].join('\n')
  if ((injection + '\n' + sectionText).length <= BUDGET_CHARS) {
    injection += '\n' + sectionText
  }
  // Lower-priority sections silently dropped if no budget
}
injection = '<hivemind>\n' + injection.trim() + '\n</hivemind>'
```

### Step 3: Add anchor age

In the anchor formatting, calculate and display age:

```typescript
const age = Date.now() - anchor.created_at
const ageStr = age < 3600000 ? `${Math.floor(age/60000)}m ago` :
               age < 86400000 ? `${Math.floor(age/3600000)}h ago` :
               `${Math.floor(age/86400000)}d ago`
lines.push(`  [${anchor.key}] (${ageStr}): ${anchor.value}`)
```

### Step 4: Collapse redundancies

- Remove `shouldSuggestCommit` call from injection (keep only in after-hook for logging)
- Remove `formatMemsForPrompt` call (useless count)
- Merge drift warning and tool activation into single line: `⚠ Drift: 42/100 → call map_context`

### Step 5: Run tests, fix any format-dependent assertions

---

## US-02: Fix Hook Consistency & Performance

**Priority:** HIGH — inconsistent write lists, double save, bash unclassified

**Files:**
- Modify: `src/hooks/tool-gate.ts`
- Modify: `src/hooks/soft-governance.ts`

**Acceptance Criteria:**
- [ ] EXEMPT_TOOLS: `declare_intent, map_context, compact_session, self_rate, scan_hierarchy, save_anchor, think_back, check_drift, save_mem, list_shelves, recall_mems, read, grep, glob, bash, webfetch, task, skill, todowrite, google_search`
- [ ] WRITE_TOOLS: `write, edit` (only actual OpenCode innate write tools)
- [ ] Phantom tools removed from both lists (`find, list, search, create, delete, rename, move, patch`)
- [ ] `isExemptTool` uses exact `Set.has()` match, NOT `startsWith`
- [ ] `isWriteTool` uses exact `Set.has()` match, NOT `includes`
- [ ] `shouldTrackAsViolation` in soft-governance uses same WRITE_TOOLS set
- [ ] Double save in soft-governance consolidated to single save at end of function
- [ ] Dead `args?` field removed from soft-governance input type
- [ ] `tsc --noEmit` passes
- [ ] `npm test` passes

**Implementation:**

Replace fuzzy matching with exact set matching:

```typescript
const EXEMPT_TOOLS = new Set([
  // HiveMind tools (always allowed)
  "declare_intent", "map_context", "compact_session", "self_rate",
  "scan_hierarchy", "save_anchor", "think_back", "check_drift",
  "save_mem", "list_shelves", "recall_mems",
  // OpenCode innate read-only tools
  "read", "grep", "glob",
  // OpenCode innate command/utility tools
  "bash", "webfetch", "task", "skill", "todowrite", "google_search",
])

const WRITE_TOOLS = new Set([
  "write", "edit",
])

function isExemptTool(toolName: string): boolean {
  return EXEMPT_TOOLS.has(toolName)
}

function isWriteTool(toolName: string): boolean {
  return WRITE_TOOLS.has(toolName)
}
```

Consolidate double-save in soft-governance:

```typescript
// Single save at end
await stateManager.save(newState)
// Remove the early save at line 83
```

---

## US-03: Tool Error Consistency + Input Validation

**Priority:** HIGH — inconsistent UX, no input validation

**Files:**
- Modify: ALL 11 tools in `src/tools/*.ts`

**Acceptance Criteria:**
- [ ] ALL error messages use `"ERROR: ..."` prefix consistently
- [ ] ALL error messages include guidance on what to do instead
- [ ] `declare_intent`: validates `focus` is non-empty after trim
- [ ] `map_context`: validates `content` is non-empty after trim
- [ ] `save_anchor`: validates `key` and `value` are non-empty after trim
- [ ] `save_mem`: validates `content` is non-empty after trim
- [ ] Error format: `"ERROR: <what's wrong>. <what to do instead>."`
- [ ] `tsc --noEmit` passes
- [ ] `npm test` passes

**Implementation:**

For each tool that returns an error without prefix, add `"ERROR: "`:

```typescript
// Before (scan_hierarchy, think_back, check_drift)
return "No active session. Call declare_intent to start."
// After
return "ERROR: No active session. Call declare_intent to start a work session."
```

For input validation, add at the start of execute():

```typescript
// declare_intent
if (!args.focus?.trim()) return "ERROR: focus cannot be empty. Describe what you're working on."

// map_context
if (!args.content?.trim()) return "ERROR: content cannot be empty. Describe your current focus."

// save_anchor
if (!args.key?.trim()) return "ERROR: key cannot be empty. Use a descriptive name like 'DB_SCHEMA' or 'API_PORT'."
if (!args.value?.trim()) return "ERROR: value cannot be empty. Describe the constraint or fact."

// save_mem
if (!args.content?.trim()) return "ERROR: content cannot be empty. Describe the decision, pattern, or lesson."
```

---

## US-04: Tool Helper Guidance (Next Action Footers)

**Priority:** HIGH — tools don't guide agent to next action

**Files:**
- Modify: ALL 11 tools in `src/tools/*.ts`

**Acceptance Criteria:**
- [ ] Every tool output ends with a `"→ Next:"` footer suggesting the logical next action
- [ ] Footers are context-aware (different guidance for different states)
- [ ] `declare_intent` → suggests `map_context`
- [ ] `map_context` → suggests `check_drift` or continuing work
- [ ] `compact_session` → warns LOCKED, suggests `declare_intent`
- [ ] `self_rate` → suggests based on score tier
- [ ] `scan_hierarchy` → suggests `check_drift` or `think_back`
- [ ] `save_anchor` → suggests `scan_hierarchy` to verify
- [ ] `think_back` → suggests `map_context` to refocus
- [ ] `check_drift` → suggests based on drift level
- [ ] `save_mem` → suggests `recall_mems` or `list_shelves`
- [ ] `list_shelves` → suggests `recall_mems` (already has this ✅)
- [ ] `recall_mems` → empty brain suggests `save_mem` (fix gap)
- [ ] `tsc --noEmit` passes
- [ ] `npm test` passes

**Implementation:**

Add footer to each tool's return string. Example for `compact_session`:

```typescript
// Current output:
return `Archived. ${turnCount} turns, ${filesCount} files. ${archiveCount} total archives. Session reset.`

// New output:
return `Archived. ${turnCount} turns, ${filesCount} files. ${archiveCount} total archives.\n` +
  `→ Session is now LOCKED. Call declare_intent to start new work.`
```

---

## US-05: Fix save_anchor Upsert + save_mem Dedup + Session Awareness

**Priority:** HIGH — stale data causes hallucination

**Files:**
- Modify: `src/tools/save-anchor.ts`
- Modify: `src/tools/save-mem.ts`
- Modify: `src/lib/anchors.ts` (if upsert logic needs lib change)

**Acceptance Criteria:**
- [ ] `save_anchor` with existing key UPDATES the value (upsert, not duplicate)
- [ ] `save_anchor` output shows `"updated"` vs `"saved"` and shows previous value
- [ ] `save_anchor` warns when no active session (not silent `"unknown"`)
- [ ] `save_anchor` description removes "API keys" (security risk) — replaces with "endpoints, ports, constraints"
- [ ] `save_mem` with duplicate content on same shelf returns "already exists" message
- [ ] `save_mem` warns when no active session (not silent `"unknown"`)
- [ ] `tsc --noEmit` passes
- [ ] `npm test` passes (add new tests for upsert behavior)

**Implementation:**

For save_anchor upsert, the `addAnchor` function in `src/lib/anchors.ts` already replaces existing keys (line confirmed in audit: "addAnchor replaces existing key" test passes). The TOOL just needs to detect the update and show the delta:

```typescript
const existing = anchorsState.anchors.find(a => a.key === args.key)
anchorsState = addAnchor(anchorsState, { key, value, ... })
await saveAnchors(directory, anchorsState)

if (existing) {
  return `Anchor updated: [${key}] (was: "${existing.value.slice(0,50)}", now: "${value.slice(0,50)}"). ${count} total.\n→ Use scan_hierarchy to see all anchors.`
} else {
  return `Anchor saved: [${key}] = "${value.slice(0,50)}". ${count} total.\n→ Use scan_hierarchy to see all anchors.`
}
```

---

## US-06: Fix scan_hierarchy — Structured Text Output

**Priority:** HIGH — raw JSON breaks consistent output style

**Files:**
- Modify: `src/tools/scan-hierarchy.ts`

**Acceptance Criteria:**
- [ ] Output is structured text (lines), NOT `JSON.stringify()`
- [ ] Output follows same format as `think_back` and `check_drift`
- [ ] Shows: session status, hierarchy levels, metrics, anchor count, mems count
- [ ] Each section labeled clearly
- [ ] Footer suggests `check_drift` or `think_back`
- [ ] Description differentiates from `think_back`: emphasizes "quick snapshot" vs "deep refocus"
- [ ] `tsc --noEmit` passes
- [ ] `npm test` passes (update tests checking JSON output)

**Implementation:**

Replace `JSON.stringify(result, null, 2)` with structured text:

```typescript
const lines: string[] = []
lines.push(`📊 Session: ${state.session.governance_status} | Mode: ${state.session.mode}`)
lines.push(``)
lines.push(`Hierarchy:`)
lines.push(`  Trajectory: ${state.hierarchy.trajectory || '(not set)'}`)
lines.push(`  Tactic: ${state.hierarchy.tactic || '(not set)'}`)
lines.push(`  Action: ${state.hierarchy.action || '(not set)'}`)
lines.push(``)
lines.push(`Metrics:`)
lines.push(`  Turns: ${state.metrics.turn_count} | Drift: ${state.metrics.drift_score}/100 | Files: ${state.metrics.files_touched.length}`)
lines.push(`  Context updates: ${state.metrics.context_updates}`)

if (anchorsState.anchors.length > 0) {
  lines.push(``)
  lines.push(`Anchors: ${anchorsState.anchors.length}`)
}

const memsState = await loadMems(directory)
if (memsState.mems.length > 0) {
  lines.push(`Memories: ${memsState.mems.length}`)
}

lines.push(``)
lines.push(`→ Use check_drift for alignment analysis, or think_back for a full context refresh.`)

return lines.join('\n')
```

---

## US-07: Fix declare_intent Overwrite Warning + self_rate Thresholds

**Priority:** MEDIUM — UX polish

**Files:**
- Modify: `src/tools/declare-intent.ts`
- Modify: `src/tools/self-rate.ts`

**Acceptance Criteria:**
- [ ] `declare_intent` warns when overwriting an existing trajectory: `"⚠ Previous trajectory replaced: \"...\"."`
- [ ] `self_rate` thresholds: `<= 3` → reset warning, `<= 5` → drift warning, `>= 6` → good progress
- [ ] `tsc --noEmit` passes
- [ ] `npm test` passes (update threshold tests in self-rate.test.ts)

---

## US-08: Fix list-shelves Array Mutation + think_back Output Budget

**Priority:** MEDIUM — data corruption risk and unbounded output

**Files:**
- Modify: `src/tools/list-shelves.ts`
- Modify: `src/tools/think-back.ts`

**Acceptance Criteria:**
- [ ] `list-shelves.ts` uses `[...memsState.mems].sort()` instead of in-place `.sort()`
- [ ] `think_back` Plan section capped at 10 lines with `"... (N more lines)"`
- [ ] `think_back` anchors capped at 5 with `"... and N more anchors"`
- [ ] `think_back` total output budget: ~2000 chars max
- [ ] `tsc --noEmit` passes
- [ ] `npm test` passes

---

## US-09: Package.json Publication Quality

**Priority:** HIGH — npm publication readiness

**Files:**
- Modify: `package.json`

**Acceptance Criteria:**
- [ ] `peerDependencies` changed from `"*"` to `">=1.1.0"`
- [ ] `files` changed to `["dist", "README.md", "LICENSE", "CHANGELOG.md"]` — remove `src/` and `docs/`
- [ ] BUT: `docs/10-commandments.md` must still be available → **embed as string constant** in `src/cli/init.ts` instead of file copy, OR add `"docs/10-commandments.md"` as a specific file (not whole `docs/` dir)
- [ ] `exports` field added for proper ESM resolution
- [ ] `@types/bun` removed from devDependencies
- [ ] Build script includes `chmod +x dist/cli.js`
- [ ] `tsc --noEmit` passes
- [ ] `npm test` passes
- [ ] `npm pack --dry-run` shows clean file list

---

## US-10: README Rewrite + CHANGELOG + Version Bump

**Priority:** HIGH — stale README is embarrassing for publication

**Files:**
- Rewrite: `README.md`
- Update: `CHANGELOG.md`
- Update: `package.json` (version → 2.0.0)

**Acceptance Criteria:**
- [ ] README documents all 11 tools with descriptions and examples
- [ ] README documents all 4 hooks
- [ ] README shows tool lifecycle matrix (when to use which tool)
- [ ] README shows install instructions (npx + manual)
- [ ] README shows governance modes table
- [ ] README test count matches actual (331+)
- [ ] CHANGELOG covers v2.0.0 changes
- [ ] Version bumped to 2.0.0 (significant behavioral changes)
- [ ] Git tag v2.0.0 created
- [ ] `npm test` passes
- [ ] `tsc --noEmit` passes

---

## Execution Order

```
US-01 (system prompt)
  ↓
US-02 (hook consistency) — depends on US-01 for injection changes
  ↓
US-03 (error consistency) — independent but best after hooks settled
US-04 (helper footers) — can parallel with US-03
US-05 (save_anchor/save_mem fixes) — independent
US-06 (scan_hierarchy text output) — independent
  ↓
US-07 (declare_intent + self_rate) — independent
US-08 (list-shelves + think_back) — independent
  ↓
US-09 (package.json) — after all code changes
  ↓
US-10 (README + version) — LAST
```

## Quality Gates

After EVERY user story:
1. `npx tsc --noEmit` — zero errors
2. `npm test` — all tests pass
3. Manual review of changed output format
4. Commit with descriptive message
