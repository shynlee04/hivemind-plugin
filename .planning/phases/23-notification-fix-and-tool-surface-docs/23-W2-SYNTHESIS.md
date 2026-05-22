# Wave 2 Synthesis: ORCHESTRATION Skills

**Date:** 2026-05-23
**Source files:** 5 ORCHESTRATION SKILL.md files + 23-SYSTEM-AUDIT + 23-RESEARCH + 23-PATTERNS + 23-CONTEXT + 23-CONTEXT-ANALYSIS
**Status:** READY — gaps/debts documented, edits scoped

---

## Summary

| Metric | Value |
|--------|-------|
| Skills analyzed | 5 |
| Total current LOC | 1,166 |
| Total target LOC (post-edit) | <970 |
| Operational tools available | 18 (✅ fully operational) |
| Partial tools available | 4 (🟡 note limitations, do NOT reference as primary) |
| TBD tools excluded | 4 (phase not reached) |
| Broken `<files_to_read>` paths | 6 (all in coordinating-loop) |
| Non-existent skill references | 4 skills reference `hm-planning-persistence` (does not exist) |
| Legacy state paths (`.opencode/state/`) | 2 skills (phase-execution, phase-loop) |
| Ralph-loop references to remove | 3 skills (coordinating-loop, phase-loop, completion-looping) |

---

## Tool Scope

### Operational — Include in Skills (✅ 18 tools)

| Tool | Phase Origin | Include In |
|------|-------------|-----------|
| `delegate-task` | CP-DT-01 ✅ | coordinating-loop, phase-execution, completion-looping |
| `delegation-status` | CP-DT-01 ✅ | coordinating-loop, completion-looping |
| `execute-slash-command` | P21.1 ✅ | coordinating-loop, phase-execution, phase-loop |
| `hivemind-command-engine` | CP-CMD-01 ✅ | coordinating-loop, phase-execution |
| `session-tracker` | CP-ST-01 ✅ | coordinating-loop, hivemind-power-on |
| `session-hierarchy` | CP-ST-01 ✅ | coordinating-loop, hivemind-power-on |
| `session-context` | CP-ST-01 ✅ | coordinating-loop, hivemind-power-on |
| `hivemind-session-view` | P16 ✅ | coordinating-loop, hivemind-power-on |
| `prompt-skim` | Pre-restructuring ✅ | gate-orchestrator (pre-gate analysis) |
| `prompt-analyze` | Pre-restructuring ✅ | gate-orchestrator (pre-gate analysis) |
| `session-patch` | Pre-restructuring ✅ | hivemind-power-on (session state) |
| `session-journal-export` | Pre-restructuring ✅ | completion-looping (loop state export) |
| `hivemind-doc` | Pre-restructuring ✅ | phase-execution (read PLAN.md, CONTEXT.md) |
| `hivemind-sdk-supervisor` | P14 ✅ | hivemind-power-on (SDK health) |
| `configure-primitive` | BOOT ✅ | hivemind-power-on (primitive compile) |
| `validate-restart` | BOOT ✅ | hivemind-power-on (restart validation) |
| `bootstrap-init` | BOOT ✅ | hivemind-power-on (init context) |
| `bootstrap-recover` | BOOT ✅ | hivemind-power-on (recovery) |

### Partial — Reference with Caveats (🟡 4 tools)

| Tool | Caveat | Include In |
|------|--------|-----------|
| `run-background-command` | PTY control-plane incomplete (CP-PTY-01 pending). DO NOT reference from ORCHESTRATION skills — only from CP-PTY dedicated skills when that phase starts. | ❌ EXCLUDE from Wave 2 |
| `hivemind-trajectory` | State machine untested. Redesign pending P24. DO NOT reference as stable surface. | ❌ EXCLUDE from Wave 2 |
| `hivemind-pressure` | Redesign pending P26. Core classify/detect works but design is unstable. | ❌ EXCLUDE from Wave 2 |
| `hivemind-agent-work-create/export` | Lifecycle untested. Redesign pending P24-25. | ❌ EXCLUDE from Wave 2 |

### TBD — Do NOT Reference (4 tools)

