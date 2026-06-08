# iter-15: Tool-Intelligence Test Rewrite + Config-Governance Wiring - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning

## Phase Boundary

This iteration rewrites the test suite for `ToolIntelligenceEngine` to assert against the new config-driven contract (R1/R2/R3/R4 severities come from `.hivemind/configs.json`, not from hardcoded detector output) and wires the surrounding governance ecosystem — workflow doc, agent frontmatter, command, skill — so all 42 shipped agents can author and consume governance rules safely. Scope is bounded to a single atomic commit; no `src/` engine changes, no config mutations, no ITER-16 territory (l0/l1/l2/l3 primitive restructuring).

<spec_lock>
## Requirements (locked via SPEC.md)

**5 requirements are locked.** See `iter-15-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `iter-15-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md Boundaries):**
- Rewriting `tests/features/tool-intelligence/tool-intelligence-engine.test.ts` against the new config-driven engine contract.
- Creating `assets/workflows/hm-config-edit.md` (the missing TUI workflow).
- Ensuring `hm-config-govern` command has a reachable agent (creating `hm-platform-references` agent if needed).
- Wiring `skills: [hm-config-governance]` onto the 42 named agents via a single idempotent shell script.
- Creating `assets/skills/hm-config-governance/SKILL.md` with full progressive-disclosure content.
- One atomic commit: `feat(iteration-15): config-governance wiring + test rewrite`.
- Running `npm run typecheck` and `npm test` and reporting pass counts.

**Out of scope (from SPEC.md Boundaries):**
- Touching `.hivemind/configs.json` or `.hivemind/configs.schema.json` (already correct, per brief).
- Touching `src/features/tool-intelligence/index.ts` (engine refactor already landed, per brief).
- Touching `.opencode/get-shit-done/` (developer tooling, off-limits).
- Renaming, removing, or restructuring any l0/l1/l2/l3 skill/agent files (ITER 16 territory).
- Changing the engine's runtime behavior (the config-driven contract is the new source of truth).
- Adding new `action.type` enum values to the Zod schema or runtime.
- Creating new `GovernanceRule` entries in `.hivemind/configs.json` (the 14 existing rules are correct).

</spec_lock>

## Implementation Decisions

### Test rewrite strategy (R1)

