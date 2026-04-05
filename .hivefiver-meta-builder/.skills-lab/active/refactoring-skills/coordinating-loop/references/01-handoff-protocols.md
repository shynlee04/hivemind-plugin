# Hand-off Protocols

How to transfer context between agents and skills safely, completely, and without leakage.

---

## The Problem

When an Agent dispatches work to another Agent, the most common failure mode is **context mismatch**:

- **Too much context** — Child Agent drowns in irrelevant session history, loses focus.
- **Too little context** — Child Agent lacks critical information, makes wrong assumptions.
- **Wrong context** — Child Agent receives stale or contradictory instructions.
- **No verification** — Parent Agent has no way to confirm the child understood the task.

This reference defines a protocol that prevents all four.

---

## Hand-off Anatomy

Every hand-off consists of four parts:

### 1. Task Envelope (REQUIRED)

The minimum viable hand-off. Every dispatch must include:

```markdown
## Task
<One-sentence description of what needs to happen>

## Scope
- **Include:** <Specific files, functions, or areas to work on>
- **Exclude:** <Specific files, functions, or areas to NOT touch>

## Context
<Error messages, file paths, relevant code snippets, test names>

## Expected Output
<What the child Agent should return when done>

## Verification
<Concrete step the child must run before returning>
```

### 2. Context Payload (ADAPTIVE)

What to include depends on the task type:

| Task Type | Include | Exclude |
|-----------|---------|---------|
| Bug fix | Error output, failing test, relevant source | Unrelated test failures, full session history |
| Feature build | Spec, acceptance criteria, existing patterns | Unrelated code, design debates |
| Refactor | Before/after examples, constraints | Business logic changes, new features |
| Investigation | Symptoms, affected files, hypotheses | Unrelated subsystems |
| Skill creation | Target skill name, purpose, trigger phrases | Other skills' internal content |

### 3. Constraints Block (REQUIRED)

Explicit boundaries that prevent scope creep:

```markdown
## Constraints
- Do NOT modify files outside <scope>
- Do NOT change existing behavior except where specified
- Do NOT introduce new dependencies
- Do NOT skip verification steps
- Return summary even if task cannot be completed
```

### 4. Receipt Confirmation (REQUIRED)

The child Agent must confirm understanding before starting:

```markdown
## Confirmation
- Task understood: <restate in own words>
- Scope boundaries: <list included and excluded files>
- Verification step: <confirm the gate to pass>
- Any ambiguities: <list questions before proceeding>
```

If the child cannot confirm all four, it must ask clarifying questions rather than guess.

---

## Filled-In Example: Complete Hand-off

**Scenario:** Parent Agent dispatches a child to fix failing auth tests.

### Parent writes this envelope:

```markdown
## Task
Fix the 3 failing tests in tests/lib/session-api.ts caused by SDK API change.

## Scope
- **Include:** tests/lib/session-api.ts, src/lib/session-api.ts
- **Exclude:** All other test files, all production code outside session-api.ts,
  any files in src/lib/continuity.ts or src/lib/state.ts

## Context
Error output from last test run:
```
FAIL tests/lib/session-api.ts
  ✕ waitForSession should retry on timeout (tests/lib/session-api.ts:45)
    TypeError: client.waitForSession is not a function
  ✕ createSession should handle multi-path fallback (tests/lib/session-api.ts:78)
    Expected 200 but received 500
  ✕ getSession should parse response correctly (tests/lib/session-api.ts:112)
    Cannot read properties of undefined (reading 'id')
```

The SDK changed `waitForSession()` to `waitForSessionAsync()`. The multi-path
fallback at src/lib/session-api.ts:142-168 uses the old signature.

Reference the working pattern at src/lib/continuity.ts:200-215 which already
handles the new SDK signature correctly.

## Expected Output
1. Summary of root cause (what changed in the SDK)
2. List of changes made in file:line format
3. Confirmation that all 3 tests pass with `npm test -- tests/lib/session-api.ts`

## Verification
Run: npm test -- tests/lib/session-api.ts
All 3 tests must pass. If any fail, report which ones and why.

## Constraints
- Do NOT modify files outside tests/lib/session-api.ts and src/lib/session-api.ts
- Do NOT change existing behavior except where the SDK signature changed
- Do NOT introduce new dependencies or imports
- Return summary even if task cannot be completed
```

