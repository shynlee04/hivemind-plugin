# Remediation Plan — 2026-03-26

**Plan ID:** `plan-2026-03-26-remediation`
**Created:** 2026-03-26T18:36:55+07:00
**Status:** Validated — ready for orchestration (Phase 02 blocked on architect)
**Planner:** hiveplanner

---

## Goal

Remediate 3 verified problems in dependency order with TDD gates, cross-verification after each fix, and final integration test.

## Verified Problems

| # | Problem | Severity | Root Cause | Target File |
|---|---------|----------|------------|-------------|
| A | `initSkillInjection()` never called | CRITICAL | Wiring omission during module decomposition | `src/plugin/opencode-plugin.ts` |
| B | Skill registry scans wrong path | HIGH | `discoverSkills()` scans `{packageRoot}/skills/` (no SKILL.md there) | `src/shared/opencode-skill-registry.ts` |
| C | Loop checkpoint stale | LOW | JSON reports 3 phases done, actual is 10 | `.hivemind/activity/delegation/hivefiver-refactor-loop-checkpoint.json` |

## Step Summary

| # | Phase | Title | Target Agent | Dependencies | TDD Gate | Status |
|---|-------|-------|-------------|-------------|----------|--------|
| 1 | 01-fix-a | Wire initSkillInjection into plugin init | hitea → hivemaker → code-skeptic | none | `tsc + test` | Ready |
| 2 | 02-fix-b | Fix skill registry scan path | hitea → hivemaker → code-skeptic | 01 + architect decision | `tsc + test` | **Blocked** |
| 3 | 03-fix-c | Update stale loop checkpoint | hivemaker | none | `json valid` | Ready |
| 4 | 04-integration | Integration verification | hiveq | 01 + 02 | `tsc + test + build` | Waiting on 02 |

## Dependency Graph

```
01-fix-a ──────────────────────┬──→ 04-integration
                               │
architect-decision ─→ 02-fix-b ┘

03-fix-c (independent, parallel-safe with 01)
```

**Critical path:** 01 → architect → 02 → 04
**Parallel wave 1:** 01 + 03 (zero shared files)

## TDD Protocol Per Phase

### Phase 01: Fix A (3 slices, TDD red/green/refactor)

1. **01a (red)** — hitea writes failing test asserting `initSkillInjection` is called during plugin assembly
2. **01b (green)** — hivemaker adds import + call in `opencode-plugin.ts`, makes test pass
3. **01c (refactor)** — code-skeptic cross-verifies: single call, cachedConfig populated, no side effects

**Gate:** `npx tsc --noEmit && npm test`
**Handoff:** `.hivemind/activity/delegation/01a-*`, `01b-*`, `01c-*`

### Phase 02: Fix B (3 slices, TDD red/green/refactor) — BLOCKED

1. **02a (red)** — hitea writes failing test for correct skill discovery path
2. **02b (green)** — hivemaker updates `discoverSkills()` path per architect decision
3. **02c (refactor)** — code-skeptic cross-verifies: correct paths, no regressions

**Gate:** `npx tsc --noEmit && npm test`
**Blocked on:** Architect design decision (scan path strategy)

### Phase 03: Fix C (1 slice, direct write)

1. **03a** — hivemaker updates checkpoint JSON (phases 10, iteration 10)

**Gate:** JSON valid (`python3 -m json.tool`)
**Handoff:** `.hivemind/activity/delegation/03a-*`

### Phase 04: Integration (1 slice, verify-only)

1. **04a** — hiveq runs full integration test: typecheck + tests + build + end-to-end skill discovery

**Gate:** `npx tsc --noEmit && npm test && npm run build`

## Architect Decisions Needed

| Decision | Context | Urgency | Blocks |
|----------|---------|---------|--------|
| Skill registry scan path strategy | `discoverSkills()` scans wrong path. Options: A) `skills/skills/*`, B) `.opencode/skills/*`, C) multi-path with fallback, D) reconstruct directory | Before Phase 02 | 02-fix-b |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Architect decision delayed | medium | high | 01+03 proceed independently. Escalate if >24h. |
| initSkillInjection call site unclear | low | medium | hivexplorer confirmed function signature and module. |
| Checkpoint update wrong phase count | low | low | Verify against actual git history before writing. |

## Handoff Artifacts

| Artifact | Path |
|----------|------|
| Plan JSON | `.hivemind/activity/planning/remediation-plan-2026-03-26.json` |
| This summary | `.hivemind/activity/planning/remediation-plan-2026-03-26-summary.md` |
| Phase 01 delegation packets | `.hivemind/activity/delegation/01{a,b,c}-*.json` |
| Phase 02 delegation packets | `.hivemind/activity/delegation/02{a,b,c}-*.json` (after architect clears) |
| Phase 03 delegation packet | `.hivemind/activity/delegation/03a-*.json` |
| Phase 04 delegation packet | `.hivemind/activity/delegation/04a-*.json` |

