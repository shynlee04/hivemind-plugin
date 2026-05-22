# Wave 4 Synthesis: WORKFLOW Skills (4 skills)

**Date:** 2026-05-23
**Source files:** 4 SKILL.md files (1 MISSING) + 23-SYSTEM-AUDIT + 23-CONTEXT + 23-W2-SYNTHESIS + 23-W3-SYNTHESIS
**Wave scope:** Wave 3C (subagent-delegation-patterns, user-intent-interactive-loop, cross-cutting-change, debug)
**Status:** READY — scoping complete, gaps/debts documented

---

## Summary

| Metric | Value |
|--------|-------|
| Skills analyzed | 4 |
| Skills that EXIST on disk | 3 (`user-intent-interactive-loop`, `cross-cutting-change`, `debug`) |
| Skills that are MISSING (need NEW creation) | 1 (`hm-l2-subagent-delegation-patterns`) |
| Total current LOC (3 existing skills) | 970 |
| Total target LOC post-edit (3 existing + 1 NEW) | ~1,400 (existing: ~800, new: ~600) |
| Operational tools — include | 18 (✅ fully operational) |
| Partial tools — EXCLUDE from Wave 4 | 4 (🚫 TBD: run-background-command, hivemind-trajectory, hivemind-pressure, hivemind-agent-work) |
| Broken reference paths in SKILL.md | 8 paths (all in user-intent-interactive-loop — `hm-` vs `hm-l2-` prefix mismatch) |
| Scripts directory exists | 2 skills have scripts/ (user-intent-interactive-loop: 6 scripts, debug: scripts/ dir present) |
| References directories with content | 3/3 existing skills have populated references/ |
| Evals/metrics directories | 3/3 existing skills have evals/ + metrics/ |
| NEW skill needed from scratch | `hm-l2-subagent-delegation-patterns` (directory MISSING entirely) |

---

## Tool Scope

### Operational — Include in Skills (✅ 18 tools)

| Tool | Phase Origin | Include In |
|------|-------------|-----------|
| `delegate-task` | CP-DT-01 ✅ | subagent-delegation (PRIMARY), user-intent-interactive-loop, cross-cutting-change, debug |
| `delegation-status` | CP-DT-01 ✅ | subagent-delegation (PRIMARY), user-intent-interactive-loop, debug |
| `execute-slash-command` | P21.1 ✅ | subagent-delegation, user-intent-interactive-loop |
| `hivemind-command-engine` | CP-CMD-01 ✅ | subagent-delegation (command discovery), user-intent-interactive-loop |
| `session-tracker` | CP-ST-01 ✅ | subagent-delegation (delegation tracking), user-intent-interactive-loop |
| `session-hierarchy` | CP-ST-01 ✅ | subagent-delegation (parent-child navigation) |
| `session-context` | CP-ST-01 ✅ | subagent-delegation (cross-session), user-intent-interactive-loop |
| `hivemind-session-view` | P16 ✅ | subagent-delegation (unified view) |
| `prompt-skim` | Pre-restructuring ✅ | user-intent-interactive-loop (prompt analysis) |
| `prompt-analyze` | Pre-restructuring ✅ | user-intent-interactive-loop (intent analysis) |
| `session-patch` | Pre-restructuring ✅ | user-intent-interactive-loop (intent state), debug (debug state) |
| `session-journal-export` | Pre-restructuring ✅ | subagent-delegation (delegation lineage), debug (debug state export) |
| `hivemind-doc` | Pre-restructuring ✅ | cross-cutting-change (read plan/context), debug (read code/docs) |
| `hivemind-sdk-supervisor` | P14 ✅ | subagent-delegation (SDK health before dispatch) |
| `configure-primitive` | BOOT ✅ | subagent-delegation (agent/command discovery) |
| `validate-restart` | BOOT ✅ | subagent-delegation (post-dispatch validation) |
| `bootstrap-init` | BOOT ✅ | user-intent-interactive-loop (session init context) |
| `bootstrap-recover` | BOOT ✅ | user-intent-interactive-loop (session recovery) |

### Partial — EXCLUDE from Wave 4 Scope (🚫 4 tools)

| Tool | Status | Blocking Phase | Exclusion Reason |
|------|--------|---------------|------------------|
| `run-background-command` | 🟡 PARTIAL | CP-PTY-01 chưa start | PTY control-plane MVP not implemented. NOT for WORKFLOW skills. |
| `hivemind-trajectory` | 🟡 PARTIAL | P24 chưa tới | State machine untested. Redesign pending. NOT for WORKFLOW skills. |
| `hivemind-pressure` | 🟡 PARTIAL | P26 chưa tới | Redesign pending. NOT for WORKFLOW skills. |
| `hivemind-agent-work` | 🟡 PARTIAL | P24-25 chưa tới | Lifecycle untested. Redesign pending. NOT for WORKFLOW skills. |

