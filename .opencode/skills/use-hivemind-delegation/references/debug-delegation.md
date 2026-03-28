# Debug Delegation

## Purpose

Delegate debug loops with the reproduce→narrow→contain→evidence pattern.

## Phase Breakdown

### Reproduce Phase

**Goal:** Confirm the bug is real and reproducible.

**Child must:**
- Execute the reported reproduction steps
- Document actual vs expected behavior
- Capture environment details (OS, node version, dependencies)
- Confirm the bug is consistent (not flaky)

**Return:** Repro steps verified, failing behavior documented, environment captured.

### Narrow Phase

**Goal:** Isolate the failing component.

**Child must:**
- Form hypotheses about the root cause
- Rank hypotheses by likelihood
- Test hypotheses systematically (add logging, breakpoints, targeted tests)
- Identify the specific file/function where the bug originates

**Return:** Hypotheses ranked, failing file/function identified, evidence for each hypothesis.

### Contain Phase

**Goal:** Prevent the bug from spreading and fix it.

**Child must:**
- Define the fix boundary (what changes, what doesn't)
- Implement the minimal fix
- Assess blast radius (what else could be affected)
- Write a regression test

**Return:** Fix applied, blast radius documented, regression test written.

### Evidence Phase

**Goal:** Prove the fix works.

**Child must:**
- Run before/after comparison
- Run full test suite
- Verify no regressions
- Document what was fixed and how

**Return:** Before/after evidence, test output, regression prevention proof.

## Cross-Reference

Debug methodology details: `hivemind-system-debug`
Delegation mechanics: `use-hivemind-delegation`
Loop gating: `hivemind-gatekeeping`
