# Session Inspection Export

- ses_id: `ses_2d6111bbbffebuhjwP3mFeB3qo`
- prepared_at: `2026-03-26T11:42:03.077Z`

## Assistant Output

The design decision has been written to `.hivemind/activity/agents/architect/remediation-architect-review/design-decision.md`.

## Summary

**Recommendation: Option A — Fix the registry to scan OpenCode's official discovery paths.**

### Key Findings

1. **Option B is blocked.** The OpenCode SDK has `client.app.agents()` and `client.app.log()` but NO `client.app.skills()`. Verified against the SDK docs at https://opencode.ai/docs/sdk/. There is no way to query OpenCode's discovered skills at runtime from a plugin.

2. **Option C is over-engineered.** The registry's single consumer is `validateSkillNames()` — a filesystem validation function. There's no "runtime state" to trust. OpenCode's skill discovery happens inside the server process, not exposed to plugins.

3. **Option A is the correct fix.** Scan the same paths OpenCode uses:
   - `.opencode/skills/` (project, primary)
   - `~/.config/opencode/skills/` (global, fallback)
   - `skills/skills/` (authoring surface, validation-only catch for unpublished skills)

### What Changes

- `discoverSkills()` (internal function) — rewrite to iterate multiple paths, deduplicate by skill ID
- `createOpencodeSkillRegistry()` signature — **unchanged** (backward compatible)
- Warning message in `validateSkillNames()` — update to reference correct path

### What Does NOT Change

- `createOpencodeSkillRegistry` public API
- `skill-injection-loader.ts` caller
- `skill-exposure-map.ts` injection pipeline
- Any TypeScript interfaces

### Reversibility

High. If the SDK adds `client.app.skills()` in the future, the filesystem scan can be replaced without changing the public API.