| Tool | Blocking Phase | Reason |
|------|---------------|--------|
| `run-background-command` | CP-PTY-01 chưa start | PTY control-plane MVP not implemented |
| `hivemind-trajectory` | P24 chưa tới | Trajectory state machine redesign pending |
| `hivemind-pressure` | P26 chưa tới | Pressure + notification redesign pending |
| `hivemind-agent-work` | P24-25 chưa tới | Agent-work-contract lifecycle redesign pending |

---

## Skill 1: hm-l2-coordinating-loop

### Current State

| Field | Value |
|-------|-------|
| **Lines** | 448 |
| **Layer** | L3 |
| **Role** | coordinator |
| **allowed-tools** | `Bash Read Write Edit Glob Grep todowrite skill` |
| **References** | 5 `<files_to_read>` paths + 9 scripts |
| **Cross-references** | dispatching-parallel-agents, user-intent-interactive-loop, **hm-planning-persistence (NON-EXISTENT)**, phase-loop |

### Broken Paths (6)

| # | Line | Current Path | Fix |
|---|------|-------------|-----|
| 1 | 35 | `.opencode/skills/hm-coordinating-loop/references/01-handoff-protocols.md` | `hm-coordinating-loop` → `hm-l2-coordinating-loop` |
| 2 | 36 | `.opencode/skills/hm-coordinating-loop/references/02-sequential-vs-parallel.md` | `hm-coordinating-loop` → `hm-l2-coordinating-loop` |
| 3 | 37 | `.opencode/skills/hm-coordinating-loop/references/03-parent-child-cycles.md` | `hm-coordinating-loop` → `hm-l2-coordinating-loop` |
| 4 | 38 | `.opencode/skills/hm-coordinating-loop/references/04-ralph-loop-integration.md` | `hm-coordinating-loop` → `hm-l2-coordinating-loop` |
| 5 | 39 | `.opencode/skills/hm-coordinating-loop/references/05-edge-guardrails.md` | `hm-coordinating-loop` → `hm-l2-coordinating-loop` |
| 6 | 40 | `.opencode/get-shit-done/references/thinking-models-execution.md` | **Likely non-existent** — verify with glob, then either fix path or remove |

Additionally: All 9 script references (lines 26, 52, 56, 86, 149, 150, 151, 166, 167, 207, 221, etc.) reference `bash scripts/` paths that almost certainly do not exist in the current codebase.

### Missing Allowed-Tools

Required for coordinator role — current list lacks:

| Tool | Why Needed | Priority |
|------|-----------|----------|
| `delegate-task` | Primary dispatch mechanism for subagent delegation | HIGH |
| `execute-slash-command` | Command dispatch path for deterministic tasks (referenced in flowchart line 97) | HIGH |
| `hivemind-command-engine` | Command discovery before execute-slash-command (line 96-97) | HIGH |
| `session-tracker` | Session continuity tracking during coordination | MEDIUM |
| `session-hierarchy` | Parent-child session navigation during dispatch | MEDIUM |
| `session-context` | Cross-session context synthesis | LOW |
| `hivemind-doc` | Read SKILL.md files for agent selection | MEDIUM |

### Non-Existent Skill References

| Skill Referenced | Exists? | Impact |
|-----------------|---------|--------|
| `hm-planning-persistence` | ❌ DOES NOT EXIST | Cross-reference table (lines 420-421) references a skill that was never created. Must be removed or replaced. |
| `dispatching-parallel-agents` | ✅ exists (not hm-* lineage) | Cross-reference valid but non-hm lineage — note the cross-lineage bridge |
| `user-intent-interactive-loop` | ✅ exists as `hm-l2-user-intent-interactive-loop` | Name mismatch: references `user-intent-interactive-loop` without `hm-l2-` prefix |

### Ralph-Loop Patterns to Remove

Lines 165-171, 213-238 contain ralph-loop validator integration (`bash scripts/run-ralph-loop.sh`). Ralph loops are considered "totally nonsensical" per CONTEXT-ANALYSIS (Section 2.1.B.4). **Must remove all ralph-loop references** and replace with practical verification patterns.

### Target Scope (Reduce)

