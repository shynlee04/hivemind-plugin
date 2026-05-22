# Wave 3 Synthesis: FOUNDATION + REFERENCE Skills (5 skills)

**Date:** 2026-05-23
**Source files:** 5 SKILL.md files + 23-SYSTEM-AUDIT + 23-CONTEXT + 23-PATTERNS
**Wave scope:** Wave 3B (hivemind-power-on) + Wave 3C (4 REFERENCE skills)
**Status:** READY — scoping complete, gaps/debts documented

---

## Summary

| Metric | Value |
|--------|-------|
| Skills analyzed | 5 |
| Total current LOC | 2,125 (hivemind-power-on: 236 + engine-contracts: 451 + state-reference: 414 + integration-contracts: 447 + tool-capability-matrix: 577) |
| Total target LOC (post-edit) | <1,700 (~20% reduction) |
| Operational tools — include | 18 (✅ fully operational) |
| Partial tools — EXCLUDE from Wave 3 | 4 (🚫 TBD: run-background-command, hivemind-trajectory, hivemind-pressure, hivemind-agent-work) |
| Tools currently in allowed-tools that MUST be removed | 2 (hivemind-power-on lists hivemind-trajectory + hivemind-pressure) |
| Reference directories missing | 2 skills (engine-contracts, state-reference) |
| Reference directories empty | 1 skill (tool-capability-matrix has 0 content files) |
| IRON CLAW blocks (boilerplate duplication) | 4/5 skills — 5-step validation chain repeated identically |
| Anti-pattern tables | 3/5 skills present |
| Self-correction sections | 5/5 skills present (consistent pattern) |

---

## Tool Scope

### Operational — Include as Reference (✅ 18 tools)

| Tool | Phase Origin | Include In |
|------|-------------|-----------|
| `delegate-task` | CP-DT-01 ✅ | hivemind-power-on, engine-contracts, tool-capability-matrix |
| `delegation-status` | CP-DT-01 ✅ | hivemind-power-on, engine-contracts |
| `execute-slash-command` | P21.1 ✅ | hivemind-power-on (tool catalog), engine-contracts |
| `session-tracker` | CP-ST-01 ✅ | hivemind-power-on, state-reference |
| `session-hierarchy` | CP-ST-01 ✅ | hivemind-power-on |
| `session-context` | CP-ST-01 ✅ | hivemind-power-on |
| `hivemind-session-view` | P16 ✅ | hivemind-power-on |
| `hivemind-command-engine` | CP-CMD-01 ✅ | hivemind-power-on (tool catalog), engine-contracts |
| `prompt-skim` | Pre-restructuring ✅ | hivemind-power-on (tool catalog) |
| `prompt-analyze` | Pre-restructuring ✅ | hivemind-power-on (tool catalog) |
| `session-patch` | Pre-restructuring ✅ | hivemind-power-on |
| `session-journal-export` | Pre-restructuring ✅ | state-reference |
| `hivemind-doc` | Pre-restructuring ✅ | engine-contracts |
| `hivemind-sdk-supervisor` | P14 ✅ | engine-contracts |
| `configure-primitive` | BOOT ✅ | tool-capability-matrix (meta-builder tools), integration-contracts |
| `validate-restart` | BOOT ✅ | tool-capability-matrix |
| `bootstrap-init` | BOOT ✅ | hivemind-power-on (init context) |
| `bootstrap-recover` | BOOT ✅ | hivemind-power-on (recovery context) |

### Partial — EXCLUDE from Wave 3 Scope (🚫 4 tools)

These tools are 🟡 PARTIAL per 23-SYSTEM-AUDIT. They MUST NOT appear in Wave 3 skill edits because their designs are pending future phases:

| Tool | Status | Blocking Phase | Exclusion Reason |
|------|--------|---------------|------------------|
| `run-background-command` | 🟡 PARTIAL | CP-PTY-01 chưa start | PTY control-plane MVP not implemented. Currently in tool-capability-matrix Hivemind custom tools list — must NOT be removed from matrix (it's catalogued) but must be flagged as PARTIAL. Must NOT appear in hivemind-power-on tool catalog after trim. |
| `hivemind-trajectory` | 🟡 PARTIAL | P24 chưa tới | State machine untested. Currently in hivemind-power-on allowed-tools (line 30) and tool catalog (line 175) — **MUST BE REMOVED** from both. In engine-contracts (line 176 for trajectory) — must be removed or flagged PARTIAL with caveat. |
| `hivemind-pressure` | 🟡 PARTIAL | P26 chưa tới | Redesign pending. Currently in hivemind-power-on allowed-tools (line 34) and tool catalog (line 178) — **MUST BE REMOVED** from both. In engine-contracts tool table — must be removed or flagged PARTIAL. |
| `hivemind-agent-work` | 🟡 PARTIAL | P24-25 chưa tới | Lifecycle untested. In hivemind-power-on tool catalog (lines 183-184) — must be removed during trim. In engine-contracts tool table — must be removed or flagged PARTIAL. |

### Mapping to Skill Files (confirmed from glob + read)

| Tool Exists In | Skills |
|----------------|--------|
| hivemind-power-on allowed-tools (line 30) | `hivemind-trajectory` ← 🚫 REMOVE |
| hivemind-power-on allowed-tools (line 34) | `hivemind-pressure` ← 🚫 REMOVE |
| hivemind-power-on tool catalog (lines 168-188) | Lists all 18 tools including `hivemind-trajectory`, `hivemind-pressure`, `hivemind-agent-work` ← 🚫 REMOVE 4 PARTIAL tools, keep 18 operational |
| engine-contracts tool table (lines 124-137) | Lists `run-background-command` (line 129), plus `delegate-task`, `delegation-status`, `prompt-skim`, `prompt-analyze`, `session-patch`, `session-journal-export`, `configure-primitive`, `validate-restart` |
| engine-contracts cross-ref (line 176, 178) | References `hivemind-trajectory` and `hivemind-pressure` — must be removed or flagged with PARTIAL caveat |
| tool-capability-matrix (lines 156-165) | Lists `run-background-command` (line 157) — must NOT be removed from catalog (documentation) but must be flagged 🟡 PARTIAL with caveat |

---

## Skill 1: hivemind-power-on — Session Governance Core

### Current State

| Field | Value |
|-------|-------|
| **Lines** | 236 |
| **Layer** | — (hivemind lineage, L0-support) |
| **Load priority** | 1 (LOAD FIRST) |
| **allowed-tools** | skill, read, grep, glob, bash, task, todowrite, session-tracker, session-hierarchy, session-context, hivemind-session-view, delegation-status, **hivemind-trajectory 🚫**, prompt-skim, prompt-analyze, hivemind-doc, **hivemind-pressure 🚫** |
| **Consumed-by** | hm-l0-orchestrator, hf-l0-orchestrator, hm-l1-coordinator, hf-l1-coordinator, hm-l2-conductor, hf-l2-meta-builder |
| **References** | `references/` directory ✅ (6 files: session-tracker-anatomy, task-tool-resume, lineage-routing, project-phase-routing, continuity-navigation, delegation-depth-recovery) |
| **Tool catalog** | 18 tools (lines 166-188) — includes 4 PARTIAL tools that must be removed |
| **Jump links** | Lines 149-162 — progressive disclosure table with 6 reference files |

### Critical Issues

| # | Issue | Lines | Severity |
|---|-------|-------|----------|
| 1 | **`hivemind-trajectory` in allowed-tools** | Line 30 | 🔴 HIGH — PARTIAL tool, not operational per SYSTEM-AUDIT, redesign pending P24 |
| 2 | **`hivemind-pressure` in allowed-tools** | Line 34 | 🔴 HIGH — PARTIAL tool, redesign pending P26 |
| 3 | **Tool catalog includes 4 PARTIAL tools** | Lines 175-184 | 🟡 MEDIUM — trajectory (line 175), pressure (line 178), agent-work-create (line 183), agent-work-export (line 184) must be removed or flagged with caveats |
| 4 | **Tool catalog too long (18 tools)** | Lines 166-188 | 🟡 MEDIUM — per PATTERNS.md trim plan, compress to 6-line summary or remove (tools already documented in tool-capability-matrix) |
| 5 | **Bootstrap/recovery tools missing from allowed-tools** | — | 🟡 LOW — `bootstrap-init` and `bootstrap-recover` are not in allowed-tools but should be for init/recovery workflows |
| 6 | **`delegate-task` not in allowed-tools** | — | 🟡 LOW — referenced in tool catalog (line 176) but not in allowed-tools frontmatter. As "LOAD FIRST" skill for orchestrators, this is inconsistent. |

### Target Scope (Reduce)

| Dimension | Current | Target |
|-----------|---------|--------|
| Lines | 236 | ~150-160 |
| allowed-tools | 17 | 17 (remove 2 TBD, add 0 if bootstrap stays implicit) |
| Tool catalog tools | 18 | 14 (remove 4 PARTIAL, keep 14 operational) |
| Tool catalog lines | 22 lines (168-188) | ~6-8 lines (summary format) |
| Broken/missing ref paths | 0 | 0 (verify after edits) |

### Edits Required

1. **Remove `hivemind-trajectory`** from allowed-tools (line 30)
2. **Remove `hivemind-pressure`** from allowed-tools (line 34)
3. **Compress tool catalog** (lines 164-188) — replace 22-line per-tool table with:
   - Brief sentence pointing to `hm-l3-tool-capability-matrix` for full catalog
   - 4-6 line summary of key tool categories (session, delegation, prompt, config)
   - Cross-reference: "See hm-l3-tool-capability-matrix for complete catalog with permission levels"
4. **Remove hivemind-trajectory, hivemind-pressure, hivemind-agent-work-create, hivemind-agent-work-export** from tool catalog (or mark with 🟡 PARTIAL caveat)
5. **Add `delegate-task`** to allowed-tools (consistency with tool catalog)
6. **Verify all 6 reference files exist** and path references are correct (lines 155-162)
7. **Verify jump link rendering** at runtime per D4 constraint

### Gaps & Debts

| Gap | Severity | Description |
|-----|----------|-------------|
| References dir exists (6 files) | ✅ VERIFIED | No gap — 6 reference files confirmed on disk |
| `bootstrap-init`/`bootstrap-recover` not in allowed-tools | 🟡 LOW | Only in tool catalog. If orchestrators need to init/recover sessions, they need these tools. Add to allowed-tools or document that these are hf-meta-builder tools. |
| D4 jump link verification required | 🔴 HIGH | Per CONTEXT.md D4: "Jump link + progressive disclosure verification REQUIRED — user reports these mechanisms do NOT work in loaded skills." Must test at runtime after edits. |
| `delegate-task` in catalog but not in allowed-tools | 🟡 LOW | Trimming tool catalog may solve this (remove individual entries, point to tool-capability-matrix) |

---

## Skill 2: hm-l3-hivemind-engine-contracts — Engine Integration Contracts

### Current State

| Field | Value |
|-------|-------|
| **Lines** | 451 |
| **Layer** | L3 REFERENCE |
| **Role** | reference |
| **Pattern** | P2 |
| **context-bomb** | true |
| **allowed-tools** | Read, Grep, Glob, Bash |
| **References** | `references/` directory ❌ **DOES NOT EXIST** |
| **Source verification** | Claims "All contracts verified against src/plugin.ts and src/lib/ source code (2026-04-30)" — **~23 days stale** |
| **Cross-references** | hm-l3-hivemind-state-reference (line 449) |

### IRON CLAW Block

**4,600+ characters** (lines 24-90) — the full 5-step validation chain, consumption rules table, and integrated enforcement points table. Identical boilerplate across engine-contracts, state-reference, integration-contracts, tool-capability-matrix.

### Critical Issues

| # | Issue | Lines | Severity |
|---|-------|-------|----------|
| 1 | **No `references/` directory** | — | 🔴 HIGH — skill references external docs for plugin load order, tool registration, hook composition but has no reference files on disk |
| 2 | **Source verification 23 days stale** | Line 20 | 🔴 HIGH — claims verified against `src/plugin.ts` as of 2026-04-30. Today is 2026-05-23. Plugin load order, tool count, and registrations may have changed (e.g., Phase 22 added delegation-status notification routing, P21 added execute-slash-command). Must reverify. |
| 3 | **Tool registration table omits 15 tools** | Lines 124-137 | 🟡 MEDIUM — table lists 9 tools but SYSTEM-AUDIT confirms 23 tools registered. Missing: `session-tracker`, `session-hierarchy`, `session-context`, `hivemind-session-view`, `hivemind-command-engine`, `hivemind-sdk-supervisor`, `hivemind-doc`, `hivemind-trajectory` (PARTIAL), `hivemind-pressure` (PARTIAL), `hivemind-agent-work-create/export`, `bootstrap-init`, `bootstrap-recover`, `run-background-command` (PARTIAL). Skill says "Currently registered tools (8 tools)" — count is wrong. |
| 4 | **References `hivemind-trajectory`, `hivemind-pressure` as stable tools** | Lines 176, 178 | 🟡 MEDIUM — cross-references in tool sections reference PARTIAL tools as if they are stable. Must flag with PARTIAL caveat. |
| 5 | **IRON CLAW bloated** | Lines 24-90 | 🟡 MEDIUM — 67 lines of boilerplate. Can be compressed to ~15 lines with cross-reference to a canonical source. |
| 6 | **Concurrency defaults outdated?** | Lines 269-293 | 🟡 LOW — may still reference `src/lib/` paths. Per WS-SR restructuring, `src/lib/` was removed. Code now lives under `src/shared/`, `src/coordination/`, etc. Verify paths. |

### Target Scope (Reduce)

| Dimension | Current | Target |
|-----------|---------|--------|
| Lines | 451 | <380 |
| IRON CLAW | 67 lines | ~20 lines (cross-ref to canonical IRON CLAW doc) |
| Source verification staleness | 23 days | 0 days (reverify against current src/plugin.ts) |
| Tool registration table | 9 tools | 23 tools (complete from SYSTEM-AUDIT) |
| References directory | MISSING | Optional — all content is inline, no external refs needed |
| PARTIAL tool refs | 3 unmarked | All flagged with 🟡 PARTIAL caveat |

### Edits Required

1. **Reverify plugin load order** against current `src/plugin.ts` — load order may have changed since April 30
2. **Update tool registration table** (lines 124-137) — expand from 9 tools to all 23 tools, or note that some are documented in tool-capability-matrix and point there
3. **Remove or flag `hivemind-trajectory`, `hivemind-pressure`, `hivemind-agent-work`, `run-background-command`** as PARTIAL (or remove them from stable tool groups)
4. **Compress IRON CLAW** (lines 24-90) — keep Step 1-5 outline but remove consumption rules and enforcement points tables (those are for implementation authority, not needed for a read-only reference skill)
5. **Update stale path references** — `src/lib/` → `src/shared/`, `src/coordination/`, etc. per WS-SR restructuring
6. **Remove or update** the "Source verification" date claim — reverify and update
7. **Add cross-reference** to `hm-l3-tool-capability-matrix` for complete tool catalog

### Gaps & Debts

| Gap | Severity | Description |
|-----|----------|-------------|
| References directory missing | 🟡 LOW | No reference files shipped with this skill. This is actually fine — all content is inline. But the skill's frontmatter or "On Load" section should not reference external files that don't exist. |
| 23-day staleness of source verification | 🔴 HIGH | Contract accuracy depends on current source code. Must reverify `src/plugin.ts` load order (line 96-106), tool registration (line 124-137), budget defaults (line 300-306), concurrency policies (line 269-293). |
| `src/lib/` → restructured paths | 🟡 MEDIUM | Per WS-SR restructuring (CP-ST-04 etc.), `src/lib/` was removed. Skill still references `src/lib/completion-detector.ts`, `src/lib/concurrency.ts`, `src/lib/types.ts`. Must update to current paths. |
| Tool count wrong ("8 tools" → 23 tools) | 🟡 MEDIUM | Skill claims 8 registered tools but SYSTEM-AUDIT confirms 23. Must fix. |
| Locked decisions Q1-Q6 reference (line 10) | 🟡 LOW | Frontmatter `requires: Q1-Q6-validation-decisions` — Q6 decisions have been made but may need reverification per current state. |

---

## Skill 3: hm-l3-hivemind-state-reference — State Root Reference

### Current State

| Field | Value |
|-------|-------|
| **Lines** | 414 |
| **Layer** | L3 REFERENCE |
| **Role** | reference |
| **Pattern** | P2 |
| **context-bomb** | true |
| **allowed-tools** | Read, Grep, Glob, Bash |
| **References** | `references/` directory ❌ **DOES NOT EXIST** |
| **Cross-references** | hm-l3-hivemind-engine-contracts (line 412) |

### Issues

| # | Issue | Lines | Severity |
|---|-------|-------|----------|
| 1 | **IRON CLAW boilerplate** | Lines 24-90 | 🟡 MEDIUM — 67 lines identical to engine-contracts, integration-contracts, tool-capability-matrix |
| 2 | **No references directory** | — | 🟡 LOW — all content inline, no external files needed |
| 3 | **`.hivemind/` structure may have changed** | Lines 93-115 | 🟡 MEDIUM — directory tree documented from writing date may not match current filesystem. Must verify with `ls -R .hivemind/`. |
| 4 | **`config-workflows.json` documented but stale?** | Lines 271-311 | 🟡 LOW — Phase 21 may have changed workflow persistence format. Verify against current file on disk. |
| 5 | **Planning persistence documented** | Lines 312-329 | 🟡 LOW — references `hm-planning-persistence` template format. This skill was identified as non-existent in W2 synthesis. |
| 6 | **Agent Access Boundaries table may need update** | Lines 360-366 | 🟡 LOW — L3 reference say "read-only, no direct write" — correct. But L2 specialists listed as "read-only" which matches W2 findings. |
| 7 | **Legacy `.opencode/state/` references** | Lines 373-374 | 🟡 LOW — Anti-pattern #3 flags `.opencode/state/` as migration-only. Good — this is correct guidance. |

### Target Scope (Reduce)

| Dimension | Current | Target |
|-----------|---------|--------|
| Lines | 414 | <350 |
| IRON CLAW | 67 lines | ~20 lines |
| `.hivemind/` accuracy | Assumed | Verified against disk |

### Edits Required

1. **Compress IRON CLAW** (lines 24-90) — keep 5 steps, remove consumption/enforcement tables
2. **Verify `.hivemind/` directory structure** (lines 93-115) against current filesystem — run `ls -R .hivemind/` and update any discrepancies
3. **Verify `session-continuity.json` schema** (lines 121-178) — particularly `PendingNotification` format which was modified in Phase 22 (notification TTL, retry). Ensure `delivered` boolean and `metadata.delegationId` fields are documented.
4. **Verify `delegations.json` schema** (lines 203-228) — check if Phase 22 added fields (`errorCode`, `notificationRetryCount`, `notificationTTL`)
5. **Update planning persistence section** (lines 312-329) — remove `hm-planning-persistence` reference, or note it's a template format
6. **Remove `event-tracker/` legacy section** (lines 244-269) — or compress to 2-line note. Currently 24 lines documenting a removed system.
7. **Verify anti-pattern #3** (line 374-375) — `.opencode/state/` → `.hivemind/` migration guidance is correct, keep as-is

### Gaps & Debts

| Gap | Severity | Description |
|-----|----------|-------------|
| `.hivemind/` structure not verified against disk | 🟡 MEDIUM | May contain artifacts from Phase 22 (notification TTL records), Phase 21 (delegation refactoring), or other recent phases that the docs don't reflect. Must verify. |
| `event-tracker/` section is dead weight | 🟡 LOW | 24 lines documenting a removed system. "REMOVED in CP-ST-03" (line 244). Could compress to "REMOVED — see session-tracker instead" (2 lines). |
| IRON CLAW duplication across 4 REFERENCE skills | 🟡 HIGH | Every REFERENCE skill copies the exact same 67-line IRON CLAW block. 4 × 67 = 268 lines of identical boilerplate. Consider centralizing into a shared reference file that all skills cross-reference. |
| `hm-planning-persistence` name inconsistency | 🟡 LOW | W2 found this skill does not exist. State-reference documents its template format as if it exists. Either remove or note that the template is used but the skill was never created. |

---

## Skill 4: hm-l3-integration-contracts — Agent↔Skill Binding Contracts

### Current State

| Field | Value |
|-------|-------|
| **Lines** | 447 |
| **Layer** | L3 REFERENCE |
| **Role** | integration-contracts |
| **Pattern** | P2 |
| **Lineage** | hm-\* |
| **allowed-tools** | Read, Write, Edit, Bash, Glob, Grep |
| **References** | `references/` ✅ **(4 files: agent-to-skill-bindings.md, contract-schema.md, cross-lineage-rules.md, skill-to-agent-bindings.md)** |
| **Consumed-by** | hm-l0, hm-l1, hm-l2-\*, hf-l2-\*, both skill-routers |
| **Cross-references** | hm-l2-skill-router, hf-l2-skill-router, hf-l2-naming-syndicate, gate-l3-evidence-truth |

### Issues

| # | Issue | Lines | Severity |
|---|-------|-------|----------|
| 1 | **IRON CLAW boilerplate** | Lines 46-111 | 🟡 MEDIUM — 66 lines identical to other REFERENCE skills |
| 2 | **Agent inventory may be stale (97 agents)** | Line 413 | 🟡 MEDIUM — claims "97 agents mapped" but this is from April 2026. Current agent count may differ. Must verify against `.opencode/agents/`. |
| 3 | **RICH-8 self-scoring asserts PASS** | Lines 410-422 | 🟡 MEDIUM — self-scored at 108/120 (A-grade). This is a claim that needs reverification per current codebase. |
| 4 | **On Load instructions point to non-existent validation script** | Line 129 | 🟡 MEDIUM — `scripts/validate-contracts.sh` — does this script exist on disk? If not, the "On Load" instruction is broken. |
| 5 | **Write + Edit in allowed-tools for a REFERENCE skill** | Line 36 | 🟡 LOW — `Write` and `Edit` in allowed-tools is unusual for an L3 reference skill. Allowed-tools should match the REFERENCE standard: `Read, Grep, Glob, Bash`. Write/Edit may be for updating contract bindings but this contradicts the L3 read-only role. |
| 6 | **`configure-primitive` not in allowed-tools** | — | 🟡 LOW — integration contracts need to compile/decompile agent and skill definitions to verify bindings. Tool is operational but missing from allowed-tools. |

### Target Scope (Reduce)

| Dimension | Current | Target |
|-----------|---------|--------|
| Lines | 447 | <380 |
| IRON CLAW | 66 lines | ~20 lines |
| allowed-tools | Read, Write, Edit, Bash, Glob, Grep | Read, Grep, Glob, Bash, configure-primitive (remove Write/Edit for L3 reference role) |
| Agent inventory | 97 (claimed) | Verified actual count |
| Validation script | referenced | verified existence or remove reference |

### Edits Required

1. **Compress IRON CLAW** (lines 46-111) — keep 5 steps, remove consumption/enforcement tables
2. **Remove `Write` and `Edit` from allowed-tools** (line 36) — L3 reference skill should not need write/edit permissions. If writing contracts is needed, it's a meta-builder task (hf-* lineage).
3. **Add `configure-primitive`** to allowed-tools — for reading current agent/skill definitions
4. **Verify agent count** — check `.opencode/agents/` for actual count. Update "97 agents" claim if stale.
5. **Verify `scripts/validate-contracts.sh` exists** (line 129) — if not, either create it or remove the reference
6. **Verify all 4 reference files content** — `agent-to-skill-bindings.md`, `contract-schema.md`, `cross-lineage-rules.md`, `skill-to-agent-bindings.md` exist at 7-8KB each (confirmed). Verify paths match current `.opencode/skills/hm-l3-integration-contracts/references/`.
7. **Update RICH-8 scorecard** (lines 410-422) — reverify PASS claims against current state
8. **Verify cross-lineage rules** (lines 322-328) — Rule 5 says hf agents MAY load hm skills. Confirm this is still the correct policy per D-AD-01.

### Gaps & Debts

| Gap | Severity | Description |
|-----|----------|-------------|
| 97 agent count claim unverified | 🟡 MEDIUM | Agent definitions may have been added/renamed since April. Must glob and count. |
| `scripts/validate-contracts.sh` existence unknown | 🟡 MEDIUM | Referenced as executable validation (line 129) but may not exist. Must verify. |
| Write/Edit on L3 reference skill | 🟡 LOW | Contradicts REFERENCE standard pattern. Contracts should be maintained by hf-meta-builder, not updated by reference skills. |
| Integration contracts reference non-existent `hm-planning-persistence` | 🟡 LOW | Skill-to-agent table (lines 237-238): `hm-l2-planning-persistence` appears in "Planning Skills" section. This skill was created but what about `scripts/validate-contracts.sh`? |
| RICH-8 self-scoring is L5 claim | 🟡 MEDIUM | Scorecard is a self-assessment. Does not validate contracts against current disk state. The score may be stale. |

---

## Skill 5: hm-l3-tool-capability-matrix — Complete Tool Catalog

### Current State

| Field | Value |
|-------|-------|
| **Lines** | 577 |
| **Layer** | L3 REFERENCE |
| **Role** | reference |
| **Pattern** | P2 |
| **context-bomb** | false |
| **allowed-tools** | Read, Grep, Glob |
| **References** | `references/` directory ✅ **exists but EMPTY (0 content files)** |
| **Cross-references** | hm-l3-opencode-platform-reference, hm-l3-subagent-delegation-patterns, hf-l2-naming-syndicate, hf-l2-delegation-gates, opencode-config-workflow |

### Issues

| # | Issue | Lines | Severity |
|---|-------|-------|----------|
| 1 | **IRON CLAW boilerplate** | Lines 34-99 | 🟡 MEDIUM — 66 lines identical to other REFERENCE skills |
| 2 | **Hivemind custom tools list may be stale** | Lines 154-165 | 🟡 MEDIUM — lists 10 tools. SYSTEM-AUDIT confirms 23 tools registered. Missing: session-tracker, session-hierarchy, session-context, hivemind-session-view, hivemind-command-engine, hivemind-sdk-supervisor, hivemind-doc, hivemind-trajectory (PARTIAL), hivemind-pressure (PARTIAL), hivemind-agent-work (PARTIAL), bootstrap-init, bootstrap-recover. Table may need expansion. |
| 3 | **56-agent analysis may be stale** | Lines 451-463 | 🟡 MEDIUM — "Based on actual agent definitions in .opencode/agents/ (April 2026)". Agent definitions may have changed. Must reverify. |
| 4 | **Per-depth permissions may not match current agent frontmatter** | Lines 200-290 | 🟡 MEDIUM — Derived from "56 agent definitions" but agents may have been updated. Must spot-check L0/L1/L2 permissions against current frontmatter. |
| 5 | **References directory EMPTY** | — | 🟡 LOW — `references/` exists but contains only `.gitkeep`. Skill has no external reference files. This is fine if all content is inline. |
| 6 | **`run-background-command` listed as stable Hivemind tool** | Line 157 | 🟡 MEDIUM — Listed without PARTIAL caveat. SYSTEM-AUDIT classifies it as 🟡 PARTIAL. Must add caveat. |
| 7 | **Hivemind Session-View missing from Hivemind tools table** | — | 🟡 MEDIUM — `hivemind-session-view` is operational (P16 ✅) but not listed in the Hivemind custom tools section. |
| 8 | **Hivemind Command Engine missing from Hivemind tools table** | — | 🟡 MEDIUM — `hivemind-command-engine` is operational (CP-CMD-01 ✅) but not listed. |
| 9 | **Bootstrap tools missing from Hivemind tools table** | — | 🟡 MEDIUM — `bootstrap-init` and `bootstrap-recover` are operational (BOOT ✅) but not listed. |
| 10 | **Session-tracker/hierarchy/context missing** | — | 🟡 MEDIUM — these 3 tools are operational (CP-ST-01 ✅) but the Hivemind tools table only lists 10 tools, missing these foundational session tools. |

### Target Scope (Reduce)

| Dimension | Current | Target |
|-----------|---------|--------|
| Lines | 577 | <480 |
| IRON CLAW | 66 lines | ~20 lines |
| Hivemind tools listed | 10 | 18 (add missing operational tools) |
| Agent count | 56 (claimed) | Verified actual count |
| PARTIAL tool flags | 0 | 4 (mark all PARTIAL tools with 🟡 caveat) |

### Edits Required

1. **Compress IRON CLAW** (lines 34-99) — keep 5 steps, remove consumption/enforcement tables
2. **Expand Hivemind custom tools table** (lines 154-165) — add missing operational tools:
   - `session-tracker`, `session-hierarchy`, `session-context`, `hivemind-session-view`
   - `hivemind-command-engine`, `hivemind-sdk-supervisor`, `hivemind-doc`
   - `bootstrap-init`, `bootstrap-recover`
3. **Add 🟡 PARTIAL flags** to: `run-background-command`, `hivemind-trajectory`, `hivemind-pressure`, `hivemind-agent-work-create/export`
4. **Update 56-agent analysis** (lines 451-463) — reverify agent count from `.opencode/agents/`
5. **Verify per-depth permissions** (lines 200-290) — spot-check 3-4 agent frontmatter files for permission drift
6. **Update "April 2026" date claim** (line 452) — to current verification date
7. **Add PARTIAL tool section** — new section after the stable tool catalog documenting all 4 PARTIAL tools with their caveats and target phases
8. **Update per-lineage rules** (lines 311-391) — verify hm STRICT rules against current agent frontmatter (particularly `configure-primitive` always ask on hm — confirm this is still the policy)

### Gaps & Debts

| Gap | Severity | Description |
|-----|----------|-------------|
| 56-agent count likely stale | 🟡 MEDIUM | Last verified April 2026. Agent definitions may have been added in Phase 21 (execute-slash-command agents), Phase 22 (error/status agents), or other phases. Must recount. |
| 10/18 operational Hivemind tools documented | 🟡 HIGH | Table lists 10 tools but SYSTEM-AUDIT confirms 18 operational + 4 PARTIAL. Missing operational tools include core session tools (session-tracker, session-hierarchy, session-context) and bootstrap tools. |
| `hivemind-session-view` not documented despite being in hivemind-power-on | 🟡 MEDIUM | P16 session-view tool is operational but absent from the Hivemind tool catalog in this skill. |
| Per-depth L2 tool denials (lines 279-292) need verification | 🟡 LOW | Claims L2 agents "explicitly ask" harness tools. This is a generalization — must verify against current agent frontmatter. |
| References directory empty with `On Load` instructions | 🟡 LOW | Skill's "On Load" says to scan references — but refs dir is empty. Either remove On Load instruction or add actual reference files. |

---

## Cross-Skill Findings

### Redundancies

| Pattern | Appears In | Recommendation |
|---------|-----------|---------------|
| **IRON CLAW 5-step validation block** (67 lines) | engine-contracts (lines 24-90), state-reference (lines 24-90), integration-contracts (lines 46-111), tool-capability-matrix (lines 34-99) — **4/5 skills** | Extract to shared reference file (e.g., `references/IRON-CLAW-STANDARD.md`) that all REFERENCE skills cross-reference. Saves ~200 lines total. Each skill carries: `## IRON CLAW — see [references/IRON-CLAW-STANDARD.md]` (3 lines). |
| **Anti-Patterns table** | engine-contracts (lines 398-407), state-reference (lines 369-376), tool-capability-matrix (lines 467-476) — **3/5 skills** | Consistent pattern. Keep as-is. |
| **Self-Correction 4-mode pattern** | hivemind-power-on, engine-contracts, state-reference, integration-contracts, tool-capability-matrix — **5/5 skills** | Consistent pattern. Keep as-is. |
| **Cross-References table** | engine-contracts, state-reference, integration-contracts, tool-capability-matrix — **4/5 skills** | Consistent pattern. Keep as-is. |
| **PARTIAL tools referenced without caveats** | engine-contracts (trajectory, pressure — lines 176, 178), tool-capability-matrix (run-background-command — line 157) | Both reference PARTIAL tools as if stable. Must add 🟡 caveats. |

### Staleness Issues

| Claim | Skills | Verification Needed |
|-------|--------|-------------------|
| "Verified against source 2026-04-30" | engine-contracts (line 20) | 23 days stale. Plugin load order, tool count, budget defaults may have changed. |
| "From 56 agent definitions (April 2026)" | tool-capability-matrix (line 452) | Agent count may have changed. Phase 21/P22 may have added agents. |
| "97 agents mapped" | integration-contracts (line 413) | Claim may be stale. Must glob and recount. |
| `.hivemind/` directory structure | state-reference (lines 93-115) | Structure may have changed with Phase 22 notification TTL, Phase 21 delegation refactoring. |
| "All contracts verified" claim | engine-contracts (line 451) | Must reverify plugin load order, tool registration, hook composition against current `src/plugin.ts`. |

### Missing Tools in Skill Catalogs

| Missing Tool | Operational? | Appears In | Missing From |
|-------------|-------------|------------|-------------|
| `session-tracker` | ✅ OPERATIONAL | hivemind-power-on | tool-capability-matrix, engine-contracts |
| `session-hierarchy` | ✅ OPERATIONAL | hivemind-power-on | tool-capability-matrix, engine-contracts |
| `session-context` | ✅ OPERATIONAL | hivemind-power-on | tool-capability-matrix, engine-contracts |
| `hivemind-session-view` | ✅ OPERATIONAL | hivemind-power-on | tool-capability-matrix, engine-contracts |
| `hivemind-command-engine` | ✅ OPERATIONAL | hivemind-power-on | tool-capability-matrix, engine-contracts |
| `hivemind-sdk-supervisor` | ✅ OPERATIONAL | engine-contracts | tool-capability-matrix |
| `hivemind-doc` | ✅ OPERATIONAL | engine-contracts | tool-capability-matrix |
| `bootstrap-init` | ✅ OPERATIONAL | hivemind-power-on | tool-capability-matrix, engine-contracts |
| `bootstrap-recover` | ✅ OPERATIONAL | hivemind-power-on | tool-capability-matrix, engine-contracts |

### PARTIAL Tools — Reference Audit (Wave 3 Scope Enforcement)

| Tool | Appears In Skill | Current Treatment | Required Action |
|------|-----------------|------------------|-----------------|
| `run-background-command` | tool-capability-matrix (line 157) | Listed without caveat | Add 🟡 PARTIAL caveat + "CP-PTY-01 pending" |
| `hivemind-trajectory` | hivemind-power-on (line 30, 175) | In allowed-tools + tool catalog | **REMOVE from allowed-tools** + flag as PARTIAL in tool catalog |
| `hivemind-trajectory` | engine-contracts (line 176) | Cross-referenced as stable tool | Flag with 🟡 PARTIAL caveat or remove |
| `hivemind-pressure` | hivemind-power-on (line 34, 178) | In allowed-tools + tool catalog | **REMOVE from allowed-tools** + flag as PARTIAL in tool catalog |
| `hivemind-pressure` | engine-contracts (line 178) | Cross-referenced as stable tool | Flag with 🟡 PARTIAL caveat or remove |
| `hivemind-agent-work` | hivemind-power-on (lines 183-184) | In tool catalog | Remove from tool catalog during trim |
| `hivemind-agent-work` | engine-contracts (cross-ref) | Not directly listed but related | No action needed if not explicitly referenced |

### Dependency Issues

| Issue | Impact | Resolution |
|-------|--------|------------|
| No skill has `delegate-task` in allowed-tools | 🟡 MEDIUM — hivemind-power-on references it in catalog but cannot call it | Add to hivemind-power-on allowed-tools |
| 4/5 skills have near-identical IRON CLAW blocks | 🟡 MEDIUM — 268 lines of duplicate content | Create shared IRON CLAW reference file |
| 2 skills missing references/ directory (engine-contracts, state-reference) | 🟡 LOW — all content is inline, no external refs needed | No action if content is complete without refs |
| tool-capability-matrix references empty dir | 🟡 LOW — On Load section says "Scan references" but none exist | Either add reference files or remove On Load instruction |
| PARTIAL tools inconsistently flagged | 🟡 HIGH — some skills flag them, others don't, some list in allowed-tools | Create consistent PARTIAL tool flagging protocol across all skills |
| Source staleness across all REFERENCE skills | 🟡 HIGH — each has "verified at date" claims that are 23+ days old | All need reverification against current codebase |

---

## Skill Edit Priority Order

| Priority | Skill | Effort | Risk | Reason |
|----------|-------|--------|------|--------|
| 1 | **hm-l3-tool-capability-matrix** | HIGH | HIGH | Most lines (577), missing 8+ operational tools, needs 4 PARTIAL caveats. Foundation for all other skills' tool references. Must be updated FIRST so other skills can cross-reference it. |
| 2 | **hivemind-power-on** | MEDIUM | HIGH | Critical allowed-tools fixes (remove 2 PARTIAL tools from allowed-tools). Tool catalog trim. Bootstrap/init tools may need addition. Used by all L0/L1 agents. |
| 3 | **hm-l3-hivemind-engine-contracts** | HIGH | HIGH | 23-day stale source verification. Tool registration table needs update (8 → 18+ tools). `src/lib/` → restructured paths. Staleness could produce incorrect guidance. |
| 4 | **hm-l3-integration-contracts** | MEDIUM | MEDIUM | 97-agent count unverified. RICH-8 scorecard may be stale. allowed-tools has Write/Edit for L3 ref skill. `configure-primitive` missing. |
| 5 | **hm-l3-hivemind-state-reference** | LOW | MEDIUM | `.hivemind/` structure verification needed. `event-tracker/` dead weight. IRON CLAW compression. Least critical of the set. |

### Edit Dependency Chain

```
tool-capability-matrix (fix tool catalog FIRST)
    ↓
hivemind-power-on (trim catalog → cross-ref tool-capability-matrix)
    ↓
engine-contracts (update tool registration → cross-ref tool-capability-matrix)
    ↓
integration-contracts (verify bindings, verify agent count)
    ↓
state-reference (verify .hivemind/ structure)
```

---

## Total Edit Summary

| Metric | Value |
|--------|-------|
| Skills to edit | 5 |
| Total current lines | 2,125 |
| Total target lines (post-edit) | <1,700 (~20% reduction) |
| IRON CLAW blocks to compress | 4 skills (saves ~180 lines) |
| Allowed-tools additions | +3 across all skills (delegate-task, configure-primitive) |
| Allowed-tools removals | 4 total: +2 from power-on (trajectory, pressure) + 2 from integration-contracts (Write, Edit) |
| PARTIAL tool caveats to add | 7 mentions across 3 skills |
| Missing operational tools to add to catalog | 9 tools in tool-capability-matrix |
| Stale date/claim to reverify | 4 claims across 3 skills |
| Cross-references to verify | ~25 across all skills |
| `.hivemind/` structure to verify | 1 skill (state-reference) |
| Agent counts to reverify | 2 skills (integration-contracts: 97, tool-capability-matrix: 56) |
| Jump-link runtime tests required | 3 skills (D4 compliance: power-on, integration-contracts, tool-capability-matrix — skills with reference files) |

---

## Verification Checklist (post-edit)

- [ ] hivemind-power-on: `hivemind-trajectory` and `hivemind-pressure` removed from allowed-tools
- [ ] hivemind-power-on: tool catalog compressed (22 lines → ~6 lines, cross-ref to tool-capability-matrix)
- [ ] hivemind-power-on: 4 PARTIAL tools removed from catalog
- [ ] engine-contracts: tool registration table updated (9 → 18+ operational tools)
- [ ] engine-contracts: stale "2026-04-30" verification date reverified and updated
- [ ] engine-contracts: `src/lib/` path references updated to restructured paths
- [ ] engine-contracts: PARTIAL tools flagged with 🟡 caveat
- [ ] state-reference: `.hivemind/` directory structure verified against disk
- [ ] state-reference: `event-tracker/` section compressed
- [ ] integration-contracts: Write/Edit removed from allowed-tools
- [ ] integration-contracts: agent count reverified
- [ ] integration-contracts: `configure-primitive` added to allowed-tools
- [ ] integration-contracts: `scripts/validate-contracts.sh` existence verified
- [ ] tool-capability-matrix: 9 missing operational tools added to Hivemind custom tools table
- [ ] tool-capability-matrix: 4 PARTIAL tools flagged with 🟡 caveat
- [ ] tool-capability-matrix: agent count reverified (current vs. "56" claim)
- [ ] ALL skills: IRON CLAW blocks compressed (~67 → ~20 lines each, or shared cross-ref)
- [ ] ALL skills: D4 constraint — jump link rendering verified at runtime
- [ ] ALL skills: PARTIAL tool reference protocol consistent (always flag with 🟡 + phase caveat)
