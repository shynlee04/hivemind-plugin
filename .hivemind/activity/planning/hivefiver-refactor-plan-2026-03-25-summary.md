# Hivefiver Refactor Plan — Summary

**Plan ID:** plan-20260325-hivefiver-refactor  
**Created:** 2026-03-25T16:16:56Z  
**Status:** VALIDATED  
**Total Phases:** 11  
**Critical Path Length:** 5 phases (01 → 03 → 05 → 09 → 11)

---

## Goal

Replace hardcoded skill injection with a configurable, schema-driven architecture managed by a new `hivefiver` agent. Clean up legacy CLI, dead code, and false sync artifacts. Establish three commands (`hm-init`, `hm-doctor`, `hm-settings`) as the new runtime configuration surface.

---

## Phase Overview

| # | Phase | Concern | Files | Wave | Dependencies | Gate |
|---|-------|---------|-------|------|-------------|------|
| 01 | Dead Code Cleanup | write | 1 | 1 (parallel) | none | tsc + test |
| 02 | Legacy CLI Audit | read | 5 | 1 (parallel) | none | none |
| 03 | Schema Definition | write | 4 | 2 | 01 | tsc + test |
| 04 | Agent Definitions | write | 2 | 3 | 03 | tsc + test |
| 05 | Skill Injection Refactor | write | 4 | 4 | 03, 04 | tsc + test |
| 06 | Command Surface | write | 3 | 5 | 03, 05 | tsc + test |
| 07 | Plugin Integration | write | 2 | 6 | 06 | tsc + test |
| 08 | Configuration Categories | write | 3 | 7 | 06, 07 | tsc + test |
| 09 | Tiered Injection | write | 3 | 8 | 05, 08 | tsc + test |
| 10 | Legacy Removal | write | 5 | 9 | 02, 07 | tsc + test |
| 11 | Verification | verify | 0 | 10 | 09, 10 | tsc + test + build |

---

## Dependency DAG (Critical Path)

```
01 (dead code) ──┐
                  ├──→ 03 (schema) ──→ 04 (agents) ──→ 05 (injection) ──┐
02 (audit) ────┘                                                          │
                  ┌──────────────────────────────────────────────────────┘
                  │
                  ├──→ 06 (command surface) ──→ 07 (plugin) ──→ 08 (config groups) ──┐
                  │                                                                   │
                  │   ┌───────────────────────────────────────────────────────────────┘
                  │   │
                  │   ├──→ 09 (tiered injection)
                  │   │
                  └──→ 10 (legacy removal) ──→ 11 (verification)
```

**Critical path:** 01 → 03 → 05 → 09 → 11 (5 phases)

**Parallel candidates (Wave 1):** 01 + 02 can run simultaneously — no shared files, no shared types, no output chain.

---

## Phase Details

### Phase 01: Dead Code Cleanup
- **Target:** `src/shared/paths.ts`
- **Action:** Remove `ARTIFACTS_DIR`, `CHECKPOINTS_DIR`, `STATE_FILES` (0 consumers each). Audit `handoffsDir` — remove if no consumer found.
- **Risk:** LOW — all exports have 0 consumers outside paths.ts

### Phase 02: Legacy CLI Audit
- **Target:** 5 files (2329 lines total)
- **Action:** Read-only. Map import chains. Produce removal decision matrix (safe / needs-replacement / keep).
- **Risk:** LOW — read-only, no mutation

### Phase 03: Schema Definition
- **Target:** 3 new files in `src/schema-kernel/`
- **Action:** `config-records.ts` (user settings types), `agent-records.ts` (agent template type), `skill-injection-records.ts` (injection rule types). All use Zod. Additive-only.
- **Risk:** MEDIUM — must align with existing schema-kernel conventions

### Phase 04: Agent Definitions
- **Target:** `src/shared/agent-definitions.ts` + test
- **Action:** Define 10 default agent templates. Each validated against AgentTemplate schema.
- **Risk:** LOW — new files, no existing code modified

### Phase 05: Skill Injection Refactor ⚠️ HIGHEST RISK
- **Target:** 4 files (skill-exposure-map.ts, opencode-skill-registry.ts, messages-transform-adapter.ts, injection-store.ts)
- **Action:** Replace 20 hardcoded skill names with configurable rules. Bridge filesystem registry with injection pipeline. Fix MAX_SKILLS (7→3). Remove 11 non-existent skill references.
- **Risk:** HIGH — central to plugin behavior, must preserve function signatures
- **Success test:** Zero hardcoded names, same public API, MAX_SKILLS=3

