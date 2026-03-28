# Pre-Gatekeeping

## Table of Contents

- [Pre-Gatekeeping Purpose](#pre-gatekeeping-purpose)
- [Pre-Gate Checklist](#pre-gate-checklist)
- [Pre-Gate Protocol](#pre-gate-protocol)
- [Integration with hivemind-gatekeeping](#integration-with-hivemind-gatekeeping)
- [Evidence Record Format](#evidence-record-format)

## Pre-Gatekeeping Purpose

Sits between investigation/research and synthesis. Ensures synthesized output is trustworthy before it enters the pipeline.

**If pre-gatekeeping is skipped, synthesis output may reference broken APIs, stale tests, or failing builds. Downstream agents will build on sand.**

## Pre-Gate Checklist

| Check | Command | Evidence Required | Gate Type |
|-------|---------|-------------------|-----------|
| Tests pass | `npm test` | Output showing all green | Hard — blocks |
| Build succeeds | `npm run build` | Exit code 0 output | Hard — blocks |
| Types check | `npx tsc --noEmit` | 0 errors in output | Hard — blocks |
| No circular dependencies | Dependency graph analysis | Graph analysis report | Hard — blocks |
| No broken exports | Grep verification of import chains | Grep output showing valid imports | Soft — warning |
| Session findings cross-checked | Git log correlation | Git log matching session timestamps | Soft — warning |

**Gate order:** Run all hard gates first. If any hard gate fails → synthesis BLOCKED. Run soft gates after hard gates pass. Soft gate failures are warnings — synthesis can proceed with documented risk.

## Pre-Gate Protocol

1. **Run all hard gates** — tests, build, types, circular dependency check
2. **Evaluate hard gates:**
   - All pass → proceed to soft gates
   - Any fail → synthesis cannot proceed until fixed
3. **Run soft gates** — broken exports, session cross-check
4. **Log results** to `.hivemind/activity/synthesis/pre-gate-{timestamp}.json`
5. **Feed result** into `hivemind-gatekeeping` synthesis gate

**Failure handling:**

| Failure | Action |
|---------|--------|
| Hard gate fails | Block synthesis. Fix the issue. Re-run hard gates. |
| Soft gate fails | Document warning. Proceed to synthesis with risk flag. |
| Multiple hard gates fail | Fix in order: types → build → tests → dependencies. |
| Intermittent failure | Re-run gate 3 times. If still fails, treat as hard failure. |

## Integration with hivemind-gatekeeping

Pre-gate is a **precondition** for synthesis gates:

```
Pre-gate (this skill) → Synthesis gate (hivemind-gatekeeping) → Integration checkpoint
```

| Relationship | Rule |
|-------------|------|
| Pre-gate failure | Blocks synthesis pipeline completely |
| Pre-gate pass | Proceeds to `hivemind-gatekeeping` synthesis gates |
| Both must pass | Synthesis output is trusted only when pre-gate AND synthesis gate pass |
| Pre-gate result feeds forward | Pre-gate JSON is referenced by synthesis gate for evidence |

## Evidence Record Format

Pre-gate results are logged as JSON:

```json
{
  "pre_gate_id": "synthesis-pre-gate-001",
  "timestamp": "2026-03-28T21:00:00Z",
  "checks": {
    "tests_green": {
      "passed": true,
      "command": "npm test",
      "evidence": "Tests: 42 passed, 0 failed"
    },
    "build_ok": {
      "passed": true,
      "command": "npm run build",
      "evidence": "exit 0"
    },
    "types_clean": {
      "passed": true,
      "command": "npx tsc --noEmit",
      "evidence": "0 errors"
    },
    "no_circular_deps": {
      "passed": true,
      "method": "dependency_graph_analysis",
      "evidence": "No circular dependencies found"
    }
  },
  "soft_checks": {
    "no_broken_exports": {
      "passed": true,
      "warnings": []
    },
    "session_cross_check": {
      "passed": true,
      "warnings": []
    }
  },
  "overall": "PASS",
  "blocks_synthesis": false,
  "logged_to": ".hivemind/activity/synthesis/pre-gate-2026-03-28T210000Z.json"
}
```

**Fields:**
- `pre_gate_id` — unique identifier
- `timestamp` — ISO 8601 when gate was run
- `checks` — hard gate results with command and evidence
- `soft_checks` — soft gate results with warnings
- `overall` — PASS or FAIL
- `blocks_synthesis` — true if any hard gate failed
- `logged_to` — path where result was stored
