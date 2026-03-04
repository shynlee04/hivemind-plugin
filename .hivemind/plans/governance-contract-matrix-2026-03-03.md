# Governance Contract Matrix — META03 Cycle 0

**Status**: completed  
**Owner**: hiveplanner  
**Plan ID**: META03-CYCLE0  

**Date:** 2026-03-03
**Parent:** META02 (c197352)
**Author:** Orchestrator session (META03 Cycle 0)
**Status:** COMPLETE

---

## Resolved Conflicts

### Conflict 1: Delegation Depth Mismatch

| Aspect | Detail |
|--------|--------|
| **Source A** | `agents/hiveminder.md:130-131` |
| **Source B** | `.opencode/plugins/hiveops-governance/types.ts:66-67` |
| **Before** | Agent profile: depth=1, recursive=false. Plugin: depth=3, recursive=true. |
| **After** | Both: depth=1, recursive=false |
| **Resolution** | Aligned plugin types to agent profile (source of truth) |
| **Risk** | LOW |
| **Verification** | tsc compiles, values match agent profile |
| **Rollback** | Revert types.ts lines 66-67 |

### Conflict 2: Session Boundary Deadlock

| Aspect | Detail |
|--------|--------|
| **Source A** | `agents/hiveminder.md:179` — sub-sessions "do not ask user for confirmation" |
| **Source B** | `.opencode/skills/hivemind-governance/SKILL.md:143-147` — "WAIT yes/proceed before ANY file change" |
| **Before** | Unresolvable deadlock: sub-sessions cannot obey both policies simultaneously |
| **After** | Sub-session exception added (SKILL.md:149-153): delegated sub-sessions execute without user confirmation; parent session's dispatch approval serves as authorization gate |
| **Resolution** | Scoped exception preserving main session governance while unblocking sub-sessions |
| **Risk** | MEDIUM — exception is narrowly scoped to explicit delegation packets only |
| **Verification** | Main session rules unchanged, sub-session policy aligned with hiveminder.md |
| **Rollback** | Remove lines 149-153 from SKILL.md |

### Conflict 3: Hierarchy Path Inconsistency

| Aspect | Detail |
|--------|--------|
| **Source A** | `.opencode/skills/session-lifecycle/SKILL.md:174` — `.hivemind/hierarchy.json` |
| **Source B** | `.opencode/skills/hivefiver-mode/SKILL.md:19` — `.hivemind/state/hierarchy.json` |
| **Before** | Two different paths referenced; 5 stale refs vs 67 canonical refs |
| **After** | All active skill references use `.hivemind/state/hierarchy.json` |
| **Resolution** | Updated session-lifecycle to canonical path (matches runtime code, actual file location) |
| **Risk** | LOW |
| **Verification** | Zero stale refs in `.opencode/skills/`, path matches `src/lib/paths.ts:190` |
| **Rollback** | Revert session-lifecycle SKILL.md line 174 |

### Conflict 4: First-Load Skill Ambiguity

| Aspect | Detail |
|--------|--------|
| **Source A** | `agents/hivefiver.md:94` — loaded mode+coordination first |
| **Source B** | `.opencode/skills/hivefiver-prime/SKILL.md:4` — "MANDATORY first-load... BEFORE any other skill" |
| **Before** | hivefiver skipped prime bootstrap, loaded mode+coordination directly |
| **After** | Line 94 loads prime FIRST; lines 205/244/272 annotated with "prime already active" |
| **Resolution** | Prime loads first (role boundaries, session hierarchy, progressive disclosure), then triggers mode+coordination |
| **Risk** | LOW |
| **Verification** | Prime skill exists and declares first-load; no conflicting instructions |
| **Rollback** | Revert hivefiver.md line 94 and remove annotations |

---

## Cross-Reference Map

| Policy Domain | Canonical Source | Governed By |
|---------------|-----------------|-------------|
| Delegation topology (agents) | `agents/{agent}.md` (profile section) | Agent profile |
| Delegation topology (runtime) | `.opencode/plugins/hiveops-governance/types.ts` | Must mirror agent profiles |
| User confirmation policy | `.opencode/skills/hivemind-governance/SKILL.md` section 8 | Governance skill |
| Sub-session behavior | `agents/hiveminder.md:178-179` | Agent profile |
| Hierarchy file path | `.hivemind/state/hierarchy.json` | `src/lib/paths.ts:190` (runtime code) |
| Skill load order (hivefiver) | `agents/hivefiver.md:94` | Agent profile |
| Skill bootstrap (hivefiver) | `.opencode/skills/hivefiver-prime/SKILL.md` | Skill metadata |

---

## Previously Resolved (META02)

| Conflict | Resolution | Commit |
|----------|------------|--------|
| Plugin path duplication (`plugins/` vs `plugin/`) | Migrated 28 refs, deleted stale dir | c197352 |
| hivefiver-prime stale TODOs | Resolved 6 markers, added YAML frontmatter | c197352 |

---

## Remaining Known Items

| Item | Status | Notes |
|------|--------|-------|
| META02-SUB03 (content placement architecture) | Pending restart | Noted in c197352 |
| META02-SUB04 (agent body + prompt injection rewrite) | Pending restart | Noted in c197352 |
| 5 stale hierarchy refs outside `.opencode/skills/` | Tracking | In archive docs, low priority |

---

## Cycle 1 Prerequisites

All Cycle 0 conflicts resolved. Cycle 1 (Governance Plugin Hook Enhancement) can proceed when:
1. This contract matrix is validated by user
2. Full verification (tsc + tests) passes
3. Changes committed to repository