---

## Skill 1: hm-l2-subagent-delegation-patterns — ⚠️ NEW SKILL (DIRECTORY MISSING)

### Discovery

| Field | Value |
|-------|-------|
| **Location** | `.opencode/skills/hm-l2-subagent-delegation-patterns/` |
| **Status** | ❌ **DIRECTORY DOES NOT EXIST** — verified via glob (zero files returned) |
| **Current SKILL.md** | NONE — needs full creation, not rewrite |
| **Cross-referenced by** | `hm-l2-coordinating-loop` (W2 synthesis: "cross-references subagent-delegation-patterns"), `hm-l2-phase-execution` (W2 synthesis: "hm-subagent-delegation-patterns" in cross-refs), `hm-l3-tool-capability-matrix` (W3: cross-references this skill) |
| **Layer** | L2 (execution/delegation domain) |
| **Role** | delegation-specialist |

### Why This Skill Is Needed

1. **Coordinating-loop** references subagent-delegation patterns for dispatch protocols (W2 finding)
2. **Phase-execution** references it for wave-based delegation (W2 finding)
3. **Tool-capability-matrix** references it for permission-aware delegation (W3 finding)
4. **No existing skill** documents the delegation patterns, session stacking, or checkpoint protocols
5. **Phase 23 CONTEXT D4** lists it in Wave 3C as a planned creation

### Target Scope

| Dimension | Target |
|-----------|--------|
| **Lines** | ~500-600 (new creation — must be THIN but DEEP with references) |
| **Layer** | L2 |
| **Role** | delegation-specialist |
| **Pattern** | P2 |
| **allowed-tools** | `Read, Write, Edit, Bash, Glob, Grep, delegate-task, delegation-status, execute-slash-command, session-tracker, session-hierarchy, hivemind-session-view, hivemind-command-engine, session-journal-export, hivemind-sdk-supervisor, configure-primitive` |

### Content Requirements

| Section | Description |
|---------|-------------|
| **Iron Law** | "Delegate scope, not trust. Stack context, not sessions." |
| **Overview** | Documents subagent delegation patterns for OpenCode: WaiterModel dispatch, session stacking via `parentSessionId`, checkpoint protocols, dual-signal completion, and permission-aware agent dispatch |
| **Entry Gate** | Delegation must include: agent, prompt, success criteria, budget (turn/token limit). If any missing → STOP. |
| **Core Patterns** | (1) **WaiterModel dispatch** — delegate-task returns immediately, delegation-status polls for completion. (2) **Session stacking** — attach as child via `parentSessionId`. (3) **Checkpoint protocol** — structured handoff for long-running subagents. (4) **Dual-signal completion** — task output + explicit completion signal. (5) **Permission-aware dispatch** — match agent to tool permissions via tool-capability-matrix. |
| **Workflows** | Sequential delegation → Parallel delegation (via dispatching-parallel-agents) → Conditional branching → Retry/failover |
| **Anti-Patterns** | (1) Orphan dispatch — delegating without `parentSessionId`. (2) Context dumping — injecting full session context instead of bounded intent. (3) No success criteria — subagent completes but output is unusable. (4) Budget starvation — no turn/token limit. (5) Permission mismatch — agent lacks required tools for its task. |
| **Cross-References** | `hm-l2-coordinating-loop` (coordination patterns), `hm-l2-phase-execution` (wave dispatch), `hm-l3-tool-capability-matrix` (permission enforcement), `hm-l2-user-intent-interactive-loop` (intent capture before delegation), `hm-l3-hivemind-engine-contracts` (session API contracts), `hm-l3-subagent-delegation-patterns` (⚠️ circular — ensure this is named correctly) |
| **References** | 4 files in `references/`: `waiter-model-detailed.md`, `session-stacking-protocol.md`, `checkpoint-handoff.md`, `permission-agent-matching.md` |
| **Self-Correction** | Standard 4-mode pattern (task failing, unsure, user contradicts, edge case) |
| **Anti-Patterns Table** | Standard table with 5-7 anti-patterns |

### D4 Constraint

Per CONTEXT.md D4: **THIN but DEEP**. The new skill MUST:
- Use references directory for deep content (keep SKILL.md ~500-600 lines)
- Use jump links to reference files (but verify at runtime that they render — user reports jump links may NOT work when skills are loaded)
- Cross-reference existing skills rather than duplicating content

### Gaps & Debts

| Gap | Severity | Description |
|-----|----------|-------------|
| No existing codebase to audit | N/A | This is a NEW creation, not a rewrite. No stale paths, no script dependencies, no legacy state paths. |
| Jump link runtime behavior unverified | 🔴 HIGH | D4 constraint applies to NEW skill too. Reference files in `references/` must be verifiable at runtime. User reports jump links may not render when loaded. |
| Cross-skill consistency | 🟡 MEDIUM | Must match the naming convention (`hm-l2-subagent-delegation-patterns`), allowed-tools pattern, and HMQUAL template used by other Wave skills |