### Phase 06: Command Surface
- **Target:** 3 new files in `src/tools/hivefiver/`
- **Action:** `hivemind_hm_init`, `hivemind_hm_doctor`, `hivemind_hm_setting` tools. Follow existing tool pattern (index/tools/types). Use tool.schema (Zod).
- **Risk:** MEDIUM — new tool surface, must match existing patterns

### Phase 07: Plugin Integration
- **Target:** `src/plugin/opencode-plugin.ts` + test
- **Action:** Wire 3 new tools into plugin. Replace hardcoded 'hivefiver' default with configurable value. Update smoke test for 12 tools (was 9).
- **Risk:** MEDIUM — touches plugin entry point

### Phase 08: Configuration Categories
- **Target:** `src/shared/config-groups.ts` + test + `src/tools/hivefiver/tools.ts`
- **Action:** 4 groups: language, expertise, governance (halt-investigate-propose, NO auto-block), operation mode. Independently configurable via hm-setting.
- **Risk:** LOW — new files + tool update

### Phase 09: Tiered Injection
- **Target:** `src/shared/tiered-injection.ts` + test + `src/plugin/skill-exposure-map.ts`
- **Action:** Two-tier: Tier 1 (core init skills) → Tier 2 (task-conditional). Per-agent/per-phase/per-task rules. Mandatory + high-likelihood distinction.
- **Risk:** HIGH — extends core injection system
- **Prerequisite:** AMB-02 must be resolved (Tier 2 activation trigger)

### Phase 10: Legacy Removal
- **Target:** 5 files + .opencode/commands/ cleanup
- **Action:** Remove false sync, deprecated scripts, 7 dev mirror commands. Keep hm-init/hm-doctor/hm-settings.
- **Risk:** MEDIUM — deletion, must verify no active consumers

### Phase 11: Verification
- **Target:** Full project
- **Action:** `npx tsc --noEmit && npm test && npm run build`. Grep for dead code. Verify 12 tools, 3 commands, 3 schema modules.
- **Risk:** NONE — read-only

---

## Open Ambiguities (Must Resolve Before Execution)

| ID | Description | Impact | Blocks |
|----|-------------|--------|--------|
| AMB-01 | Governance levels — names and scope undefined | HIGH | Phase 08 |
| AMB-02 | Tier 2 activation trigger — session/task/time based? | MEDIUM | Phase 09 |
| AMB-03 | Agent template format — AGENTS.md extension or new surface? | MEDIUM | Phase 04 |
| AMB-04 | Schema authority — schema-kernel vs new location? | LOW | Phase 03 |

---

## Re-Decomposition Rules

If any phase fails twice on the same slice_id:

1. **Collect failure evidence** — gather both return packets, find the real blocker
2. **Re-run decomposition** — apply 6-step decomposition to failed slice alone
3. **Split further** — by authority surface → concern type → file cluster
4. **Re-emit** — new slice_ids, updated dependency graph
5. **Log** — record reason in `re_decomposition_log`

**Decision tree:**
- External dependency blocker → add dependency slice before failed slice
- Scope too large → split by surface → concern → cluster
- Missing context → add read slice before the write slice
- Conflicting with another → merge into sequential pair
- Architectural blocker → STOP, escalate to user

---

## Carry-Forward (≤5 Key Findings)

1. **Skill injection:** 20 hardcoded names, 11 non-existent, MAX_SKILLS=7 must become 3
2. **Dead code:** ARTIFACTS_DIR, CHECKPOINTS_DIR, STATE_FILES in paths.ts — 0 consumers
3. **Legacy CLI:** 8 files, 2329 lines total, bin/hivemind-tools.cjs is 1422 lines
4. **opencode.json:** Only model/plugin/provider — no agents/commands/skills/mcp/lsp
5. **Schema kernel:** thin re-export from archive/schema-kernel/ — new modules go here (additive)

---

## Plan File

**JSON:** `.hivemind/activity/planning/hivefiver-refactor-plan-2026-03-25.json`
