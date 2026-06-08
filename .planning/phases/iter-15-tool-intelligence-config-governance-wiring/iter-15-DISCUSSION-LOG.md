# iter-15: Tool-Intelligence Test Rewrite + Config-Governance Wiring - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-08
**Phase:** iter-15-tool-intelligence-config-governance-wiring
**Mode:** `--auto --text` (autonomous, single-pass, no user prompts)
**Areas discussed:** 5 (Test rewrite, Workflow doc layout, Agent routing, Wiring script, Skill progressive-disclosure)

---

## Test rewrite strategy (R1)

| Option | Description | Selected |
|--------|-------------|----------|
| Inline `sampleRules` in each test | Tests construct `new ToolIntelligenceEngine([...sampleRules])` per test; full shape visible in test file. | ✓ |
| Extract `tests/features/tool-intelligence/_fixtures/sampleRules.ts` | Shared helper module; DRY; slightly more setup. | |
| Mutate `.hivemind/configs.json` from tests | Risky: pollutes real config; brittle in CI. | |

**Auto-selected:** Inline `sampleRules` in each test (lowest risk, matches existing test file structure which has no fixtures dir). Sample rules include R1 → `block`, R2 → `needs_jit_grant`, R4 → `block` plus a default (unmatched) case.

**Notes:** Spec REQ-1 acceptance: `npm test -- tests/features/tool-intelligence/tool-intelligence-engine.test.ts` reports ≥ 20 tests passing, 0 failing. Each test asserts ONE behavior.

---

## Workflow doc layout (R2)

| Option | Description | Selected |
|--------|-------------|----------|
| 7-turn TUI flow (T1–T7) | Read → pick action → collect → validate → diff+confirm → write+reset → suggest commit. | ✓ |
| Single-screen form | One-shot form; harder to recover from validation errors. | |
| Wizard library integration | Overkill for a static markdown workflow doc. | |

**Auto-selected:** 7-turn TUI flow. Each turn is a numbered section with action + tool calls in fenced code blocks. File ≤ 200 LOC.

**Notes:** Workflow references `validateConfigsFile()` (T4) and `resetToolIntelligenceEngine()` (T6) — both are existing engine hooks, not new code.

---

## Agent routing for `hm-config-govern` command (R3)

| Option | Description | Selected |
|--------|-------------|----------|
| Create `assets/agents/hm-platform-references.md` | New agent with the tool set the command needs. | ✓ |
| Re-route command to an existing agent | The command declares `agent: hm-platform-references`; no existing agent matches. | |
| Inline agent in command | Not allowed — command is static markdown, not a runtime definition. | |

**Auto-selected:** Create `assets/agents/hm-platform-references.md`. Frontmatter includes `tools:` (`hivemind-steer`, `hivemind-doc`, `hivemind-command-engine`, `configure-primitive`, `delegate-task`, `delegation-status`) and references the `hm-config-govern` command. After creation, run `scripts/sync-assets.js` to mirror into `.opencode/agents/`.

**Notes:** Sync is mandatory per `.opencode/AGENTS.md` "Source vs Deploy Reminder". The agent file does not currently exist in either root.

---

## Wiring script approach (R4)

| Option | Description | Selected |
|--------|-------------|----------|
| New `add-skills-to-agents.sh` (model on `add-tools-to-agents.sh`) | Idempotent, awk-based, macOS-compatible. | ✓ |
| One-off inline bash in commit | Not idempotent; no audit trail. | |
| TypeScript wiring script | Heavier; over-engineered for a one-time frontmatter injection. | |

**Auto-selected:** New `add-skills-to-agents.sh` modeled on existing `add-tools-to-agents.sh` (89 LOC, proven). Walks `assets/agents/hm-*.md`, `assets/agents/hf-*.md`, and `assets/agents/hm-l0-orchestrator.md`. Detects existing `skills:` block; appends `hm-config-governance` if missing; injects new block if absent. Reports counts.

**Notes:** Acceptance: `grep -l "hm-config-governance" assets/agents/hm-*.md assets/agents/hf-*.md | wc -l` ≥ 42. Script is idempotent (running twice does not duplicate the entry).

---

## Skill progressive-disclosure (R5)

| Option | Description | Selected |
|--------|-------------|----------|
| Always-loaded (Pattern 1) + on-demand (Pattern 2) split | Standard skill layout; one paragraph always loads, references load on demand. | ✓ |
| Single deep SKILL.md | Simpler but bloats the always-loaded context. | |
| Skip skill; rely on reference doc only | Skill is the required deliverable per SPEC.md R5. | |

**Auto-selected:** Progressive-disclosure with Pattern 1 (always-loaded one-paragraph overview of config-driven governance) + Pattern 2 (cross-references to `hm-config-governance.md` reference, `config-rules.template.json`, `hm-config-edit.md` workflow, `hm-config-govern.md` command). `description:` includes trigger phrases: `'governance rule'`, `'config tool'`, `'action.type'`, `'block list'`, `'warn list'`, `'add rule'`, `'remove rule'`, `'set severity'`. SKILL.md ≤ 250 LOC.

**Notes:** All 4 cross-reference paths resolve to existing or to-be-created files in this iteration.

---

## the agent's Discretion

- **D-14:** Whether to extract test sample rules into a shared fixtures helper. Agent picks inline (matches existing test file structure).
- **D-15:** Commit message body wording. Agent finalizes after seeing final test/typecheck counts.
- **D-16:** Final touch on workflow doc TUI prompts. Agent picks concise wording consistent with existing TUI patterns.

## Deferred Ideas

None — discussion stayed within phase scope. Out-of-scope items are already listed in SPEC.md Boundaries:

- Engine refactor (`src/features/tool-intelligence/index.ts`) — already landed, not this iteration.
- Config mutations (`.hivemind/configs.json`, `.hivemind/configs.schema.json`) — already correct, not this iteration.
- l0/l1/l2/l3 primitive restructuring — ITER 16 territory.
- New `action.type` enum values or new governance rules — out of scope.
- Renaming or removing any skill/agent/command files — ITER 16 territory.

---

*Mode: --auto (no interactive prompts; all decisions auto-selected per the recommended option in each gray area)*
*Single-pass cap enforced per `workflows/discuss-phase/modes/hm-auto.md`*