## Ready-to-Send Packets

### Packet 01a: Write Failing Test for initSkillInjection

```json
{
  "packet_id": "01a-test-init-skill-injection",
  "slice_id": "01a-test-init-skill-injection",
  "target_agent": "hitea",
  "mode": "execution",
  "execution_mode": "sequential",
  "concern": "verify",
  "tdd_phase": "red",
  "authority_surfaces": ["plugin"],
  "in_scope": ["tests/plugin/skill-injection.test.ts"],
  "out_of_scope": ["src/shared/**", "src/tools/**"],
  "description": "Write a failing test in tests/plugin/skill-injection.test.ts that asserts initSkillInjection() is called when the plugin assembles. The test should import the plugin module and verify the side effect (cachedConfig is populated after init).",
  "gate": "npx tsx --test tests/plugin/skill-injection.test.ts",
  "expected_gate_result": "fail",
  "evidence_required": ["test_file_exists", "test_fails_with_expected_error"],
  "return_contract": "status, evidence, files_checked"
}
```

### Packet 01b: Wire initSkillInjection (after 01a passes red gate)

```json
{
  "packet_id": "01b-wire-init-skill-injection",
  "slice_id": "01b-wire-init-skill-injection",
  "target_agent": "hivemaker",
  "mode": "execution",
  "execution_mode": "sequential",
  "concern": "write",
  "tdd_phase": "green",
  "authority_surfaces": ["plugin"],
  "in_scope": ["src/plugin/opencode-plugin.ts"],
  "out_of_scope": ["src/shared/**", "src/tools/**"],
  "description": "Add import: `import { resolveDefaultAgent, initSkillInjection } from './skill-exposure-map.js'`. Call `initSkillInjection(packageRoot)` in plugin init after package root is resolved. This makes the 01a test pass.",
  "depends_on": ["01a-test-init-skill-injection"],
  "gate": "npx tsc --noEmit && npx tsx --test tests/plugin/skill-injection.test.ts",
  "expected_gate_result": "pass",
  "evidence_required": ["import_added", "function_called", "test_passes", "typecheck_clean"],
  "implementation_hints": {
    "import_line": "import { resolveDefaultAgent, initSkillInjection } from './skill-exposure-map.js'",
    "call_location": "In plugin assembly function, after packageRoot is resolved",
    "packageRoot_source": "context.directory or plugin setup parameter"
  },
  "return_contract": "status, evidence, diff_output, gate_result"
}
```

### Packet 01c: Cross-verify Fix A (after 01b passes)

```json
{
  "packet_id": "01c-verify-01a-refactor",
  "slice_id": "01c-verify-01a-refactor",
  "target_agent": "code-skeptic",
  "mode": "verification",
  "execution_mode": "sequential",
  "concern": "verify",
  "tdd_phase": "refactor",
  "authority_surfaces": ["plugin"],
  "in_scope": ["src/plugin/opencode-plugin.ts", "tests/plugin/skill-injection.test.ts"],
  "out_of_scope": ["src/shared/**"],
  "description": "Cross-verify: initSkillInjection called exactly once, cachedConfig populated after init, resolveSkillBundle returns non-empty, no unintended side effects on other plugin hooks.",
  "depends_on": ["01b-wire-init-skill-injection"],
  "gate": "npx tsc --noEmit && npm test",
  "expected_gate_result": "pass",
  "evidence_required": ["single_call_confirmed", "cached_config_populated", "no_side_effects"],
  "return_contract": "status, evidence, verdict, concerns_found"
}
```

### Packet 03a: Update Stale Checkpoint

```json
{
  "packet_id": "03a-update-checkpoint",
  "slice_id": "03a-update-checkpoint",
  "target_agent": "hivemaker",
  "mode": "execution",
  "execution_mode": "sequential",
  "concern": "write",
  "tdd_phase": "green",
  "authority_surfaces": ["config"],
  "in_scope": [".hivemind/activity/delegation/hivefiver-refactor-loop-checkpoint.json"],
  "out_of_scope": ["src/**"],
  "description": "Update checkpoint JSON: set current_iteration to 10, phases_completed to 10, mark all 10 phases as status=complete, update coverage_status to reflect actual progress.",
  "depends_on": [],
  "gate": "python3 -m json.tool .hivemind/activity/delegation/hivefiver-refactor-loop-checkpoint.json",
  "expected_gate_result": "pass",
  "evidence_required": ["json_valid", "phases_count_10", "iteration_10"],
  "return_contract": "status, evidence, updated_fields"
}
```

---

**Next action for orchestrator:** Dispatch Packet 01a and Packet 03a in parallel. Await architect decision before dispatching Phase 02 packets.
