# Phase HER-1 Context: Documentation & Configuration Recovery

**Phase:** HER-1 | **Workstream:** harness-ecosystem-recovery
**Date:** 2026-05-05
**Context Source:** HER-0 Ecosystem Re-map & Reality Audit (all decisions pre-determined by audit evidence)

---

<domain>
Bring all documentation (AGENTS.md, ARCHITECTURE.md, src/lib/AGENTS.md) and agent configuration (hm-l1-coordinator permissions, command frontmatter, skill frontmatter) into alignment with verified runtime reality. Create missing files (CHANGELOG.md, .hivemind/ READMEs). Zero code changes — all edits are documentation, configuration, and new markdown files.
</domain>

<decisions>

### D1: hm-l1-coordinator delegation unblock (HER-1-A)
**Decision:** Add `delegate-task` to hm-l1-coordinator.md tool permissions.
**Evidence:** UAT-F-01, Lane A — L1 coordinator confirmed "delegate-task is not exposed as a callable tool in my current environment." Tool exists at plugin.ts:109 and works (Phase 2 verified).
**File:** `.opencode/agents/hm-l1-coordinator.md`
**Change:** Add `delegate-task` to the agent's tool permissions list.

### D2: AGENTS.md count correction (HER-1-B)
**Decision:** Update agent count to 89 (was 97), skill count to 58 (was 51), sync date to 2026-05-05.
**Evidence:** Lane B C-2 (agents: ls .opencode/agents/*.md → 89), Lane B C-4 (skills: ls .opencode/skills/*/SKILL.md → 58).
**File:** `AGENTS.md`
**Change:** Fix 3 count lines + sync date footnote.

### D3: ARCHITECTURE.md count correction (HER-1-C)
**Decision:** Update tools to 16 (was 9), agents to 89 (was 57), skills to 58 (was 50), commands to 18 (was 20).
**Evidence:** Lane B C-1 (tools: src/plugin.ts:108-125 → 16 registered), Lane B C-2 (agents: 89 actual), Lane B C-4 (skills: 58 actual), Lane B claim 6 (commands: ls .opencode/commands/*.md → 18).
**File:** `.planning/codebase/ARCHITECTURE.md`
**Change:** Update 4 sections (tool count text, tool table, agent count, skill count, command count).

### D4: notification-handler status correction (HER-1-D)
**Decision:** Update src/lib/AGENTS.md to reflect notification-handler as "Re-activated in Phase 16.2" (currently says "DEPRECATED: Dead code").
**Evidence:** Lane B C-3 — notification-handler.ts:4-8 says "Re-activated in Phase 16.2"; actively imported by delegation-state-machine.ts:22 and lifecycle-manager.ts:9.
**File:** `src/lib/AGENTS.md`
**Change:** Line 13 — remove DEPRECATED tag, add re-activated status.

### D5: Command agent reference repair (HER-1-E)
**Decision:** Update all 14 broken commands to reference actual agent names on disk (89 agents, not the stale names).
**Evidence:** UAT-F-02, Lane A — validate-restart reports 14/18 commands broken because frontmatter references non-existent agents. 78% failure rate.
**Files:** 14 command files in `.opencode/commands/`
**Change:** Update `agent:` frontmatter in each to reference actual agent names.

### D6: Skill frontmatter repair (HER-1-F)
**Decision:** Fix hm-l2-planning-persistence/SKILL.md frontmatter (undefined name/description).
**Evidence:** UAT-F-06, Lane A.
**File:** `.opencode/skills/hm-l2-planning-persistence/SKILL.md`
**Change:** Add proper `name:` and `description:` to YAML frontmatter.

### D7: CHANGELOG.md creation (HER-1-G)
**Decision:** Create CHANGELOG.md at project root for npm package hygiene.
**Evidence:** UAT-F-04, Lane A.
**File:** `CHANGELOG.md` (new)
**Change:** Create with version history from Phase progression.

### D8: .hivemind/ README creation (HER-1-G)
**Decision:** Create journal/README.md and lineage/README.md in .hivemind/ for developer onboarding.
**Evidence:** UAT-F-05, Lane A.
**Files:** `.hivemind/journal/README.md`, `.hivemind/lineage/README.md` (new)
**Change:** Create with purpose documentation for each directory.

</decisions>

<canonical_refs>
- `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-SUMMARY-2026-05-05.md` — Phase completion summary with all evidence
- `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/ecosystem-map-2026-05-05.md` — SOT navigation index (MUST read before planning)
- `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-a-uat-reclassification-2026-05-05.md` — UAT findings detail
- `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-b-governance-drift-audit-2026-05-05.md` — Governance drift with file:line evidence
- `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-c-ownership-matrix-2026-05-05.md` — Module ownership (for notification-handler context)
- `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-d-runtime-sdk-spotcheck-2026-05-05.md` — SDK verification (confirms tool count = 16)
- `.planning/workstreams/harness-ecosystem-recovery/ROADMAP.md` — HER-1 requirements definition
- `.planning/PROJECT.md` — Project context and constraints
- `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md` — Q6 decision (state root separation)
</canonical_refs>

<code_context>
### Files to edit (from HER-0 evidence):
- `src/plugin.ts:108-125` — Tool registration block (16 tools, reference for ARCHITECTURE.md update)
- `src/lib/AGENTS.md:13` — notification-handler DEPRECATED tag to update
- `src/lib/notification-handler.ts:4-8` — Re-activated in Phase 16.2 (reference)
- `src/lib/delegation-state-machine.ts:22` — Active import of notifyDelegationTerminal (confirms not dead)
- `src/lib/lifecycle-manager.ts:9` — Active import of replayPendingNotifications (confirms not dead)
- `.opencode/agents/hm-l1-coordinator.md` — Needs delegate-task permission
- `.opencode/commands/*.md` — 14 files with broken agent references
- `.opencode/skills/hm-l2-planning-persistence/SKILL.md` — Broken frontmatter

### Files to create:
- `CHANGELOG.md` (project root)
- `.hivemind/journal/README.md`
- `.hivemind/lineage/README.md`

### Verification:
- `validate-restart` tool — current: 14+ errors, target: 0
</code_context>

<deferred>
- Agent overlap remediation (8 pairs >50% keyword overlap) — HER-5
- Dead code cleanup (2,959 LOC) — HER-2
- Context & compaction management — HER-3
- SDK integration depth — HER-4
</deferred>

---

*Context produced from HER-0 audit evidence. No gray areas — all actions are evidence-tagged with file:line citations. Ready for gsd-plan-phase.*
