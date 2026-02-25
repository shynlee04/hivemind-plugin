# Quality Gate Definitions

Standard definitions for each quality gate type in the HiveMind framework. Used by HiveQ for gate enforcement.

## Gate Types

### Auto-Gate
- **Trigger**: Missing derivable metadata or stale cache that can be rebuilt safely
- **Enforcement**: Hook + safe tool chain
- **User visibility**: Optional toast notification
- **Outcome**: Auto-remediate then continue
- **Example**: Missing `.hivemind/state/brain.json` → auto-regenerate from session data

### Soft-Gate
- **Trigger**: Drift/context concerns without immediate safety risk
- **Enforcement**: Hook governance layer
- **User visibility**: Toast + recommendation
- **Outcome**: Continue with warning
- **Example**: Drift score drops below 50 → warn user, suggest `map_context`

### Hard-Gate
- **Trigger**: Contract violation, missing critical entities, forbidden tool scope
- **Enforcement**: Hook/tool-gate
- **User visibility**: Explicit block response
- **Outcome**: Stop execution until repaired
- **Example**: No `declare_intent` called → block all tool mutations

### Human-Gate
- **Trigger**: High-risk operation (destructive/security/billing boundary)
- **Enforcement**: Hook + user confirmation step
- **User visibility**: Explicit prompt required
- **Outcome**: Wait for user approval
- **Example**: `git push --force` to master → require explicit user confirmation

## Standard Quality Gates

| Gate ID | Command | Pass Condition | Severity on Fail |
|---------|---------|---------------|:----------------:|
| `unit-tests` | `npm test` | `# fail 0` in output | Hard-gate |
| `type-check` | `npx tsc --noEmit` | Empty output (0 errors) | Hard-gate |
| `release-safety` | `npm run guard:public` | Exit code 0 | Hard-gate |
| `loc-limits` | `wc -l` on src files | All ≤ 550 LOC | Soft-gate |
| `cqrs-compliance` | `grep -r "stateManager.save" src/hooks/` | 0 matches | Hard-gate |
| `orphan-check` | Cross-reference assets | All assets referenced | Soft-gate |
| `sync-check` | `diff -rq agents/ .opencode/agents/` | No differences | Soft-gate |

## Gate Execution Order

When running all gates, execute in this order (fastest first for fast feedback):
1. Type Check (compile errors — fast, catches most issues)
2. CQRS Compliance (architecture — instant grep)
3. LOC Limits (structure — instant wc)
4. Unit Tests (logic — medium duration)
5. Orphan Check (organization — medium)
6. Sync Check (deployment — medium)
7. Release Safety (deployment — slowest)

## Pass/Fail Escalation

| Result | Action |
|--------|--------|
| All PASS | Emit green verdict, save baseline to memory |
| Soft-gate FAIL only | Emit warning, continue, save findings |
| Hard-gate FAIL | Block, report failures, require remediation |
| Human-gate triggered | Pause, request explicit user approval |
