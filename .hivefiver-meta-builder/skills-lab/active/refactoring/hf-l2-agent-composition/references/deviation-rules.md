# Deviation Rules

Deviation rules govern what an agent does when it encounters work NOT in the plan. This is the executor's most sophisticated pattern — it auto-applies rules, tracks deviations, and knows when to stop and ask.

## The Four-Rule System

From gsd-executor. This is the ONLY deviation rule system in the GSD framework. All agents that encounter unplanned work should use this system or a subset of it.

### Rule 1: Auto-Fix Bugs

**Trigger:** Code doesn't work as intended (broken behavior, errors, incorrect output)

**Examples:** Wrong queries, logic errors, type errors, null pointer exceptions, broken validation, security vulnerabilities, race conditions, memory leaks

**Action:** Fix inline → add/update tests if applicable → verify fix → continue task → track as `[Rule 1 - Bug] description`

**No user permission needed.**

### Rule 2: Auto-Add Missing Critical Functionality

**Trigger:** Code missing essential features for correctness, security, or basic operation

**Examples:** Missing error handling, no input validation, missing null checks, no auth on protected routes, missing authorization, no CSRF/CORS, no rate limiting, missing DB indexes, no error logging

**Definition:** Critical = required for correct/secure/performant operation. These aren't "features" — they're correctness requirements.

**Action:** Add → test → verify → track as `[Rule 2 - Missing] description`

**No user permission needed.**

### Rule 3: Auto-Fix Blocking Issues

**Trigger:** Something prevents completing current task

**Examples:** Missing dependency, wrong types, broken imports, missing env var, DB connection error, build config error, missing referenced file, circular dependency

**Action:** Unblock → verify → track as `[Rule 3 - Blocking] description`

**No user permission needed.**

### Rule 4: Ask About Architectural Changes

**Trigger:** Fix requires significant structural modification

**Examples:** New DB table (not column), major schema changes, new service layer, switching libraries/frameworks, changing auth approach, new infrastructure, breaking API changes

**Action:** STOP → return checkpoint with: what found, proposed change, why needed, impact, alternatives → **User decision required**

## Rule Priority Ordering

```
1. Rule 4 applies → STOP (architectural decision)
2. Rules 1-3 apply → Fix automatically
3. Genuinely unsure → Rule 4 (ask)
```

**Decision flow:**
```
Does this affect correctness, security, or ability to complete task?
├── YES, directly → Rules 1-3 (auto-fix)
├── MAYBE, structural → Rule 4 (ask)
└── NO, unrelated → Out of scope, log to deferred-items.md
```

## Scope Boundary

**Critical rule:** Only auto-fix issues DIRECTLY caused by the current task's changes.

**In scope:**
- Bugs introduced by the code you just wrote
- Missing functionality the current task was supposed to add
- Blocking issues that prevent the current task from completing

**Out of scope:**
- Pre-existing warnings in unrelated files
- Linting errors from before your changes
- Failures in files the current task doesn't touch

**Action for out-of-scope discoveries:** Log to `deferred-items.md` in the phase directory. Do NOT fix. Do NOT re-run builds hoping they resolve.

## Fix Attempt Limit

Track auto-fix attempts per task. After **3 auto-fix attempts** on a single task:

1. STOP fixing
2. Document remaining issues in SUMMARY.md under "Deferred Issues"
3. Continue to the next task (or return checkpoint if blocked)
4. Do NOT restart the build to find more issues

**Why:** Infinite fix loops burn context. Three attempts is enough to surface the real problem.

## Deviation Tracking Format

Every deviation is tracked in the SUMMARY.md:

```markdown
## Deviations

| Rule | Type | Description | Files Affected |
|------|------|-------------|----------------|
| Rule 1 | Bug | Fixed null pointer in getUser() | src/api/user.ts |
| Rule 2 | Missing | Added input validation to login | src/api/auth.ts |
| Rule 4 | Architectural | Proposed: add Redis cache layer | — awaiting decision |
```

## Composing Deviation Rules for New Agents

Not every agent needs all four rules. Select by agent type:

| Agent Type | Rules Needed | Why |
|------------|-------------|-----|
| Executor | All 4 | Encounters all types of unplanned work |
| Nyquist Auditor | None (escalate only) | Read-only — never fixes, always escalates |
| Security Auditor | None (open threats only) | Read-only — reports gaps, doesn't patch |
| Doc Writer | Rule 3 only (blocking) | May encounter missing source files |
| Planner | Rule 4 only (ask) | Should never auto-fix — asks user |

**General rule:** Write agents need Rules 1-4. Read-only agents need zero deviation rules — they escalate instead.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Silent scope creep** — fixing pre-existing issues | SUMMARY shows deviations in files not touched by current task | Add scope boundary text, enforce deferred-items.md |
| **Infinite fix loops** — no attempt cap | Task runs 10+ auto-fixes | Add 3-attempt limit, document in SUMMARY |
| **Rule confusion** — treating architectural changes as bugs | Rule 4 items tracked as Rule 1 | Clarify trigger definitions |
| **No tracking** — deviations not recorded | SUMMARY.md has no Deviations section | Add tracking table to structured returns |
| **Over-delegating** — read-only agents applying rules | Verifier/auditor modifies source | Add read-only enforcement + ESCALATE pattern |
