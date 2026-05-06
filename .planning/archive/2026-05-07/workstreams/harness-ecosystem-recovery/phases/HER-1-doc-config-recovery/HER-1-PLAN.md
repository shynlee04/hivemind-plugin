# Phase HER-1 Plan: Documentation & Configuration Recovery

**Phase:** HER-1 | **Workstream:** harness-ecosystem-recovery
**Created:** 2026-05-05
**Context:** HER-1-CONTEXT.md (all decisions pre-determined by HER-0 audit evidence)
**Type:** Documentation-only — zero code changes

---

## Overview

Bring all documentation and agent configuration into alignment with verified runtime reality. 9 action items organized into 4 execution waves by dependency and effort.

## Exit Criteria

1. `validate-restart` returns **0 errors** (currently 14+15)
2. AGENTS.md footnote matches reality (89 agents, 58 skills)
3. ARCHITECTURE.md counts match reality (16 tools, 89 agents, 58 skills, 18 commands)
4. `hm-l1-coordinator` has `delegate-task` permission
5. All command files reference actual agent names

---

## Wave 1: Critical Surgical Edits (Items 1-4)

**Parallelizable:** Yes — all independent single-file edits.
**Effort:** ~10 minutes total

### Plan 1.1: Unblock L1 Coordinator Delegation (HER-1-A)

**Requirement:** HER-1-A
**File:** `.opencode/agents/hm-l1-coordinator.md`
**Evidence:** UAT-F-01, Lane A — delegate-task exists at plugin.ts:109, works (Phase 2), but not in L1 coordinator permissions.

**Tasks:**
1. Read `.opencode/agents/hm-l1-coordinator.md` — locate tools/permissions section
2. Add `delegate-task` to the tool permissions list
3. Verify the tool name matches exactly: `delegate-task` (as registered in plugin.ts:109)

**Verification:** Re-read the file and confirm `delegate-task` appears in permissions.

### Plan 1.2: Fix AGENTS.md Counts (HER-1-B)

**Requirement:** HER-1-B
**File:** `AGENTS.md` (project root)
**Evidence:** Lane B C-2 (89 agents actual, claims 97), Lane B C-4 (58 skills actual, claims 51).

**Tasks:**
1. Read `AGENTS.md` — locate agent count, skill count, sync date
2. Update agent count: `97` → `89` (and fix the breakdown: 33 gsd + 45 hm + 11 hf = 89)
3. Update skill count: `51` → `58`
4. Update sync date footnote to `2026-05-05`
5. Update any breakdown text that sums to 97 to sum to 89

**Verification:** `grep -c "97\|51" AGENTS.md` should return 0 (no stale counts remain).

### Plan 1.3: Fix ARCHITECTURE.md Counts (HER-1-C)

**Requirement:** HER-1-C
**File:** `.planning/codebase/ARCHITECTURE.md`
**Evidence:** Lane B C-1 (16 tools actual, claims 9), Lane B C-2 (89 agents, claims 57), (58 skills, claims 50), (18 commands, claims 20).

**Tasks:**
1. Read `.planning/codebase/ARCHITECTURE.md`
2. Update line ~20: tool count text `9` → `16`
3. Update tool table (lines ~86-101): add 7 missing hivemind-* tools (hivemind-doc, hivemind-trajectory, hivemind-pressure, hivemind-sdk-supervisor, hivemind-command-engine, hivemind-agent-work-create, hivemind-agent-work-export)
4. Update agent count: `57` → `89`
5. Update skill count: `50` → `58`
6. Update command count: `20` → `18`

**Verification:** Counts in ARCHITECTURE.md match `plugin.ts` tool block (16), `ls .opencode/agents/*.md | wc -l` (89), `ls .opencode/skills/*/SKILL.md | wc -l` (58), `ls .opencode/commands/*.md | wc -l` (18).

### Plan 1.4: Fix notification-handler Status (HER-1-D)

**Requirement:** HER-1-D
**File:** `src/lib/AGENTS.md`
**Evidence:** Lane B C-3 — line 13 says "DEPRECATED: Dead code" but notification-handler.ts:4-8 says "Re-activated in Phase 16.2", actively imported by delegation-state-machine.ts:22 and lifecycle-manager.ts:9.

**Tasks:**
1. Read `src/lib/AGENTS.md` — locate notification-handler entry (line ~13)
2. Replace "DEPRECATED: Dead code. WaiterModel polling replaces push notifications." with "ACTIVE: Re-activated in Phase 16.2 for terminal-state delegation notifications. Imported by delegation-state-machine.ts and lifecycle-manager.ts."

**Verification:** `grep -i deprecated src/lib/AGENTS.md` should not match notification-handler.

---

## Wave 2: Batch Command Repair (Item 5-6)

**Parallelizable:** Yes — all independent file edits.
**Effort:** ~20 minutes (14 command files + 1 skill file)
**Depends on:** Wave 1 should complete first (agent names must be verified before updating commands)

