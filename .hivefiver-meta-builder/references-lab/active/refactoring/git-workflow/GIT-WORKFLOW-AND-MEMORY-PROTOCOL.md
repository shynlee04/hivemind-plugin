# Git Workflow & Long-Term Memory Protocol — Hivefiver

**Synthesized from:** superpowers (using-git-worktrees, finishing-a-development-branch), GSD (git-integration, git-planning-commit), GitHub awesome-copilot (git-flow-branch-creator, memory-merger, gh-cli), episodic-memory (remembering-conversations), elite-longterm-memory, and HiveMind advanced use cases.

**Date:** 2026-04-05
**Status:** Active — supersedes all prior git/memory protocols

---

## Part 1: Worktree Network Architecture

### The Principle

Each worktree is an **isolated agent workspace** on its own branch. Multiple teams (human + AI) work simultaneously without collision. Branches form a **network** — not a linear tree — where each branch represents a distinct unit of work.

### Branch Naming Convention

```
<type>/<scope>-<description>

Types:
  feature/     — New capability (agent, command, skill, workflow)
  fix/         — Bug fix or correction
  refactor/    — Structural improvement without behavior change
  docs/        — Documentation, AGENTS.md, protocols
  experiment/  — Exploratory work (may be discarded)
  sync/        — Cross-worktree synchronization

Scopes:
  agent-       — Agent definitions
  command-     — Command definitions
  skill-       — Skill packages
  workflow-    — Workflow files
  memory-      — Memory/index infrastructure
  git-         — Git workflow/tooling
```

### Worktree → Branch Mapping

| Worktree | Branch | Purpose | Team |
|----------|--------|---------|------|
| `harness-experiment` | `harness-experiment` | Main development. Labs + symlinks. | Human + Coordinator |
| `hivefiver-v2` | `feature/hivefiver-agent-command-v2` | Agent+command package dev | Specialist agents |
| `hivefiver-packs` | `feature/hivefiver-agent-command-packs` | Alternative package dev | Specialist agents |
| *(new)* | `feature/skill-<name>` | Individual skill development | Skill author agent |
| *(new)* | `fix/<component>` | Bug fixes | Builder + Critic |
| *(new)* | `docs/<topic>` | Documentation updates | Human + Researcher |

### Directory Selection (Priority Order)

1. **Check existing:** `ls -d .worktrees 2>/dev/null` → use if exists
2. **Check CLAUDE.md/AGENTS.md:** `grep -i "worktree.*director" AGENTS.md` → follow if specified
3. **Ask user:** Only if neither exists

### Safety Verification (NON-NEGOTIABLE)

```bash
# MUST verify directory is ignored before creating worktree
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
# If NOT ignored → add to .gitignore → commit → proceed
```

### Worktree Creation Protocol

```bash
# 1. Detect project name
project=$(basename "$(git rev-parse --show-toplevel)")

# 2. Create worktree with descriptive branch
git worktree add .worktrees/<name> -b <type>/<scope>-<description>

# 3. Run project setup (auto-detect)
if [ -f package.json ]; then npm install; fi

# 4. Verify clean baseline
git status --short  # should be clean
git log --oneline -3  # verify starting point

# 5. Report
echo "Worktree ready at .worktrees/<name>"
echo "Branch: <type>/<scope>-<description>"
echo "Tests: <result>"
```

---

## Part 2: Atomic Commit Protocol

### The Principle

**Every commit is a self-contained unit of work** that can be understood, reviewed, and reverted independently. Commits are the **long-term memory** of the project — they form a navigable history that any agent (or human) can reconstruct context from.

### Commit Types

| Type | When | Example |
|------|------|---------|
| `feat` | New capability | `feat(agent): add hivefiver-skill-author specialist` |
| `fix` | Bug fix | `fix(coordinator): remove broken JS template literal` |
| `refactor` | Structural change, no behavior change | `refactor(labs): symlink .opencode/ to lab directories` |
| `docs` | Documentation | `docs(protocol): add git workflow + memory protocol` |
| `test` | Test-only changes | `test(skill): add trigger eval for use-authoring-skills` |
| `chore` | Config, tooling, cleanup | `chore(git): add .worktrees to .gitignore` |
| `sync` | Cross-worktree synchronization | `sync(labs): copy new agents from hivefiver-v2` |
| `plan` | Planning documents only | `plan(hivefiver): 3-3-3 wave execution plan` |

### Commit Message Format

```
<type>(<scope>): <what changed> — <why it matters>

- <key change 1>
- <key change 2>
- <verification: command + result>
```

### Atomic Commit Rules

1. **ONE logical change per commit** — Never mix unrelated changes
2. **Stage files individually** — NEVER `git add .` or `git add -A`
3. **Commit after each task** — Not after each phase, not at the end
4. **Include verification** — Every commit message includes how to verify
5. **Plans and code are separate** — Planning docs get `plan:` type, code gets `feat/fix/refactor:`

### Committing Plans vs Code

