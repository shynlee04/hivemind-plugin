# Audit Report: `planning-with-files` Skill

**Date**: 2026-04-04
**Method**: 4 parallel subagents (Code Flow, Trigger/Invocation, Asset Utilization, Failure Mode)
**Target**: `.skills-lab/refactoring-skills/planning-with-files/` (18 files, 66,337 bytes)

---

## 1. Executive Summary

**Effectiveness Rating: 2/10 — Structurally Loadable, Functionally Inert**

The `planning-with-files` skill is a **state machine implemented as prose**. It declares 10+ enforcement mechanisms (scripts, checklists, algorithms, protocols, hooks) but **zero** were actually executed in any observed session. The skill IS loadable via the `skill()` tool (confirmed in session transcripts), but agents that load it bypass every operational mechanism and fall back to manual file creation and `todowrite`-based tracking — the exact anti-pattern the skill warns against.

**Root Cause**: Every enforcement mechanism exists only as prose instructions. There is no platform-level hook, no mandatory pre-action gate, no automated trigger that forces compliance. The skill is a documentation package pretending to be an operational system.

**Secondary Cause**: The scripts were designed for a skill-pack-only world with bash governance. The harness is now a full platform with CLI substrate, runtime build-on-demand, plugin hooks (TypeScript), and SDK-driven state management. The scripts are architecturally obsolete.

---

## 2. Asset Usage Matrix

| File | Size | External Refs | Runtime Invocations | Classification |
|---|---|---|---|---|
| **SKILL.md** | 16,311 B | 31 files | `skill()` tool (2 sessions) | **ESSENTIAL** |
| **scripts/check-complete.sh** | 4,289 B | 19 files | **0** in code | **PARTIALLY USED** |
| **scripts/init-session.sh** | 4,060 B | 17 files | **0** in code | **ESSENTIAL** |
| **scripts/session-catchup.py** | 10,165 B | 10 files | **0** in code | **PARTIALLY USED** |
| **scripts/verify-hierarchy.sh** | 7,253 B | 10 files | **0** in code | **WASTED CONTEXT** |
| **scripts/register-skill.sh** | 3,478 B | 11 files | **0** in code | **WASTED CONTEXT** |
| **references/01-file-structure.md** | 5,135 B | 7 files | **0** | **PARTIALLY USED** |
| **references/02-session-lifecycle.md** | 5,518 B | 15 files | **0** | **PARTIALLY USED** |
| **references/03-goal-refresh.md** | 3,849 B | 12 files | **0** | **PARTIALLY USED** |
| **references/04-cross-platform-hooks.md** | 4,578 B | 6 files | **0** | **WASTED CONTEXT** |
| **hooks/pre-tool-use.json** | 520 B | 0 files | Not registered | **WASTED CONTEXT** |
| **hooks/post-tool-use.json** | 441 B | 0 files | Not registered | **WASTED CONTEXT** |
| **hooks/stop.json** | 429 B | 0 files | Not registered | **WASTED CONTEXT** |
| **evals/evals.json** | 5,363 B | 0 files | All assertions `passed: false` | **WASTED CONTEXT** |
| **evals/trigger-queries.json** | 1,402 B | 0 files | Never loaded | **WASTED CONTEXT** |
| **templates/task_plan.md** | 441 B | 0 files | Bypassed by init-session.sh heredocs | **WASTED CONTEXT** |
| **templates/findings.md** | 319 B | 0 files | Bypassed by init-session.sh heredocs | **WASTED CONTEXT** |
| **templates/progress.md** | 364 B | 0 files | Bypassed by init-session.sh heredocs | **WASTED CONTEXT** |

### Summary

| Classification | Count | Bytes | % |
|---|---|---|---|
| **ESSENTIAL** | 2 | 20,371 | 30.7% |
| **PARTIALLY USED** | 5 | 28,829 | 43.5% |
| **WASTED CONTEXT** | 11 | 17,137 | 25.8% |

### Duplicate Tax

The skill exists in **4 active locations** (`.skills-lab/`, `.opencode/skills/`, `.kilo/skills/`, `.archive/`). Wasted context multiplied: **17,137 × 3 extra copies = 51,411 bytes (50.2 KB)** of duplicated dead weight.

---

## 3. Trigger Analysis vs Actual Behavior

### Declared Triggers (from SKILL.md frontmatter + body)

