# Command & Workflow Audit

**Date:** 2026-04-07  
**Auditor:** prompt-enhance orchestrator  
**Scope:** 11 commands, 4 workflows in `.hivefiver-meta-builder/*-lab/active/refactoring/`

---

## Command Audit (11 Commands)

### 1. `deep-init.md`
- **Agent:** `hivefiver-orchestrator`
- **Subtask:** `true`
- **Triggers:** `/init-deep`, `/init-deep --create-new`, `/init-deep --max-depth=N`
- **Skills Required:** None explicitly loaded; references explore agents, LSP
- **Workflow:** None bound
- **Issues:** Self-contained command with full execution protocol inline. No external workflow reference. Large inline content (~300+ lines) — should reference a workflow file instead.
- **Cross-refs:** References `explore` subagent (exists), LSP tool (exists), `task()` calls (exists)

### 2. `deep-research-synthesis-repomix.md`
- **Agent:** none specified
- **Subtask:** none
- **Content:** Reference document (cheat sheet), not an executable command
- **Issues:** Missing frontmatter entirely. No `description`, `agent`, or `subtask` fields. This is a reference document mislabeled as a command. Should be in `references-lab/`.
- **Cross-refs:** References repomix MCP, context7, LSP, Task tool — all valid

### 3. `harness-audit.md`
- **Agent:** `hivefiver-orchestrator`
- **Subtask:** `true`
- **Triggers:** "audit harness", "check boundaries", "verify architecture"
- **Skills Required:** `harness-audit` (loaded via instruction)
- **Workflow:** None bound
- **Issues:** References injected state via `!bash` — good pattern. References `harness-audit` skill which exists at `.qwen/skills/harness-audit/`
- **Cross-refs:** `harness-audit` skill exists

### 4. `harness-doctor.md`
- **Agent:** `conductor`
- **Subtask:** `false`
- **Triggers:** `/harness-doctor`
- **Skills Required:** None explicitly
- **Workflow:** None bound
- **Issues:** References `.opencode/rules/harness-rules.md` which may not exist. References `delegate-task` tool (harness plugin tool).
- **Cross-refs:** `conductor` agent exists

### 5. `hf-audit.md`
- **Agent:** `hivefiver-orchestrator`
- **Subtask:** `true`
- **Triggers:** "audit skills", "check agents", "doctor commands"
- **Workflow Reference:** `@/Users/apple/hivemind-plugin/.worktrees/hivefiver-v2/.opencode/hivefiver/workflows/audit.md`
- **CRITICAL ISSUE:** Dead external reference — path points to `hivefiver-v2` worktree, NOT the local `workflows-lab/active/refactoring/audit.md`. This command will fail in this worktree.
- **Cross-refs:** `hivefiver-orchestrator` agent exists, but workflow path is WRONG

### 6. `hf-create.md`
- **Agent:** `hivefiver-orchestrator`
- **Subtask:** `true`
- **Triggers:** "create a skill", "add an agent", "build a command", "make a tool"
- **Workflow Reference:** `@/Users/apple/hivemind-plugin/.worktrees/hivefiver-v2/.opencode/hivefiver/workflows/create.md`
- **CRITICAL ISSUE:** Same dead external reference — points to `hivefiver-v2` worktree. Should reference local `workflows-lab/active/refactoring/create.md`.
- **Cross-refs:** `hivefiver-orchestrator` agent exists, but workflow path is WRONG

### 7. `hf-prompt-enhance.md`
- **Agent:** `hivefiver-orchestrator`
- **Subtask:** `false`
- **Triggers:** "enhance this prompt", "audit this prompt", "repack this prompt"
- **Workflow:** None externally referenced — execution protocol is inline
- **Issues:** Self-contained with full protocol. No dead refs. Well-structured.
- **Cross-refs:** `.hivemind/state/session-context-prompt.md` path is correct

### 8. `hf-stack.md`
- **Agent:** `hivefiver-orchestrator`
- **Subtask:** `true`
- **Triggers:** "stack skills", "combine skills", "chain skill for..."
- **Workflow Reference:** `@/Users/apple/hivemind-plugin/.worktrees/hivefiver-v2/.opencode/hivefiver/workflows/stack.md`
- **CRITICAL ISSUE:** Same dead external reference — points to `hivefiver-v2` worktree. Should reference local `workflows-lab/active/refactoring/stack.md`.
- **Cross-refs:** `hivefiver-orchestrator` agent exists, but workflow path is WRONG

