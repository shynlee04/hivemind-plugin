---
name: gcc
description: "Git Context Controller (GCC) v2 — Lean agent memory backed by real git. Stores hash + intent + optional decision notes instead of verbose markdown. Auto-bridges to aiyoucli vector memory when available. Dual mode: git-backed (lean index.yaml) or standalone (markdown fallback). Triggers on /gcc commands or natural language like 'commit this progress', 'branch to try an alternative', 'merge results', 'recover context'."
---

# Git Context Controller (GCC) v2

## Overview

GCC transforms agent memory from verbose markdown into a lean, git-backed index. Instead of duplicating what git already knows, GCC stores only **hash + intent + optional decision notes** (~50 tokens vs ~500 per entry). Full context is reconstructed on demand via `git show`.

Two modes:
- **git mode**: Real commits, lean `index.yaml`, worktree isolation, aiyoucli bridge
- **standalone mode**: Markdown fallback for projects without git (v1 compatible)

## Initialization

On first use, check if `.GCC/` exists. If not, run the init script:

```bash
scripts/gcc_init.sh          # auto-detects git/standalone
scripts/gcc_init.sh --upgrade # migrate v1 → v2
```

### Git mode structure
```
.GCC/
├── index.yaml       # Single source of truth (timeline, worktrees, decisions)
├── branches/        # Branch-specific notes (only when needed)
├── worktrees/       # Worktree tracking
└── .bridge-log      # Tracks what's been synced to aiyoucli
```

### Standalone mode structure
```
.GCC/
├── index.yaml       # Timeline in standalone mode
├── main.md          # Global roadmap (v1 compat)
├── log.md           # OTA execution log (v1 compat)
└── branches/
```

## index.yaml Format

```yaml
version: 2
mode: git              # or "standalone"
created: "2026-03-28T00:00:00Z"
config:
  proactive_commits: true
  worktree_ttl: 24h
  bridge_to_aiyoucli: auto   # auto | off | manual

current_branch: main

timeline:
  - id: C001
    hash: 85c8539
    intent: "release prep"
    branch: main
    date: "2026-02-25T21:40:00Z"

  - id: C002
    hash: a3f1b22
    intent: "auth middleware rewrite"
    note: "descartamos passport.js — too opinionated for our use case"
    branch: main
    date: "2026-02-26T10:00:00Z"

worktrees:
  - name: refactor-auth
    path: ../gcc-wt-refactor-auth
    branch: refactor-auth
    created: "2026-03-28T10:00:00Z"
    ttl: 24h
    status: active

decisions: []
```

**Key principle**: `hash` is the pointer to git truth. `intent` is why. `note` is only for decisions git can't capture (rejected alternatives, trade-offs).

## Scripts

### gcc_init.sh
Initialize GCC v2. Auto-detects git repo.
```bash
scripts/gcc_init.sh              # new project
scripts/gcc_init.sh --upgrade    # migrate v1 → v2 (backs up old files)
```

### gcc_commit.sh
Execute a real git commit and append lean entry to index.
```bash
scripts/gcc_commit.sh "implement retry logic"
scripts/gcc_commit.sh "release prep" "descartamos semantic-release por overhead"
scripts/gcc_commit.sh --staged "hotfix: null check"   # only staged files
```

### gcc_context.sh
Reconstruct context from index hashes.
```bash
scripts/gcc_context.sh                    # last 5 entries with git details
scripts/gcc_context.sh --last 10          # last 10
scripts/gcc_context.sh --hash abc123      # full details for specific commit
scripts/gcc_context.sh --summary          # one-line per entry (cheap, no git calls)
scripts/gcc_context.sh --decisions        # only entries with notes
scripts/gcc_context.sh --full             # everything
```

### gcc_bridge.sh
Feed commit data to aiyoucli vector memory. Silent no-op if aiyoucli unavailable.
```bash
scripts/gcc_bridge.sh --status            # check bridge connectivity
scripts/gcc_bridge.sh --sync              # sync all unsynced entries
# Called automatically by gcc_commit.sh when bridge_to_aiyoucli: auto
```

### gcc_cleanup.sh
TTL-based worktree cleanup and index pruning.
```bash
scripts/gcc_cleanup.sh                    # interactive cleanup
scripts/gcc_cleanup.sh --dry-run          # show what would be cleaned
scripts/gcc_cleanup.sh --force            # clean without asking
scripts/gcc_cleanup.sh --prune-index 50   # keep last 50 timeline entries
```

