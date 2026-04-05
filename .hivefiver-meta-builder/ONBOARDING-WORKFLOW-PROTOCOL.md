# Onboarding Workflow Protocol — Hivefiver Meta-Builder

## Purpose

This document defines the onboarding protocol for any agent (human or AI) joining the Hivefiver meta-builder module. It ensures consistent context loading, skill activation, and workflow execution across all worktrees and sessions.

---

## Phase 0: Memory Load (First 30 Seconds)

**Before loading any context, check the memory layers:**

```bash
# L1: Git history — the primary memory system
git log --oneline -10  # recent narrative
git branch -a  # available work contexts
git log --grep="skill\|agent\|command" --oneline  # topic search

# L2: Lab files — session state
cat .hivefiver-meta-builder/skills-lab/progress.md 2>/dev/null | tail -30
cat .hivefiver-meta-builder/skills-lab/findings.md 2>/dev/null | tail -30

# L3: Episodic memory — conversation history (if needed)
# Dispatch search-conversations agent for historical context
```

**See:** `references-lab/active/refactoring/git-workflow/GIT-WORKFLOW-AND-MEMORY-PROTOCOL.md` for the complete three-layer memory model.

---

## Phase 1: Context Loading (Next 60 Seconds)

### Step 1: Read AGENTS.md
```
Read: .hivefiver-meta-builder/AGENTS.md
Purpose: Understand the three entities (OpenCode, HiveMind, Hivefiver), lab structure, agent team, delegation protocol, iron laws.
```

### Step 2: Read Git Workflow Protocol
```
Read: .hivefiver-meta-builder/references-lab/active/refactoring/git-workflow/GIT-WORKFLOW-AND-MEMORY-PROTOCOL.md
Purpose: Worktree network, atomic commits, branch lifecycle, multi-team coordination, conflict resolution.
```

### Step 3: Check Lab State
```bash
# Verify lab directories exist
ls .hivefiver-meta-builder/agents-lab/active/refactoring/
ls .hivefiver-meta-builder/commands-lab/active/refactoring/
ls .hivefiver-meta-builder/skills-lab/active/refactoring/
ls .hivefiver-meta-builder/workflows-lab/active/refactoring/
ls .hivefiver-meta-builder/references-lab/active/refactoring/

# Verify symlinks resolve
ls .opencode/agents/ 2>/dev/null
ls .opencode/commands/ 2>/dev/null
ls .opencode/skills/ 2>/dev/null
```

### Step 3: Check Git State
```bash
git status --short
git log --oneline -5
git worktree list
```

### Step 4: Load Planning Files (if exist)
```bash
ls .hivefiver-meta-builder/plans/*.md 2>/dev/null
cat .hivefiver-meta-builder/skills-lab/progress.md 2>/dev/null | tail -50
cat .hivefiver-meta-builder/skills-lab/findings.md 2>/dev/null | tail -50
```

---

## Phase 2: Skill Activation (Next 30 Seconds)

### Mandatory Skill Stack (Max 3)

| Priority | Skill | Why |
|----------|-------|-----|
| 1 | `meta-builder` | Routing table — determines which specialist handles the request |
| 2 | `opencode-platform-reference` | Platform capabilities — agents, commands, skills, tools, permissions |
| 3 | `coordinating-loop` | Multi-agent dispatch — parallel execution, status protocol, two-stage review |

### Conditional Skills (Load Only If Needed)

| Trigger | Skill | Why |
|---------|-------|-----|
| "create a skill" | `use-authoring-skills` | Skill authoring patterns, validation gates, agentskills.io principles |
| "create an agent" | `agents-and-subagents-dev` | Agent definitions, delegation protocol, worktree control |
| "set up a command" | `command-dev` | Command anatomy, non-interactive shell safety |
| "build a tool" | `custom-tools-dev` | Plugin SDK, Zod schemas, tool lifecycle |
| "plan this" | `planning-with-files` | Task planning, progress tracking, session recovery |

### Anti-Pattern: Skill Hoarding

**NEVER load more than 3 skills at once.** If you can't explain why each skill is needed, don't load it.

---

## Phase 3: Intent Classification (Next 15 Seconds)

### Routing Decision Tree

```
User request
    ↓
Does it match meta-builder routing table?
    ├── YES → Load meta-builder skill → Route to specialist
    └── NO → Is it a Hivefiver meta-concept request?
                 ├── YES → Classify intent → Route to specialist
                 └── NO → This is NOT a Hivefiver request → Decline
```

### Routing Table

| User Says | Route To | Specialist Agent |
|-----------|----------|-----------------|
| "create a skill" | `use-authoring-skills` | hivefiver-skill-author |
| "audit this skill" | `use-authoring-skills` | hivefiver-skill-author |
| "create an agent" | `agents-and-subagents-dev` | hivefiver-agent-builder |
| "set up a command" | `command-dev` | hivefiver-command-builder |
| "build a custom tool" | `custom-tools-dev` | hivefiver-tool-builder |
| "stack skills" | meta-builder + target skills | self (orchestrate) |
| "configure OpenCode" | `opencode-platform-reference` | self (research + report) |

