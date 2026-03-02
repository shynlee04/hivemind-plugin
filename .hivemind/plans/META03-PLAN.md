# META03: Governance Canonicalization Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve 3 cross-team-validated governance conflicts + 1 load-order fix before building context intelligence (Cycle 1+).

**Architecture:** Sequential fix-verify-gate pipeline. Each fix is atomic, independently rollbackable, and verified before proceeding. No fix depends on another.

**Rationale:** "Your observed failures are governance drift failures, not algorithmic limitations. Canonicalizing contracts first reduces ambiguity at every turn boundary." — Cross-team synthesis insight.

**Parent:** META02 (c197352) — plugin path cleanup complete
**Blocks:** META03-CYCLE1 (hook enhancement), META03-CYCLE2 (auto-export)

---

## Status

| Fix | Description | Status | Gate | Evidence |
|-----|-------------|--------|------|----------|
| F1 | Delegation depth mismatch | COMPLETE | tsc PASS | types.ts:66-67 aligned to hiveminder.md:130-131 |
| F2 | Session boundary deadlock | COMPLETE | policy PASS | SKILL.md:149-153 sub-session exception added |
| F3 | Hierarchy path inconsistency | COMPLETE | grep PASS | Zero stale refs in .opencode/skills/ |
| F4 | Prime-first load order | COMPLETE | load PASS | Prime first at line 94; 205/244/272 annotated |
| D1 | Contract matrix deliverable | COMPLETE | review PASS | governance-contract-matrix-2026-03-03.md created |

## Execution Order

```
F1 → verify(tsc) → GATE
F3 → verify(grep) → GATE
F4 → verify(skill-load) → GATE
F2 → verify(policy-consistency) → GATE  ← highest risk, last
D1 → verify(completeness) → GATE
FULL VERIFY → tsc + tests → GATE
EXPORT → session checkpoint → done
```

## Success Criteria

1. Zero contradictions between agent profiles and plugin types
2. Sub-sessions can execute file changes without deadlock
3. All hierarchy.json references point to canonical path
4. hivefiver-prime loads before mode/coordination
5. Contract matrix artifact documents all resolutions

## Rollback

Each fix is a single-line or single-paragraph change. `git stash` or `git checkout -- <file>` reverts any individual fix.
