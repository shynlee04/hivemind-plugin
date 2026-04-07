# Task Plan: Hivefiver Skill Audit + Fix

**Goal:** Fix 4 broken skills + validate 3 agents + fix playbook. All must pass HIVEFIVER-PLAYBOOK rules and universal-rules.md.

**Current Phase:** Phase 7b — Fix Execution (5/7 complete)

## Phase 7: Hivefiver Skill Audit + Fix (2026-04-07)

### Audit Results
| Artifact | Verdict | Defects | Status |
|----------|---------|---------|--------|
| session-context-manager | NEEDS_FIX | 2 | ✅ FIXED |
| phase-loop | NEEDS_FIX | 4 | ✅ FIXED |
| command-parser | NEEDS_REWRITE | 4 | ✅ ALREADY CLEAN (stale audit) |
| agent-authorization | NEEDS_FIX | 4 | ✅ FIXED |
| intent-loop agent | CLEAN | 0 | ✅ NO ACTION |
| spec-verifier agent | CLEAN | 0 | ✅ NO ACTION |
| phase-guardian agent | CLEAN | 0 | ✅ NO ACTION |
| HIVEFIVER-PLAYBOOK | NEEDS_FIX | 3 critical | ✅ FIXED |

### Fix Tasks
- [x] 7a. session-context-manager — workspace-relative paths, no --constraint, added `<files_to_read>`
- [x] 7b. phase-loop — YAML allowed-tools, removed TS code, added `<files_to_read>`, fixed generic roles
- [x] 7c. command-parser — was already clean (audit read stale version)
- [x] 7d. agent-authorization — YAML format, soft task_plan.md ref, specialist names as examples, softened thresholds, removed meta-builder dead ref
- [x] 7e. HIVEFIVER-PLAYBOOK — instruction→instructions, removed phantom name field, added steps field, fixed allowed-tools example
- [ ] 7f. Integration fixes — broken cross-refs, state bridge
- [ ] 7g. System-wide re-validation

**Status:** in_progress

## Decisions Made
| Decision | Rationale | When |
|----------|-----------|------|
| command-parser was already clean | Audit read stale version; actual file had proper YAML, no JS, no GSD refs | Phase 7 |
| Bash IS allowed in skills | OpenCode supports `!command` for shell output injection | Phase 7 |
| Fix .opencode/ versions only | These are live installed versions; lab copies are mirrors via symlinks | Phase 7 |
| Subagents kept aborting | Context budget exhaustion; switched to direct edits | Phase 7 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| Builder subagents returned empty | Dispatched 3x with different prompts | Switched to direct edits |
| Context compaction mid-audit | Multiple waves dispatched simultaneously | Re-dispatched with tighter scopes |
| task_plan.md missing at root | Files were cleaned up during archive | Created fresh plan file |