---

## Skill 2: hm-l2-user-intent-interactive-loop — Interactive Probing Skill

### Current State

| Field | Value |
|-------|-------|
| **Lines** | 446 |
| **Layer** | L1 |
| **Role** | front-agent |
| **Pattern** | P3 |
| **allowed-tools** | `Read, Write, Edit, Bash, Glob, Grep, Task, Question` |
| **Consumed-by** | orchestrator, coordinator (front-facing agents) |
| **References** | `references/` ✅ 6 files (question-protocols, context-preservation, brainstorming, long-session, worked-examples, durable-human-interrupts) |
| **Scripts** | `scripts/` ✅ 6 scripts (first-action, intent-verify, register-skill, session-checkpoint, validate-skill, verify-hierarchy) |
| **Evals** | ✅ `evals/` directory exists |
| **Metrics** | ✅ `metrics/` directory exists |

### Critical Issues

| # | Issue | Lines | Severity |
|---|-------|-------|----------|
| 1 | **ALL 8 `<files_to_read>` paths use WRONG directory name** | 101-108 | 🔴 HIGH — SKILL.md references `.opencode/skills/hm-user-intent-interactive-loop/` (without `-l2-` infix) but actual directory is `.opencode/skills/hm-l2-user-intent-interactive-loop/`. All 6 reference files + 2 script files will fail to load. |
| 2 | **No operational tools in allowed-tools** | 10-19 | 🟡 MEDIUM — allowed-tools only has generic tools (Read, Write, Edit, Bash, Glob, Grep, Task, Question). No harness tools (`prompt-skim`, `prompt-analyze`, `session-patch`, `delegate-task`, `hivemind-command-engine`, `session-journal-export`). |
| 3 | **Script-based gate enforcement** | 27-96 | 🟡 MEDIUM — 5 gates implemented as bash scripts (`intent-verify.sh`, `verify-hierarchy.sh`, `register-skill.sh`). Scripts DO exist (verified on disk) but script-based enforcement is fragile compared to tool-based verification. |
| 4 | **Question tool caps via file counting** | 31-36 | 🟡 LOW — Question count tracked in `.opencode/state/question-count.json`. Per Q6, state should live under `.hivemind/`. This is legacy path. |
| 5 | **Intent state stored under `.opencode/state/`** | 140, 340-349 | 🟡 LOW — Multiple references to `.opencode/state/intent.json`, `.opencode/state/question-count.json`. Per Q6, these should be `.hivemind/state/`. |
| 6 | **Anti-pattern #9 mismatch** | 377 | 🟡 LOW — "The Skill Ignorer" anti-pattern references "loading a skill for its file list but bypassing its workflow." This is a meta-observation that should be in integration-contracts, not here. |
| 7 | **No `session-patch` tool for intent state** | — | 🟡 LOW — Skill writes to `intent.json` via Bash (lines 139-142) but has no structured tool for patching intent state. `session-patch` would be appropriate. |

### Reference Files Status

| File | Path | On Disk? | Path Correct in SKILL.md? |
|------|------|----------|--------------------------|
| 01-question-protocols.md | `references/01-question-protocols.md` | ✅ 13,458 bytes | ❌ path uses `hm-` prefix (line 101) |
| 02-context-preservation.md | `references/02-context-preservation.md` | ✅ 11,660 bytes | ❌ path uses `hm-` prefix (line 102) |
| 03-brainstorming-patterns.md | `references/03-brainstorming-patterns.md` | ✅ 13,303 bytes | ❌ path uses `hm-` prefix (line 103) |
| 04-long-session-management.md | `references/04-long-session-management.md` | ✅ 15,175 bytes | ❌ path uses `hm-` prefix (line 104) |
| 05-worked-examples.md | `references/05-worked-examples.md` | ✅ 3,049 bytes | ❌ path uses `hm-` prefix (line 105) |
| 06-durable-human-interrupts.md | `references/06-durable-human-interrupts.md` | ✅ 1,122 bytes | ❌ path uses `hm-` prefix (line 106) |
| intent-verify.sh | `scripts/intent-verify.sh` | ✅ 11,801 bytes | ❌ path uses `hm-` prefix (line 107) |
| verify-hierarchy.sh | `scripts/verify-hierarchy.sh` | ✅ 7,609 bytes | ❌ path uses `hm-` prefix (line 108) |

**Impact:** ALL 8 `<files_to_read>` paths are broken. They reference a non-existent directory (`hm-user-intent-interactive-loop`) instead of the actual directory (`hm-l2-user-intent-interactive-loop`). When this skill is loaded, none of the reference files or scripts will resolve.

### Scripts vs. Tools Decision

