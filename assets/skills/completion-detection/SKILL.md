---
name: completion-detection
description: >
  Use when detecting and guardrailing against premature completion claims —
  verifying that subagent "done" assertions are backed by fresh runtime evidence,
  enforcing dual-signal completion protocol (doer + verifier must agree), and
  catching hollow "it works" claims that skip verification. Triggers on:
  "verify completion", "completion detection", "dual-signal", "premature completion",
  "evidence before claims", "hollow done", "fake done", "completion guardrail",
  "verify before complete", "block completion until verified",
  "done but not verified", "did it actually work", "completion verification",
  "dual-signal completion", "two-agent completion", "fresh evidence requirement".
  NOT for loop mechanics (iterative-loop), delegation patterns (subagent-delegation-patterns),
  or quality gate triad orchestration (quality-gate-orchestration).
metadata:
  layer: "2"
  role: "execution-engine"
  pattern: P2
  version: "1.0.0"
---

# Completion Detection

## The Iron Law

```
NO completion claim without fresh verification evidence.
```

## Overview

Completion detection is the discipline of **distinguishing real completion from declared completion.** An agent saying "done" is not proof of completion — it is a claim that must be independently verified before the loop advances, the result is committed, or the next task begins.

The core problem: agents are incentivized to declare completion early. Under context pressure, budget constraints, or task ambiguity, a subagent may report "tests pass" when they were never run, "code compiles" when it has syntax errors, or "feature is complete" when only the happy path is handled.

This skill provides the dual-signal protocol — a verification layer that separates the **doer** from the **verifier** — and the fresh-evidence rule that prevents stale or fabricated completion claims from passing.

## When to Use / When NOT to Use

**Load this skill when:**
- A subagent returns claiming a task is complete and you need to verify
- You observe a pattern of premature "done" claims in agent output
- You need to enforce "verify before complete" discipline in autonomous loops
- A task says "make sure it actually works" or "verify before claiming done"
- You are building a two-agent pipeline (do → verify → commit)
- You need guardrails against hollow completion in delegation workflows
- You receive claims like "tests passed" without test output, or "it should work because..."

**Do NOT load this skill for:**
- Loop mechanics (how to iterate, retry, or refine — use iterative-loop)
- Subagent delegation mechanics (how to dispatch agents — use subagent-delegation-patterns)
- Quality gate triad orchestration (lifecycle → spec → evidence gates — use quality-gate-orchestration)
- Task planning or decomposition (those are separate concerns)

## What Completion Detection Detects

### Signal 1: Hollow "Done" Claims

The subagent declares completion without providing evidence.

**Detection pattern:**
Agent says "done" or "complete" but:
- Does not include test output or verification log
- Does not reference specific files or changes made
- Does not state exit criteria met
- Generic victory lap: "Successfully completed..." with no detail

**Response:** Request fresh verification. If none provided, mark as NOT_COMPLETE.

### Signal 2: Mock-Only Evidence

The subagent claims runtime behavior without runtime execution.

**Detection pattern:**
- "Tests pass" but tests were never run (only examined or discussed)
- "The code compiles" but build was never invoked
- "Integration works" but only the interface was defined, never exercised
- "The fix works" but only the fix was applied, not tested

**Response:** Require actual command output. "Tests pass" with no `npm test` output is not evidence. Mock expectations are not runtime proof.

### Signal 3: Stale Verification

The subagent references verification that happened earlier in the session, before the current changes.

**Detection pattern:**
- "Tests passed earlier in the session" — but new code has been added since
- "I already verified this" — without re-running after the latest change
- "It was working before" — status quo ante is not current correctness

**Response:** Fresh verification is required after every change. "Earlier" evidence is stale. Re-run now.

### Signal 4: Missing Runtime Proof

The subagent asserts behavior that could only be proven by running the actual system, without running it.

**Detection pattern:**
- "The error should be fixed because I changed the condition"
- "The query should return the right results because the filter is correct"
- "The feature works end-to-end" but no end-to-end execution was performed

**Response:** Run the actual system. Block on "should work" — require "does work" with evidence.

## Dual-Signal Completion Protocol

The dual-signal protocol separates the **doer** (who declares completion) from the **verifier** (who confirms with fresh evidence). Both must agree before completion is accepted.

### Protocol Flow

```
PHASE 1: SUBAGENT COMPLETES WORK
  Subagent: "Task complete. Here are the changes: [list of changes]"
  → Do NOT accept this as completion yet

PHASE 2: VERIFY WITH FRESH EVIDENCE (MANDATORY)
  Run verification commands with the ACTUAL current state:
    - build command → check exit code 0
    - test command → check all tests pass
    - linter → check no errors
    - runtime check → actual execution produces expected output
  → Record the verification output verbatim

PHASE 3: COMPARISON — Does Subagent Claim Match Verification?
  Claim: "All tests pass"
  Evidence: $ npm test → 15 passed, 0 failed
  → MATCH: completion confirmed

  Claim: "All tests pass"
  Evidence: $ npm test → 3 failed, 12 passed
  → MISMATCH: completion REJECTED

PHASE 4: RESOLUTION
  If MATCH → mark as COMPLETE, proceed
  If MISMATCH → return to doer with verification output, do NOT proceed
```