## Commands

### COMMIT

Persist a milestone. In git mode, executes a real commit.

**Triggers**: `/gcc commit <summary>`, "commit this progress", "checkpoint"

**Procedure (git mode)**:
1. Run `scripts/gcc_commit.sh "<intent>" ["<note>"]`
2. This stages changes, commits, captures hash, appends to index.yaml
3. If `bridge_to_aiyoucli: auto`, feeds to aiyoucli memory

**Procedure (standalone mode)**:
1. Run `scripts/gcc_commit.sh "<intent>"`
2. Appends OTA entry to log.md

**Proactive behavior**: When `proactive_commits: true`, suggest a commit after:
- Completing a function, module, or coherent unit of work
- Fixing a bug and verifying the fix
- Finishing a research/exploration phase with conclusions

### BRANCH

Create an isolated workspace. In git mode, uses real git worktrees.

**Triggers**: `/gcc branch <name>`, "try a different approach", "experiment with..."

**Procedure (git mode)**:
1. `git worktree add ../gcc-wt-<name> -b <name>`
2. Register in index.yaml under `worktrees:` with TTL
3. Agent works in worktree directory

**Procedure (standalone mode)**:
1. Create `.GCC/branches/<name>/` with summary.md, log.md
2. Register in index.yaml timeline

### MERGE

Integrate a branch back. In git mode, real git merge.

**Triggers**: `/gcc merge <branch>`, "integrate the experiment", "branch X is done"

**Procedure (git mode)**:
1. `cd` to main worktree
2. `git merge <branch>`
3. Append synthesis entry to timeline with intent + learnings as note
4. `git worktree remove ../gcc-wt-<name>`
5. Update worktree status to `merged`

**Procedure (standalone mode)**:
1. Read branch summary and commits
2. Append synthesis to main timeline
3. Update branch status

### CONTEXT

Retrieve historical memory. Reconstructed from git, not stored verbatim.

**Triggers**: `/gcc context`, "where were we?", "what's the status?"

**Flags**:
- `--summary` — One-line per entry. Cheapest option (~0 extra tokens). Use for quick orientation.
- `--last N` — Last N entries with full git reconstruction. Default for session recovery.
- `--hash <hash>` — Deep dive into specific commit (diff, message, files).
- `--decisions` — Only entries with notes (rejected alternatives, trade-offs).
- `--full` — Everything. Use sparingly.

### CLEANUP

Maintain the index and worktrees.

**Triggers**: `/gcc cleanup`, "clean up old worktrees"

**Procedure**:
1. Run `scripts/gcc_cleanup.sh` to handle expired worktrees
2. Run `scripts/gcc_cleanup.sh --prune-index 50` to trim old entries

## Cross-Session Recovery

When starting a new session on a project with `.GCC/`:

1. Run `scripts/gcc_context.sh --summary` for quick orientation
2. If more detail needed, run `scripts/gcc_context.sh --last 5`
3. Check `scripts/gcc_cleanup.sh --dry-run` for expired worktrees
4. Resume work with full context reconstructed from git

**Cost**: ~50 tokens for summary vs ~2500 tokens loading all v1 markdowns.

## aiyoucli Integration

When `bridge_to_aiyoucli: auto` in config:
- Every commit is automatically fed to aiyoucli vector memory via `gcc_bridge.sh`
- Stored with namespace `gcc`, tagged by branch
- Enables semantic search across commits: "when did I do something similar?"
- If aiyoucli is not installed, bridge is silently skipped

Manual sync: `scripts/gcc_bridge.sh --sync`

## Natural Language Mapping

| User says | Command |
|---|---|
| "save/checkpoint/persist this" | COMMIT |
| "try a different approach" | BRANCH |
| "that experiment worked, integrate it" | MERGE |
| "where were we?" / "what's the status?" | CONTEXT --summary |
| "show recent activity" | CONTEXT --last 10 |
| "what did we decide about X?" | CONTEXT --decisions |
| "deep dive into commit abc" | CONTEXT --hash abc |
| "clean up old stuff" | CLEANUP |
| "sync to memory" | bridge --sync |