| Dimension | Current | Target |
|-----------|---------|--------|
| Lines | 448 | <300 |
| allowed-tools | 8 | 12+ |
| Broken paths | 6 | 0 |
| Script references | 9 | 0 (use tools instead) |
| Ralph-loop refs | 30+ lines | 0 |
| Cross-references to non-existent skills | 1 | 0 |

### Edits Required

1. **Fix 6 broken `<files_to_read>` paths** — rename `hm-coordinating-loop` → `hm-l2-coordinating-loop`, verify/remove GSD reference
2. **Expand `allowed-tools`** — add delegate-task, execute-slash-command, hivemind-command-engine, session-tracker, session-hierarchy, hivemind-doc
3. **Remove ralph-loop sections** (lines 165-171, 213-238)
4. **Remove all `bash scripts/` references** — replace with actual tool calls
5. **Remove `hm-planning-persistence` cross-reference** — replace with hivemind-power-on or hivemind-state-reference
6. **Fix `user-intent-interactive-loop` name** → `hm-l2-user-intent-interactive-loop`
7. **Trim worked example** (lines 241-314) — 70+ lines, compress to <30
8. **Update Kit Bundle Contents** (lines 434-448) — replace scripts with operational tools
9. **Update Platform Adaptation** section — remove bash-script-heavy patterns

### Gaps & Debts

| Gap | Severity | Description |
|-----|----------|-------------|
| References directory may not exist | MEDIUM | `.opencode/skills/hm-l2-coordinating-loop/references/` — check existence of all 5 reference files after fixing paths. If they don't exist, create minimal references or eliminate bundled references entirely (per D4: THIN but DEEP). |
| Jump link runtime behavior unverified | HIGH | Per D4 constraint: "Jump link + progressive disclosure verification REQUIRED — user reports these mechanisms do NOT work in loaded skills." Must test at runtime. |
| Missing subagent-delegation-patterns partner | MEDIUM | coordinating-loop cross-references subagent-delegation-patterns but `hm-l2-subagent-delegation-patterns` may not exist on disk. |
| Scripts directory does not exist | HIGH | All 9 `bash scripts/` references point to non-existent infrastructure. Must either create scripts or migrate to tool-based gates. |

---

## Skill 2: hm-l2-gate-orchestrator

### Current State

| Field | Value |
|-------|-------|
| **Lines** | 221 |
| **Layer** | L2 |
| **Role** | domain-execution |
| **allowed-tools** | `Read, Write, Edit, Bash, Glob, Grep` |
| **References** | 1 (`references/gate-flow.md`) |
| **Scripts** | 0 |
| **Cross-references** | gate-lifecycle-integration, gate-spec-compliance, gate-evidence-truth, hm-production-readiness, hm-requirements-analysis, hm-roadmap-maintainability, hm-lineage-router |

### Assessment — HEALTHIEST SKILL IN SET

| Criterion | Status |
|-----------|--------|
| Broken paths | ✅ NONE |
| Allowed-tools match actual usage | ✅ YES (Read/Write/Edit/Bash/Glob/Grep correct for document analysis) |
| HMQUAL compliance | ✅ COMPLETE (all 8 HMQUAL sections present) |
| Cross-references valid | ✅ All 7 cross-references point to existing skills |
| Routes-to metadata | ✅ Valid: routes to 3 gate-* skills that all exist |
| Self-correction | ✅ 4 anti-patterns documented |
| Progressive disclosure | ✅ Uses `references/gate-flow.md` |

### Minor Issues

| Issue | Line | Description |
|-------|------|-------------|
| `references/gate-flow.md` existence | 55 | Needs runtime verification per D4 constraint — skill says "Read references/gate-flow.md" but jump links may not render when loaded |
| Missing operational tools | — | Could benefit from `prompt-skim`/`prompt-analyze` for pre-gate context analysis, but not critical |
| Skill name in usage protocol | 161 | References `hm-gate-orchestrator` (missing `-l2-` infix) — line 161: `Load this skill (\`hm-gate-orchestrator\`)` |

### Target Scope (Reduce)

