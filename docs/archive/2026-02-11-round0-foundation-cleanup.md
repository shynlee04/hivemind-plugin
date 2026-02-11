# HiveMind Round 0: Foundation & Cleanup

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate plugin to `.hivemind/` namespace, archive dead plans, wire existing hooks, synthesize "10 Commandments" for future tool development.

**Architecture:** Path migration (`.opencode/` → `.hivemind/`) across 28 source files, hook wiring in `src/index.ts`, plan archival to `.hivemind/archive/plans/`, "10 Commandments" synthesis from 3 source documents.

**Tech Stack:** OpenCode Plugin SDK v1.1.53, TypeScript strict mode, Node.js native test runner, existing 131 passing tests must remain passing.

---

## Task 1: Synthesize "10 Commandments" Document

**Files:**
- Create: `.hivemind/10-commandments.md` (will be created by init.ts)
- Create: `docs/10-commandments.md` (permanent reference in plugin)

**Step 1: Create the "10 Commandments" reference document**

File: `docs/10-commandments.md`

```markdown
# The 10 Commandments for Writing AI Agent Tools

> Synthesized from: iDumb MASTER-PLAN.md (5 NON-NEGOTIABLE principles), pitfalls-when-creating-tools.md (6 principles + 7-point rubric), and opencode-tool-architect skill.

These commandments apply to **all** tool development in HiveMind and downstream plugins. Violate at your own risk.

---

## Commandment 1: ONE ARGUMENT MAX (The Iceberg Principle)

**Rule:** Tools take 0-2 required arguments maximum. Hide complexity behind simple interfaces.

**Why:** Agents track state, not IDs. The system knows the active session, file context, and current focus. Don't make the agent repeat what the system already knows.

**Example:**
```
GOOD: declare_intent({ focus: "Build auth system" })
      → system handles mode, session ID, write-unlock automatically

BAD:  declare_intent({ session_id: "abc123", mode: "plan_driven", focus: "...", unlock_writes: true })
      → agent must track IDs, ceremony
```

**Enforcement:** Use `opencode-tool-architect` skill's 7-point checklist before creating tools. Point 4: "Low Argument Burden" - 0-2 required args maximum?

---

## Commandment 2: NATURAL SELECTION (No Shadowing)

**Rule:** Tool descriptions match the agent's natural thought. No prompt reminders. No "use X tool" in agent profiles.

**Why:** If a tool needs a prompt reminder, the description is bad ("Hollow Tool Trap"). Agents select tools when the description matches their intent in the moment.

**Example:**
```
GOOD: "Start tracking your work and unlock file writes."
      → agent thought: "I want to start working" → naturally selects

BAD:  "Initialize governance lifecycle entity management with mode and focus parameters."
      → PM jargon, agent won't pick this naturally
```

**Enforcement:** Pitfalls Question 1: "Do agents select this without prompt reminders?" If no → redesign description.

---

## Commandment 3: HIGH FREQUENCY, NOT NICHE

**Rule:** Build tools for many use cases, called frequently. One-shot workflows should be CLI scripts, not tools.

**Why:** High-frequency tools justify their existence. Niche tools clutter the tool list and reduce selection accuracy.

**Example:**
```
GOOD: fast_read({ path: "src/auth.ts" })      → called constantly during debugging
GOOD: map_context({ level: "action", ... })  → called every context switch

BAD:  generate_changelog({ format: "markdown" })  → called once per release → make a CLI script
```

**Enforcement:** Pitfalls Question 2: "Made for few specific use cases or many with high frequency?" If few → move to CLI script or command.

---

## Commandment 4: NO OVERLAP (Distinct Verb Domains)

**Rule:** Each tool has a distinct purpose. No two tools answer the same agent intent.

**Why:** Overlap confuses agents. Which tool do I pick? If both do "read file," the description must be crystal clear about the difference.

**Example:**
```
GOOD: read()           → reads full file
      fast_read()       → hierarchical index + section reading (Jump Read)
      grep()            → search across files

BAD:  scan_file()      → "read file"
      inspect_file()    → "read file with context"
      analyze_file()    → "read file and analyze"
      → 3 tools, same intent, confusion
```

**Enforcement:** Pitfalls Question 3: "Conflict with other tools? Overlapping solutions?" If yes → merge or delete.

---

## Commandment 5: CONTEXT IS KING (Context Inference)

**Rule:** Never ask for IDs or what the system already knows. The system knows active session, current file, last action.

**Why:** Agents forget IDs. They track "what I'm doing now," not "task abc123." IDs create shadowing.

**Example:**
```
GOOD: map_context({ level: "tactic", content: "..." })
      → system knows active session, updates it

BAD:  map_context({ session_id: "abc123", hierarchy_id: "xyz789", level: "tactic", ... })
      → agent must remember IDs, breaks flow
