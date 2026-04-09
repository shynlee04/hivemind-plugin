# GSD Execution Patterns

## What LLMs Don't Know

LLMs are trained on prompts and templates. GSD is a **real execution engine** with bash scripts, state management, checkpoint protocols, and atomic commits. This document captures the ACTUAL patterns, not descriptions of what they might be.

---

## 1. The Core Execution Loop

### gsd-executor.md Pattern

```bash
# STEP 1: Initialize via gsd-tools CLI
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init execute-phase "${PHASE}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi

# STEP 2: Parse JSON output
# Extracts: executor_model, commit_docs, sub_repos, phase_dir, plans, incomplete_plans

# STEP 3: Load state
cat .planning/STATE.md 2>/dev/null

# STEP 4: Detect auto-mode
AUTO_CHAIN=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow._auto_chain_active 2>/dev/null || echo "false")
AUTO_CFG=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.auto_advance 2>/dev/null || echo "false")
```

### Task Execution Flow

| Task Type | Behavior |
|-----------|----------|
| `type="auto"` | Execute → apply deviation rules → handle auth gates → verify → commit |
| `type="checkpoint:*"` | STOP immediately → return structured checkpoint message |
| `type="tdd"` | RED (failing test) → GREEN (implementation) → REFACTOR |

### Checkpoint Detection

```bash
grep -n "type=\"checkpoint" [plan-path]
```

Three patterns:
- **Pattern A** (no checkpoints): Execute all, create SUMMARY, commit
- **Pattern B** (has checkpoints): Execute until checkpoint, STOP, return structured message
- **Pattern C** (continuation): Verify commits exist, resume from specified task

---

## 2. Atomic Per-Task Commits

```bash
# 1. Check modified files
git status --short

# 2. Stage task-related files individually (NEVER git add .)
git add src/api/auth.ts
git add src/types/user.ts

# 3. Commit with type prefix
git commit -m "{type}({phase}-{plan}): {concise task description}
- {key change 1}
- {key change 2}
"

# 4. Record hash for SUMMARY
TASK_COMMIT=$(git rev-parse --short HEAD)
```

**Why this matters:** Each task is independently verifiable. If a task fails, you can revert just that commit without affecting others.

---

## 3. State Management (gsd-tools.cjs)

Every agent uses `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs"` for:

| Command | Purpose |
|---------|---------|
| `init execute-phase` | Load phase context |
| `init phase-op` | Load phase operation context |
| `state advance-plan` | Increment plan counter |
| `state update-progress` | Recalculate progress |
| `state record-metric` | Record execution metrics |
| `state load` | Load current state |
| `state begin-phase` | Start new phase |
| `roadmap get-phase` | Get phase data from ROADMAP.md |
| `roadmap update-plan-progress` | Update roadmap |
| `roadmap analyze` | Analyze full roadmap |
| `requirements mark-complete` | Mark requirements done |
| `verify artifacts` | Check artifact existence and quality |
| `verify key-links` | Check wiring between artifacts |
| `verify plan-structure` | Validate task structure |
| `summary-extract` | Extract summary data |
| `commit-to-subrepo` | Commit to sub-repository |
| `commit` | Standard commit with metadata |
| `phase complete` | Mark phase complete |
| `phase-plan-index` | Get plan index for phase |

---

## 4. Deviation Handling

| Rule | Action | When |
|------|--------|------|
| 1 | Auto-fix bugs | Broken behavior, errors, null pointers |
| 2 | Auto-add missing functionality | Error handling, auth, validation |
| 3 | Auto-fix blocking issues | Missing deps, broken imports |
| 4 | Stop and ask | Architectural changes (new DB tables, major schema) |

**Fix attempt limit:** 3 per task → STOP, document in SUMMARY.md, continue with next task.

---

## 5. Verification (gsd-verifier.md)

### Goal-Backward Verification Process

```bash
# Step 0: Check for previous verification (re-verification mode)
cat "$PHASE_DIR"/*-VERIFICATION.md 2>/dev/null

# Step 2a: Load ROADMAP success criteria
PHASE_DATA=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap get-phase "$PHASE_NUM" --raw)

# Step 2b: Load PLAN frontmatter must-haves
grep -l "must_haves:" "$PHASE_DIR"/*-PLAN.md 2>/dev/null

# Step 4: Artifact verification (3 levels)
ARTIFACT_RESULT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" verify artifacts "$PLAN_PATH")
```

### Anti-Pattern Scanning

```bash
# Stub detection
grep -n -E "TODO|FIXME|XXX|HACK|PLACEHOLDER" "$file"
grep -n -E "placeholder|coming soon|will be here|not yet implemented" "$file" -i
grep -n -E "return null|return \{\}|return \[\]|=> \{\}" "$file"
grep -n -E "=\s*\[\]|=\s*\{\}|=\s*null|=\s*undefined" "$file"
```

### Behavioral Spot-Checks

```bash
# API endpoint returns non-empty data
curl -s http://localhost:$PORT/api/$ENDPOINT 2>/dev/null | node -e "..."

# CLI command produces expected output
node $CLI_PATH --help 2>&1 | grep -q "$EXPECTED_SUBCOMMAND"

# Build produces output files
ls $BUILD_OUTPUT_DIR/*.{js,css} 2>/dev/null | wc -l
```

---

