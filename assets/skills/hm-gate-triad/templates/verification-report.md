# Verification Report Template

Output of the 3-gate triad.

```markdown
# VERIFICATION: <phase-or-skill-name>

**Date:** YYYY-MM-DD
**Verifier:** <agent>
**Branch:** <branch>

## Gate 1: lifecycle-integration
- **Verdict:** PASS | FAIL
- **Findings:**
  - <finding with file:line>
  - <finding with file:line>
- **Sub-checks:**
  - 9-surface authority: PASS
  - CQRS boundaries: PASS
  - Event-driven wiring: PASS
  - Classification fit: PASS
  - OpenCode SDK compliance: PASS
  - 22-category prefix: PASS
  - Tech-agnostic principle: PASS
  - Forbidden-name regex: PASS
  - .planning/ scope: PASS

## Gate 2: spec-compliance
- **Verdict:** PASS | FAIL
- **Findings:**
  - <gap with type: missing | phantom | contradictory | underspecified>
- **Sub-checks:**
  - Bidirectional traceability: PASS
  - EARS acceptance criteria: PASS
  - 4 gap types scan: PASS
  - Anti-patterns scan: PASS
  - 5-realm coverage: PASS
  - GSD compatibility pointer: PASS / N/A
  - Risk tier assignment: PASS
  - Migration sequencing: PASS

## Gate 3: evidence-truth
- **Verdict:** PASS | FAIL
- **Findings:**
  - <evidence-level-issue>
- **Sub-checks:**
  - Evidence hierarchy: L1 | L2 | L3 | L4 | L5
  - Coverage state: PASS | PARTIAL | MISSING | BLOCKED
  - Fresh evidence (current session): PASS
  - Dual-signal completion: PASS
  - Mock-only detection: PASS

## Aggregate

- Gate 1: PASS | FAIL
- Gate 2: PASS | FAIL
- Gate 3: PASS | FAIL
- **Status:** passed | human_needed | gaps_found

## Remediation (if any FAIL)

- **Gate 1 issue:** <what to fix, where>
- **Gate 2 issue:** <what to fix, where>
- **Gate 3 issue:** <what evidence to add, where>
```

## Storage

Save to `<phase-dir>/<padded>-VERIFICATION.md`.
