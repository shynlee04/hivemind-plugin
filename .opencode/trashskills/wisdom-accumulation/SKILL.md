---
name: "wisdom-accumulation"
description: "Cross-task learning system using .harness/wisdom/ directory to persist learnings, decisions, and gotchas between agent sessions. Enables institutional memory and prevents repeating mistakes."
---

# Wisdom Accumulation

## Core Idea

Every task produces learnings. Without persistence, every agent starts from zero. Wisdom files create **institutional memory** across sessions.

## Directory Structure

```
.harness/wisdom/
  learnings.md    — Facts and patterns discovered
  decisions.md    — Architectural decisions with rationale
  issues.md       — Recurring problems and their solutions
```

Create `.harness/wisdom/` on first use if it doesn't exist.

## When to Write

**After every task** (success or failure), extract at least one learning:

- Discovered a convention? → Write to learnings.md
- Made an architecture choice? → Write to decisions.md
- Hit a confusing error? → Write to issues.md

## learnings.md Format

```markdown
# Learnings

## Conventions
- [2024-01-15] This project uses pnpm, not npm. Always use pnpm.
- [2024-01-15] Tests go in `tests/` not `__tests__/`.

## Successes
- [2024-01-15] Using zod schemas for API validation cut errors by 80%.

## Gotchas
- [2024-01-15] The `transform()` function mutates in-place. Clone first.
- [2024-01-15] Node 22+ required for test runner. Node 20 fails silently.
```

## decisions.md Format

```markdown
# Decisions

## [2024-01-15] Use file-based config over env vars
- **Context**: Need configurable retry behavior
- **Options**: env vars vs config file vs CLI flags
- **Chosen**: config file (.opencode.json)
- **Why**: Env vars get lost in subagent spawning. Config survives.

## [2024-01-14] SQLite for local cache
- **Context**: Need persistent cache for tool results
- **Options**: SQLite vs JSON files vs in-memory
- **Chosen**: SQLite via better-sqlite3
- **Why**: Concurrent reads, atomic writes, no corruption risk
```

## issues.md Format

```markdown
# Issues

## [2024-01-15] pnpm install hangs on Apple Silicon
- **Symptom**: `pnpm install` hangs at postinstall scripts
- **Root cause**: Rosetta emulation issue with native modules
- **Fix**: `pnpm install --ignore-scripts` then `pnpm rebuild`

## [2024-01-14] TypeScript path aliases not resolved in tests
- **Symptom**: Import errors only in test runner
- **Root cause**: tsconfig paths not picked up by vitest
- **Fix**: Add `resolve.alias` in vitest.config.ts matching tsconfig paths
```

## Wisdom Injection Pattern

When spawning a subagent for a specialist task, **inject relevant wisdom** into its prompt:

```
You are working on [task].

## Relevant Learnings
- This project uses pnpm, not npm
- Tests go in tests/ directory
- The transform() function mutates in-place

## Known Issues
- pnpm install may hang on Apple Silicon: use --ignore-scripts

Now proceed with: [specific instructions]
```

Only inject **relevant** wisdom — don't dump the entire file.

## Cleanup Rules

1. **Stale entries**: Remove entries older than 7 days that haven't been referenced
2. **Merge duplicates**: If the same learning appears twice, keep the more detailed one
3. **Promote patterns**: If a gotcha appears 3+ times, promote it to a project convention
4. **Size limit**: Keep each file under 100 lines. Archive older entries to `.harness/wisdom/archive/`

## Reading Wisdom

At the start of every task, read the relevant sections:
- Starting a build task? → Check learnings for conventions
- Debugging? → Check issues for known problems
- Making architecture choices? → Check decisions for precedent