### Dual-Agent Variant

For autonomous workflows, enforce separation of concerns:

```
Agent A (Doer):   Changes files, applies fixes, produces output
                  Declares "done" with change summary

Agent B (Verifier): INDEPENDENT verification
                  1. Reads the current state (files, test output, runtime)
                  2. Runs verification commands with fresh execution
                  3. Compares doer's claim against actual evidence
                  4. Returns verification verdict: PASS or FAIL with evidence
```

**Rule of separation:** The verifier must not be the same session or the same agent that did the work. A doer cannot verify its own completion — the incentive to confirm its own claim is too strong.

## Fresh Evidence Rule

**The rule:** Every verification must produce fresh output in the current turn. No reference to prior runs, no "I already checked," no "it was working before."

### Enforcement

| Claim Type | Fresh Evidence Required | Acceptable |
|------------|------------------------|------------|
| "Tests pass" | `npm test` output in this turn | ✅ Actual output with counts |
| | | ❌ "Tests passed earlier" |
| | | ❌ "They should pass because..." |
| "Code compiles" | `npm run build` exit code + output | ✅ Exit 0 with no errors |
| | | ❌ "It compiled last build" |
| "Feature works" | Actual runtime execution evidence | ✅ Command output showing correct behavior |
| | | ❌ "The logic looks correct" |
| "Change is applied" | File read showing the change | ✅ `git diff` or file read with expected content |
| | | ❌ "I just wrote it" |

### The Exception

If the verification command itself produces no output (e.g., silent success), run it with a flag that produces output (`--verbose`, `-v`) or wrap it: `echo "EXIT: $?" && npm test`.

No output is not evidence. Silent exit 0 with no output is acceptable ONLY if the command is well-known to produce exit codes reliably (e.g., `grep -q`).

## Completion Claim Grading

Use this rubric to grade completion claims:

| Grade | Definition | Action |
|-------|------------|--------|
| **CONFIRMED** | Claim backed by fresh verification output in the current turn | Accept — mark complete |
| **PLAUSIBLE** | Claim is consistent with what was implemented, but no fresh evidence provided | Request fresh verification before accepting |
| **SUSPICIOUS** | Claim contradicts available evidence or lacks specifics | Reject — request verification + clarification |
| **FALSE** | Claim directly contradicted by fresh verification | Reject — escalate with evidence |

## Completion Gate Checklist

Use this checklist before marking ANY task as complete:

```
- [ ] Subagent declared completion with specific claim?
- [ ] Claim includes WHAT was done (files changed, features added)?
- [ ] Claim includes HOW it was verified (test output, build output)?
- [ ] Fresh verification was run in this turn (not earlier)?
- [ ] Verification output matches the claim?
- [ ] If discrepancy: was it reported and actioned?
- [ ] Is the completion dual-signal (doer + verifier agreed)?

If any of these is UNCHECKED: Do NOT mark as complete.
```

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Self-verification** | The agent that did the work also claims verification | Use dual-signal: verifier must be a separate agent/session |
| **Stale evidence** | "Tests passed yesterday" or "I checked earlier" | Re-run all verification after every change |
| **Mock evidence** | "Tests should pass" or "The logic is correct so it works" | Require actual command execution with output |
| **Selective reporting** | Test output shown but only passing tests reported | Show full output including failures |
| **Rubber-stamp verification** | A verifier that always passes regardless of evidence | Rotate verifiers or enforce fresh evidence requirement |
| **Trusted shortcut** | "I trust this agent, no need to verify" | Trust is not verification. Rules apply equally |
| **Implicit completion** | Silence = done (agent stops, no completion claim made) | Require explicit completion declaration before verifying |
| **Verification without running** | Reading test files instead of executing them | Execution is the only verification. Read-only is review, not verification. |
| **Exit code only** | "Exit 0" without output content | Capture both exit code AND output. Exit 0 can be faked. |

## Cross-References

- **iterative-loop** — Loop mechanics. Use completion-detection inside each iteration to verify the iteration's output before deciding to continue or exit.
- **subagent-delegation-patterns** — Delegation mechanics. Use completion-detection to verify subagent output before accepting results from async delegations.
- **wave-execution** — Parallel execution. Apply completion-detection to verify each wave's output before advancing to the next wave.
- **quality-gate-orchestration** — Quality gate triad. Completion-detection feeds evidence into the evidence gate (terminal gate in the triad).
- **hm-coord-loop** — Multi-agent workflows. Dual-signal protocol is a coordination pattern between doer and verifier agents.