```

**Enforcement:** Agent-Native Principle 4: "Context Inference" - Don't ask for what's already known.

---

## Commandment 6: SIGNAL OVER NOISE (1-Line Output)

**Rule:** Return ONLY what the agent needs to continue working. 1-line success or structured JSON. Pull-not-push.

**Why:** Agents don't read navigation menus. They call `status` ONLY when confused. Verbose output wastes tokens.

**Example:**
```
GOOD: "Session OPEN. Trajectory set."
      or { allowed: true, warning: "..." }

BAD:  Task ID: abc123
      Plan: plan-456
      Status: active
      Next steps:
      1. Write tests
      2. Update docs
      Navigation: /status /complete /fail
      → agent ignores this
```

**Enforcement:** Agent-Native Principle 3: "Signal-to-Noise" - 1-line output. Pitfall Checklist Point 7.

---

## Commandment 7: HARMONIZE WITH HOOKS

**Rule:** Tool state changes must be visible to hooks. Hooks read what tools write. Shared state (brain.json, files) is the contract.

**Why:** Tools and hooks are two halves of one system. If a tool changes state that hooks can't see, governance breaks.

**Example:**
```
GOOD: map_context() updates brain.json.hierarchy
      → tool-gate hook reads brain.json to check if session has intent

BAD:  map_context() only returns string, no state change
      → tool-gate can't know if intent was declared
```

**Enforcement:** Pitfalls Principle 5: "Tools must harmonize with hooks - state changes visible to hooks."

---

## Commandment 8: ACTIONABLE OUTPUT

**Rule:** Agent can DO something with the output. If output is decorative, it's noise.

**Why:** Tools exist to help agents work. If the agent can't act on the result, the tool is useless.

**Example:**
```
GOOD: fast_read() returns { sections: [...] }
      → agent can pick a section to read deeper

BAD:  fast_read() returns "This file has 5 sections and 200 lines."
      → agent can't do anything with this info
```

**Enforcement:** Pitfalls Principle 4: "Tool output must be actionable."

---

## Commandment 9: PARALLEL BY DESIGN (Native Parallelism)

**Rule:** Tools designed to be called N times in one turn. Each call is atomic. No JSON batch parsing.

**Why:** Agents think in parallel. "Add 3 tasks" → 3 tool calls, not 1 call with array.

**Example:**
```
GOOD: map_context({ level: "action", content: "Write tests" })
      + map_context({ level: "action", content: "Update docs" })
      + map_context({ level: "action", content: "Run lint" })
      → 3 calls, each atomic

BAD:  map_context({ actions: [
        { level: "action", content: "Write tests" },
        { level: "action", content: "Update docs" },
        { level: "action", content: "Run lint" }
      ]})
      → agent must parse JSON, error-prone
```

**Enforcement:** Agent-Native Principle 5: "Native Parallelism" - N calls in one turn.

---

## Commandment 10: SCHEMA FIRST, THEN CODE

**Rule:** Define schema first, derive types, write code. Never hand-write interfaces.

**Why:** Schemas are the contract. Hand-written interfaces drift from the tool registration. Schema-first ensures runtime and compile-time agreement.

**Example:**
```
GOOD:
import { tool, tool } from "@opencode-ai/plugin/tool"

export default tool({
  description: "...",
  args: {
    level: tool.schema.enum(["trajectory", "tactic", "action"]).describe("Hierarchy level"),
    content: tool.schema.string().describe("The new focus"),
  },
  async execute(args) {
    // args.level is type "trajectory" | "tactic" | "action"
  }
})

BAD:
interface MapContextArgs {
  level: string  // no compile-time check
  content: string
}

async function mapContext(args: MapContextArgs) {
  // runtime validation missing, type drift possible
}
```

**Enforcement:** Pitfalls Principle 6: "Schema-first - define schema, derive type, write tool."

---

## The 7-Point Validation Checklist (Use Before Creating ANY Tool)

After designing a tool, answer these 7 questions. If ANY answer is NO → redesign.

1. **Natural Selection**: Does the description match the agent's natural thought?
2. **High Frequency**: Will this be called often, or is it a rare one-off?
3. **No Overlap**: Does this conflict with innate tools or existing custom tools?
4. **Low Argument Burden**: 0-2 required args maximum?
5. **Lifecycle Granularity**: Does it map to ONE workflow moment?
6. **Hook vs Tool**: Should enforcement live in a hook instead?
7. **Signal-to-Noise**: Is output 1-line or structured JSON?

---

## Summary

| Commandment | Key Phrase | Skill Reference |
|---|---|---|
| 1 | ONE ARGUMENT MAX | Iceberg Principle |
| 2 | NATURAL SELECTION | No Shadowing |
| 3 | HIGH FREQUENCY | Pitfalls Q2 |
| 4 | NO OVERLAP | Pitfalls Principle 3 |
| 5 | CONTEXT IS KING | Context Inference |
| 6 | SIGNAL OVER NOISE | Signal-to-Noise |
| 7 | HARMONIZE WITH HOOKS | Pitfalls Principle 5 |
| 8 | ACTIONABLE OUTPUT | Pitfalls Principle 4 |
| 9 | PARALLEL BY DESIGN | Native Parallelism |
| 10 | SCHEMA FIRST, THEN CODE | Pitfalls Principle 6 |

**Follow these, and agents will pick your tools naturally, use them frequently, and never complain about bureaucracy.**
```

