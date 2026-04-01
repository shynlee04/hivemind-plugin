# GCC v2 File Format Reference

## index.yaml (v2 — primary format)

The single source of truth. Replaces v1's `commit.md`, `log.md`, and `metadata.yaml`.

```yaml
version: 2
mode: git                    # "git" or "standalone"
created: "2025-01-10T08:00:00Z"
config:
  proactive_commits: true
  worktree_ttl: 24h          # git mode only
  bridge_to_aiyoucli: auto   # auto | off | manual

current_branch: main

timeline:
  - id: INIT
    hash: a1b2c3d
    intent: "gcc initialized"
    branch: main
    date: "2025-01-10T08:00:00Z"

  - id: C001
    hash: e4f5a6b
    intent: "implement retry logic for API calls"
    branch: feature-resilience
    date: "2025-01-15T10:30:00Z"

  - id: C002
    hash: null                  # decision-only entry (no commit)
    intent: "evaluated caching strategies"
    note: "descartamos Redis — dependency too heavy for this use case"
    branch: main
    date: "2025-01-16T14:00:00Z"

  - id: C003
    hash: 7c8d9e0
    intent: "release v1.0.0"
    note: "descartamos semantic-release por overhead para repo pequeño"
    branch: main
    date: "2025-01-20T09:00:00Z"

worktrees:
  - name: refactor-auth
    path: ../gcc-wt-refactor-auth
    branch: refactor-auth
    created: "2025-01-18T10:00:00Z"
    ttl: 24h
    status: active             # active | merged | expired | abandoned

decisions: []                  # reserved for future structured decisions
```

### Timeline Entry Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | yes | Sequential ID: `INIT`, `C001`, `C002`, ... |
| `hash` | yes | Git short hash, or `null` for decision-only entries |
| `intent` | yes | Why this commit exists (1 line, imperative) |
| `note` | no | Decision context git can't capture (rejected alternatives, trade-offs) |
| `branch` | yes | Branch name at time of commit |
| `date` | yes | UTC ISO 8601 timestamp |

### Worktree Entry Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | yes | Worktree identifier |
| `path` | yes | Filesystem path (convention: `../gcc-wt-<name>`) |
| `branch` | yes | Git branch checked out in worktree |
| `created` | yes | UTC ISO 8601 timestamp |
| `ttl` | yes | Time-to-live before auto-cleanup (e.g., `24h`, `7d`) |
| `status` | yes | `active`, `merged`, `expired`, or `abandoned` |

### Token Cost Comparison

| Format | Tokens per entry | 10 entries |
|--------|-----------------|------------|
| v1 `commit.md` | ~500 | ~5,000 |
| v2 `index.yaml` (no reconstruction) | ~50 | ~500 |
| v2 + `git show` reconstruction | ~200 | ~2,000 |

## Standalone Mode Files

When `mode: standalone`, GCC also creates these v1-compatible files:

### main.md

Global roadmap. Updated on MERGE and significant COMMITs.

```markdown
# Project Roadmap

## Objectives
- [ ] Objective 1
- [x] Objective 2 (completed)

## Milestones
### M1: Feature X implemented
- Status: merged

## Active Branches
- `experiment-z`: Testing alternative caching approach
```

### log.md

OTA execution log. Standalone mode only (git mode uses `index.yaml` timeline).

```markdown
---
**[OTA-042]** 2025-01-15T10:15:00Z | Branch: main
- **Observation**: API calls failing intermittently
- **Thought**: Need exponential backoff
- **Action**: Implementing retry logic

---
```

## Bridge Log (.bridge-log)

Internal file tracking which entries have been synced to aiyoucli. One hash per line.

```
a1b2c3d
e4f5a6b
7c8d9e0
```

## Migration from v1

Run `scripts/gcc_init.sh --upgrade` to:
1. Back up v1 files to `.GCC/.v1-backup/`
2. Create `index.yaml` from existing state
3. Preserve `main.md` and `log.md` if in standalone mode

v1 files are not deleted, only superseded by `index.yaml`.