| Script | LOC | Tool Alternative |
|--------|-----|-----------------|
| `intent-verify.sh` | 11,801 bytes | Replace with `prompt-analyze` + inline intent state check |
| `verify-hierarchy.sh` | 7,609 bytes | Replace with `hivemind-sdk-supervisor` readiness check |
| `register-skill.sh` | 3,902 bytes | Replace with `configure-primitive` read/list |
| `session-checkpoint.sh` | 5,867 bytes | Replace with `session-journal-export` + `session-patch` |
| `validate-skill.sh` | 754 bytes | Replace with inline validation (small script — fine to keep or inline) |
| `first-action.sh` | 6,302 bytes | Replace with inline tool sequence in "On Load" section |

**Recommendation:** Keep scripts for Phase 23 (proven E2E with 5 gates). Add operational tools to allowed-tools. Script rewrite can be deferred to a future cleanup phase.

### Target Scope (Reduce & Fix)

| Dimension | Current | Target |
|-----------|---------|--------|
| Lines | 446 | <400 |
| Broken `<files_to_read>` paths | 8 | 0 (fix all to `hm-l2-` prefix) |
| allowed-tools additions | 0 | +5 (prompt-skim, prompt-analyze, session-patch, delegate-task, session-journal-export) |
| Legacy `.opencode/state/` paths | 2 locations | Flag for migration — defer actual migration |
| Script references | 6 | Keep (scripts exist on disk and work) — mark as "may be migrated to tools in future" |

### Edits Required

1. **Fix 8 broken `<files_to_read>` paths**: `hm-user-intent-interactive-loop` → `hm-l2-user-intent-interactive-loop` (lines 101-108)
2. **Expand allowed-tools**: Add `prompt-skim`, `prompt-analyze`, `session-patch`, `delegate-task`, `session-journal-export`, `hivemind-command-engine`
3. **Fix script path references** throughout SKILL.md (lines 26, 52, 56, 122, etc. — all reference `scripts/` which IS correct because scripts exist at that relative path; only the `<files_to_read>` paths are wrong)
4. **Verify question count persistence path**: `.opencode/state/question-count.json` (line 31) — flag as legacy per Q6 but do NOT migrate in this edit (would break existing scripts)
5. **Verify script shebangs and execution**: All 6 scripts have `+x` permission. Quick test needed to confirm they run.
6. **Update Gate 3 loading order** (lines 70-72): Remove `opencode-non-interactive-shell` from required background skills? D4 CONTEXT.md says skills should use thin references — check if this is still needed.
7. **Update Platform Adaptation table** (lines 425-435): Add `hivemind-command-engine` as a new row for OpenCode command discovery.

### Gaps & Debts

| Gap | Severity | Description |
|-----|----------|-------------|
| 8 broken reference/script paths in `<files_to_read>` | 🔴 HIGH | ALL paths use wrong directory name (`hm-` not `hm-l2-`). No reference files or scripts will load until fixed. |
| No harness operational tools in allowed-tools | 🟡 MEDIUM | Skill governs delegation (DELEGATE phase) but cannot `delegate-task`. Cannot analyze prompts (`prompt-analyze`). Cannot persist state (`session-patch`, `session-journal-export`). |
| Legacy state paths under `.opencode/state/` | 🟡 MEDIUM | Q6 compliance requires `.hivemind/`. However, scripts hardcode `.opencode/state/` paths. Migration must update both SKILL.md and scripts. Defer to cleanup phase. |
| Script-based gates are platform-specific | 🟡 LOW | 5 bash scripts work on macOS/Linux but not Windows. SKILL.md "Platform Adaptation" table (line 425) only covers OpenCode/Claude Code/Codex/Cursor — all POSIX environments. Acceptable for now. |
| Gate 3 loading order (lines 52-72) has cross-lineage load | 🟡 LOW | Requires loading `opencode-platform-reference` (hm-l3 skill) and `repomix-exploration-guide` (non-hm). This is correct per the cross-lineage bridge rules. |
| D4 jump link verification | 🔴 HIGH | After fixing paths, test at runtime whether reference content renders when skill is loaded. |

---

## Skill 3: hm-l2-cross-cutting-change — Cross-Pane Change Governance

### Current State

| Field | Value |
|-------|-------|
| **Lines** | 330 |
| **Layer** | L2 |
| **Role** | domain-execution |
| **Pattern** | P2 |
| **allowed-tools** | `Read, Write, Edit, Bash, Glob, Grep` |
| **References** | `references/` ✅ 4 files (pan-classification, red-first-protocol, lifecycle-impact-matrix, mock-honesty-detection) |
| **Scripts** | ❌ NO scripts directory — clean |
| **Evals** | ✅ `evals/` directory exists |
| **Metrics** | ✅ `metrics/` directory exists |
| **Cross-references** | hm-test-driven-execution, hm-spec-driven-authoring, hm-completion-looping, hm-phase-execution |

