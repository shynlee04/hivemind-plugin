---
name: use-hivemind-git-memory
description: Entry router for git-based semantic memory operations. Routes to git-continuity-memory for session recovery, hivemind-atomic-commit for commit discipline, git-memory-enforce for memory-first enforcement, and hierarchy-retrace for decision indexing. Use when: resuming work from git history, tracing decisions, anchoring checkpoints, enforcing memory-carrying commits, or indexing decision hierarchies.
---

# use-hivemind-git-memory

Domain router that unifies all git-based semantic memory operations under a single entry point. Instead of loading multiple git/memory skills directly, this router dispatches to the correct specialist based on the operation type — session recovery, commit discipline, memory enforcement, or decision indexing. It ensures consistent routing, prevents skill conflicts, and maintains a clean separation between continuity (retrieval), discipline (write), and indexing (structure).

## Purpose

- Route git memory requests to the correct specialist skill
- Entry point for all git-based continuity and memory operations
- Prevent skill conflicts by enforcing single-path routing
- Maintain clean separation between continuity retrieval, commit discipline, memory enforcement, and decision indexing

## When to Activate

| Trigger | Route To | Mode |
|---------|----------|------|
| Resume from interruption or session break | `git-continuity-memory` | resume |
| Trace why a change exists or what decision led to it | `git-continuity-memory` | trace |
| Retrieve decisions or context from git history | `git-continuity-memory` | retrieve |
| Anchor next checkpoint for future recovery | `git-continuity-memory` | anchor |
| Commit with typed activity classification | `hivemind-atomic-commit` | — |
| Enforce that commits carry decision memory | `git-memory-enforce` | — |
| Index or query the decision hierarchy | `hierarchy-retrace` | — |

## Prerequisites

- `use-hivemind` loaded (session entry)
- Git repository initialized with commit history
- `.hivemind/` runtime directory present (for path resolution)

## Sibling Skills

| Skill | Domain | Role |
|-------|--------|------|
| `git-continuity-memory` | Continuity | Session recovery, tracing, retrieval, anchoring |
| `hivemind-atomic-commit` | Discipline | Typed commit classification, pre-commit gates, rollback plans |
| `git-memory-enforce` | Enforcement | Memory-first commit validation, decision encoding |
| `hierarchy-retrace` | Indexing | Decision tree traversal, cross-session query, audit trails |

## Anti-Patterns

| Anti-Pattern | Why It Fails | Correct Approach |
|--------------|--------------|------------------|
| Loading `git-continuity-memory` directly | Bypasses routing; may conflict with other git skills | Use this router to dispatch |
| Mixing resume and commit operations in one call | Different skill domains with different contracts | Route to separate skills sequentially |
| Using `hivemind-atomic-commit` for recovery | Atomic commit is write-side discipline, not recovery | Use `git-continuity-memory` (resume) for recovery |
| Querying hierarchy without indexing first | Hierarchy data may be stale or unindexed | Route to `hierarchy-retrace` to build/query index |
| Running multiple git memory skills in parallel | Shared git state; parallel writes risk conflicts | Sequential dispatch through this router |

## Independence Rules

```
ROUTER ONLY. This skill does not implement git memory operations.
It dispatches to specialist skills and returns their results.

Dependency chain:
  use-hivemind (session entry)
    → use-hivemind-git-memory (this router)
      → git-continuity-memory | hivemind-atomic-commit | git-memory-enforce | hierarchy-retrace

No direct code execution. No file mutation. Pure routing.
```

## Routing Logic

```
Input: operation type
  ├── "resume" | "trace" | "retrieve" | "anchor"
  │     → dispatch git-continuity-memory with mode parameter
  ├── "commit" | "classify" | "atomic"
  │     → dispatch hivemind-atomic-commit
  ├── "enforce" | "memory-check" | "validate-commit"
  │     → dispatch git-memory-enforce
  └── "index" | "query" | "hierarchy" | "decision-tree"
        → dispatch hierarchy-retrace
```

## Return Contract

Each downstream skill returns its own evidence contract. This router passes through the return value without modification — it does not synthesize, merge, or transform results. The caller receives the specialist skill's raw output.