| Dimension | Current | Target |
|-----------|---------|--------|
| Lines | 221 | <200 |
| Allowable-tools additions | 0 | +2 (prompt-skim, prompt-analyze) optional |

### Edits Required

1. **Fix skill name** line 161: `hm-gate-orchestrator` → `hm-l2-gate-orchestrator`
2. **Optional: add** `prompt-skim` and `prompt-analyze` to allowed-tools for pre-gate context analysis
3. **Verify** `references/gate-flow.md` exists on disk after edit

### Gaps & Debts

| Gap | Severity | Description |
|-----|----------|-------------|
| References file may not render when loaded | HIGH | D4 constraint: jump link verification required. Must test at runtime. |
| No verification of gate-* skill existence | LOW | Assumes 3 gate skills exist. Would benefit from a compatibility check section. |

---

## Skill 3: hm-l2-phase-execution

### Current State

| Field | Value |
|-------|-------|
| **Lines** | 190 |
| **Layer** | L1 |
| **Role** | orchestrator |
| **allowed-tools** | `Read, Write, Edit, Bash, Glob, Grep, Task` |
| **References** | 3 (`references/wave-protocol.md`, `references/checkpoint-recovery.md`, `references/execution-state-template.md`) |
| **Scripts** | 1 (verify.sh) |
| **Cross-references** | hm-coordinating-loop (**name mismatch**), hm-planning-persistence (**NON-EXISTENT**), hm-phase-loop, hm-subagent-delegation-patterns |

### Critical Issues

| Issue | Lines | Description |
|-------|-------|-------------|
| Legacy state path | 50-51 | References `.opencode/state/opencode-harness/phase-execution/` — per Q6, state belongs in `.hivemind/`. Must migrate all 4 state artifacts. |
| Legacy state path | 146 | Independence Notes section: `.opencode/state/opencode-harness/phase-execution/` again |
| `Task` in allowed-tools | 23 | `Task` is not an operational tool. May be a platform-native tool but should be explicitly documented. |
| Missing delegate-task | — | Phase execution dispatches plans. Should reference delegate-task for subagent plan execution. |
| Missing execute-slash-command | — | For command-based plan dispatch. |
| Non-existent skill ref | 188 | `hm-planning-persistence` cross-reference — skill does not exist. |
| Name mismatch | 187 | `hm-coordinating-loop` → `hm-l2-coordinating-loop` |

### Target Scope (Reduce)

| Dimension | Current | Target |
|-----------|---------|--------|
| Lines | 190 | <180 |
| Allowed-tools additions | 0 | +3 (delegate-task, execute-slash-command, hivemind-command-engine) |
| Legacy paths | 2 locations | 0 |

### Edits Required

1. **Migrate state paths**: `.opencode/state/opencode-harness/phase-execution/` → `.hivemind/state/phase-execution/` (lines 50-51, 146)
2. **Add tools**: delegate-task, execute-slash-command, hivemind-command-engine to allowed-tools
3. **Remove `Task`** from allowed-tools unless it's a verified platform tool
4. **Fix cross-reference**: `hm-coordinating-loop` → `hm-l2-coordinating-loop` (line 187)
5. **Remove or replace**: `hm-planning-persistence` cross-reference (line 188) — refer to hivemind-power-on instead
6. **Check** `references/execution-state-template.md` for legacy path references and fix them too

### Gaps & Debts

| Gap | Severity | Description |
|-----|----------|-------------|
| `.opencode/state/` → `.hivemind/` migration | HIGH | Q6 compliance — ALL internal state must live under `.hivemind/`. Phase execution state artifacts are internal state. |
| Missing subagent-dispatch tools | MEDIUM | Cannot execute plans via subagents without delegate-task in allowed-tools |
| Independence Notes (line 146) GSD/non-GSD | LOW | Claims "does not require GSD" but path patterns suggest GSD-specific assumptions. Verify non-GSD compatibility. |

---

## Skill 4: hm-l2-phase-loop

### Current State