### Assessments

| Criterion | Status |
|-----------|--------|
| **HMQUAL compliance** | ✅ COMPLETE — all sections present (Iron Law, Overview, Entry Gate, Boundary Rules, Core Workflow 7 phases, Gates, Rollback Plan, Anti-Patterns, Decision Tree, Self-Correction, Verification Checklist) |
| **Broken paths** | ✅ NONE — all 4 reference paths use correct `hm-l2-cross-cutting-change` directory prefix |
| **allowed-tools match usage** | ⚠️ PARTIAL — only generic tools listed. Needs `hivemind-doc` for reading plan/context docs, `session-journal-export` for change packet export, `delegate-task` for dispatching sub-changes. |
| **Third-party patterns** | ✅ 3 sources documented (addyosmani/agent-skills, helderberto/skills, kw12121212/auto-spec-driven) with adopt/adapt decisions |
| **RICH gate sources** | ✅ 3 sources listed with decisions |
| **Independence Notes** | ✅ No GSD/planning dependency |
| **Self-correction** | ✅ 4-mode pattern present |
| **Anti-Patterns table** | ✅ 8 anti-patterns documented |
| **Verification Checklist** | ✅ 11-item checklist at end |
| **Target lines** | 330 — could reduce to <300 but healthy as-is |

### Issues

| # | Issue | Lines | Severity |
|---|-------|-------|----------|
| 1 | **No operational tools in allowed-tools** | 15-21 | 🟡 MEDIUM — SKILL.md orchestrates multi-pan changes (Phase 5 ordering) but cannot read PAN.md/PLAN.md (`hivemind-doc`), cannot export handoff packets (`session-journal-export`), cannot dispatch subagents (`delegate-task`). |
| 2 | **Phase 5 verification uses `npm run`** | 186-193 | 🟡 LOW — Verification commands assume Node.js/npm. For a general-purpose skill, should note platform adaptation or reference a tool. |
| 3 | **Phase 1 scan uses `grep -rl`** | 96-101 | 🟡 LOW — Suggests grep commands inline but allowed-tools includes `Grep` and `Glob`. Actually correct — these could be executed via Bash. No issue. |
| 4 | **No `hivemind-doc` for reading dependency maps** | — | 🟡 LOW — Phase 1 Scan and Phase 3 Impact Analysis would benefit from reading architecture docs. Optional enhancement. |
| 5 | **No `session-journal-export` for handoff** | — | 🟡 LOW — Phase 7 Handoff packet (lines 217-233) is written as YAML. Could use `session-journal-export` for structured export. |

### Reference Files Status

| File | Path | On Disk? | Path Correct? |
|------|------|----------|---------------|
| pan-classification.md | `references/pan-classification.md` | ✅ 10,554 bytes | ✅ |
| red-first-protocol.md | `references/red-first-protocol.md` | ✅ 6,930 bytes | ✅ |
| lifecycle-impact-matrix.md | `references/lifecycle-impact-matrix.md` | ✅ 9,664 bytes | ✅ |
| mock-honesty-detection.md | `references/mock-honesty-detection.md` | ✅ 9,579 bytes | ✅ |

**All 4 references exist, all paths correct.**

### Target Scope (Minor edits)

| Dimension | Current | Target |
|-----------|---------|--------|
| Lines | 330 | <310 |
| allowed-tools additions | 0 | +3 (hivemind-doc, session-journal-export, delegate-task) optional |
| Broken paths | 0 | 0 |
| Script references | 0 | 0 (clean — keep this way) |

### Edits Required

1. **Add operational tools to allowed-tools** (lines 15-21): `hivemind-doc` (for reading plan/context/architecture docs), `session-journal-export` (for handoff packet export), `delegate-task` (for dispatching sub-changes). Mark as LOW priority — skill functions without them.
2. **Update "On Load" section** (lines 53-59): Add cross-reference to `hm-l3-tool-capability-matrix` for operational tool permission levels.
3. **No path fixes needed** — all 4 reference paths use correct `hm-l2-` prefix. Cleanest skill in the W4 set.

### Gaps & Debts

| Gap | Severity | Description |
|-----|----------|-------------|
| No operational tool dependencies | 🟡 LOW | Skill is self-contained with generic tools. Enhancement possible but not critical. |
| Phase 5 verification commands assume npm | 🟡 LOW | `npm run typecheck`, `npm test` are Node.js-specific. For a general-purpose skill, note that platform-specific verification commands should be substituted. |
| D4 jump link verification | 🔴 HIGH | 4 reference files (pan-classification, red-first-protocol, lifecycle-impact-matrix, mock-honesty-detection) may not render when loaded. Must test at runtime. |

---

## Skill 4: hm-l2-debug — Systematic Debugging

### Current State