### 9. `plan.md`
- **Agent:** `conductor`
- **Subtask:** `false`
- **Triggers:** `/plan`
- **Skills Required:** None explicitly
- **Workflow:** None bound
- **Issues:** Clean. References `task_plan.md` and `delegate-task`. References `conductor` agent (exists).
- **Cross-refs:** All valid

### 10. `start-work.md`
- **Agent:** `conductor`
- **Subtask:** `false`
- **Triggers:** `/start-work`
- **Skills Required:** None explicitly
- **Workflow:** None bound
- **Issues:** References `delegate-task` tool and `progress.md` for resumption. Clean.
- **Cross-refs:** `conductor` agent exists, `progress.md` exists

### 11. `ultrawork.md`
- **Agent:** `conductor`
- **Subtask:** `false`
- **Triggers:** `/ultrawork`
- **Skills Required:** None explicitly
- **Workflow:** None bound
- **Issues:** Self-contained execution protocol. References `delegate-task`. Clean.
- **Cross-refs:** `conductor` agent exists

### Command Summary

| Metric | Count |
|--------|-------|
| Total commands | 11 |
| With valid agent refs | 11/11 |
| With dead workflow refs | 3 (hf-audit, hf-create, hf-stack) |
| Missing frontmatter | 1 (deep-research-synthesis-repomix) |
| Self-contained (no external workflow) | 6 |
| External workflow refs | 4 (3 dead + 0 local) |

---

## Workflow Audit (4 Workflows)

### 1. `audit.md`
- **Objective:** Scan meta-concepts for quality issues
- **Steps:** Load state → Determine scope → Run validators → Detect overlaps → Generate report
- **Skills Referenced:** None explicitly loaded
- **Agents Referenced:** None dispatched (this is a shell-script-heavy workflow)
- **Commands Referenced:** bash-only validation scripts
- **Issues:** All validation is bash-script based. No subagent dispatch via Task tool. Missing integration with Hivefiver specialist agents.
- **Cross-refs:** References `.opencode/skills/`, `.opencode/agents/`, `.opencode/commands/` — all valid paths

### 2. `create.md`
- **Objective:** Route creation requests to specialist agents
- **Steps:** Load state → Classify intent → Load skills → Dispatch specialist → Collect/verify → Report
- **Skills Referenced:** `use-authoring-skills`, `agents-and-subagents-dev`, `command-dev`, `custom-tools-dev`
- **Agents Referenced:** `hivefiver-skill-author`, `hivefiver-agent-builder`, `hivefiver-command-builder`, `hivefiver-tool-builder`
- **Issues:** Clean routing table. All referenced skills exist in `.qwen/skills/`. All referenced agents exist in `.opencode/agents/`.
- **Cross-refs:** All valid

### 3. `prompt-enhance.md`
- **Objective:** Enhance prompts through layered pipeline
- **Steps:** Session state → Phase 0 skim → Bridge → Investigation lanes → Clarification gate → Final assembly
- **Skills Referenced:** `planning-with-files` (implicit via session state)
- **Agents Referenced:** `prompt-analyzer`, `context-mapper`, `risk-assessor`, `context-purifier`, `prompt-repackager`
- **Issues:** References `session-patch` tool (harness plugin tool). References `.hivemind/state/session-context-prompt.md` — valid path. Complex but well-structured.
- **Cross-refs:** All agents referenced exist in `.opencode/agents/`

### 4. `stack.md`
- **Objective:** Stack 2-3 skills for a workflow
- **Steps:** Load state → Parse request → Validate compatibility → Determine loading order → Produce stack config
- **Skills Referenced:** All 20 skills (in loading order section)
- **Agents Referenced:** None dispatched
- **Issues:** Comprehensive loading order defined. Clean.
- **Cross-refs:** All valid

### Workflow Summary

| Metric | Count |
|--------|-------|
| Total workflows | 4 |
| With valid skill refs | 4/4 |
| With valid agent refs | 3/4 (audit.md has none) |
| With dead external refs | 0 |
| Self-contained | 4/4 |

---

## Findings

### Critical (must fix)
1. **hf-audit.md**: Dead workflow ref to `hivefiver-v2` worktree
2. **hf-create.md**: Dead workflow ref to `hivefiver-v2` worktree
3. **hf-stack.md**: Dead workflow ref to `hivefiver-v2` worktree
4. **deep-research-synthesis-repomix.md**: Missing command frontmatter (not a valid command)

### Medium (should fix)
5. **deep-init.md**: Inline content too large — should extract to workflow
6. **audit.md**: No subagent dispatch — should integrate with Hivefiver specialists

### Low (informational)
7. 6 of 11 commands are self-contained with no workflow binding
8. No commands reference the `phase-loop` workflow
9. No commands reference the `intent-loop` agent