```bash
# Plan-only commit (no code changes)
git add .hivefiver-meta-builder/plans/plan-name.md
git commit -m "plan(hivefiver): 3-3-3 wave execution plan

- Task 1: Audit agents (researcher subagent)
- Task 2: Audit commands (command-builder subagent)
- Task 3: Extract patterns from .skills-lab/
- Verification: plan document exists, tasks are atomic"

# Code commit (with plan reference)
git add .hivefiver-meta-builder/agents-lab/active/refactoring/hivefiver-skill-author.md
git commit -m "feat(agent): add hivefiver-skill-author specialist

- Creates/audits/repairs skills with agentskills.io principles
- Pattern selection (P1/P2/P3), validation loops, deviation rules
- References plan: .hivefiver-meta-builder/plans/command-pack-implementation-plan-2026-04-05.md
- Verification: agent file exists, frontmatter valid, 280+ lines"
```

---

## Part 3: Branch Network as Context Graph

### The Principle

**Git branches are not just code containers — they are context networks.** Each branch captures a coherent unit of work with its own narrative. The commit history within a branch tells the story of how that work evolved.

### Branch Lifecycle

```
CREATE → WORK → VERIFY → INTEGRATE → CLEANUP
  ↓        ↓        ↓         ↓          ↓
worktree  commits  tests    merge/PR   remove
created   atomic   pass     or keep    worktree
```

### Integration Options (Present to User)

When work is complete, present exactly 4 options:

```
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work
```

**Rules:**
- **NEVER** proceed without user choice (unless explicitly told to auto-merge)
- **ALWAYS** verify tests pass before presenting options
- **ALWAYS** require typed confirmation for Option 4 (discard)
- **NEVER** auto-cleanup worktree for Options 2 or 3

### Branch Context Recovery

Any agent can reconstruct context from any branch:

```bash
# What happened on this branch?
git log --oneline <branch>  # commit narrative
git diff <base>..<branch> --stat  # what changed
git log --format="%h %s" <branch> | head -20  # story

# What files were touched?
git diff --name-only <base>..<branch>

# What's the current state?
git show <branch>:path/to/file  # file at branch tip
```

---

## Part 4: Long-Term Memory System

### The Three-Layer Memory Model

| Layer | Mechanism | Scope | Persistence |
|-------|-----------|-------|-------------|
| **L1: Git History** | Commits, branches, tags | Code + plans + docs | Permanent (git log) |
| **L2: Lab Files** | progress.md, findings.md, STATE.md | Session state | File-based (survives restarts) |
| **L3: Episodic Memory** | Conversation index + semantic search | Full conversation history | SQLite + vector embeddings |

### Layer 1: Git as Long-Term Memory

**Git is the primary memory system.** Every decision, every change, every plan is captured in commits.

```bash
# Navigate the memory graph
git log --all --graph --oneline  # full branch network
git log --since="1 week ago"  # recent memory
git log --grep="skill"  # search by topic
git log --author="builder"  # search by agent

# Reconstruct context from any point
git checkout <commit>  # time travel
git show <commit>  # what changed
git diff <commit1>..<commit2>  # evolution between points
```

**Commit messages are the index.** Write them so any future agent can understand what happened and why.

### Layer 2: Lab Files as Session State

These files persist across sessions and provide structured state:

| File | Purpose | Location |
|------|---------|----------|
| `progress.md` | Session log — what was done, what's pending | `.hivefiver-meta-builder/skills-lab/` |
| `findings.md` | Research discoveries, evidence, gaps | `.hivefiver-meta-builder/skills-lab/` |
| `task_plan.md` | Current plan with checkbox tracking | `.hivefiver-meta-builder/plans/` |
| `STATE.md` | Position, decisions, blockers | `.planning/` (GSD pattern) |
| `ROADMAP.md` | Phase progress tracking | `.planning/` (GSD pattern) |

**Update protocol:** After every significant action, update the relevant file. Before starting any task, read these files for context.

### Layer 3: Episodic Memory (Conversation History)

**When to search:**
- User asks "how should I..." or "what's the best approach..."
- You've explored codebase and need to make architectural decisions
- User says "last time", "before", "we discussed"
- You're stuck on a problem
- Facing an unfamiliar workflow

**How to search:**
```
Dispatch search-conversations agent:
  description: "Search past conversations for [topic]"
  prompt: "Search for [specific query]. Focus on [decisions/patterns/gotchas]."
  subagent_type: "search-conversations"
```

**NEVER** load raw conversation files directly. Always use the search agent — it synthesizes 50-100x more efficiently.

### Memory Merger Protocol

When lessons from a domain become mature (validated across multiple sessions), merge them into the permanent instruction files:

```bash
# Check for mature lessons in progress.md / findings.md
# If patterns are consistent and validated:
# 1. Extract the lesson
# 2. Add to AGENTS.md or relevant skill's SKILL.md
# 3. Commit: "docs(memory): merge <domain> lessons into permanent instructions"
# 4. Archive the source file
```

---

## Part 5: Multi-Team Coordination

### Team Boundaries

