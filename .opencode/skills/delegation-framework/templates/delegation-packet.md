# Delegation Packet Template

**PURPOSE**: Fill in this template before dispatching ANY delegation. All required fields must be completed; optional fields are recommended for complex tasks.

---

## Delegation Packet

### Required Fields

**Objective**: _[WHAT to accomplish — goal, not method]_

**Scope**:
- In scope: _[explicit list of what IS included]_
- Out of scope: _[explicit list of what IS NOT included]_

**Constraints**:
- Architecture: _[patterns to follow, files to avoid]_
- Time/tokens: _[estimated budget]_
- Dependencies: _[what must exist before this work]_

**Acceptance Criteria**:
- [ ] _[Criterion 1 — concrete, verifiable]_
- [ ] _[Criterion 2 — concrete, verifiable]_
- [ ] _[Criterion 3 — concrete, verifiable]_

**Output Format**: _[expected structure: file changes / report / test results / etc.]_

### Optional Fields (Recommended for Complex Tasks)

**Context Payload**:
- Decisions made so far: _[key decisions the subagent needs to know]_
- Prior art: _[relevant existing files, patterns, tests]_
- Known risks: _[things that could go wrong]_

**Communication Protocol**:
- Report back when: _[conditions for intermediate updates]_
- Escalate if: _[conditions that require orchestrator intervention]_
- Completion signal: _[how to know it's done]_

---

## Template Rules

1. **Never leave "Objective" vague** — "Fix the bug" fails. "Fix the auth token refresh returning 401 in src/auth.ts:L45" passes.
2. **Always define out-of-scope** — prevents scope creep during execution.
3. **Acceptance criteria must be verifiable** — if you can't write a command to check it, it's not a criterion.
4. **Include constraints** — subagents without constraints will optimize for completion, not quality.
