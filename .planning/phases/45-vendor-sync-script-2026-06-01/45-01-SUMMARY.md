---
phase: 45-vendor-sync-script-2026-06-01
plan: 01
type: summary
created: 2026-06-01
status: PASS
---

# Plan 45-01 Summary — Vendor fork initial setup

## Objective

Vendor the `@hivemind/opencode-tmux` fork into the Hivemind monorepo at
`opencode-tmux/` (a vendored copy, not an npm dependency) and establish the
git remote / branch / pin-set conventions used by `scripts/sync-fork.sh` (built
in 45-02).

## What Shipped

1. `opencode-tmux/` directory created at the monorepo root with the vendored source
2. Pinned file list (initially 4 files: `session-manager.ts`, `grid-planner.ts`, `tmux.ts`, `config.ts`) — these are protected from upstream merge
3. `git remote add fork <upstream-url>` wired
4. `scripts/sync-fork.sh` skeleton (full implementation in 45-02)

## Verification

- `ls opencode-tmux/` shows the vendored structure (src/, __tests__/, package.json, README.md)
- `git remote -v | grep fork` shows the upstream URL
- Pinned file list is documented in `opencode-tmux/.hivemind-pin-list`

## Open Items at Handoff

- 45-02 needed to implement the full `sync-fork.sh` logic (3-way merge, pinned-file
  conflict detection, replace-only semantics) and add the BATS test suite.
- BATS test suite shipped in 45-02 and re-verified in 49-05 with 3/3 passing.