| Team | Domain | Worktrees | Cannot Touch |
|------|--------|-----------|-------------|
| **Human** | Architecture decisions, approvals, reviews | Any | Nothing (full access) |
| **Coordinator** | Orchestration, delegation, tracking | `harness-experiment` | `src/**`, `tests/**` |
| **Specialist Agents** | Skill/agent/command creation | Dedicated worktrees | Other teams' worktrees |
| **Builder** | Code implementation | Dedicated worktrees | `.opencode/` meta-concepts |
| **Critic** | Quality verification | Read-only across all | Nothing (read-only) |
| **Researcher** | Investigation, evidence | Read-only across all | Nothing (read-only) |

### Non-Disruptive Workflow Rules

1. **Each team works in its own worktree** — No shared worktrees during active development
2. **Commits are atomic and labeled** — Type prefix identifies the team (`feat:`, `fix:`, `docs:`, `plan:`)
3. **Symlinks are the integration point** — `.opencode/` symlinks to labs, so changes are instantly testable
4. **No force pushes** — Never `git push --force` on shared branches
5. **No rebasing shared branches** — Only rebase your own feature branches
6. **Merge, don't rebase, when integrating** — Preserves the commit narrative

### Cross-Worktree Synchronization

When one team's work affects another:

```bash
# Team A finishes work, Team B needs the changes
# Team B's worktree:
git fetch origin
git merge origin/<team-a-branch>  # merge, don't rebase

# Or for selective changes:
git cherry-pick <commit-hash>  # pick specific commits
```

---

## Part 6: Improved Onboarding Protocol

### Phase 0: Memory Load (First 30 Seconds)

```bash
# 1. Check git memory
git log --oneline -10  # recent narrative
git branch -a  # available work contexts

# 2. Check session state
cat .hivefiver-meta-builder/skills-lab/progress.md 2>/dev/null | tail -30
cat .hivefiver-meta-builder/skills-lab/findings.md 2>/dev/null | tail -30

# 3. Search conversation memory (if needed)
# Dispatch search-conversations agent for historical context
```

### Phase 1: Context Loading (Next 30 Seconds)

1. Read AGENTS.md
2. Verify lab directories exist
3. Verify symlinks resolve
4. Check git state

### Phase 2: Skill Activation (Next 15 Seconds)

Mandatory stack (max 3):
1. `meta-builder` — routing
2. `opencode-platform-reference` — platform capabilities
3. `coordinating-loop` — multi-agent dispatch

### Phase 3: Intent Classification

Route to specialist per routing table. Never improvise.

### Phase 4: Execution

Follow delegation protocol. Two-stage review. Atomic commits.

### Phase 5: Memory Update

After completing work:
1. Update progress.md
2. Update findings.md (if discoveries made)
3. Commit with descriptive message
4. If lessons are mature → merge into permanent instructions

---

## Part 7: Conflict Resolution

### Terminology Conflicts

| Term | Use | Not |
|------|-----|-----|
| Worktree | Isolated git workspace | Branch, environment |
| Lab | Source of truth directory | Workspace, directory |
| Symlink | Live testing link | Copy, duplicate |
| Commit | Atomic unit of work | Save, update |
| Branch | Context network node | Version, copy |
| Agent | Specialist role | AI, model, assistant |
| Skill | Procedural instruction | Prompt, template |
| Command | Thin shell referencing workflow | Script, tool |

### Setting Conflicts

| Setting | Hivefiver Value | Reason |
|---------|----------------|--------|
| `CI=true` | Always set | Non-interactive shell safety |
| `GIT_PAGER=cat` | Always set | No interactive pagers |
| `GIT_EDITOR=true` | Always set | No interactive editors |
| Max skills per stack | 3 | Context window management |
| Max module size | 500 LOC | Agent comprehension |
| Commit frequency | After each task | Atomic memory |

### Workflow Conflicts

| Conflict | Resolution |
|----------|------------|
| Superpowers says "write design doc first" vs user says "just execute" | User wins. Document after execution. |
| GSD says "commit plans separately" vs superpowers says "commit everything together" | GSD wins. Plans and code are separate concerns. |
| Episodic-memory says "search first" vs task is simple | Search first anyway. Costs nothing, may save everything. |
| Git-flow says "rebase before merge" vs multi-team says "merge, don't rebase" | Multi-team wins. Preserves commit narrative for all teams. |

---

## Part 8: Next Actions

### Immediate (This Session)

1. **Commit this protocol** — `docs(protocol): add git workflow + long-term memory protocol`
2. **Update AGENTS.md** — Reference this protocol in worktree strategy section
3. **Create memory index** — Set up episodic-memory plugin if not already installed

### Short-Term (Next Sessions)

4. **Add git-workflow skill** — Create `.hivefiver-meta-builder/skills-lab/active/refactoring/git-workflow/` with synthesized protocol as SKILL.md
5. **Add memory-merger skill** — Create skill for merging mature lessons into permanent instructions
6. **Test worktree network** — Create 2-3 test worktrees, verify isolation, test sync

### Medium-Term

7. **Build TS runtime** — Pack validated labs into `opencode-harness` npm package
8. **Add analytics** — Track task completion rates, agent performance, token usage
9. **Community workflows** — Share validated workflow patterns