| Field | Value |
|-------|-------|
| **Lines** | 158 |
| **Layer** | L2 |
| **Role** | domain-execution |
| **allowed-tools** | `Read, Write, Edit, Bash, Glob, Grep` |
| **References** | 1 (implicit — durable cursor pattern from phase-loop) |
| **Scripts** | 0 (but references checker/validator scripts loosely) |
| **Cross-references** | hm-planning-persistence (**NON-EXISTENT**), hm-phase-execution |

### Issues

| Issue | Lines | Description |
|-------|-------|-------------|
| Legacy state path | 65 | Durable cursor location: `.opencode/state/...` — should be `.hivemind/state/phase-loop/` |
| Non-existent skill ref | 157 | `hm-planning-persistence` — skill does not exist |
| Ralph-loop adjacency | 44 | Loop flowchart pattern references re-spawning agents in a ralph-like loop (line 44f: "Re-spawn implementer subagent") — should use delegate-task with delegation-status polling |
| Missing allowed-tools | — | No session-management tools. Phase loops need to persist durable cursors — `hivemind-doc` for reading cursor state, hivemind-session-view for session context |

### Target Scope (Reduce)

| Dimension | Current | Target |
|-----------|---------|--------|
| Lines | 158 | <150 |
| Legacy paths | 1 | 0 |
| Non-existent skill refs | 1 | 0 |

### Edits Required

1. **Migrate cursor path**: `.opencode/state/` → `.hivemind/state/phase-loop/` (line 65)
2. **Remove `hm-planning-persistence`** cross-reference (line 157) — replace with `hivemind-power-on`
3. **Replace ralph-loop agent re-spawn** (line 44f) with `delegate-task` + `delegation-status` polling pattern
4. **Add allowed-tools**: `hivemind-doc` for durable cursor persistence, `delegate-task` for agent dispatch
5. **Verify** cross-reference `hm-phase-execution` exists (line 158) — ✅ exists as `hm-l2-phase-execution`

### Gaps & Debts

| Gap | Severity | Description |
|-----|----------|-------------|
| Durable cursor path migration | MEDIUM | Q6 compliance: state under `.opencode/` is legacy; must move to `.hivemind/` |
| No tool-based cursor persistence | LOW | Loop cursor is described as a YAML structure but no tool is assigned for reading/writing it. hivemind-doc could serve for reading, but Write is also needed. |

---

## Skill 5: hm-l2-completion-looping

### Current State

| Field | Value |
|-------|-------|
| **Lines** | 149 |
| **Layer** | L2 |
| **Role** | domain-execution |
| **allowed-tools** | `Read, Write, Edit, Bash, Glob, Grep` |
| **References** | 3 (`references/verification-checklist.md`, `references/loop-patterns.md`, `references/durable-completion-cursors.md`) |
| **Scripts** | 0 |
| **Cross-references** | hm-coordinating-loop (**name mismatch**), hm-phase-loop, hm-planning-persistence (**NON-EXISTENT**) |

### Issues

| Issue | Lines | Description |
|-------|-------|-------------|
| Name mismatch | 145-148 | `hm-coordinating-loop` → `hm-l2-coordinating-loop` |
| Non-existent skill ref | 149 | `hm-planning-persistence` — does not exist |
| Missing allowed-tools | — | For self-verification envelopes, needs `delegation-status` for checking subagent completion. Also needs `session-journal-export` for loop state export. |
| Ralph-loop guardrails | 51-53 | Phase 30 hardening section (lines 47-55) references "per-edge guardrail evidence" pattern from ralph-loop era — should be simplified |
| Durable cursor path | 75 | Cursor fields described as schema but no persistence path specified. Should reference `.hivemind/state/completion-loop/`. |

### Target Scope (Reduce)

| Dimension | Current | Target |
|-----------|---------|--------|
| Lines | 149 | <140 |
| Allowed-tools additions | 0 | +2 (delegation-status, session-journal-export) |
| Non-existent skill refs | 1 | 0 |
| Name mismatches | 1 | 0 |

### Edits Required

1. **Fix name mismatch**: `hm-coordinating-loop` → `hm-l2-coordinating-loop` (line 145)
2. **Remove `hm-planning-persistence`** cross-reference (line 149) — replace with `hivemind-power-on`
3. **Add allowed-tools**: `delegation-status`, `session-journal-export`
4. **Specify cursor persistence path**: Add `Session journal: session-journal-export` to the durable cursor fields (line 75)
5. **Simplify guardrail lineage** (lines 45-55) — remove LangGraph/AutoGen/OpenAI source lineage, keep local adaptation only

