# A006 - Action Roadmap

## P0 (immediate)

1. Re-harden stamp fallback path resolution (`planning-fs`) and add direct tests for traversal cases.
2. Restore explicit non-fatal logging in `withState` backup rename path.
3. Add PR-retention annotation in review docs when post-merge consolidation reverts behavior.

## P1 (next sprint)

1. Re-extract migration logic if all read paths adopt it.
2. Rebuild direct prompt-generation tests for agent behavior.
3. Reintroduce config option constants as single source of truth if CLI/schema continue to expand.

## P2 (after profiling)

1. Re-assess `copyFile` optimization with real state-file distribution.
2. Re-assess tree flatten optimization with realistic max-depth data.
3. Design bounded-concurrency backup cleanup model instead of unbounded `Promise.all`.
