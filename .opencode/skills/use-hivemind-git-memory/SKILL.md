---
name: use-hivemind-git-memory
description: Entry router for git-based semantic memory operations. Routes to
  git-atomic-memory for commit linking, intent encoding, and knowledge network
  formation. P1 skill for memory workflows.
---

# use-hivemind-git-memory

Entry router for git-based semantic memory. Dispatches to git-atomic-memory for implementation.

## When to Activate

| Intent Category | Trigger Phrases |
|------------------|-----------------|
| **Retrieve** | `git memory`, `semantic memory`, `knowledge network`, `what did we decide`, `decision history` |
| **Encode** | `commit intent`, `anchor commit`, `link commit to session`, `encode this decision` |
| **Resume** | `resume from git`, `session resume from git`, `restore from commits`, `continue from anchor` |
| **Build** | `build knowledge network`, `form semantic network`, `git knowledge graph` |

## Do NOT Activate When

| Condition | Reason | What to Use Instead |
|-----------|--------|---------------------|
| Request is `git rebase/bisect/cherry-pick` | Operations, not memory | `git-advanced-workflows` |
| Request is "write commit message" | Formatting, not memory | `conventional-commit` |
| Simple `git status` query without semantic analysis | No memory operation | Handle directly |
| Another git-memory skill already active | Conflict | Defer to active skill |
| Context depth > 70% | Budget exhaustion | Defer to context recovery |

## Two HiveMind Lineages

| Lineage | Purpose | Git Memory Use |
|---------|---------|----------------|
| **hivefiver** | Meta-builder: Framework development | Restore framework context from commits |
| **hiveminder** | Project-oriented: Product work | Track product decisions via commit network |

**Rule:** When in self-referential mode (HiveMind building HiveMind), use git memory to trace framework evolution.

## Routing Logic

```
GIT MEMORY REQUEST:
├── RETRIEVE mode
│   ├── "retrieve --session-id" → route to git-atomic-memory (retrieve mode)
│   ├── "what did we decide" → route to git-atomic-memory (retrieve mode)
│   └── "decision history" → route to git-atomic-memory (retrieve mode)
│
├── ENCODE mode
│   ├── "encode --commit" → route to git-atomic-memory (encode mode)
│   ├── "commit intent" → route to git-atomic-memory (encode mode)
│   └── "anchor" → route to git-atomic-memory (encode mode)
│
├── NETWORK mode
│   ├── "network --build" → route to git-atomic-memory (network mode)
│   └── "knowledge network" → route to git-atomic-memory (network mode)
│
├── RESUME mode
│   └── "resume --from-git" → route to use-hivemind-session-resume
│
├── INTENT mode
│   └── "intent --extract" → route to git-atomic-memory (intent mode)
│
└── UNKNOWN
    └── Ask clarifying question before routing
```

## Coordinator vs Specialist Behavior

| Behavior | Coordinator (this skill) | Specialist (git-atomic-memory) |
|----------|-------------------------|------------------------------|
| **Role** | Route, gatekeep, teach boundaries | Execute memory operations |
| **Reading** | Broad routing assessment | Deep git history analysis |
| **Execution** | Delegate only | Implement retrieval/encoding |
| **Depth** | Strategic overview | Detailed implementation |

**Never** implement git memory operations directly — always delegate to git-atomic-memory.

## NO-LOAD Rules

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Context depth exceeds | >70% | Defer to context recovery |
| Session state degraded | `interrupted` or `degraded` | Skip activation |
| Stack budget exhausted | Active skills ≥3 | Skip activation |
| No `.git` directory | No repository | Skip activation |

## Degrees of Freedom Model

### Degree 1: High Freedom (Router Mode)
- Ask clarifying questions about intent
- Present routing options
- "Retrieve vs encode" distinctions

### Degree 2: Medium Freedom (Teaching Mode)
- Explain git memory concepts
- Show reference paths
- Describe network formation

### Degree 3: Low Freedom (Deterministic Mode)
- Explicit mode routing when clear
- Mandatory delegate to git-atomic-memory
- No direct implementation

## Platform Knowledge

### OpenCode Git Patterns

| Concept | Behavior |
|---------|----------|
| **Skill Loading** | `skill` tool loads `.opencode/skills/git-atomic-memory/SKILL.md` |
| **References** | Loaded from `.opencode/skills/use-hivemind-git-memory/references/` |
| **Chaining** | git-atomic-memory depends on context-intelligence-entry (P1) |

### Session-to-Commit Linking

| Session Type | Git Memory Use |
|--------------|----------------|
| **NEW** | Encode intent on first commit |
| **RESUMED** | Retrieve anchors, restore trajectory |
| **DELEGATED** | Link to parent decisions via commits |
| **DEGRADED** | Recover from semantic anchors |

## Hard Behavior Rules

1. **Commits are immutable anchors.** Git memory reads from commits, never modifies history.

2. **Intent is semantic, not syntactic.** Route to git-atomic-memory for meaning extraction, not just git log commands.

3. **Session linkage requires consent.** User must approve session-commit associations before encoding.

4. **Routing is explicit.** Never implement in this skill — always delegate to git-atomic-memory.

## Related Skills

| Skill | Relationship |
|-------|--------------|
| `git-atomic-memory` | **ROUTES TO** — implementation layer for all git memory operations |
| `use-hivemind-session-resume` | **ROUTES TO** — for resume-from-git requests |
| `context-intelligence-entry` | **DEPENDS_ON** — validates session before memory operations |
| `git-advanced-workflows` | **COMPLEMENTS** — operations layer (rebase, bisect) |
| `conventional-commit` | **COMPLEMENTS** — formatting layer (messages) |

## References

| Reference | When to Load |
|-----------|--------------|
| `git-atomic-memory/references/01-intent-encoding.md` | When routing encode mode |
| `git-atomic-memory/references/02-session-linking.md` | When routing retrieve/resume mode |
| `git-atomic-memory/references/03-network-formation.md` | When routing network mode |
| `git-atomic-memory/references/04-hierarchy-levels.md` | When routing retrieve for specific levels |