| Trigger | Declared In | Actually Fires? |
|---------|------------|-----------------|
| Task requires >5 tool calls | Frontmatter (`min-tool-calls: 5`) | ❌ Agents don't count tool calls |
| User says "plan this", "break down" | Body line 50 | ❌ No NLP trigger detection |
| Session recovery after `/clear` | Body line 51 | ❌ No `/clear` detection |
| Research tasks with multiple sources | Body line 52 | ❌ No auto-detection |
| Feature development spanning files | Body line 53 | ❌ No auto-detection |
| Complex bug debugging | Body line 54 | ❌ No auto-detection |
| Hierarchy gate (verify-hierarchy.sh) | Body line 17 | ❌ Never invoked |
| Skill registration (register-skill.sh) | Body line 23 | ❌ Never invoked |
| `init-session.sh` if files missing | Body line 43 | ❌ Agent creates files manually |
| `check-complete.sh` if files exist | Body line 42 | ❌ Never invoked |
| `session-catchup.py` for recovery | Body line 181 | ❌ Never invoked |
| Pre-Tool-Use Checklist | Body line 140 | ❌ No evidence of execution |
| Goal-refresh algorithm (5-call counter) | Body lines 124-136 | ❌ LLMs can't maintain counters |
| 3-Strike Protocol | Body lines 200-230 | ❌ No error logging observed |

### What Actually Works

| Mechanism | Status | Evidence |
|-----------|--------|----------|
| `skill()` tool invocation by name | ✅ Works | `ses_2b05.md:3160`, `planning-with-files-skill.md:3467` |
| File schema (3-file pattern) | ⚠️ Partial | Agent creates files manually, not via scripts |
| Phase-based planning concept | ⚠️ Partial | Agent uses phases but not declared schema |

### Phantom Triggers: 14 declared, 0 functional

Every enforcement mechanism (scripts, checklists, algorithms, protocols) is a **phantom trigger** — declared in the skill but never fires in practice.

---

## 4. Specific Failures with Code Evidence

### 4.1 The Hierarchy Gate Depends on a File That Doesn't Exist

**SKILL.md lines 27-28**:
```
- `.opencode/state/intent.json` must exist with `user_confirmed: true`
```

This file is never created by any skill. The `user-intent-interactive-loop` skill's `intent-verify.sh` was archived. The prerequisite chain is broken at the source.

### 4.2 The Tool-Call Counter Is Impossible for LLMs

**SKILL.md lines 124-136**: "Track: `tool_calls_since_plan_read` counter (starts at 0). Increment counter before each tool call. Reset counter after every Read of task_plan.md."

LLMs have no persistent memory between tool calls. This counter drifts within 2-3 tool calls. It's asking the LLM to perform stateful arithmetic across its own invocations.

### 4.3 Four Different Thresholds for the Same Concept

| Source | Threshold |
|--------|-----------|
| SKILL.md line 49 | >5 tool calls |
| SKILL.md line 114 | >10 tool calls |
| references/03-goal-refresh.md line 5 | ~50 tool calls |
| references/03-goal-refresh.md line 46 | >=5 tool calls |

### 4.4 `check-complete.sh` — Regex Fragility

**Line 36**: `awk "/^### Phase/,/^### |^## /"` — matches ANY line starting with `### ` or `## `, including content lines like `- [ ] Fix the ### broken header`. Phase blocks truncate early, missing status lines.

**Line 45**: `grep -c "^\- \[x\]"` — only matches `- [x]` at line start. Indented checkboxes (`  - [x]`) are not counted, causing false "incomplete" flags.

### 4.5 `register-skill.sh` — JSON Corruption Risk

**Line 85**: `sed -i '' "s/\"$SKILL_NAME\"[^}]*/\"$SKILL_NAME\": { ... }/"` — greedy regex `[^}]*` matches across JSON object boundaries. If skill name appears in another entry, JSON is corrupted.

