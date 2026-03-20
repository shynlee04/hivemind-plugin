---
name: use-hivemind-git-memory
description: "Entry router for git-based semantic memory operations. Routes to git-atomic-memory for commit linking, intent encoding, and knowledge network formation."
---

# use-hivemind-git-memory

When user wants to store or retrieve semantic memory via git: route to the git-atomic-memory implementation. This skill handles session-commit linking, decision anchoring, and knowledge network formation through git history.

## Integration

### Upstream Dependencies
| Skill | Required Before | Why |
|-------|----------------|-----|
| `use-hivemind` | Always | Framework context |
| `context-intelligence-entry` | For session state context | Memory retrieval needs current context |

### Downstream Routes
| Skill | Routes To | When |
|-------|-----------|------|
| `git-atomic-memory` | Memory implementation | All git memory operations |

### Cross-Domain Coupling
| Coupled Skill | Relationship | Direction |
|---------------|-------------|-----------|
| `use-hivemind-delegation` | Commit anchors for delegation traceability | Bidirectional |
| `context-entry-verify` | Git state verification | Unidirectional |

### Activation Chain
```
P0: use-hivemind
    ↓
P1: context-intelligence-entry (session health)
    ↓
P1: use-hivemind-git-memory ← This skill
    ↓
P2: git-atomic-memory (implementation)
```

## Anti-Pattern: When NOT to Use This Skill

- User asks for "git rebase" or "git bisect" → WRONG, these are operations not memory
- Agent says "I'll just write a commit message" → WRONG, commit intent encoding is semantic
- User wants simple "git status" check → WRONG, no memory operation involved
- Agent treats commit as "save" → WRONG, commits are immutable decision anchors
- Agent retrieves history without selective filtering → WRONG, memory is selective retrieval
- Agent implements git memory directly → WRONG, always route to specialist

## Process Flow

```digraph git-memory-flow {
  "Git Memory Request" -> "Identify Mode"
  "Identify Mode" -> "Retrieve?" [label="memory/history/decision"]
  "Identify Mode" -> "Encode?" [label="commit intent/anchor"]
  "Identify Mode" -> "Resume?" [label="session resume"]
  "Identify Mode" -> "Network?" [label="knowledge graph"]
  "Retrieve?" -> "Route to git-atomic-memory" [label="yes"]
  "Encode?" -> "Route to git-atomic-memory" [label="yes"]
  "Resume?" -> "Route to use-hivemind-session-resume" [label="yes"]
  "Network?" -> "Route to git-atomic-memory" [label="yes"]
}
```

## Step-by-Step Protocol

1. **DETECT** — Is this a git memory request?
2. **IDENTIFY** — Which mode applies?
3. **VERIFY** — Is this a git repository?
4. **IF** not git repo → Skip activation
5. **ROUTE** — Invoke appropriate specialist with mode parameter

## Terminal State

- **Retrieve mode**: Returns decision history and rationale from commits
- **Encode mode**: Commit linked to session with semantic intent stored
- **Resume mode**: Session trajectory restored from git anchors
- **Network mode**: Knowledge graph built from commit relationships
