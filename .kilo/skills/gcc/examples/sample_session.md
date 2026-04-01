# GCC v2 Sample Session

This walkthrough demonstrates a typical GCC v2 session in git mode building a REST API.

## 1. Initialization

The agent starts working on a new project. GCC auto-detects the git repo:

```bash
$ bash scripts/gcc_init.sh
GCC v2 initialized at .GCC/
  Mode: git
  Index: .GCC/index.yaml
  Branch: main
  Last commit: a1b2c3d
```

## 2. First Commit

After implementing the Express server and todo model:

```bash
$ bash scripts/gcc_commit.sh "implement Express server with Todo model"
[C001] e4f5a6b — implement Express server with Todo model
```

The entry in `index.yaml` is lean:

```yaml
  - id: C001
    hash: e4f5a6b
    intent: "implement Express server with Todo model"
    branch: main
    date: "2026-03-28T10:15:00Z"
```

Full details live in git, reconstructed on demand via `git show e4f5a6b`.

## 3. Commit with Decision

The agent evaluates database options and picks SQLite:

```bash
$ bash scripts/gcc_commit.sh "add SQLite integration" "descartamos PostgreSQL — overkill para single-user todo app"
[C002] 7c8d9e0 — add SQLite integration
  Note: descartamos PostgreSQL — overkill para single-user todo app
```

```yaml
  - id: C002
    hash: 7c8d9e0
    intent: "add SQLite integration"
    note: "descartamos PostgreSQL — overkill para single-user todo app"
    branch: main
    date: "2026-03-28T10:30:00Z"
```

The `note` captures what git can't: **why an alternative was rejected**.

## 4. Quick Orientation

```bash
$ bash scripts/gcc_context.sh --summary
# GCC Timeline (summary)
Mode: git
---
2026-03-28T10:00:00Z  INIT  a1b2c3d  gcc initialized
2026-03-28T10:15:00Z  C001  e4f5a6b  implement Express server with Todo model
2026-03-28T10:30:00Z  C002  7c8d9e0  add SQLite integration
```

Cost: ~50 tokens. No git calls needed.

## 5. Reviewing Decisions

```bash
$ bash scripts/gcc_context.sh --decisions
# GCC Decisions
---
2026-03-28T10:30:00Z [C002] 7c8d9e0 — add SQLite integration
  -> descartamos PostgreSQL — overkill para single-user todo app
```

Only entries with notes appear. Perfect for understanding past trade-offs.

## 6. Cross-Session Recovery

New session. Agent recovers context:

```bash
$ bash scripts/gcc_context.sh --last 3
# GCC Context (last 3)
Mode: git
---

## [INIT]
Hash: a1b2c3d
Author: Dev
Date: Sat Mar 28 10:00:00 2026 -0400
Message: initial commit

 package.json | 15 +++++++++++++++
 1 file changed, 15 insertions(+)
Intent: gcc initialized
Branch: main

## [C001]
Hash: e4f5a6b
Author: Dev
Date: Sat Mar 28 10:15:00 2026 -0400
Message: implement Express server with Todo model

 server.js    | 45 +++++++++++++++++++++++++++
 models/todo.js | 32 +++++++++++++++++++
 2 files changed, 77 insertions(+)
Intent: implement Express server with Todo model
Branch: main

## [C002]
Hash: 7c8d9e0
Author: Dev
Date: Sat Mar 28 10:30:00 2026 -0400
Message: add SQLite integration

 db/sqlite.js    | 38 +++++++++++++++++++++++
 migrations/001.sql | 12 +++++++
 3 files changed, 50 insertions(+)
Intent: add SQLite integration
Note: descartamos PostgreSQL — overkill para single-user todo app
Branch: main
```

Full context reconstructed from git. The agent knows what was done, why, and what was rejected.

## 7. Bridge to aiyoucli

```bash
$ bash scripts/gcc_bridge.sh --status
# GCC Bridge Status
aiyoucli: available
Timeline entries: 3
Synced to memory: 3
Pending: 0
```

All entries synced to vector memory. Enables semantic search across commits in the future.

## 8. Cleanup

After weeks of work:

```bash
$ bash scripts/gcc_cleanup.sh --prune-index 20
Pruning index to last 20 entries...
Removing 5 oldest entries (keeping 20).
Done. Pruned 5 entries.
```

## Token Cost Comparison

| Operation | v1 (verbose markdown) | v2 (lean index) |
|---|---|---|
| 3 commits stored | ~1,500 tokens | ~150 tokens |
| Quick orientation | Read main.md (~800 tokens) | `--summary` (~50 tokens) |
| Full recovery | Read all files (~2,500 tokens) | `--last 5` (~1,000 tokens) |
| Check decisions | Scan all commits manually | `--decisions` (~100 tokens) |

## Resulting .GCC/ Structure

```
.GCC/
├── index.yaml       # 3 timeline entries (~150 tokens total)
├── .bridge-log      # 3 hashes synced to aiyoucli
├── branches/        # (empty — no branches used in this session)
└── worktrees/       # (empty — no worktrees used)
```

Compare to v1: 6 files totaling ~5,000 tokens. v2: 1 file at ~150 tokens.