### Plan 2.1: Fix 14 Broken Command Agent References (HER-1-E)

**Requirement:** HER-1-E
**Evidence:** UAT-F-02, Lane A — 14/18 commands reference non-existent agents. validate-restart reports them as broken.

**Tasks:**
1. Run `ls .opencode/agents/*.md` to get definitive list of 89 actual agent names
2. Run `ls .opencode/commands/*.md` to get all 18 command files
3. For each command file, read the `agent:` frontmatter field
4. Cross-reference against actual agent names
5. For each broken reference: identify the most likely correct agent name from the 89 actual agents (by prefix match and purpose alignment)
6. Update the `agent:` frontmatter in each of the 14 broken command files

**Verification:** Run `validate-restart` (or manually cross-reference all 18 command `agent:` values against `ls .opencode/agents/*.md`). Target: 0 broken references.

### Plan 2.2: Fix Skill Frontmatter (HER-1-F)

**Requirement:** HER-1-F
**File:** `.opencode/skills/hm-l2-planning-persistence/SKILL.md`
**Evidence:** UAT-F-06, Lane A — frontmatter has undefined name and description.

**Tasks:**
1. Read `.opencode/skills/hm-l2-planning-persistence/SKILL.md`
2. If `name:` is missing or undefined, set to `hm-l2-planning-persistence`
3. If `description:` is missing or undefined, set to a clear description based on the skill's content

**Verification:** Read frontmatter and confirm both `name:` and `description:` are defined and non-empty.

---

## Wave 3: New File Creation (Items 7-8)

**Parallelizable:** Yes — all independent file creations.
**Effort:** ~15 minutes (3 new files)
**Depends on:** None (can run in parallel with Wave 2)

### Plan 3.1: Create CHANGELOG.md (HER-1-G)

**Requirement:** HER-1-G
**File:** `CHANGELOG.md` (project root, new)
**Evidence:** UAT-F-04, Lane A — no changelog exists for the npm package.

**Tasks:**
1. Create `CHANGELOG.md` with Keep a Changelog format
2. Include current version from `package.json`
3. Document significant milestones from phase history (Phase 14: WaiterModel, Phase 16: Agents Builder, Phase 26: Quality Synthesis, HER-0: Ecosystem Audit)
4. Add "Unreleased" section for ongoing work

**Verification:** File exists and follows Keep a Changelog format.

### Plan 3.2: Create .hivemind/ READMEs (HER-1-G)

**Requirement:** HER-1-G
**Files:** `.hivemind/journal/README.md`, `.hivemind/lineage/README.md` (new)
**Evidence:** UAT-F-05, Lane A.

**Tasks:**
1. Check if `.hivemind/journal/` and `.hivemind/lineage/` directories exist; create if needed
2. Create `.hivemind/journal/README.md` explaining journal purpose (append-only event timeline, session lifecycle events)
3. Create `.hivemind/lineage/README.md` explaining lineage purpose (execution lineage tracking, delegation chains)

**Verification:** Both files exist and contain purpose documentation.

---

## Wave 4: Verification Gate (Item 9)

**Effort:** ~5 minutes
**Depends on:** Waves 1, 2, 3 ALL complete

### Plan 4.1: Exit Gate — validate-restart (HER-1-H)

**Requirement:** HER-1-H

**Tasks:**
1. Run `validate-restart` tool
2. Verify 0 errors reported (was 14+ command errors + other issues)
3. Verify AGENTS.md counts match: `grep "89 agents" AGENTS.md`, `grep "58 skills" AGENTS.md`
4. Verify ARCHITECTURE.md counts match: `grep "16 tools" .planning/codebase/ARCHITECTURE.md`
5. Verify hm-l1-coordinator has delegate-task: `grep "delegate-task" .opencode/agents/hm-l1-coordinator.md`
6. Verify notification-handler not deprecated: `grep -i "DEPRECATED" src/lib/AGENTS.md | grep -v notification` (should NOT match notification-handler)

**Exit criteria:**
- ✅ validate-restart = 0 errors
- ✅ All 8 requirements (HER-1-A through HER-1-H) satisfied
- ✅ ROADMAP.md updated: HER-1 status → COMPLETE, all requirement statuses → ✅ Covered

---

## Execution Summary

| Wave | Plans | Files Touched | Effort | Dependencies |
|------|-------|--------------|--------|-------------|
| 1 | 1.1, 1.2, 1.3, 1.4 | 4 files | ~10 min | None |
| 2 | 2.1, 2.2 | 15 files | ~20 min | Wave 1 (agent names verified) |
| 3 | 3.1, 3.2 | 3 new files | ~15 min | None (parallel with Wave 2) |
| 4 | 4.1 | 0 (verification) | ~5 min | Waves 1+2+3 |
| **Total** | **8 plans** | **~22 files** | **~50 min** | — |

---

*Plan produced from HER-1-CONTEXT.md. All tasks are evidence-tagged from HER-0 audit lanes. Ready for gsd-execute-phase.*