| Field | Value |
|-------|-------|
| **Lines** | 194 |
| **Layer** | L2 |
| **Role** | domain-execution |
| **Pattern** | P2 |
| **allowed-tools** | `Read, Write, Edit, Bash, Glob, Grep` |
| **References** | `references/` ✅ 2 files (debug-state-machine, evidence-framework) |
| **Scripts** | ✅ `scripts/` directory exists (content unverified — empty by glob? but ls showed directory exists) |
| **Evals** | ✅ `evals/` directory exists |
| **Metrics** | ✅ `metrics/` directory exists |
| **Cross-references** | hm-l3-detective (codebase investigation), hm-l3-synthesis (evidence synthesis), hivemind-power-on (planning persistence) |

### Assessments

| Criterion | Status |
|-----------|--------|
| **HMQUAL compliance** | ✅ COMPLETE — Iron Law, Overview, Entry Gate, 6-Step Protocol, Persistent State, RICH Gate Sources, Independence Notes, Anti-Patterns, Self-Correction, Cross-References, Verification (implied) |
| **Broken paths** | ✅ NONE — all reference paths use correct `hm-l2-debug` prefix |
| **allowed-tools match usage** | ⚠️ PARTIAL — missing `hivemind-doc` for reading code, `session-patch` for debug state persistence, `session-journal-export` for debug state export, `delegate-task` for dispatching investigation subagents |
| **Most concise skill in set** | ✅ Only 194 lines — clean, focused, well-structured |
| **Debug state path** | `.debug/<bug-id>.md` — good, project-scoped, no legacy `.opencode/state/` paths |
| **Independence Notes** | ✅ Explicitly says "Do not assume GSD, BMAD, or this repository's `.planning/` layout" — correct |
| **Self-correction** | ✅ 4-mode pattern present |
| **Anti-Patterns table** | ✅ 4 anti-patterns documented |

### Issues

| # | Issue | Lines | Severity |
|---|-------|-------|----------|
| 1 | **No operational tools in allowed-tools** | 17-23 | 🟡 MEDIUM — Debug workflow uses Bash for grep/glob but could benefit from `hivemind-doc` (structured code reading), `session-patch` (debug state persistence to `.debug/<bug-id>.md`), `session-journal-export` (export debug state for handoff), `delegate-task` (dispatch parallel investigation subagents). |
| 2 | **Cross-reference to `hm-planning-persistence`** | 190 | 🟡 LOW — Line 190: "hm-planning-persistence" referenced in Cross-References table. This skill does NOT exist (confirmed W2 finding). Should be replaced with `hivemind-power-on`. |
| 3 | **`hivemind-power-on` cross-reference name** | 193 | 🟡 LOW — Cross-references `hivemind-power-on` (line 193) as the replacement for planning persistence. This is correct per W2 recommendation. |
| 4 | **Scripts directory empty on glob, but ls showed files** | — | 🟡 LOW — Investigate. `ls -la` showed `scripts/` directory exists with `.gitkeep` or empty. SKILL.md references `scripts/` paths? Check: SKILL.md has no `bash scripts/` references — correct. |
| 5 | **No evidence hierarchy section** | — | 🟡 LOW — Debug skill references "evidence framework" but doesn't define L1-L5 hierarchy. SYSTEM-AUDIT uses evidence hierarchy. Optional cross-reference to `hm-l3-evidence-truth` gate skill. |

### Reference Files Status

| File | Path | On Disk? | Path Correct? |
|------|------|----------|---------------|
| debug-state-machine.md | `references/debug-state-machine.md` | ✅ 1,639 bytes | ✅ |
| evidence-framework.md | `references/evidence-framework.md` | ✅ 507 bytes | ✅ |

**Both references exist, both paths correct.** Evidence framework is only 507 bytes — may need expansion.

### Target Scope (Minor edits, could stay as-is)

| Dimension | Current | Target |
|-----------|---------|--------|
| Lines | 194 | <200 (most concise — could stay or slightly expand) |
| allowed-tools additions | 0 | +4 optional (hivemind-doc, session-patch, session-journal-export, delegate-task) |
| Non-existent skill refs | 1 (hm-planning-persistence) | 0 |
| Broken paths | 0 | 0 |

### Edits Required

1. **Remove/Replace `hm-planning-persistence` cross-reference** (line 190) — this skill does not exist. Replace with `hivemind-power-on`. Or simply remove the row — debug already cross-references `hivemind-power-on` on line 193.
2. **Add operational tools to allowed-tops** (lines 17-23): `hivemind-doc` (for structured code reading during isolation), `session-patch` (for debug state persistence), `session-journal-export` (for exporting debug state as handoff). `delegate-task` optional (for parallel investigation).
3. **Verify scripts directory content** — if scripts/ is empty, remove the directory or add relevant debug scripts. If `ls` showed files, confirm they exist and are needed.
4. **Update evidence framework** — reference `hm-l3-evidence-truth` gate skill as the "evidence hierarchy" source.