### Child returns this confirmation:

```markdown
## Confirmation
- Task understood: Fix 3 failing tests in session-api.ts by updating the SDK
  call from waitForSession() to waitForSessionAsync() and fixing the multi-path
  fallback at lines 142-168.
- Scope boundaries: Only tests/lib/session-api.ts and src/lib/session-api.ts.
  Nothing else.
- Verification step: npm test -- tests/lib/session-api.ts must pass all 3 tests.
- Any ambiguities: None — the reference at continuity.ts:200-215 shows the
  correct pattern. Proceeding.
```

### Child returns this result:

```markdown
## Result: TASK COMPLETE

### Root Cause
The SDK renamed `waitForSession()` to `waitForSessionAsync()` and changed the
return type from synchronous to Promise-based. The multi-path fallback at
src/lib/session-api.ts:142-168 was calling the old method name.

### Changes Made
- src/lib/session-api.ts:145 — Renamed `waitForSession` to `waitForSessionAsync`, added `await`
- src/lib/session-api.ts:152 — Updated response parsing to handle new Promise return type
- src/lib/session-api.ts:160 — Fixed undefined access by adding null check before `.id`
- tests/lib/session-api.ts:45-50 — Updated test to use async/await pattern
- tests/lib/session-api.ts:78-85 — Updated mock to return Promise instead of sync value
- tests/lib/session-api.ts:112-118 — Added null check in test assertion

### Verification
```
$ npm test -- tests/lib/session-api.ts
PASS tests/lib/session-api.ts (2.3s)
  ✓ waitForSession should retry on timeout (45ms)
  ✓ createSession should handle multi-path fallback (12ms)
  ✓ getSession should parse response correctly (8ms)
Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

All 3 tests pass.
```

---

## What to Leave Behind

**Never include in a hand-off:**

- Full session history or conversation context
- Unrelated failures or tangents
- Speculative reasoning or hypotheses not yet validated
- Internal coordination decisions between other agents
- Sensitive information (API keys, credentials, internal URLs)
- Stale decisions that have been superseded

**The parent Agent's job is to filter, not forward.**

---

## Verification of Receipt

After dispatching, the parent Agent must:

1. **Wait for confirmation** — Child Agent restates task, scope, and verification step.
2. **Check for ambiguities** — If child asks questions, answer them before child proceeds.
3. **Confirm scope boundaries** — Ensure child knows what NOT to touch.
4. **Record the hand-off** — Write to `progress.md` with timestamp, task, and child Agent scope.

If the child Agent does not provide confirmation, the parent must re-dispatch with clearer instructions.

---

## Multi-Agent Hand-off Chains

When work flows through multiple agents (A → B → C):

```
Parent → Agent A → Agent B → Agent C
```

Each link in the chain must:

1. **Receive** a complete Task Envelope from the previous agent.
2. **Confirm** understanding before proceeding.
3. **Produce** output that includes a new Task Envelope for the next agent (if needed).
4. **Write results to disk** — never rely on in-memory context for chain continuity.

**Chain continuity rule:** Each agent writes its output to a named file that the next agent reads. The file name must be descriptive and date-stamped.

Example:
```
findings-agent-a-2026-04-03.md → findings-agent-b-2026-04-03.md → findings-agent-c-2026-04-03.md
```

---

## Hand-off Anti-Patterns

| Anti-Pattern | What It Looks Like | Fix |
|-------------|-------------------|-----|
| The Data Dump | Pasting entire conversation history | Filter to task-relevant context only |
| The Whisper | "Fix the thing we discussed" | Restate task explicitly with file paths |
| The Moving Target | Changing scope after dispatch | Freeze scope in Task Envelope before dispatch |
| The Black Hole | No confirmation, no output format | Require receipt confirmation and expected output |
| The Chain Break | Agent B doesn't know what Agent A did | Write Agent A's output to disk, reference in B's envelope |

---

## Cross-References

- `references/02-sequential-vs-parallel.md` — When to chain agents sequentially vs dispatch in parallel
- `references/03-parent-child-cycles.md` — How parent agents monitor child hand-offs
- `references/04-ralph-loop-integration.md` — How hand-offs work within ralph-loop cycles