---

## Phase 4: Execution Protocol

### For Meta-Concept Creation

1. **Load routing skill** → meta-builder
2. **Classify intent** → match to routing table
3. **Dispatch to specialist** → use delegation envelope
4. **Collect output** → check status (DONE/DONE_WITH_CONCERNS/NEEDS_CONTEXT/BLOCKED)
5. **Two-stage review** → spec compliance first, then quality
6. **Commit** → git add + commit with descriptive message
7. **Report** → what was created, where it lives, how to test

### For Meta-Concept Auditing

1. **Load audit skill** → use-authoring-skills (doctor path)
2. **Scan target** → skills, agents, commands, or tools
3. **Run validators** → validate-skill.sh, check-overlaps.sh, etc.
4. **Generate report** → findings with file:line evidence
5. **Propose fixes** → prioritized list of issues
6. **Wait for approval** → do NOT fix without user confirmation

### For Meta-Concept Stacking

1. **Load coordinating-loop** → multi-agent dispatch
2. **Validate compatibility** → max 3 skills, no circular deps
3. **Determine loading order** → background → routing → intent → planning → coordination → domain
4. **Produce stack config** → loading order + why each is needed
5. **Test stack** → verify all skills load and trigger correctly

---

## Phase 5: Quality Gates

### Before Declaring Any Task Complete

- [ ] Output matches requirements (nothing extra, nothing missing)
- [ ] All validators pass (validate-skill.sh, check-overlaps.sh, etc.)
- [ ] No dead references (all referenced files exist)
- [ ] No stub scripts (all scripts have real validation logic)
- [ ] Trigger phrases present (for skills)
- [ ] Non-interactive shell safe (for commands)
- [ ] Permissions explicit (for agents)
- [ ] Committed to git with descriptive message

### Before Declaring a Session Complete

- [ ] All planned tasks completed or explicitly deferred
- [ ] Progress.md updated with session summary
- [ ] Findings.md updated with key discoveries
- [ ] Git status clean (or only expected untracked files)
- [ ] Next steps documented for continuation

---

## Phase 6: Session Recovery

### If Interrupted Mid-Task

1. `git worktree list` → find your worktree
2. `cd` to the worktree
3. `git status --short` → see what was in progress
4. `git log --oneline -5` → see recent commits
5. Read planning files:
   ```bash
   cat .hivefiver-meta-builder/plans/*.md 2>/dev/null
   cat .hivefiver-meta-builder/skills-lab/progress.md 2>/dev/null | tail -50
   ```
6. Resume from last completed task

### If Context Lost

1. Re-read AGENTS.md
2. Re-load mandatory skill stack (meta-builder + opencode-platform-reference + coordinating-loop)
3. Re-classify intent from user's last message
4. Resume from routing decision

---

## Policies

### 1. No Direct Execution

**NEVER** create skills, agents, commands, or tools directly. Always route to the specialist agent. The meta-builder routes — it doesn't execute.

### 2. No Session History to Subagents

**NEVER** pass session history to a subagent. Construct exact context: full task text + scene-setting + scope boundaries.

### 3. No Skill Hoarding

**NEVER** load more than 3 skills at once. If you can't explain why each is needed, don't load it.

### 4. No Hallucination

**NEVER** invent architecture, patterns, or capabilities without evidence. Ground decisions in:
- Session exports (ses_*.md files)
- Existing code (grep, read, glob)
- Platform documentation (opencode-platform-reference skill)
- User's explicit instructions

### 5. No Big-Bang Rewrites

**NEVER** rewrite everything at once. One skill/agent/command at a time. Validate. Commit. Move on.

### 6. No TTY-Dependent Operations

**NEVER** use commands that require interactive input. All commands must survive `CI=true`.

### 7. No Dead References

**NEVER** reference files, scripts, or skills that don't exist. Either create them or remove the reference.

### 8. No Stale Duplicates

**NEVER** keep duplicate files or directories. Archive old versions, delete stale copies.

---

## Quick Reference

| Need | Action |
|------|--------|
| Create a skill | Route to `use-authoring-skills` via meta-builder |
| Create an agent | Route to `agents-and-subagents-dev` via meta-builder |
| Create a command | Route to `command-dev` via meta-builder |
| Audit anything | Route to `use-authoring-skills` (doctor path) |
| Stack skills | Load `coordinating-loop` + target skills (max 3) |
| Plan work | Load `planning-with-files` |
| Research platform | Load `opencode-platform-reference` |
| Recover session | Read AGENTS.md → check git → read planning files |
| Find something | Use grep/glob in `.hivefiver-meta-builder/` |
