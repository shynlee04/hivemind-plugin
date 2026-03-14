# HiveOps Framework Tools — TDD Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Validate, test, and integrate the 4 hiveops custom tools + 1 governance plugin so they actually work end-to-end for the agent team.

**Architecture:** OpenCode custom tools (`.opencode/tool/*.ts`) + plugin (`.opencode/plugins/`) loaded by bun runtime. Tests via standalone bun test scripts in `.opencode/tests/`.

**Tech Stack:** TypeScript, @opencode-ai/plugin SDK, bun test runner, node:fs/path

---

### Task 1: Create Test Harness + Validate All Tools Compile

**Files:**
- Create: `.opencode/tests/hiveops-tools.test.ts`
- Create: `.opencode/tests/tsconfig.json`

**Step 1: Write tsconfig for .opencode tests**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["bun-types"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "."
  },
  "include": ["../**/*.ts"],
  "exclude": ["../node_modules"]
}
```

**Step 2: Write compilation validation test**

Test that every `.opencode/tool/*.ts` and `.opencode/plugins/**/*.ts` can be imported without errors. Test that each tool exports a default with `description` and `execute` properties.

**Step 3: Run test**

Run: `cd .opencode && npx bun test tests/hiveops-tools.test.ts`
Expected: All tools compile and export correct shape

**Step 4: Commit**

```bash
git add .opencode/tests/
git commit -m "test: add hiveops tool compilation test harness"
```

---

### Task 2: Test hiveops_todo — All 8 Actions

**Files:**
- Create: `.opencode/tests/hiveops-todo.test.ts`
- Modify: `.opencode/tool/hiveops_todo.ts` (fix any bugs found)

**Step 1: Write failing tests for all actions**

Tests for: add, start, complete, block, cancel, list, deps, export
- add: creates item, returns ID, persists to `.hivemind/state/todo.json`
- start: only one active, blocks if deps unmet
- complete: marks done, unblocks downstream
- deps: shows upstream/downstream graph
- list: formatted output with status icons
- export: JSON snapshot

**Step 2: Run tests to verify they fail**

Run: `cd .opencode && npx bun test tests/hiveops-todo.test.ts`
Expected: FAIL — tests reference tool internals that need extraction

**Step 3: Extract testable functions from hiveops_todo.ts**

Extract `loadTodoState`, `saveTodoState`, `generateId` as named exports alongside the default tool export so tests can unit-test the state logic.

**Step 4: Fix bugs, run tests until pass**

Run: `cd .opencode && npx bun test tests/hiveops-todo.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add .opencode/tool/hiveops_todo.ts .opencode/tests/hiveops-todo.test.ts
git commit -m "test: validate hiveops_todo all 8 actions with TDD"
```

---

### Task 3: Test hiveops_gate — All 6 Actions

**Files:**
- Create: `.opencode/tests/hiveops-gate.test.ts`
- Modify: `.opencode/tool/hiveops_gate.ts` (fix any bugs found)

**Step 1: Write failing tests**

Tests for: criteria, check, pass, fail, status, reset
- criteria: returns G0-G4 definitions
- pass: requires evidence, persists to `.hivemind/state/gates.json`
- fail: requires reason, records failure
- status: shows all gates with icons
- reset: clears gate or all gates

**Step 2-5: Same TDD loop as Task 2**

---

### Task 4: Test hiveops_sot — All 7 Actions

**Files:**
- Create: `.opencode/tests/hiveops-sot.test.ts`
- Modify: `.opencode/tool/hiveops_sot.ts` (fix any bugs found)

**Step 1: Write failing tests**

Tests for: register, search, scan, stale, tree, index, export
- register: creates entry in `.hivemind/state/sot-index.json`
- search: finds by title/tag/domain
- scan: auto-discovers files in docs/
- stale: flags files >48h old
- tree: renders hierarchy
- export: writes TSV

**Step 2-5: Same TDD loop**

---

### Task 5: Test hiveops_export — All 4 Actions

**Files:**
- Create: `.opencode/tests/hiveops-export.test.ts`
- Modify: `.opencode/tool/hiveops_export.ts` (fix any bugs found)

**Step 1: Write failing tests**

Tests for: handoff, checkpoint, list, read
- handoff: creates JSON + MD in `.hivemind/handoffs/`, includes gate state
- checkpoint: snapshots TODO + gate state
- list: shows recent handoffs
- read: retrieves handoff content

**Step 2-5: Same TDD loop**

---

### Task 6: Test hiveops-governance Plugin — Hook Interfaces

**Files:**
- Create: `.opencode/tests/hiveops-governance.test.ts`
- Modify: `.opencode/plugins/hiveops-governance/**/*.ts` (fix any bugs found)

**Step 1: Write failing tests**

Tests for:
- types.ts: DELEGATION_TOPOLOGY has all 8 agents, SCOPE_BOUNDARIES correct
- utils.ts: matchesScope, isPathAllowed, validateDelegation all work correctly
- hooks/delegation.ts: blocks unauthorized delegation, blocks scope violations
- hooks/compaction.ts: injects governance context into output.context array

**Step 2-5: Same TDD loop**

---

### Task 7: Integration Test — Full Agent Workflow

**Files:**
- Create: `.opencode/tests/integration.test.ts`

**Step 1: Write end-to-end test**

Simulates:
1. Agent starts session → enforcement state created
2. TODO items added with dependencies
3. Gate G0 checked and passed
4. File write attempted in forbidden scope → BLOCKED
5. Delegation to authorized agent → ALLOWED
6. Delegation to unauthorized agent → BLOCKED
7. Handoff created with gate snapshot
8. SOT artifact registered from handoff

**Step 2: Run, fix, iterate until pass**

---

### Task 8: Wire Agent Profiles + Create State Directories

**Files:**
- Modify: `.opencode/agents/hiveminder.md` (add hiveops tools to allowed_tools)
- Modify: `.opencode/agents/hivemaker.md` (add hiveops tools)
- Modify: `.opencode/agents/hivefiver.md` (add hiveops tools)
- Create: `.hivemind/state/todo.json` (initial empty state)
- Create: `.hivemind/state/gates.json` (initial empty state)
- Create: `.hivemind/state/sot-index.json` (initial empty state)
- Create: `.hivemind/state/enforcement.json` (initial empty state)
- Create: `.hivemind/handoffs/.gitkeep`
- Create: `.hivemind/checkpoints/.gitkeep`

**Step 1: Add hiveops tools to agent allowed_tools**

Every orchestrator agent (hiveminder, hivemaker, hivefiver, hiveq, hiveplanner) gets:
```yaml
  hiveops_todo: true
  hiveops_gate: true
  hiveops_sot: true
  hiveops_export: true
```

**Step 2: Create initial state files**

```json
{ "items": [], "version": 0, "lastSync": 0, "activeItem": null }
```

**Step 3: Verify no regressions**

Run: `npm test`
Expected: All existing tests still pass (we didn't touch src/)

**Step 4: Commit**

```bash
git add .opencode/agents/ .hivemind/state/ .hivemind/handoffs/ .hivemind/checkpoints/
git commit -m "feat(hiveops): wire tools to agents, create state directories"
```

---

### Task 9: Master Plan Document

**Files:**
- Create: `docs/plans/2026-03-02-hiveops-framework-refactor-plan.md`

Write the consolidated R1-R8 artifact map showing what was built, what it does, and how the team uses it.

---