- **D-01:** Tests construct `new ToolIntelligenceEngine([...sampleRules])` with an inline rule array — never `process.cwd()` config reads. Sample rules cover R1-malformed-task → `block`, R2-child-recursive-task → `needs_jit_grant`, R3 path (severity from config), R4-delegate-task-code-intent → `block`, and a default (unmatched tool) case.
- **D-02:** Each test asserts ONE behavior. A single `expect()` per test (or tightly grouped related asserts on the same decision field). No multi-assert bundles.
- **D-03:** Test file keeps the 20+ test count and the public-seam assertion discipline (assert against the engine's return envelope, not internals). Reason text is asserted only when the engine documents it as part of the contract.

### Workflow doc layout (R2)

- **D-04:** `assets/workflows/hm-config-edit.md` documents a 7-turn TUI flow: T1 read current config + print rules table → T2 prompt user to pick `list|add|remove|set-action|validate` → T3 collect rule fields (id, toolNames, action.type) → T4 call `validateConfigsFile()` and on failure show issue path + exit → T5 show before/after diff + ask for confirmation → T6 write file + call `resetToolIntelligenceEngine()` to invalidate the singleton → T7 suggest atomic commit per rule change.
- **D-05:** Workflow file stays ≤ 200 LOC, references `assets/commands/hm-config-govern.md` via relative path. Each turn is a numbered section with action + tool calls in fenced code blocks.

### Agent routing for `hm-config-govern` command (R3)

- **D-06:** Create `assets/agents/hm-platform-references.md` (the agent does not exist). Frontmatter includes `description`, `tools:` listing `hivemind-steer`, `hivemind-doc`, `hivemind-command-engine`, `configure-primitive`, `delegate-task`, `delegation-status`, and the `hm-config-govern` command reference. Agent body explains its role as the platform-references gateway for the config-governance cluster (command → workflow → engine loop).
- **D-07:** `scripts/sync-assets.js` is the canonical sync mechanism — no parallel hand-rolled copy. After agent creation, run sync and confirm `.opencode/agents/hm-platform-references.md` mirrors.

### Wiring script approach (R4)

- **D-08:** Model the new script on existing `add-tools-to-agents.sh` (proven pattern in repo root). New script `add-skills-to-agents.sh` walks `assets/agents/hm-*.md`, `assets/agents/hf-*.md`, and `assets/agents/hm-l0-orchestrator.md`. For each, check if `skills:` exists; if yes, append `hm-config-governance` only if missing (idempotent); if no, inject a `skills: [hm-config-governance]` block after the closing `---` of frontmatter.
- **D-09:** Script reports counts: `Added: N | Skipped (already-wired): M | Total touched: 42`. macOS-compatible: no `mapfile`, no associative arrays, pure awk + grep.
- **D-10:** Script handles all 42 named agents in a single pass (31 `hm-*` + 10 `hf-*` + 1 `hm-l0-orchestrator`). Acceptance verified via `grep -l "hm-config-governance" assets/agents/hm-*.md assets/agents/hf-*.md | wc -l` reporting ≥ 42.

### Skill progressive-disclosure (R5)

- **D-11:** `assets/skills/hm-config-governance/SKILL.md` follows the standard progressive-disclosure pattern: Pattern 1 (always-loaded) one paragraph explains config-driven governance and the R1/R2/R3/R4 → action.type mapping; Pattern 2 (when relevant) cross-references `assets/references/hm-config-governance.md`, `assets/templates/config-rules.template.json`, `assets/workflows/hm-config-edit.md`, `assets/commands/hm-config-govern.md`.
- **D-12:** `description:` frontmatter includes trigger phrases: `'governance rule'`, `'config tool'`, `'action.type'`, `'block list'`, `'warn list'`, `'add rule'`, `'remove rule'`, `'set severity'`. Body covers: (1) how the engine consults config, (2) what each `action.type` value means (`allow|warn|block|escalate|needs_jit_grant`), (3) when to use which, (4) a worked example of adding a rule with the inline shape.
- **D-13:** SKILL.md ≤ 250 LOC. All 4 cross-reference paths resolve to existing files (already verified: reference doc, template, command, and the new workflow + new agent created in this iteration).

### the agent's Discretion

- **D-14:** Choice of yarn vs npm script for the wiring step — `add-skills-to-agents.sh` is plain bash, no package manager coupling. The agent picks the simplest invocation path consistent with `add-tools-to-agents.sh`.
- **D-15:** Whether to extract the test sample rules into a shared `tests/features/tool-intelligence/_fixtures/sampleRules.ts` helper (DRY) or inline them per test. The agent chooses; current test file structure has no fixtures dir, so inline is the lower-risk default. If a fixtures dir already exists, the agent may extract.
- **D-16:** Commit message body lists all 5 file changes + the test/typecheck pass counts. The agent picks the final bullet wording.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked specification (read first)

- `.planning/phases/iter-15-tool-intelligence-config-governance-wiring/iter-15-SPEC.md` — Locked requirements (5 REQs), boundaries, acceptance criteria. MUST read before planning or implementing.

### Engine source — contract surface

- `src/features/tool-intelligence/index.ts` — `ToolIntelligenceEngine` constructor accepts `governanceRules[]`; severity always comes from config via `findMatchingRule` + `resolveFromConfig`. Default (no rule match) → `allow`.
- `src/features/tool-intelligence/types.ts` — Public type surface for the engine's return envelope (`kind`, `reason`, `decision`, `guidance`).
- `tests/features/tool-intelligence/tool-intelligence-engine.test.ts` — Test file to be rewritten (current 6/20 failing).

### Configuration source of truth

- `.hivemind/configs.json` — 14 governance rules already exist (R1, R2, R4, etc.). DO NOT mutate from tests.
- `.hivemind/configs.schema.json` — `GovernanceRuleSchema` defines `action.type` enum: `allow|warn|block|escalate|needs_jit_grant`.
- `src/schema-kernel/hivemind-configs.schema.ts` — Zod source of truth for the schema.

### Authoring assets already in place

- `assets/references/hm-config-governance.md` — Authoritative config governance reference (read first when adding/editing/debugging rules).
- `assets/templates/config-rules.template.json` — Drop-in starter for `governance.rules[]`.
- `assets/commands/hm-config-govern.md` — Command with `agent: hm-platform-references` (must be reachable).

### Assets to be created in this iteration

- `assets/workflows/hm-config-edit.md` — 7-turn TUI workflow (R2 deliverable).
- `assets/agents/hm-platform-references.md` — Agent that routes `hm-config-govern` (R3 deliverable).
- `assets/skills/hm-config-governance/SKILL.md` — Progressive-disclosure skill (R5 deliverable).

### Reference pattern (copy from this)

- `add-tools-to-agents.sh` (repo root) — Idempotent frontmatter-wiring script. Model the new `add-skills-to-agents.sh` on this. macOS-compatible, awk-based, reports counts.

### Lineage & governance (project-wide)

- `AGENTS.md` (root) — Hard rules, project structure, atomic commit discipline.
- `.opencode/AGENTS.md` — Source vs deploy reminder, lineage taxonomy (hm-*/hf-*/gate-*/stack-*/gsd-*), atomic commits require `npm run typecheck` + `npm test`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`ToolIntelligenceEngine` constructor** (`src/features/tool-intelligence/index.ts`): Accepts inline `governanceRules[]` — tests can construct with sample rules without mutating global config. This is the public seam the test rewrite asserts against.
- **`validateConfigsFile()`** (referenced in `assets/commands/hm-config-govern.md`): Validation entry point the new workflow calls at T4 to surface schema issues before writing.
- **`resetToolIntelligenceEngine()`**: Singleton-reset hook the workflow calls at T6 after writing a new config so the next event evaluates against fresh rules.
- **`add-tools-to-agents.sh`** (repo root, 89 LOC): Idempotent frontmatter-injection pattern. New `add-skills-to-agents.sh` mirrors its structure: walk `assets/agents/`, detect frontmatter presence, inject or append, report counts.
- **`scripts/sync-assets.js`**: Canonical sync from `assets/` → `.opencode/`. After creating any new skill/agent/command, run sync to keep both roots in lockstep.
- **`assets/commands/hm-config-govern.md`**: Already declares `agent: hm-platform-references` and full tool list. The new agent + workflow must satisfy the command's routing.

### Established Patterns

- **Idempotent wiring scripts**: `add-tools-to-agents.sh` skips agents that already have a `tools:` field. The new `add-skills-to-agents.sh` follows the same skip-if-present logic for `skills:` to keep the script safely re-runnable.
- **Frontmatter injection via awk**: `awk` pattern at line 74-85 of `add-tools-to-agents.sh` walks the file, tracks `---` boundaries, and injects content at the closing fence. The skills script reuses the same pattern with `skills:` as the field.
- **Workflow files as static markdown**: Per `Phase 24.4` cancellation note in STATE.md, templates/references/workflows are static markdown, not runtime engines. `hm-config-edit.md` is a 7-turn script the TUI follows, not executable code.
- **Progressive-disclosure skills**: Each `assets/skills/<name>/SKILL.md` follows the always-loaded (Pattern 1) + on-demand (Pattern 2) split. The new skill follows this convention exactly.
- **Atomic commits + typecheck/test gating**: Every commit must pass `npm run typecheck` and `npm test`. The iteration produces ONE commit; running both commands before commit is mandatory.

### Integration Points

- **Engine ↔ config**: `ToolIntelligenceEngine` reads `governance.rules[]` at construction. Wiring `hm-config-governance` skill to 42 agents makes the authoring surface discoverable wherever an agent needs to add a rule.
- **Command ↔ workflow**: `hm-config-govern` command (in `assets/commands/`) references the `hm-config-edit` workflow via relative path. The new workflow file must exist at the exact path the command expects.
- **Command ↔ agent**: `hm-config-govern` command's frontmatter `agent: hm-platform-references` requires the agent to exist. The new agent must be created and synced.
- **Test suite ↔ engine contract**: 6/20 tests fail under the new config-driven engine. Rewriting them against inline `sampleRules` brings the suite to ≥ 20 passing with zero regressions.
- **`.opencode/` ↔ `assets/`**: New files in `assets/` must be synced to `.opencode/` via `scripts/sync-assets.js` for OpenCode runtime discovery.

</code_context>

<specifics>
## Specific Ideas

- **Inline rule shape in tests**: Follow the same shape used in `assets/templates/config-rules.template.json` so the test fixtures match real-world usage. Sample rules:
  ```ts
  const sampleRules = [
    { id: "R1-malformed-task", condition: { toolNames: ["task"] }, action: { type: "block" }, enabled: true },
    { id: "R2-child-recursive-task", condition: { toolNames: ["task"], depth: { min: 1 } }, action: { type: "needs_jit_grant" }, enabled: true },
    { id: "R4-delegate-task-code-intent", condition: { toolNames: ["delegate-task"] }, action: { type: "block" }, enabled: true },
  ];
  ```
- **Workflow file ≤ 200 LOC**: Keep each turn to a single numbered section. The diff/confirm turn (T5) is the longest because it includes the before/after JSON shape.
- **Skill trigger phrases**: Match the wording used in the existing `assets/references/hm-config-governance.md` and `assets/commands/hm-config-govern.md` descriptions so the skill auto-loads in the same contexts the reference is read.
- **Atomic commit body**: `feat(iteration-15): config-governance wiring + test rewrite` with body listing the 5 file changes and final `npm test` / `npm run typecheck` pass counts.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Out-of-scope items are already listed in SPEC.md Boundaries (engine changes, config mutations, l0/l1/l2/l3 restructuring, new `action.type` values, new governance rules).

</deferred>

---

*Phase: iter-15-Tool-Intelligence-Test-Rewrite + Config-Governance-Wiring*
*Context gathered: 2026-06-08*
*Mode: --auto (autonomous decision capture, single pass, no user prompts)*