**Line 95-97**: macOS sed `i\` with multi-line insert produces malformed JSON.

### 4.6 `session-catchup.py` — The Git Timestamp Bug

**Line 55**: `git log -1 --format=%ci -- task_plan.md` returns **commit date**, not file mtime. Drift detection compares two different clocks.

**Line 158-161**: Check 5 fires on ANY uncommitted changes — false positive for unrelated work.

### 4.7 `verify-hierarchy.sh` — Whitelist Blocks Custom Skills

**Lines 199-208**: `is_known_skill()` only recognizes 5 hardcoded names. Any custom skill (e.g., `deep-research`, `tdd-workflow`) fails with:
```
[hierarchy] FAIL: unknown skill 'deep-research'
Known skills: meta-builder, user-intent-interactive-loop, planning-with-files, coordinating-loop, use-authoring-skills
```

### 4.8 Eval Fixtures Don't Exist

`evals/evals.json` references 4 fixture directories (`base-state`, `planning-active`, `session-recovery`, `strike-tracking`). The `evals/fixtures/` directory is empty. All 8 test cases have `"passed": false` and empty `"evidence"`.

### 4.9 Templates Are Bypassed

`init-session.sh` creates planning files from inline heredocs, NOT from the `templates/` directory. The 3 template files (441 + 319 + 364 = 1,124 bytes) are never loaded.

### 4.10 Hooks Are Not Registered

All 3 hook JSON files define triggers (`tool.execute.before`, `tool.execute.after`, `session.idle`) that are **nowhere registered** in `opencode.json` or any plugin config. The hooks directory exists but is dead weight.

---

## 5. Recommendations

### 5.1 Immediate: Archive Wasted Context (11 files, 17.1 KB)

| Action | Files | Rationale |
|--------|-------|-----------|
| **DELETE** hooks/ (3 files) | `pre-tool-use.json`, `post-tool-use.json`, `stop.json` | Not registered anywhere, zero external refs |
| **DELETE** evals/ (2 files) | `evals.json`, `trigger-queries.json` | No fixtures, all assertions false, wrong test type |
| **DELETE** templates/ (3 files) | `task_plan.md`, `findings.md`, `progress.md` | Bypassed by init-session.sh heredocs |
| **DELETE** references/04-cross-platform-hooks.md | 1 file | Documentation only, ships zero actual hooks |
| **ARCHIVE** scripts/verify-hierarchy.sh | 1 file | 6 identical copies, hardcoded paths, whitelist blocks custom skills |
| **ARCHIVE** scripts/register-skill.sh | 1 file | State mutation (violates CQRS), orchestrator concern, audit says REMOVE |

**Savings**: 17,137 bytes per copy × 3 extra copies = **51.4 KB eliminated**

### 5.2 Short-Term: Fix Essential Scripts

| Script | Fix | Priority |
|--------|-----|----------|
| `check-complete.sh` | Fix awk regex, handle indented checkboxes, exit 0 for "in progress" (report-only) | High |
| `init-session.sh` | Add error messages, consistent heredoc quoting, check write permissions | High |
| `session-catchup.py` | Use file mtime instead of git commit date, scope check 5 to planning files only, fix Windows path logic | Medium |

### 5.3 Medium-Term: Rewrite SKILL.md

The SKILL.md needs a fundamental rewrite:

1. **Remove the tool-call counter** — LLMs can't maintain stateful counters
2. **Remove hierarchy gate** — depends on files that don't exist
3. **Remove dual "first action" sections** — pick one, not two competing instructions
4. **Unify trigger thresholds** — pick ONE threshold, not four
5. **Convert from enforcement to guidance** — report facts, leave judgment to agent
6. **Reduce from 382 lines to <200** — progressive disclosure, depth in references
7. **Remove eval references** — evals test scripts, not agent behavior
8. **Remove hook references** — hooks aren't registered

### 5.4 Long-Term: Move Planning to CLI Substrate

The planning-with-files skill should be replaced by CLI commands:

| CLI Command | Replaces |
|-------------|----------|
| `hivemind-tools plan init` | `init-session.sh` |
| `hivemind-tools plan status` | `check-complete.sh` |
| `hivemind-tools plan catchup` | `session-catchup.py` |
| `hivemind-tools plan validate` | (new — content validation, not just file existence) |

This moves planning from "agent follows prose instructions" to "agent calls CLI command, gets structured JSON output."

### 5.5 The Fundamental Rewrite

The skill should be reimagined as:

```
SKILL.md (150 lines max):
- What this skill does (2 sentences)
- When to use it (3 bullet points)
- The 3-file pattern (task_plan.md, findings.md, progress.md)
- How to update each file (1 paragraph each)
- Session recovery protocol (3 steps)
- Anti-patterns to avoid (3 bullets)

scripts/ (2 files, report-only):
- check-complete.sh → exit 0, reports status
- init-session.sh → creates skeletons, reports success

No hooks. No evals. No templates. No hierarchy gates. No counters.
```

---

## 6. Evidence Trail

| Subagent | Key Finding | Evidence Location |
|----------|------------|-------------------|
| Subagent 1 (Code Flow) | Zero scripts invoked by CLI substrate | `bin/` contains no references to any planning-with-files script |
| Subagent 2 (Trigger/Invocation) | 14 phantom triggers, 0 functional | Session transcripts show agent bypassing every mechanism |
| Subagent 3 (Asset Utilization) | 11/18 files are wasted context (25.8%) | 50.2 KB duplicated dead weight across 4 locations |
| Subagent 4 (Failure Mode) | State machine implemented as prose | Every enforcement mechanism exists only as prose instructions |

---

**Status**: ✅ Audit Complete
**Verdict**: BLOCK — Multiple structural flaws prevent reliable use
**Next**: Archive wasted context, fix essential scripts, rewrite SKILL.md
