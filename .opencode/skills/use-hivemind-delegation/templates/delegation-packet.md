# Delegation Packet

<!-- _meta: { "created_at": "2026-03-24T00:00:00Z", "updated_at": "2026-03-24T00:00:00Z" } -->

```json
{
  "packet_id": "deleg_1711072800_tool_fix",
  "concern": "Fix failing tests in src/tools/runtime/",
  "objective": "Resolve 3 test failures in runtime tool tests caused by type mismatch after SDK update",
  "mode": "verification",
  "execution_mode": "sequential",
  "activity_type": "verification",
  "phase_type": "verification-gate",
  "branch": "refactor/product-detox-concerns",
  "worktree": "/repo/.worktrees/product-detox",
  "worktree_role": "linked",
  "authority_surfaces": ["src/tools/runtime/", "tests/tools/"],
  "must_read_artifacts": ["tests/tools/runtime-tools.test.ts", "src/tools/runtime/tools.ts"],
  "scope": ["tests/tools/runtime-tools.test.ts"],
  "out_of_scope": ["src/tools/doc/", "src/tools/task/", "src/core/"],
  "constraints": [
    "Fix tests only — do not change production code unless the test proves a real bug",
    "Do not modify test expectations without confirming the behavior changed",
    "All changes must pass npx tsc --noEmit"
  ],
  "success_metrics": [
    "All 3 failing tests pass",
    "No new test failures introduced",
    "TypeScript compiles clean"
  ],
  "required_evidence": [
    "Test output showing all tests pass",
    "tsc output showing zero errors"
  ],
  "required_accounting": [
    "Which tests were fixed and how",
    "Whether production code was changed and why"
  ],
  "return_contract": {
    "status": "completed | partial | blocked",
    "evidence": { "confirmed": [], "inferred": [], "unverified": [] },
    "artifacts": [],
    "blocked_routes": [],
    "recommended_next_action": ""
  },
  "return_gate": "All 3 failing tests pass AND no new failures AND tsc compiles clean"
}
```