## 6. Plan Checking (gsd-plan-checker.md)

### 11 Verification Dimensions

| # | Dimension | What It Checks |
|---|-----------|---------------|
| 1 | Requirement Coverage | Every phase requirement has task(s) addressing it |
| 2 | Task Completeness | Every task has Files + Action + Verify + Done |
| 3 | Dependency Correctness | No cycles, valid references, wave numbers consistent |
| 4 | Key Links Planned | Artifacts wired together, not just created |
| 5 | Scope Sanity | 2-3 tasks/plan, 5-8 files, <50% context |
| 6 | Verification Derivation | must_haves trace back to phase goal |
| 7 | Context Compliance | Plans honor locked decisions, exclude deferred ideas |
| 7b | Scope Reduction Detection | Plans don't silently simplify user decisions |
| 8 | Nyquist Compliance | VALIDATION.md exists, automated commands present |
| 9 | Cross-Plan Data Contracts | Shared data pipelines have compatible transforms |
| 10 | CLAUDE.md Compliance | Plans respect project conventions |
| 11 | Research Resolution | All open questions resolved before planning |

### Scope Thresholds

| Metric | Target | Warning | Blocker |
|--------|--------|---------|---------|
| Tasks/plan | 2-3 | 4 | 5+ |
| Files/plan | 5-8 | 10 | 15+ |
| Total context | ~50% | ~70% | 80%+ |

### Dependency Rules

```
depends_on: [] = Wave 1 (can run parallel)
depends_on: ["01"] = Wave 2 minimum (must wait for 01)
Wave number = max(deps) + 1
```

---

## 7. SDK Architecture

### GSD Class (src/index.ts)

Public API:
- `executePlan()` — execute a single plan
- `runPhase()` — run a full phase (discuss→research→plan→execute→verify→advance)
- `run()` — run the full pipeline

### SessionRunner (src/session-runner.ts)

Wraps `query()` from `@anthropic-ai/claude-agent-sdk`:

```typescript
const queryStream = query({
  prompt: `Execute this plan:\n\n${plan.objective}`,
  options: {
    systemPrompt: { type: 'preset', preset: 'claude_code', append: executorPrompt },
    settingSources: ['project'],
    allowedTools,
    permissionMode: 'bypassPermissions',
    maxTurns,
    maxBudgetUsd,
    cwd,
  },
});
```

### PhaseRunner (src/phase-runner.ts)

State machine:
```
discuss → research → [research_gate] → plan → [plan_check] → execute (waves) → verify (gap_closure) → advance
```

Key features:
- Config-driven step skipping (`skip_discuss`, `research: false`)
- Auto mode (`auto_advance: true`) enables AI self-discuss
- Human gate callbacks (`onDiscussApproval`, `onVerificationReview`)
- Wave-based parallel execution via `Promise.allSettled()`
- Gap closure cycle: verify → plan gaps → execute → re-verify (max 1 retry)

### EventStream (src/event-stream.ts)

Emits typed events:
- `SessionInit`, `SessionComplete`, `SessionError`
- `PhaseStart`, `PhaseStepStart`, `PhaseStepComplete`, `PhaseComplete`
- `WaveStart`, `WaveComplete`
- `ToolCall`, `ToolProgress`, `ToolUseSummary`
- `TaskStarted`, `TaskProgress`, `TaskNotification`
- `CostUpdate`, `APIRetry`, `RateLimit`, `CompactBoundary`

### Checkpoint/Resume

**NOT in the SDK** — delegated to `gsd-tools.cjs`:

```typescript
async stateLoad(): Promise<string> {
  return this.execRaw('state', ['load']);
}
```

Resume logic:
1. Re-query `phasePlanIndex(phaseNumber)` → returns `PhasePlanIndex`
2. Filter by `has_summary` — plans without summaries are incomplete
3. Re-execute only incomplete plans

---

## 8. Multi-Runtime Support (install.js)

### Runtime Selection

```javascript
const CODEX_AGENT_SANDBOX = {
  'gsd-executor': 'workspace-write',
  'gsd-planner': 'workspace-write',
  'gsd-verifier': 'workspace-write',
  'gsd-plan-checker': 'read-only',
  'gsd-integration-checker': 'read-only',
};
```

### Tool Name Mapping (Claude → Copilot)

```javascript
const claudeToCopilotTools = {
  Read: 'read', Write: 'edit', Edit: 'edit', Bash: 'execute',
  Grep: 'search', Glob: 'search', Task: 'agent', WebSearch: 'web',
  WebFetch: 'web', TodoWrite: 'todo', AskUserQuestion: 'ask_user',
};
```

### Path Conversion

```javascript
// ~/.claude/ → ~/.copilot/
// ./.claude/ → ./.github/
c = c.replace(/\$HOME\/\.claude\//g, '$HOME/.copilot/');
```

---

## 9. What This Means for Delegation

When delegating to subagents:

1. **Use session IDs** — every `task` call returns a `task_id`. Store it. Resume with it.
2. **Track commits** — each task should commit atomically with a hash.
3. **Use checkpoints** — mark where human verification is needed.
4. **Support resume** — if disconnected, resume by session ID, don't recreate.
5. **Wave execution** — group independent tasks into waves for parallel execution.
6. **Gap closure** — after verification, plan and execute gap fixes, then re-verify.