### Gaps & Debts

| Gap | Severity | Description |
|-----|----------|-------------|
| Durable cursor has no persistence tool | LOW | Schema is defined but no tool writes it to disk. session-journal-export can read but what writes? Add Write to allowed-tools for cursor persistence. |
| References directory contents unverified | MEDIUM | 3 reference files may or may not exist. Must verify after fix: `references/verification-checklist.md`, `references/loop-patterns.md`, `references/durable-completion-cursors.md`. |
| D4 jump link verification | HIGH | Same D4 constraint: must test at runtime whether references render when skill is loaded. |

---

## Cross-Skill Findings

### Redundancies

| Pattern | Appears In | Recommendation |
|---------|-----------|---------------|
| `hm-planning-persistence` cross-reference | coordinating-loop, phase-execution, phase-loop, completion-looping **(4/5 skills)** | Replace all with `hivemind-power-on` or remove. Skill never existed. |
| Ralph-loop validator pattern | coordinating-loop, phase-loop, completion-looping **(3/5 skills)** | Replace all with `delegate-task` + `delegation-status` polling. Ralph-loops are deprecated per CONTEXT-ANALYSIS. |
| Legacy `.opencode/state/` paths | phase-execution, phase-loop **(2/5 skills)** | Migrate all to `.hivemind/state/` per Q6 |
| Bash script gate enforcement | coordinating-loop **(9 scripts)** | Replace with tool-based verification (delegate-task + delegation-status) |
| `hm-coordinating-loop` name mismatch | phase-execution, completion-looping **(2/5 skills)** | Fix to `hm-l2-coordinating-loop` |
| "Iron Law" enforcement section | gate-orchestrator, phase-execution, completion-looping **(3/5 skills)** | Redundant pattern — keep if useful but ensure consistent style |
| Self-Correction 4-mode pattern | **ALL 5 skills** | Consistent pattern — good. Keep as standard template. |
| Anti-Patterns table | **ALL 5 skills** | Consistent pattern — good. Keep as standard template. |
| Cross-References table | **ALL 5 skills** | Consistent pattern — good. Keep as standard template. |

### Dependency Issues

| Issue | Impact | Resolution |
|-------|--------|------------|
| coordinating-loop references non-existent scripts directory | HIGH — script-based gates cannot work | Must either create scripts/ directory or remove all bash script references in favor of tool-based gates |
| No skill has `delegate-task` in allowed-tools | HIGH — cannot dispatch subagents | All ORCHESTRATION skills must have at minimum `delegate-task` and `delegation-status` |
| No skill has `execute-slash-command` in allowed-tools | MEDIUM — coordinating-loop flowchart references command dispatch but tool not whitelisted | Add to coordinating-loop and phase-execution |
| 0/5 skills reference session tools | MEDIUM — no session context available | coordinating-loop should reference session-tracker, session-hierarchy, session-context |
| Gate-orchestrator has no operational tool gaps | ✅ HEALTHY | Only skill without severe gaps — use as reference model |

### Cross-Reference Integrity Map

