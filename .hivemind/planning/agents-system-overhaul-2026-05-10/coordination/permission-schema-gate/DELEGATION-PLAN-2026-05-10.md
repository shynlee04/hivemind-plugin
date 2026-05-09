# Permission Schema Gate — Delegation Plan

**Created:** 2026-05-10 | **Status:** WAVE-1 DISPATCHING | **Orchestrator:** hm-l0-orchestrator

## Mission

Build the authoritative YAML schema gate for all 56 shipped agent files. Fix PH-01 rework with full specificity: mode hierarchy, delegation direction, wildcard cascading, hidden field, regex specificity, and complete allow-lists under every `*` parent.

## User-Identified Defects in Current PH-01

1. **Wildcard children not allow-listed**: `'*': ask` changed from deny→ask, but NO explicit `allow` children added under the wildcard for legitimate delegation targets
2. **`ask` at same level as children**: Some agents have `'*': ask` AND `hm-l2-*: ask` (repeating deny/ask instead of `allow`) — children MUST be `allow` to override the `ask` wildcard
3. **Missing `hidden: true`**: Non-front-facing agents (all L1, L2, L3) should have `hidden: true` so they don't surface to user
4. **Mode hierarchy violations**: `mode: primary` on agents that should be `mode: subagent`, and vice versa — primary delegates ALL levels, subagent cannot delegate to primary, subagent-to-subagent delegation rules
5. **Incomplete delegation direction**: hf-* agents with hm-* task children but missing hm-* skill children (or vice versa), cross-lineage violations
6. **Regex specificity conflicts**: `bash: { '*': ask, git *: allow }` — the `git *` pattern may not be a valid regex in OpenCode; need to verify actual pattern syntax

## Wave Plan

### WAVE-1 (PARALLEL — 2 research subagents)
1. **hm-l3-detective → OpenCode Schema Research**: Fetch authoritative agent YAML schema from `anomalyco/opencode` repo. Extract: valid frontmatter fields, valid `mode` values, `hidden` field, `permission` structure (task/skill/bash/glob/grep/edit/read/write), pattern matching syntax (glob vs regex), wildcard cascading behavior, `temperature` field, `instruction` vs `instructions`, `skills` list format.
2. **hm-l3-detective → Hivemind Permission Enforcement**: Map how `src/` enforces permissions — read tool permission resolution code, delegation manager, skill loader. How does `'*': ask` cascade? What specificity order? How does OpenCode resolve conflicting patterns?

### WAVE-2 (SEQUENTIAL — synthesis)
3. **hm-l2-synthesizer → Build PERMISSION-SCHEMA-GATE doc**: Merge Wave-1 findings into authoritative gate document with:
   - Valid YAML fields table (field, type, required, valid values, OpenCode version)
   - Mode hierarchy: `primary` (front-facing, can delegate all) vs `subagent` (cannot delegate to primary, cannot delegate peers unless explicitly allowed) vs `all` (legacy?)
   - Permission specificity: exact match > glob pattern > `*` wildcard
   - `hidden` field usage: `true` for all non-front-facing
   - Delegation direction matrix: who can delegate to whom (L0→L1→L2→L3, never up)
   - Cross-lineage rules: hf→hm allowed for investigation, hm→hf FORBIDDEN

### WAVE-3 (SEQUENTIAL — audit)
4. **hm-l2-auditor → Fleet-wide permission audit**: Run all 56 agent YAMLs against schema gate. Produce CONFLICT-AUDIT-PERMISSIONS-2026-05-10.md with per-agent violations.

### WAVE-4 (SEQUENTIAL — execution)
5. **hm-l2-executor → Fix all violations**: Apply fixes based on audit. Verify with frontmatter-only YAML parse.

### WAVE-5 (SEQUENTIAL — verification)
6. **hm-l2-validator → E2E verification**: Full fleet parse, cross-reference with SKELETON delegation graph, update STATE docs, atomic commit.

## Key References (on disk, survives compact)
- `.hivemind/planning/agents-system-overhaul-2026-05-10/SKELETON-2026-05-10.md` — delegation graph
- `.hivemind/planning/agents-system-overhaul-2026-05-10/STATE-2026-05-10.md` — master state
- `.hivemind/planning/agents-system-overhaul-2026-05-10/ROADMAP-2026-05-10.md` — phase plan
- `.hivemind/planning/refactoring/AGENTS-WORKFLOWS-SKILLS-SYSTEM-IMPROVEMENT-REFACTOR.md` — user vision
- `.hivemind/STACKS-REFERENCES.md` — correct repo links (anomalyco/opencode, NOT opencode-ai/opencode)
- `.opencode/skills/hm-l3-opencode-platform-reference/references/opencode-permissions.md` — existing permission reference (may be stale)
- `src/` — harness source code for permission enforcement

## Delegation Session Tracking
| Wave | Subagent | Session ID | Status |
|------|----------|-----------|--------|
| 1 | OpenCode Schema Research | PENDING | pending |
| 1 | Hivemind Permission Map | PENDING | pending |
| 2 | Schema Synthesis | PENDING | pending |
| 3 | Fleet Audit | PENDING | pending |
| 4 | Fix Execution | PENDING | pending |
| 5 | E2E Verify | PENDING | pending |
