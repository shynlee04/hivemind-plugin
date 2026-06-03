# Remediation Paths

Per-finding-type routing to operational hm-* skills for remediation. When a
gate finding is FAIL, route to the appropriate skill below. This gate does NOT
prescribe how to fix — it routes to the skill that does.

## Routing Table

| Finding Type | Detected By | Route To | What That Skill Should Check/Fix |
|-------------|------------|----------|----------------------------------|
| Classification violation (AP-13) | D1: Classification Fit | `hm-coordinating-loop` | Redesign dispatch boundaries. Reclassify module to correct root (src/ vs .opencode/ vs .hivemind/). Update dependency rules in AGENTS.md. |
| Cross-root contamination | D1: Classification Fit | `hm-coordinating-loop` | Audit all cross-root imports. Move files to correct root. Update import paths. Verify no state leaks across boundaries. |
| Lifecycle wiring issue | D2: CQRS Boundary | `hm-phase-execution` | Fix execution wiring. Re-register hooks in plugin.ts. Verify tool registration in plugin tool map. Check factory injection chain. |
| CQRS violation (AP-01, AP-02) | D2: CQRS Boundary | `hm-phase-execution` | Fix CQRS wiring. Remove write-side operations from hooks. Remove event observation from tools. Re-register with correct side. |
| Structural/architectural | D3: Size and Structure | `hm-refactor` | Split oversized modules (>500 LOC). Break circular dependencies. Flatten dependency chains to ≤ 2 levels. Extract responsibilities into sub-modules. |
| Delegation hierarchy (AP-06, AP-10, AP-11) | D4: Actor Hierarchy | `hm-coordinating-loop` | Redesign delegation dispatch. Add depth guards. Validate categories against VALID_DELEGATION_CATEGORIES. Fix orphan cleanup. |
| Unknown/unclear failure | Any dimension — script reports BLOCK but cause is opaque | `hm-debug` | Systematic investigation. Isolate the failure domain. Reproduce with minimal case. Identify root cause. |
| Completion verification | Post-remediation re-evaluation | `hm-completion-looping` | Verification loop after fix. Re-run gate. Confirm no regressions. Validate fix addresses the root cause, not just the symptom. |

## Verification After Remediation

For every remediation path, after the hm-* skill completes its work:

1. **Check:** Verify the specific finding is resolved by re-running the failing check
2. **Double-check:** Run `bash scripts/run-gate-eval.sh <artifact>` to confirm no regressions
3. **Triple-check:** If the finding was BLOCK-level, run the full 5-dimension evaluation
4. **Cross-check:** If multiple artifacts were affected, evaluate all of them, not just the reported one

## When NOT to Route

- **Classification violations (AP-13):** These are redesign-level issues. Do NOT route to hm-debug — route to hm-coordinating-loop for architectural redesign.
- **CQRS violations (AP-01, AP-02):** These are structural issues that require re-wiring. Do NOT route to hm-refactor — route to hm-phase-execution for lifecycle re-registration.
- **Style issues (unprefixed errors, minor `any` types):** These are fix-in-place. Do NOT route to any hm-* skill — fix directly and re-run the gate.

## Skill Independence Note

This gate validates structure and lifecycle, not the hm-* skills themselves.
The hm-* skills are referenced as remediation targets only — they are NOT
dependencies of this gate. This gate works standalone on harness source code
regardless of whether hm-* skills exist or are loaded.