| Source Skill | References | Valid? |
|-------------|-----------|--------|
| coordinating-loop | dispatching-parallel-agents | ✅ exists |
| coordinating-loop | user-intent-interactive-loop | ⚠️ exists as `hm-l2-user-intent-interactive-loop` (prefix mismatch) |
| coordinating-loop | hm-planning-persistence | ❌ does not exist |
| coordinating-loop | phase-loop | ✅ exists as `hm-l2-phase-loop` (prefix mismatch — OK for text, bad for automation) |
| gate-orchestrator | gate-lifecycle-integration | ✅ exists |
| gate-orchestrator | gate-spec-compliance | ✅ exists |
| gate-orchestrator | gate-evidence-truth | ✅ exists |
| gate-orchestrator | hm-production-readiness | ✅ exists |
| gate-orchestrator | hm-requirements-analysis | ✅ exists |
| gate-orchestrator | hm-roadmap-maintainability | ✅ exists |
| gate-orchestrator | hm-lineage-router | ✅ exists |
| phase-execution | hm-coordinating-loop | ⚠️ name prefix mismatch — exists as `hm-l2-coordinating-loop` |
| phase-execution | hm-planning-persistence | ❌ does not exist |
| phase-execution | hm-phase-loop | ✅ exists |
| phase-execution | hm-subagent-delegation-patterns | ⚠️ may not exist as L2 — L3 version exists |
| phase-loop | hm-planning-persistence | ❌ does not exist |
| phase-loop | hm-phase-execution | ✅ exists |
| completion-looping | hm-coordinating-loop | ⚠️ name prefix mismatch |
| completion-looping | hm-phase-loop | ✅ exists |
| completion-looping | hm-planning-persistence | ❌ does not exist |

**Summary:**
- 4/5 skills reference `hm-planning-persistence` — ❌ NON-EXISTENT, remove from all
- 3/5 skills have name prefix mismatches — fix all to `hm-l2-` prefix
- 1 reference may point to wrong layer (subagent-delegation-patterns L3 vs L2)

### Overall Recommendations

1. **Unified allowed-tools baseline for ORCHESTRATION skills:**
   ```yaml
   allowed-tools:
     - Read
     - Write
     - Edit
     - Bash
     - Glob
     - Grep
     - delegate-task
     - delegation-status
     - execute-slash-command
     - hivemind-command-engine
     - hivemind-doc
   ```
   (Each skill may add more per its specific needs)

2. **Migrate all state paths** from `.opencode/state/` to `.hivemind/state/` across all skills

3. **Normalize cross-reference names** to full `hm-l2-*` prefixes

4. **Remove all `hm-planning-persistence` references** — replace with `hivemind-power-on` or remove entirely

5. **Replace bash script gates** with tool-based equivalents:
   - `bash scripts/check-gate.sh` → `delegate-task` + verify
   - `bash scripts/validate-envelope.sh` → inline validation + `delegation-status`
   - `bash scripts/run-ralph-loop.sh` → remove entirely

6. **D4 constraint enforcement:** After all edits, test jump link behavior at runtime by loading each rewritten skill and verifying that `<files_to_read>` paths render. Document actual behavior in a follow-up artifact.

7. **Add `hm-l2-subagent-delegation-patterns` existence check** to the rewrite plan. If it doesn't exist, either create it or remove cross-references from coordinating-loop and phase-execution.

---

## Skill Edit Priority Order

| Priority | Skill | Effort | Risk | Reason |
|----------|-------|--------|------|--------|
| 1 | hm-l2-coordinating-loop | HIGH | HIGH | Most broken (448 lines, 6 paths, 9 scripts, missing tools). Blocks all coordination. |
| 2 | hm-l2-phase-execution | MEDIUM | MEDIUM | Legacy paths, missing tools, broken cross-refs. Foundation for wave execution. |
| 3 | hm-l2-completion-looping | LOW | LOW | Mostly sound. Name fix + tool additions + 1 cross-ref removal. |
| 4 | hm-l2-phase-loop | LOW | LOW | Path migration + cross-ref fix + ralph-loop removal. |
| 5 | hm-l2-gate-orchestrator | LOWEST | LOWEST | Healthiest skill. 1 name fix + optional tool additions. |

---

## Total Edit Summary

| Metric | Value |
|--------|-------|
| Skills to edit | 5 |
| Total current lines | 1,166 |
| Total target lines | <970 (~17% reduction) |
| Broken paths to fix | 6 |
| Allowed-tools additions | ~15 across all skills |
| Non-existent skill refs to remove | 4 (hm-planning-persistence) |
| Name mismatches to fix | 5 |
| Legacy state paths to migrate | 3 |
| Ralph-loop sections to remove | 3 skills |
| Script references to eliminate | 9 (coordinating-loop only) |
| Cross-references to verify | 22 (14 valid, 5 name-fix, 4 remove) |
| Jump-link runtime tests required | 5 (D4 compliance) |
