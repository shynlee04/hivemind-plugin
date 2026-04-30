---
phase: 32
amendment_source: delegation-async-pty-lifecycle-audit-2026-04-30.md
severity: high_override
author: hm-l1-coordinator
---

# Phase 32: AUDIT AMENDMENT — Phantom Phase References Persist

**Audit Date:** 2026-04-30
**Previous Status:** COMPLETE (7/7 tasks)
**Amended Status:** **INCOMPLETE — PHANTOM PHASES REMAIN**

---

## ⚠ POST-VALIDATION OVERRIDE (2026-04-30)

This amendment's framing — *"phantom phase references that don't exist in `.planning/phases/`"* — is **CONTEXTUAL**, not a true gap. Validation pass documented in `../../AUDIT-VALIDATION-2026-04-30.md`:

- The branch HAS `.planning/workstreams/milestone/phases/` with **70 phase directories** including 02, 09, 14, 16.x, 32, 36, 38, 46, 48.x, 52, 53 — i.e. all the "phantom" ones.
- The audit was searching `.planning/phases/` (legacy root). The project deliberately partitions planning by workstream — `workstreams/{milestone, skill-ecosystem, agent-synthesis}/phases/` — per the SE-ROADMAP D-01 decision that anchors `.hivemind/` as canonical state root.
- Phase 02 has 27 .md files including 9/9 PLANs, 9/9 SUMMARIes, plus VERIFICATION/VALIDATION/REVIEW/UAT/CONTEXT — the "0/8 complete, 1 doc" claim is false.

**Effective status:** RETURNED to **COMPLETE — pending path-layout doc**.

**Replacement work item:** Phase **32.1** (`../../phases/32.1-workstream-path-layout-doc/`) closes the documentation gap so future audits don't make the same mistake. **No phase deletions are required.**

The original amendment text is retained below for historical/audit-trail purposes only.

---

## Audit Override

The 2026-04-30 comprehensive audit reveals that **phantom phase references persist in planning metadata**:

- User context referenced phases 9, 14, 16, 48, 52, 53
- `.planning/phases/` (main repo) contains ONLY:
  - `01-baseline-cleanup/` (0 items)
  - `02-v3-runtime-architecture/` (0 items — only RESEARCH.md exists)
- **No Phase 9, 14, 16, 48, 52, or 53 directories exist in main repo `.planning/phases/`**
- The worktree has these phases but they are not in the main repo
- `.planning/ROADMAP.md:39-50` — Phase 2: 0/8 complete (only RESEARCH.md exists)
- STATE.md and ROADMAP.md in the worktree claim Phase 2 is "9/9 plans complete, 18/18 verified" — but the filesystem shows only RESEARCH.md

**The planning metadata contains inflated completion claims that do not match the filesystem reality.**

---

## Amended Requirements

### GAP-TRACE-04: Delete phantom phase references from all planning documents

**New Requirement:** Remove all references to non-existent phases from:

- `ROADMAP.md` — Phase status table must match filesystem
- `STATE.md` — Phase completion details must match filesystem
- `REQUIREMENTS.md` — Traceability matrix must match actual phases
- `PROJECT.md` — Phase references must be accurate
- AGENTS.md — Phase examples must be real
- Any `.planning/workstreams/` documents

**Specific actions:**
1. Phase 9 — Mark as `DOES NOT EXIST` or create placeholder with `STATUS-PHANTOM.md`
2. Phase 14 — If it exists only in worktree, note that it is worktree-only
3. Phase 16 — Exists in worktree; main repo has no equivalent
4. Phase 48–53 — Exist in worktree; main repo has no equivalent
5. Phase 2 — Correct "9/9 plans complete" to "0/8 complete, 1 research document"

**Acceptance Criterion:**
- No phase is marked "complete" without filesystem evidence
- All phase references have corresponding `.planning/phases/` directory or explicit worktree-only note
- ROADMAP.md status table matches `ls .planning/phases/`

**Priority:** P1 HIGH

**Affected Files:** `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/REQUIREMENTS.md`, `.planning/PROJECT.md`, `AGENTS.md`

---

### GAP-TRACE-05: Create canonical phase directory or archive phantom phases

**New Requirement:** Either create the missing phase directories in the main repo or archive them.

**Option A — Create placeholders:**
```
.planning/phases/09-sticky-delegation-corrective/STATUS-PHANTOM.md
.planning/phases/14-delegate-task-truth-reset/STATUS-PHANTOM.md
.planning/phases/16-background-delegation/STATUS-PHANTOM.md
```
Each `STATUS-PHANTOM.md` contains: "This phase exists only in the worktree `.worktrees/harness-experiment/`. Main repo does not implement this phase."

**Option B — Archive worktree phases:**
- Move worktree phases to `.planning/worktrees/harness-experiment/phases/` (already there)
- Update all main repo docs to reference worktree path explicitly

**Option C — Remove all references:**
- Delete phase numbers from ROADMAP.md that don't exist in main repo
- Renumber remaining phases to be contiguous

**Acceptance Criterion:** No confusion about which phases exist where.

**Priority:** P1 HIGH

**Affected Files:** `.planning/phases/` (may need new directories)

---

### GAP-TRACE-06: Add filesystem verification to planning health check

**New Requirement:** The planning health check (`31-planning-documentation-refresh`) must verify that every phase referenced in docs exists on disk.

**Details:**
- Script or manual step: compare `ROADMAP.md` phase list with `ls .planning/phases/`
- Flag any phase marked "complete" without corresponding directory
- Flag any phase directory without corresponding ROADMAP.md entry

**Acceptance Criterion:** Planning health check catches phantom phases automatically.

**Priority:** P2 MEDIUM

**Affected Files:** `.planning/phases/31-planning-documentation-refresh/` (health check script)

---

## Verification Criteria (Added)

- [ ] `ls .planning/phases/` matches ROADMAP.md phase list (± worktree-only notes)
- [ ] No phase marked "complete" without filesystem evidence
- [ ] Phase 2 status reflects actual filesystem (0/8, 1 research doc)
- [ ] Worktree phases explicitly labeled as worktree-only in main repo docs
- [ ] Health check script verifies phase directory existence

---

## Cross-Phase Impact

| Phase | Impact |
|-------|--------|
| Phase 31 (Planning Refresh) | Must include phantom phase cleanup |
| Phase 53 (Release Readiness) | Release readiness must not claim phantom phases |
| All future phases | New phases must be created on disk before being marked complete |

---

_Amended: 2026-04-30_
_Priority: P1 HIGH — inflated completion claims erode trust in all planning metadata_