**Step 2: Run typecheck to verify Markdown syntax**

```bash
npm run typecheck
```

Expected: No errors (Markdown files don't affect TypeScript compilation)

**Step 3: Commit the 10 Commandments**

```bash
git add docs/10-commandments.md
git commit -m "docs: synthesize 10 Commandments for tool design from iDumb principles"
```

---

## Task 2: Migrate Paths From `.opencode/` To `.hivemind/`

**Files:**
- Modify: `src/cli/init.ts` (lines 90, 100-105)
- Modify: `src/lib/persistence.ts` (lines 21, 61, 80)
- Modify: `src/lib/planning-fs.ts` (line 21)
- Modify: `AGENTS.md` (all path references)
- Modify: `README.md` (all path references)
- Modify: `example-opencode.json` (line 3)
- Modify: `CHANGELOG.md` (add v1.4.0 entry)

**Step 1: Update init.ts to create `.hivemind/` directory**

File: `src/cli/init.ts:90`

Replace:
```typescript
const planningDir = join(directory, ".opencode", "planning")
```

With:
```typescript
const hivemindDir = join(directory, ".hivemind")
```

**Step 2: Update planning directory references in init.ts**

File: `src/cli/init.ts:100-105`

Replace all references to `planningDir` with `hivemindDir`. Update comment:
```typescript
// Create .hivemind directory structure
const sessionsDir = join(hivemindDir, "sessions")
const brainDir = join(hivemindDir, "brain")
const plansDir = join(hivemindDir, "plans")
const logsDir = join(hivemindDir, "logs")
```

**Step 3: Copy 10-commandments.md to .hivemind on init**

File: `src/cli/init.ts` - add after directory creation:

```typescript
// Copy 10 Commandments to .hivemind
const commandmentsSource = join(__dirname, "..", "docs", "10-commandments.md")
const commandmentsDest = join(hivemindDir, "10-commandments.md")
await copyFile(commandmentsSource, commandmentsDest)
await log.info("Copied 10 Commandments to .hivemind/")
```

**Step 4: Update persistence.ts paths**

File: `src/lib/persistence.ts:21`

Replace:
```typescript
const brainPath = join(projectRoot, ".opencode", "planning", "brain.json")
```

With:
```typescript
const brainPath = join(projectRoot, ".hivemind", "brain.json")
```

File: `src/lib/persistence.ts:61,80`

Replace:
```typescript
const configPath = join(projectRoot, ".opencode", "planning", "config.json")
```

With:
```typescript
const configPath = join(projectRoot, ".hivemind", "config.json")
```

**Step 5: Update planning-fs.ts paths**

File: `src/lib/planning-fs.ts:21`

Replace:
```typescript
const planningDir = join(projectRoot, ".opencode", "planning")
```

With:
```typescript
const hivemindDir = join(projectRoot, ".hivemind")
const sessionsDir = join(hivemindDir, "sessions")
```

Update all references:
```typescript
const indexPath = join(sessionsDir, "index.md")
const activePath = join(sessionsDir, "active.md")
const archiveDir = join(sessionsDir, "archive")
```

**Step 6: Run existing tests to identify failures**

```bash
npm test
```

Expected: Some tests fail (they're hardcoded to look for `.opencode/planning/` paths)

**Step 7: Update all test files to use new paths**

Files to modify:
- `tests/init-planning.test.ts` - update `planningDir` references
- `tests/tool-gate.test.ts` - update config paths
- `tests/integration.test.ts` - update directory structure

In each test file:
```typescript
// OLD
const planningDir = join(dir, ".opencode", "planning")

// NEW
const hivemindDir = join(dir, ".hivemind")
const sessionsDir = join(hivemindDir, "sessions")
```

**Step 8: Verify all tests pass after path migration**

```bash
npm test
```

Expected: All 131 tests pass

**Step 9: Update AGENTS.md path references**

File: `AGENTS.md`

Replace all `.opencode/planning/` with `.hivemind/`

Update directory tree:
```markdown
.opencode/planning/      →  .hivemind/
├── index.md                ├── sessions/
├── active.md              │   ├── index.md
├── brain.json             │   ├── active.md
├── config.json            │   └── archive/
└── archive/               ├── brain.json
                           ├── config.json
                           ├── 10-commandments.md
                           ├── plans/
                           │   └── archive/
                           └── logs/
```

**Step 10: Update README.md path references**

File: `README.md`

Replace `.opencode/planning/` with `.hivemind/`

Update installation docs to reflect new structure.

**Step 11: Update example-opencode.json**

File: `example-opencode.json:3`

Replace:
```json
"plugin": ["file://.hivemind/src/index.ts"]
```

With:
```json
"plugin": ["file://./dist/index.js"]
```

Or add comment:
```json
"plugin": ["hivemind-context-governance"]
// Development: "plugin": ["file://./dist/index.js"]
```

**Step 12: Update CHANGELOG.md**

File: `CHANGELOG.md`

Add new entry at top:
```markdown
## [1.4.0] - 2026-02-11

### Changed
- **BREAKING**: Migrated from `.opencode/planning/` to `.hivemind/` directory structure
- Plugin now creates `.hivemind/sessions/` for session state
- Added `.hivemind/10-commandments.md` (tool design reference)
- `.hivemind/plans/` for plan storage (not `.plan/plans/`)

### Added
- 10 Commandments document for tool design principles
- `.hivemind/` directory structure with sessions, brain, plans, logs subdirectories

### Fixed
- Path references throughout codebase, tests, documentation

### Migration Guide
Existing projects using `.opencode/planning/` need to:
1. Run `hivemind init --migrate` (new flag)
2. Or manually move `.opencode/planning/` → `.hivemind/`
```

**Step 13: Commit path migration**

```bash
git add src/cli/init.ts src/lib/persistence.ts src/lib/planning-fs.ts tests/ AGENTS.md README.md example-opencode.json CHANGELOG.md
git commit -m "feat: migrate from .opencode/planning/ to .hivemind/ directory structure

- Add 10 Commandments to .hivemind/10-commandments.md
- Update all path references in code, tests, docs
- BREAKING: Existing projects need to migrate"
```

---

## Task 3: Archive Dead iDumb Plans

**Files:**
- Move: `.plan/plans/Brain_Engine_Prototype_980105f5.md` → `.hivemind/plans/archive/iDumb-dead-plans/`
- Move: `.plan/plans/iDumb_Strategic_Reset_Framework_f8434a4c.md` → `.hivemind/plans/archive/iDumb-dead-plans/`
- Move: `.plan/plans/iDumb_Plugin_Reboot_v2_96f02b43.md` → `.hivemind/plans/archive/iDumb-dead-plans/`
- Move: `.plan/plans/iDumb_Plugin_Reboot_d5317467.md` → `.hivemind/plans/archive/iDumb-dead-plans/`
- Move: `.plan/plans/MICRO-MILESTONE-ARCHITECTURE-2026-02-05.md` → `.hivemind/plans/archive/iDumb-dead-plans/`
- Move: `.plan/plans/concerns-of-approach.md` → `.hivemind/plans/archive/iDumb-dead-plans/`
- Archive: `.plan/plans/HiveMind_Context_Governance_Worktree_dff10786.md` → `.hivemind/plans/archive/HiveMind_Historical_Plans/`

**Step 1: Create archive directories**

```bash
mkdir -p .hivemind/plans/archive/iDumb-dead-plans
mkdir -p .hivemind/plans/archive/HiveMind_Historical_Plans
```

**Step 2: Move dead iDumb plans**

```bash
mv .plan/plans/Brain_Engine_Prototype_980105f5.md .hivemind/plans/archive/iDumb-dead-plans/
mv .plan/plans/iDumb_Strategic_Reset_Framework_f8434a4c.md .hivemind/plans/archive/iDumb-dead-plans/
mv .plan/plans/iDumb_Plugin_Reboot_v2_96f02b43.md .hivemind/plans/archive/iDumb-dead-plans/
mv .plan/plans/iDumb_Plugin_Reboot_d5317467.md .hivemind/plans/archive/iDumb-dead-plans/
mv .plan/plans/MICRO-MILESTONE-ARCHITECTURE-2026-02-05.md .hivemind/plans/archive/iDumb-dead-plans/
mv .plan/plans/concerns-of-approach.md .hivemind/plans/archive/iDumb-dead-plans/
```

**Step 3: Add README to iDumb-dead-plans archive**

File: `.hivemind/plans/archive/iDumb-dead-plans/README.md`

```markdown
# iDumb v2 Legacy Plans

These plans are from the predecessor project "iDumb v2" and are **no longer applicable** to the current HiveMind codebase.

They are preserved here for historical reference only.

## Files in This Archive

1. `Brain_Engine_Prototype_980105f5.md` - Described a `govern_brain` tool with 5 actions. Files and paths do not exist in HiveMind.
2. `iDumb_Strategic_Reset_Framework_f8434a4c.md` - Strategic reset plan for iDumb. Not applicable.
3. `iDumb_Plugin_Reboot_v2_96f02b43.md` - iDumb v2 plugin reboot plan. Not applicable.
4. `iDumb_Plugin_Reboot_d5317467.md` - iDumb v1 plugin reboot plan. Not applicable.
5. `MICRO-MILESTONE-ARCHITECTURE-2026-02-05.md` - iDumb micro-milestone architecture. Not applicable.
6. `concerns-of-approach.md` - 5-line concern note. Not applicable.

## Why These Are Dead

- HiveMind simplified from iDumb's complex agent hierarchy (Coordinator/Investigator/Executor)
- HiveMind has 4 tools instead of iDumb's many `govern_*` tools
- File paths (`.idumb/brain/index/`, `src/tools/govern-brain.ts`) don't exist in HiveMind
- Worktree paths (`/Users/apple/Documents/coding-projects/idumb/v2-brain-prototype`) are not this repo

## Status

**DO NOT USE THESE PLANS.** They reference non-existent code and paths.

Current active planning: `.hivemind/plans/` and `docs/plans/`
```

**Step 4: Archive HiveMind historical plan**

```bash
mv .plan/plans/HiveMind_Context_Governance_Worktree_dff10786.md .hivemind/plans/archive/HiveMind_Historical_Plans/
```

**Step 5: Add README to HiveMind historical archive**

File: `.hivemind/plans/archive/HiveMind_Historical_Plans/README.md`

```markdown
# HiveMind Historical Plans

Archived HiveMind plans that are no longer active but may be useful for reference.

## Files in This Archive

1. `HiveMind_Context_Governance_Worktree_dff10786.md` - Original implementation plan for v1.0.0
   - Described the full 8-phase implementation
   - Phase 1-4 marked DONE (bootstrap, schemas, tools, hooks)
   - Phase 5 (OpenTUI Dashboard): PENDING
   - Phase 6 (CLI): DONE
   - Phase 7 (Tests): Showed 76 assertions
   - Phase 8 (Docs): AGENTS.md done, README.md pending

## Why This Plan Was Archived

- Plan was created for a worktree at `.worktrees/hivemind-context-governance/` (no longer used)
- Test counts changed from 76 to 131 (self_rate tool added in v1.2.0)
- Plan says "3 tools" but current code has 4 tools
- Success criteria: 5/11 checked. Dashboard and TypeScript compilation unchecked.
- The plan is partially stale and superseded by ongoing development.

## Current Active Planning

- `.hivemind/plans/` - Active development plans
- `docs/plans/` - Published plans
- `CHANGELOG.md` - Release notes
- `AGENTS.md` - Agent-facing documentation
```

**Step 6: Create empty .plan/plans/.gitkeep for backwards compatibility**

File: `.plan/plans/.gitkeep`

```markdown
# This directory is deprecated

HiveMind plans are now stored in `.hivemind/plans/`

This `.plan/` directory structure is kept for backwards compatibility only.
No new plans should be created here.
```

**Step 7: Update .gitignore to ignore moved content**

File: `.gitignore`

Ensure `.plan/` is not ignored (we want the archive in git), but add comment:
```gitignore
# Deprecated .plan/ directory structure (kept for backwards compatibility)
# Active plans: .hivemind/plans/
```

**Step 8: Commit plan archival**

```bash
git add .hivemind/plans/archive/ .plan/plans/.gitkeep .gitignore
git rm -r .plan/plans/Brain_Engine_Prototype_980105f5.md .plan/plans/iDumb_*.md .plan/plans/MICRO-MILESTONE-ARCHITECTURE-2026-02-05.md .plan/plans/concerns-of-approach.md .plan/plans/HiveMind_Context_Governance_Worktree_dff10786.md
git commit -m "chore: archive dead iDumb plans and historical HiveMind plans

- Moved 6 dead iDumb plans to .hivemind/plans/archive/iDumb-dead-plans/
- Archived original HiveMind implementation plan to .hivemind/plans/archive/HiveMind_Historical_Plans/
- Added READMEs explaining why these plans are dead
- Kept .plan/plans/ with .gitkeep for backwards compatibility"
```

---

## Task 4: Wire Existing Dead Hooks

**Files:**
- Modify: `src/hooks/index.ts` (export tool-gate and compaction)
- Modify: `src/index.ts` (register both hooks)
- Test: `tests/tool-gate.test.ts` (already exists, should pass once wired)
- Test: `tests/integration.test.ts` (add compaction hook test)

**Step 1: Read existing dead hook implementations**

```bash
cat src/hooks/tool-gate.ts
cat src/hooks/compaction.ts
```

Note: Both are fully implemented and tested, just not exported.

**Step 2: Export both hooks from hooks/index.ts**

File: `src/hooks/index.ts`

Add exports:
```typescript
export { createToolGateHook } from "./tool-gate"
export { createCompactionHook } from "./compaction"
```

**Step 3: Register tool.execute.before hook in src/index.ts**

File: `src/index.ts` - add after line 76:

```typescript
import { createToolGateHook } from "./hooks/index.js"
```

Then add hook registration after line 90:

```typescript
/**
 * Hook: Tool gate - governance enforcement
 * Blocks or allows tool execution based on governance mode and session state
 */
"tool.execute.before": createToolGateHook(log, effectiveDir, config),
```

**Step 4: Register experimental.session.compacting hook in src/index.ts**

File: `src/index.ts` - add import:

```typescript
import { createCompactionHook } from "./hooks/index.js"
```

Then add hook registration:

```typescript
/**
 * Hook: Session compaction - preserve hierarchy across context boundaries
 * Injects trajectory/tactic/action markers into compacted context
 */
"experimental.session.compacting": createCompactionHook(log, effectiveDir),
```

**Step 5: Run existing tool-gate tests**

```bash
npm test tests/tool-gate.test.ts
```

Expected: All 12 assertions pass (hook is now wired, tests can call it)

**Step 6: Add integration test for compaction hook**

File: `tests/integration.test.ts` - add new test function:

```typescript
async function test_compactionHookPreservesHierarchy() {
  process.stderr.write("\n--- integration: compaction hook preserves hierarchy ---\n")

  const dir = await setup()

  try {
    await initProject(dir, { governanceMode: "assisted", language: "en" })

    const declareIntentTool = createDeclareIntentTool(dir)
    const mapContextTool = createMapContextTool(dir)

    // Set up full hierarchy
    await declareIntentTool.execute({
      mode: "plan_driven",
      focus: "Build feature"
    })
    await mapContextTool.execute({
      level: "tactic",
      content: "Implement component"
    })
    await mapContextTool.execute({
      level: "action",
      content: "Write test"
    })

    const stateManager = createStateManager(dir)
    const compactionHook = createCompactionHook(
      await createLogger(join(dir, "test-logs"), "test"),
      dir
    )

    const state = await stateManager.load()
    const output = { context: [] }

    await compactionHook(
      { sessionID: state.session.id },
      output
    )

    assert(
      output.context.length > 0,
      "compaction hook should add context"
    )
    assert(
      output.context[0].includes("Trajectory: Build feature"),
      "hierarchy should include trajectory"
    )
    assert(
      output.context[0].includes("Tactic: Implement component"),
      "hierarchy should include tactic"
    )
    assert(
      output.context[0].includes("Action: Write test"),
      "hierarchy should include action"
    )
  } finally {
    await cleanup()
  }
}
```

**Step 7: Run all tests to verify nothing broke**

```bash
npm test
```

Expected: All 131 + 1 = 132 assertions pass

**Step 8: Update AGENTS.md to document new hooks**

File: `AGENTS.md` - add section after "Integration with OpenCode":

```markdown
## Hook Architecture

HiveMind uses 4 hooks to provide governance:

| Hook | Purpose | Behavior |
|------|---------|----------|
| `tool.execute.before` | Governance enforcement | Blocks tools in strict mode without `declare_intent` |
| `tool.execute.after` | Tracking & drift detection | Increments turn count, checks drift, detects violations |
| `experimental.chat.system.transform` | System prompt injection | Adds governance context to every LLM turn |
| `experimental.session.compacting` | Context preservation | Preserves hierarchy across LLM context compaction |

### tool.execute.before (Tool Gate)

The tool gate hook enforces governance based on mode:

| Mode | Behavior |
|------|----------|
| **strict** | Blocks ALL write tools until `declare_intent` is called. Returns `{ allowed: false }` to prevent execution. |
| **assisted** | Warns strongly when tools used without declared intent. Allows execution. |
| **permissive** | Silent tracking only. No warnings or blocks. |

This hook is fully tested (12 assertions) and actually blocks execution (unlike legacy iDumb's soft enforcement).
```

**Step 9: Run TypeScript compilation**

```bash
npm run typecheck
```

Expected: Zero errors

**Step 10: Commit hook wiring**

```bash
git add src/hooks/index.ts src/index.ts tests/integration.test.ts AGENTS.md
git commit -m "feat: wire existing tool-gate and compaction hooks

- Export createToolGateHook and createCompactionHook from hooks/index.ts
- Register tool.execute.before hook for governance enforcement
- Register experimental.session.compacting hook for context preservation
- Add integration test for compaction hook
- Update AGENTS.md to document 4-hook architecture

Both hooks were fully implemented and tested but not connected. Now active."
```

---

## Task 5: Update Git Configuration for Automatic Enforcement

**Files:**
- Create: `scripts/setup-git-hooks.sh` (executable script)
- Create: `.githooks/pre-commit` (pre-commit hook for atomic commits)
- Modify: `CHANGELOG.md` (document new git setup)
- Modify: `AGENTS.md` (mention git hooks)

**Step 1: Create git hooks setup script**

File: `scripts/setup-git-hooks.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Setting up HiveMind git hooks..."

# Copy hooks to .git/hooks
cp "$PROJECT_ROOT/.githooks/pre-commit" "$PROJECT_ROOT/.git/hooks/pre-commit"
chmod +x "$PROJECT_ROOT/.git/hooks/pre-commit"

echo "✅ Git hooks installed. Pre-commit hook will enforce atomic commits."
echo ""
echo "The pre-commit hook will:"
echo "  - Check if .hivemind/brain.json was modified"
echo "  - Check if .hivemind/sessions/active.md was modified"
echo "  - Prompt for a focused commit message if so"
```

**Step 2: Make script executable**

```bash
chmod +x scripts/setup-git-hooks.sh
```

**Step 3: Create pre-commit hook**

File: `.githooks/pre-commit`

```bash
#!/usr/bin/env bash
# HiveMind Pre-Commit Hook
# Enforces atomic commits and session state awareness

set -euo pipefail

# Check if staged files include brain.json or active.md
STAGED_FILES=$(git diff --cached --name-only)

if echo "$STAGED_FILES" | grep -q ".hivemind/brain.json"; then
  echo ""
  echo "⚠️  brain.json modified - ensure session state is consistent"
  echo "   Consider running: hivemind status to verify session"
fi

if echo "$STAGED_FILES" | grep -q ".hivemind/sessions/active.md"; then
  echo ""
  echo "⚠️  active.md modified - ensure hierarchy is up to date"
  echo "   Verify trajectory/tactic/action are consistent before committing"
fi

# Optional: Check for .plan/ directory (deprecated)
if echo "$STAGED_FILES" | grep -q "^\.plan/"; then
  echo ""
  echo "⚠️  WARNING: Files in .plan/ are deprecated"
  echo "   Active plans should be in .hivemind/plans/"
  echo ""
  read -p "Continue commit? [y/N] " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Commit aborted."
    exit 1
  fi
fi

exit 0
```

**Step 4: Run setup script**

```bash
./scripts/setup-git-hooks.sh
```

**Step 5: Test pre-commit hook**

```bash
# Create a test brain.json modification
echo '{}' > .hivemind/brain.json
git add .hivemind/brain.json
git commit -m "test: verify pre-commit hook"
```

Expected: Pre-commit hook runs and displays warning before committing.

**Step 6: Update CHANGELOG.md**

File: `CHANGELOG.md` - add to v1.4.0:

```markdown
### Added
- Git hooks setup script (scripts/setup-git-hooks.sh)
- Pre-commit hook for enforcing atomic commits and session awareness
```

**Step 7: Update AGENTS.md to mention git hooks**

File: `AGENTS.md` - add section:

```markdown
## Git Integration

HiveMind provides git hooks to enforce best practices:

### Setup

```bash
./scripts/setup-git-hooks.sh
```

This installs a pre-commit hook that:
- Warns when `brain.json` is modified (verify session state)
- Warns when `active.md` is modified (check hierarchy consistency)
- Warns when `.plan/` files are staged (use `.hivemind/plans/` instead)
- Requires confirmation before committing deprecated `.plan/` files

### Atomic Commit Guidelines

Follow these guidelines when committing:
1. Commit tool changes with their tests together
2. Keep commits focused: one feature or bug fix per commit
3. Run `npm test` before committing if tests are affected
4. Update `CHANGELOG.md` for user-facing changes
```

**Step 8: Commit git hooks**

```bash
git add scripts/setup-git-hooks.sh .githooks/pre-commit .git/hooks/pre-commit CHANGELOG.md AGENTS.md
git commit -m "feat: add git hooks for atomic commit enforcement

- scripts/setup-git-hooks.sh: automated hook installation
- .githooks/pre-commit: enforces session state awareness
- Warns on brain.json or active.md modifications
- Blocks commits to deprecated .plan/ directory
- Update CHANGELOG.md and AGENTS.md"
```

---

## Task 6: Final Verification & Documentation

**Files:**
- Verify: All 132 tests pass
- Verify: TypeScript compilation passes
- Verify: Directory structure is correct
- Create: `docs/migration-guide-v1.3-to-v1.4.md`

**Step 1: Run full test suite**

```bash
npm test
```

Expected: All 132 assertions pass (131 existing + 1 new integration test)

**Step 2: Run TypeScript compilation**

```bash
npm run typecheck
```

Expected: Zero errors

**Step 3: Verify .hivemind directory structure**

```bash
tree -L 3 .hivemind/ 2>/dev/null || find .hivemind/ -maxdepth 3 -type d
```

Expected structure:
```
.hivemind/
├── 10-commandments.md
├── plans/
│   └── archive/
│       ├── iDumb-dead-plans/
│       └── HiveMind_Historical_Plans/
└── sessions/  (will be created by init)
```

**Step 4: Create migration guide**

File: `docs/migration-guide-v1.3-to-v1.4.md`

```markdown
# Migration Guide: HiveMind v1.3 → v1.4

## Overview

HiveMind v1.4 introduces breaking changes to the directory structure. The `.opencode/planning/` directory is replaced with `.hivemind/`.

## What Changed

| v1.3 | v1.4 |
|-------|-------|
| `.opencode/planning/index.md` | `.hivemind/sessions/index.md` |
| `.opencode/planning/active.md` | `.hivemind/sessions/active.md` |
| `.opencode/planning/brain.json` | `.hivemind/brain.json` |
| `.opencode/planning/config.json` | `.hivemind/config.json` |
| `.opencode/planning/archive/` | `.hivemind/sessions/archive/` |
| - | `.hivemind/10-commandments.md` |
| - | `.hivemind/plans/` |
| - | `.hivemind/logs/` |

## Manual Migration

If you want to migrate manually:

```bash
# 1. Create new structure
mkdir -p .hivemind/sessions/archive
mkdir -p .hivemind/plans/archive
mkdir -p .hivemind/logs

# 2. Move session files
mv .opencode/planning/index.md .hivemind/sessions/
mv .opencode/planning/active.md .hivemind/sessions/
mv .opencode/planning/brain.json .hivemind/
mv .opencode/planning/config.json .hivemind/
mv .opencode/planning/archive/* .hivemind/sessions/archive/

# 3. Move plans (if any)
mkdir -p .hivemind/plans/archive
# Archive old plans to .hivemind/plans/archive/

# 4. Remove old directory (optional)
rm -rf .opencode/planning/
```

## Automated Migration (Future)

The `hivemind init` command will add a `--migrate` flag in a future release to automate this process.

## What's New in v1.4

- **10 Commandments** document for tool design
- **Hook wiring**: `tool.execute.before` and `experimental.session.compacting` now active
- **Git hooks**: Pre-commit enforcement for atomic commits
- **Plan organization**: Active plans in `.hivemind/plans/`, archived plans in `.hivemind/plans/archive/`

## Compatibility

- Existing `opencode.json` plugin registration remains valid: `"plugin": ["hivemind-context-governance"]`
- CLI commands unchanged: `hivemind init`, `hivemind status`, `hivemind compact`, `hivemind dashboard`
- All 4 tools work identically: `declare_intent`, `map_context`, `compact_session`, `self_rate`

## Questions?

See `AGENTS.md` for documentation on using HiveMind.
```

**Step 5: Commit migration guide**

```bash
git add docs/migration-guide-v1.3-to-v1.4.md
git commit -m "docs: add migration guide for v1.3 to v1.4

- Document directory structure changes
- Provide manual migration steps
- List what's new in v1.4
- Confirm compatibility"
```

**Step 6: Create .hivemind/.gitkeep to track directory in git**

```bash
touch .hivemind/.gitkeep
git add .hivemind/.gitkeep
git commit -m "chore: add .hivemind/.gitkeep to track directory structure in git"
```

**Step 7: Final test run**

```bash
npm test && npm run typecheck
```

Expected: All tests pass, no TypeScript errors

**Step 8: Update package.json version**

File: `package.json`

```json
{
  "version": "1.4.0"
}
```

**Step 9: Commit version bump**

```bash
git add package.json
git commit -m "chore: bump version to 1.4.0"
git tag v1.4.0
```

---

## Success Criteria

- [x] 10 Commandments synthesized from 3 source documents
- [x] All paths migrated from `.opencode/` to `.hivemind/`
- [x] 6 dead iDumb plans archived with READMEs
- [x] 1 historical HiveMind plan archived with README
- [x] 2 dead hooks wired and active (`tool.execute.before`, `experimental.session.compacting`)
- [x] All 132 tests pass (131 existing + 1 integration test)
- [x] TypeScript compilation passes with zero errors
- [x] Git hooks installed for atomic commit enforcement
- [x] Migration guide created for v1.3 → v1.4
- [x] Package version bumped to 1.4.0

---

## Summary

Round 0 establishes a clean foundation for future rounds:

1. **Paths unified**: `.hivemind/` is the single source of truth
2. **Plans organized**: Active vs archived, no hash suffixes, date-stamped
3. **Hooks wired**: Tool governance and context preservation now work
4. **Principles documented**: 10 Commandments guide all future tool development
5. **Git enforced**: Pre-commit hooks prevent bad commits

This foundation enables Rounds 1-4 (Auto-Hooks, Session Management, Agent Tools, Mems Brain) to build on a stable, tested, and documented base.

**Next Round:** Round 1 (Auto-Hooks & Governance Layer) — Time-to-Stale, Git Atomic Commits, Hierarchy Chain Breaking, Activate Agent Tools.
