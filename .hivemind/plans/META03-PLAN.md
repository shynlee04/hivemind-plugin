# META03: Governance Canonicalization Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve 3 cross-team-validated governance conflicts + 1 load-order fix, then enhance governance plugin hooks for richer context injection (Cycle 1+).

**Architecture:** Sequential fix-verify-gate pipeline. Each fix is atomic, independently rollbackable, and verified before proceeding.

**Rationale:** "Your observed failures are governance drift failures, not algorithmic limitations. Canonicalizing contracts first reduces ambiguity at every turn boundary." — Cross-team synthesis insight.

**Parent:** META02 (c197352) — plugin path cleanup complete
**Blocks:** META03-CYCLE2 (auto-export), META03-CYCLE3 (context intelligence tooling)

---

## Cycle 0 — Governance Conflict Resolution (COMPLETE at 87fdc06)

| Fix | Description | Status | Gate | Evidence |
|-----|-------------|--------|------|----------|
| F1 | Delegation depth mismatch | COMPLETE | tsc PASS | types.ts:66-67 aligned to hiveminder.md:130-131 |
| F2 | Session boundary deadlock | COMPLETE | policy PASS | SKILL.md:149-153 sub-session exception added |
| F3 | Hierarchy path inconsistency | COMPLETE | grep PASS | Zero stale refs in .opencode/skills/ |
| F4 | Prime-first load order | COMPLETE | load PASS | Prime first at line 94; 205/244/272 annotated |
| D1 | Contract matrix deliverable | COMPLETE | review PASS | governance-contract-matrix-2026-03-03.md created |

## Cycle 1 — Hook Enhancement (COMPLETE)

| Task | Description | Status | Evidence |
|------|-------------|--------|----------|
| T1 | Types extension (6 interfaces) | COMPLETE | types.ts:193-266, tsc PASS |
| T2 | Compaction hook: loadHiveOpsContext() | COMPLETE | compaction.ts:119-192, tsc PASS |
| T3 | System.transform: SOT + mems injection | COMPLETE | context-injection.ts:192-302, tsc PASS |
| T4 | Messages.transform: dedup engine | COMPLETE | messages-transform.ts (new), index.ts wired, tsc PASS |
| T5 | Code review gate | COMPLETE | 6/6 criteria PASS |
| T6 | Full verification | COMPLETE | tsc clean, 182/214 pass (32 pre-existing) |

## Cycles 2-4 — NOT STARTED

- Cycle 2: Auto-Export & Session Lifecycle
- Cycle 3: Context Intelligence Tooling
- Cycle 4: Schema Registration

## Success Criteria

1. Zero contradictions between agent profiles and plugin types
2. Sub-sessions can execute file changes without deadlock
3. All hierarchy.json references point to canonical path
4. hivefiver-prime loads before mode/coordination
5. Contract matrix artifact documents all resolutions
6. Compaction recovery includes SOT/mems/brain context
7. Per-turn injection includes SOT summary and recent decisions
8. Message dedup reduces token waste on consecutive identical content

## Rollback

Each fix is a single-line or single-paragraph change. `git stash` or `git checkout -- <file>` reverts any individual fix. Cycle 1 changes are additive (new interfaces, new function, new file) — no existing behavior modified.