### Gaps & Debts

| Gap | Severity | Description |
|-----|----------|-------------|
| Non-existent `hm-planning-persistence` cross-reference | 🟡 LOW | Line 190 references a skill that never existed. Easy fix (replace with `hivemind-power-on`). |
| No harness tools for structured state persistence | 🟡 LOW | Debug state is currently written/read via Write/Bash. `session-patch` would be more structured. |
| Evidence framework reference file is tiny (507 bytes) | 🟡 LOW | May need expansion to cover L1-L5 evidence hierarchy. Could cross-reference `hm-l3-evidence-truth` instead. |
| D4 jump link verification | 🔴 HIGH | 2 reference files (debug-state-machine, evidence-framework) must be verified at runtime. |
| Debug state path `.debug/` is project-root-level | 🟡 LOW | Could conflict with other tools. Independence Notes say to use existing convention if available. Acceptable as default. |

---

## Cross-Skill Findings

### Redundancies

| Pattern | Appears In | Recommendation |
|---------|-----------|---------------|
| **No operational tools in allowed-tools** | user-intent-interactive-loop, cross-cutting-change, debug — **3/3 existing skills** | All 3 skills lack harness operational tools. Add tools per each skill's needs. |
| **Iron Law pattern** | cross-cutting-change, debug — **2/3 existing** | Consistent pattern. Keep as-is. New skill (subagent-delegation) should also have an Iron Law. |
| **Self-Correction 4-mode pattern** | user-intent-interactive-loop, cross-cutting-change, debug — **3/3 existing** | Consistent pattern. Keep as-is. New skill must follow same template. |
| **Anti-Patterns table** | user-intent-interactive-loop, cross-cutting-change, debug — **3/3 existing** | Consistent pattern. Keep as-is. New skill must follow same template. |
| **Cross-References table** | user-intent-interactive-loop, cross-cutting-change, debug — **3/3 existing** | Consistent pattern. Keep as-is. New skill must follow same template. |
| **HMQUAL compliance** | **3/3 existing skills** | All pass HMQUAL. New skill must be HMQUAL-compliant. |
| **`hm-planning-persistence` non-existent ref** | debug only (line 190) | 1 skill references this non-existent skill. Easy fix. |

### Path Integrity Issues

| Skill | `<files_to_read>` paths broken? | Reference files exist on disk? |
|-------|--------------------------------|-------------------------------|
| hm-l2-subagent-delegation-patterns | N/A (directory missing) | N/A |
| hm-l2-user-intent-interactive-loop | 🔴 **8 paths broken** (hm- vs hm-l2- prefix) | ✅ 6 ref files + 6 scripts exist at correct filesystem paths |
| hm-l2-cross-cutting-change | ✅ All 4 paths correct | ✅ 4 ref files exist |
| hm-l2-debug | ✅ All 2 paths correct | ✅ 2 ref files exist |

### allowed-tools Baseline for WORKFLOW Skills

| Tool | user-intent | cross-cutting | debug | subagent-delegation (NEW) |
|------|:-----------:|:-------------:|:-----:|:-------------------------:|
| Read | ✅ | ✅ | ✅ | ✅ |
| Write | ✅ | ✅ | ✅ | ✅ |
| Edit | ✅ | ✅ | ✅ | ✅ |
| Bash | ✅ | ✅ | ✅ | ✅ |
| Glob | ✅ | ✅ | ✅ | ✅ |
| Grep | ✅ | ✅ | ✅ | ✅ |
| Task | ✅ | ❌ | ❌ | ❌ |
| Question | ✅ | ❌ | ❌ | ❌ |
| **prompt-skim** | 🚫 ADD | ❌ | ❌ | ❌ |
| **prompt-analyze** | 🚫 ADD | ❌ | ❌ | ❌ |
| **session-patch** | 🚫 ADD | ❌ | 🚫 ADD | ❌ |
| **hivemind-doc** | ❌ | 🚫 ADD | 🚫 ADD | ❌ |
| **delegate-task** | 🚫 ADD | 🚫 ADD | 🚫 ADD | ✅ PRIMARY |
| **delegation-status** | ❌ | ❌ | ❌ | ✅ PRIMARY |
| **session-journal-export** | 🚫 ADD | 🚫 ADD | 🚫 ADD | ✅ |
| **session-tracker** | ❌ | ❌ | ❌ | ✅ |
| **session-hierarchy** | ❌ | ❌ | ❌ | ✅ |
| **hivemind-session-view** | ❌ | ❌ | ❌ | ✅ |
| **hivemind-command-engine** | 🚫 ADD | ❌ | ❌ | ✅ |
| **hivemind-sdk-supervisor** | ❌ | ❌ | ❌ | ✅ |
| **configure-primitive** | ❌ | ❌ | ❌ | ✅ |
| **execute-slash-command** | ❌ | ❌ | ❌ | ✅ |

