# Plan Record: Mandate-Enforcement Hook Decomposition

**Plan ID:** `mandate-enforcement-hook-2026-03-30`
**Created:** 2026-03-30
**Producer:** hiveplanner
**Status:** validated — ready for orchestrator dispatch

---

## Goal

Implement mandate-enforcement hooks that intercept `permission.ask` and `tool.execute.before` to deny operations violating agent behavioral mandates, with agent-identity-aware denial messages.

## Source Spec

**No architect design artifact found** in `.hivemind/activity/planning/`. Plan derived from:
1. `.opencode/skills/use-hivemind/references/orchestrator-mandate.md` — behavioral rules for 10 agent roles
2. `.hivemind/activity/agents/hivexplorer/permission-denial-audit-2026-03-30.md` — gap analysis confirming no enforcement exists

## Baseline Evidence

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ Passes clean |
| Hooks implemented | 11 of 17 |
| Current `permission.ask` | Auto-allow + toast only. Never denies. |
| Current `tool.execute.before` | Record-only. Never blocks. |
| Mandate enforcement | **MISSING** — confirmed by audit |

---

## Decomposition Summary

| Phase | Slice ID | Concern | Wave | Target Agent | Files | Complexity |
|-------|----------|---------|------|-------------|-------|------------|
| 01-foundation | `01-schema-types` | write | 0 | hivemaker | 2 files | low |
| 02-core-logic | `03-mandate-resolver` | write | 1 | hivemaker | 3 files | medium |
| 03-hook-handlers | `04-permission-handler` | write | 2 | hivemaker | 2 files | medium |
| 03-hook-handlers | `05-tool-governance` | write | 2 | hivemaker | 2 files | medium |
| 04-plugin-integration | `06-plugin-wiring` | write | 3 | hivemaker | 1 file | low |
| 05-verification | `07-test-resolver` | verify | 4 | hivemaker | 1 file | medium |
| 05-verification | `08-test-handler` | verify | 4 | hivemaker | 1 file | medium |
| 06-integration-gate | `09-integration-gate` | verify | 4 | hiveq | 0 files | low |

**Total:** 8 slices, 5 waves, critical path length 5

---

## Parallel Opportunities

| Wave | Parallel Slices | Independence Proof |
|------|----------------|-------------------|
| Wave 2 | `04-permission-handler` + `05-tool-governance` | No shared files — different directories |
| Wave 4 | `07-test-resolver` + `08-test-handler` | No shared files — test different modules |

---

## Critical Path

```
01-schema-types → 03-mandate-resolver → 04-permission-handler → 06-plugin-wiring → 09-integration-gate
```

---

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Agent identity not available in hook input | HIGH | HIGH | Graceful degradation: skip enforcement when identity unknown (permissive default) |
| `output.status='deny'` unsupported for `tool.execute.before` | MEDIUM | HIGH | Shift all enforcement to `permission.ask` if needed |
| Over-blocking legitimate tool uses | MEDIUM | MEDIUM | Permissive defaults for unknown agents/operations |
| Existing tests break | LOW | MEDIUM | Integration gate catches before handoff |

---

## Architect Decisions Needed

| Decision | Urgency | Recommendation |
|----------|---------|---------------|
| Strict deny vs advisory toast | Before Wave 2 | Strict for orchestrator, advisory for others, with runtime override |
| Agent identity resolution mechanism | Before Wave 2 | Use runtime attachment snapshot from session context |

---

## Files Affected

### New Files (6)
- `src/schema-kernel/mandate-records.ts`
- `src/shared/mandate-resolver.ts`
- `src/shared/mandate-defaults.ts`
- `src/hooks/mandate-enforcement-handler.ts`
- `src/hooks/runtime-loader/mandate-governance.ts`
- `tests/hooks/mandate-resolver.test.ts`
- `tests/hooks/mandate-enforcement-handler.test.ts`

### Modified Files (5)
- `src/schema-kernel/index.ts` — add mandate-records export
- `src/shared/index.ts` — add mandate-resolver + mandate-defaults exports
- `src/hooks/index.ts` — add mandate-enforcement-handler export
- `src/hooks/runtime-loader/index.ts` — add mandate-governance export
- `src/plugin/opencode-plugin.ts` — wire handlers into permission.ask and tool.execute.before

---

## Carry Forward

1. Type-check baseline confirmed clean — all gates start from green
2. 11/17 hooks implemented — mandate enforcement adds to existing permission.ask and tool.execute.before
3. No existing denial logic anywhere — first implementation of output.status='deny'
4. Agent identity resolution is the critical unknown — must verify SDK hook inputs before Wave 2
5. CQRS boundary: enforcement handlers must be read-only (no file writes from hooks)

---

## Validation Gate

- [x] Every step has a target agent
- [x] Every step has verifiable success criteria (npx tsc --noEmit or test commands)
- [x] Dependencies correctly sequenced (no circular deps)
- [x] Each step is small enough for single delegation (≤3 files per slice)
- [x] Architect decisions flagged where needed (2 decisions before Wave 2)
- [x] npx tsc --noEmit passes after plan creation (verified 2026-03-30T19:30:00Z)

---

*JSON artifact: `.hivemind/activity/planning/decomposition-plan-2026-03-30.json`*
