---
name: harness-delegation-inspection
description: Use when delegating tasks to subagents, inspecting OpenCode project state, or understanding how GSD execution patterns work. Triggers on "how to delegate", "subagent patterns", "GSD execution model", "context continuity", "MCP server usage", "inspect opencode project", "how does gsd work", "fail resume with ID", "session continuity", "ecosystem structure".
metadata:
  layer: "1"
  role: "domain-execution"
  pattern: P3
  version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
---

# harness-delegation-inspection

This skill documents what LLMs **do not know by default**: GSD execution patterns, MCP server realities, ecosystem structure, context continuity mechanisms, and OpenCode platform internals. It is NOT a template — it is a reference for real delegation and inspection.

## The Iron Law

```
LLMs DO NOT KNOW THESE PATTERNS. ALWAYS LOAD THIS SKILL BEFORE DELEGATING OR INSPECTING.
```

## On Load

1. Read `references/gsd-execution-patterns.md` — how GSD actually executes (bash→parse→connect→launch→fail-resume)
2. Read `references/mcp-server-reality.md` — what MCP servers are available and how to use them
3. Read `references/ecosystem-structure.md` — labs→symlinks→.opencode pipeline
4. Read `references/context-continuity.md` — how to maintain state across sessions
5. Read `references/opencode-platform-reality.md` — permissions, compaction, plugin system

## Delegation Protocol (from GSD)

### The Real Execution Model

GSD does NOT use "fire and forget" subagents. It uses:

```bash
# 1. INIT — load context via CLI tool
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init execute-phase "${PHASE}")

# 2. PARSE — extract JSON fields from init output
# Fields: executor_model, commit_docs, sub_repos, phase_dir, plans, incomplete_plans

# 3. CONNECT — load state for position tracking
cat .planning/STATE.md 2>/dev/null

# 4. LAUNCH — execute with explicit session tracking
# Each task gets atomic commit with hash tracking
git add <specific-files>  # NEVER git add .
git commit -m "{type}({phase}-{plan}): {description}"
TASK_COMMIT=$(git rev-parse --short HEAD)

# 5. FAIL/RESUME — checkpoint detection
grep -n "type=\"checkpoint" [plan-path]
# Pattern A: No checkpoints → execute all
# Pattern B: Has checkpoints → execute until checkpoint, STOP, return structured message
# Pattern C: Continuation → verify commits exist, resume from specified task
```

### Resume by Session ID (NOT by recreating tasks)

When a session disconnects:
1. **DO NOT create new tasks** — resume the existing delegated task
2. Use the session ID from the previous `task` call
3. The task tool supports `task_id` parameter for resuming
4. Check `.planning/phases/NN-name/SUMMARY.md` for completion status
5. Re-query `phasePlanIndex` to get incomplete plans
6. Re-execute only incomplete plans

### Checkpoint Return Format

When a checkpoint is reached, the subagent returns:

```markdown
## CHECKPOINT REACHED
**Type:** [human-verify | decision | human-action]
**Plan:** {phase}-{plan}
**Progress:** {completed}/{total} tasks

### Completed Tasks
| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1    | [name] | [hash] | [key files] |

### Current Task
**Task {N}:** [name]
**Status:** [blocked | awaiting verification | awaiting decision]
**Blocked by:** [specific blocker]
```

### Deviation Rules (Auto-Fix Protocol)

| Rule | Action | When |
|------|--------|------|
| 1 | Auto-fix bugs | Broken behavior, errors, null pointers |
| 2 | Auto-add missing functionality | Error handling, auth, validation |
| 3 | Auto-fix blocking issues | Missing deps, broken imports |
| 4 | Stop and ask | Architectural changes (new DB tables, major schema) |

**Fix attempt limit:** 3 per task → STOP, document in SUMMARY.md

### Wave-Based Parallel Execution

```
Phase → Plans grouped by wave number
Wave 1: Plans with depends_on: [] (run parallel via Promise.allSettled)
Wave 2: Plans with depends_on: ["01"] (run after Wave 1 completes)
Wave N: Plans with depends_on: [previous waves]
```

## Inspection Protocol

### Stack Discovery (Phase 0 — ALWAYS FIRST)

Before any audit or inspection:

```bash
# Discover tech stack
node --version
npm ls --depth=0
cat package.json | jq '.dependencies, .peerDependencies, .devDependencies'

# Read architecture docs
cat AGENTS.md
cat docs/draft/architecture-proposal-hivemind-v3.md 2>/dev/null

# Map project structure
find .opencode/ -type f -name "*.md" | head -50
find .hivefiver-meta-builder/ -type f -name "*.md" | head -50
```

### Domain-Specific Slices

When scanning N slices:
1. **Output N structured JSON artifacts** — not markdown prose
2. Each slice writes to `.temp/audit/<audit-id>/findings/slice-N.json`
3. After all slices complete, synthesize from JSON → correlated report

### Context7 MCP Usage

For EVERY tool/library lookup:
1. Call `context7_resolve-library-id` with query + library name
2. Call `context7_query-docs` with library ID + specific question
3. **Never assume** API signatures from training knowledge
4. Verify the tool's calling convention matches what's in the codebase

### Repomix MCP Usage

For codebase inspection:
1. Use `repomix_pack_codebase` with `compress: true` for essential structure
2. Use `repomix_grep_repomix_output` for pattern searches
3. Use `repomix_read_repomix_output` with offset/limit for targeted reads

### GitHub MCP Usage

For repo access:
1. Use `github_get_file_contents` for specific files
2. Use `github_search_code` for pattern searches across repos
3. Use `github_list_commits` for history inspection

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Template Stuffer** | Creates markdown templates instead of executable scripts | Use bash scripts with real commands |
| **The Fire-and-Forget** | Dispatches subagents without session tracking | Track session IDs, support resume |
| **The Assumer** | Assumes tech stack, API signatures, file locations | Discover first, verify always |
| **The Context Polluter** | Passes session history to subagents | Construct fresh context: task text + scene-setting + scope |
| **The Markdown Proser** | Outputs narrative reports instead of structured JSON | Each phase outputs JSON artifacts |
| **The Re-Creator** | Creates new tasks instead of resuming existing ones | Use session ID to resume delegated tasks |

## Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| CRITICAL | Broken functionality, data loss risk | Must fix before proceeding |
| WARNING | May cause failures under edge cases | Should fix |
| INFO | Improvement opportunity | Fix when convenient |

## Reference Map

| File | When to Read |
|------|-------------|
| `references/gsd-execution-patterns.md` | Always — core execution model |
| `references/mcp-server-reality.md` | When using MCP servers for inspection |
| `references/ecosystem-structure.md` | When navigating the Hivefiver ecosystem |
| `references/context-continuity.md` | When maintaining state across sessions |
| `references/opencode-platform-reality.md` | When inspecting OpenCode project state |