### Dependency Issues

| Issue | Impact | Resolution |
|-------|--------|------------|
| subagent-delegation-patterns is NEW — all cross-refs from W2/W3 skills are pending | 🟡 HIGH — coordinating-loop and phase-execution reference a skill that doesn't exist yet | Create the skill as Phase 23 Wave 4 work. Until then, cross-references from other skills point to nothing. |
| user-intent-interactive-loop has all 8 reference/script paths broken | 🔴 HIGH — skill loads but no references resolve | Fix 8 paths in SKILL.md (hm- → hm-l2-). High priority — breaks E2E user-intent flow. |
| Script vs. tool tension | 🟡 MEDIUM — user-intent-interactive-loop has 6 scripts for gate enforcement. W2 synthesis removed scripts from coordinating-loop/skills. Keeping scripts works but creates inconsistency. | Document scripts as "Phase 23 keep" with note to evaluate tool migration in future phase. |
| D4 constraint across 4 skills | 🔴 HIGH — ALL 4 skills have reference files that need jump link runtime verification. User reports jump links may not render when loaded. | Must create a verification test protocol after edits. |

---

## Skill Edit Priority Order

| Priority | Skill | Effort | Risk | Reason |
|----------|-------|--------|------|--------|
| 1 | **hm-l2-subagent-delegation-patterns** (NEW) | HIGH | HIGH | Directory doesn't exist. Needed by coordinating-loop and phase-execution. Must be created with full HMQUAL compliance. Foundation for all delegation workflow. |
| 2 | **hm-l2-user-intent-interactive-loop** | MEDIUM | HIGH | 8 broken paths (all reference/script paths use wrong prefix). L1 front-agent skill — impacts user experience directly. Allowed-tools also missing operational tools. |
| 3 | **hm-l2-debug** | LOW | LOW | 1 non-existent skill ref to fix. Most concise skill (194 lines). Tool additions optional. |
| 4 | **hm-l2-cross-cutting-change** | LOWEST | LOWEST | Cleanest skill — no path issues, all refs exist, all HMQUAL sections present. Tool additions entirely optional. |

### Edit Dependency Chain

```
subagent-delegation-patterns (CREATE new — coordinator dependency)
    ↓
user-intent-interactive-loop (fix 8 paths — front-agent critical path)
    ↓
debug (fix cross-ref, optional tool additions)
    ↓
cross-cutting-change (optional: tool additions, lowest priority)
```

---

## Total Edit Summary

| Metric | Value |
|--------|-------|
| Skills to edit | 3 (existing) + 1 (NEW) |
| Total current lines (3 existing) | 970 |
| Total target lines (3 existing after edits) | ~800 |
| Total target lines with NEW skill | ~1,400 |
| Broken `<files_to_read>` paths to fix | 8 (all in user-intent-interactive-loop) |
| allowed-tools additions across 3 existing skills | ~12 |
| NEW skill creation | 1 (hm-l2-subagent-delegation-patterns, ~500-600 lines) |
| Non-existent skill refs to remove | 1 (hm-planning-persistence in debug) |
| Reference files that exist on disk | 12 files across 3 skills (all ✅ present) |
| Scripts that exist on disk | 6 scripts in user-intent-interactive-loop (✅ all present, all executable) |
| Jump-link runtime tests required | 4 skills (D4 compliance — critical: user reports jump links may NOT render) |
| Legacy `.opencode/state/` paths to flag | 2 (user-intent-interactive-loop — defer migration) |

---

## Verification Checklist (post-edit)

- [ ] **subagent-delegation-patterns**: SKILL.md created at `.opencode/skills/hm-l2-subagent-delegation-patterns/SKILL.md`
- [ ] **subagent-delegation-patterns**: `references/` directory created with 4 reference files
- [ ] **subagent-delegation-patterns**: `evals/` + `metrics/` directories created
- [ ] **subagent-delegation-patterns**: HMQUAL compliance verified (all sections present)
- [ ] **user-intent-interactive-loop**: 8 broken paths fixed (`hm-` → `hm-l2-` in all `<files_to_read>`)
- [ ] **user-intent-interactive-loop**: allowed-tools expanded with harness tools
- [ ] **user-intent-interactive-loop**: legacy `.opencode/state/` paths flagged for future migration
- [ ] **debug**: `hm-planning-persistence` cross-reference removed/replaced
- [ ] **debug**: allowed-tools expanded with harness tools (optional)
- [ ] **cross-cutting-change**: allowed-tools expanded with harness tools (optional)
- [ ] **ALL 4 skills**: D4 constraint — jump link rendering verified at runtime
- [ ] **ALL 4 skills**: Self-Correction, Anti-Patterns, Cross-References tables present and consistent
- [ ] **ALL 4 skills**: No references to PARTIAL tools (run-background-command, trajectory, pressure, agent-work)
