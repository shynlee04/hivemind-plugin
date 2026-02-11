# Migration Guide: HiveMind v1.3 → v1.4

## Overview

HiveMind v1.4 introduces breaking changes to the directory structure. The `.opencode/planning/` directory is replaced with `.hivemind/`.

## What Changed

| v1.3 | v1.4 |
|-------|-------|
| `.opencode/planning/index.md` | `.hivemind/sessions/index.md` |
| `.opencode/planning/active.md` | `.hivemind/sessions/active.md` |
| `.opencode/planning/brain.json` | `.hivemind/brain.json` |
| `.opencode/planning/config.json` | `.hivemind/config.json` |
| `.opencode/planning/archive/` | `.hivemind/sessions/archive/` |
| - | `.hivemind/10-commandments.md` |
| - | `.hivemind/plans/` |
| - | `.hivemind/logs/` |

## Manual Migration

If you want to migrate manually:

```bash
# 1. Create new structure
mkdir -p .hivemind/sessions/archive
mkdir -p .hivemind/plans/archive
mkdir -p .hivemind/logs

# 2. Move session files
mv .opencode/planning/index.md .hivemind/sessions/
mv .opencode/planning/active.md .hivemind/sessions/
mv .opencode/planning/brain.json .hivemind/
mv .opencode/planning/config.json .hivemind/
mv .opencode/planning/archive/* .hivemind/sessions/archive/

# 3. Move plans (if any)
mkdir -p .hivemind/plans/archive
# Archive old plans to .hivemind/plans/archive/

# 4. Remove old directory (optional)
rm -rf .opencode/planning/
```

## Automated Migration (Future)

The `hivemind init` command will add a `--migrate` flag in a future release to automate this process.

## What's New in v1.4

- **10 Commandments** document for tool design
- **Hook wiring**: `tool.execute.before` and `experimental.session.compacting` now active
- **Git hooks**: Pre-commit enforcement for atomic commits
- **Plan organization**: Active plans in `.hivemind/plans/`, archived plans in `.hivemind/plans/archive/`

## Compatibility

- Existing `opencode.json` plugin registration remains valid: `"plugin": ["hivemind-context-governance"]`
- CLI commands unchanged: `hivemind init`, `hivemind status`, `hivemind compact`, `hivemind dashboard`
- All 4 tools work identically: `declare_intent`, `map_context`, `compact_session`, `self_rate`

## Questions?

See `AGENTS.md` for documentation on using HiveMind.
