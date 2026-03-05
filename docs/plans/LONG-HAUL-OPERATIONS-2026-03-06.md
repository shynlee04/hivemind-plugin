# Long-Haul Operations Runbook (Phase 7)

## Cadence

- Weekly: critical hook conflict replay (`HOOK-CLASH-001`)
- Bi-weekly: permission and ownership audit (`TOOL-ACCESS-*`, `SCOPE-BOUNDARY-*`)
- Monthly: registry parity and policy drift audit (`AGENT-OVERLAP-001`)

## Weekly Replay Checklist

1. Run `npx tsc --noEmit`
2. Run `npm test`
3. Confirm `npm run lint:boundary` passes
4. Verify no duplicate context markers in:
   - `src/hooks/session-lifecycle.ts`
   - `src/hooks/messages-transform.ts`
   - `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`
5. Record findings in conflict ledger

## Bi-Weekly Policy Audit

1. Confirm hivefiver blind mode remains intact (`read/glob/grep: deny`)
2. Confirm context navigation allowlist remains:
   - `hivemind_inspect`
   - `hivemind_cycle`
   - `scan_hierarchy`
   - `think_back`
   - `recall_mems`
3. Confirm docs ownership split:
   - `docs/framework/**`
   - `docs/implementation/**`
4. Confirm state write boundary script still blocks direct `.hivemind/state` writes

## Monthly Drift Audit

1. Run parity check: `bash scripts/check-agent-registry-parity.sh`
2. Diff canonical vs mirror agent files
3. Validate `agents/**` remains source of truth
4. Confirm `hivefiver-reserved.md` parity and policy integrity

## SLO Dashboard Targets

- Duplicate injection incidents: `0`
- Unauthorized boundary writes: `0`
- Registry parity drift: `0`
- Critical regression escape rate: `0` per release

## Reporting Template

```
date:
period: weekly | bi-weekly | monthly
commands:
  - npx tsc --noEmit
  - npm test
  - npm run lint:boundary
status: pass | fail
conflicts:
  hook_clash_001: pass | fail
  tool_access_001: pass | fail
  tool_access_002: pass | fail
  agent_overlap_001: pass | fail
  scope_boundary_001: pass | fail
  scope_boundary_002: pass | fail
notes:
next_actions:
```
