---
name: hm-loop-completion
description: >
  Guardrail workflows against regression with non-completion detection and automatic loop-back.
  Use when a task must loop until verified complete, when guarding against premature success claims,
  when implementing self-verifying subagent dispatch, when agents report "done" but verification fails,
  when building autonomous loops that need completion gates, or when tasks keep failing silently.
  Even when the user says "make sure it actually works" or "verify before claiming done."
  Triggers: "loop until complete", "verify completion", "completion detection", "guardrail",
  "regression guard", "self-verifying", "autonomous loop", "completion gate",
  "dual-signal", "evidence before claims", "hollow done", "fake done", "fresh evidence requirement".
  NOT for one-shot tasks, simple retry loops, or loop mechanics without verification
  (use hm-loop-phase for that).
metadata:
  consumed-by:
    - "hm-debugger"
    - "hm-finisher"
    - "hm-guardian"
    - "hm-investigator"
    - "hm-operator"
    - "hm-persistor"
    - "hm-executor"
  lineage-scope: "hm-*"
  access: "STRICT"
  role: "completion-guardrail"
  realm: "test,clean-code"
  pattern: P2
  version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

## GSD Compatibility

This skill is the canonical Hivemind replacement. If you're still on GSD:

| GSD skill | Hivemind equivalent | Behavior diff |
|-----------|--------------------|--------------|
| `gsd-verify-work` | `hm-loop-completion` | GSD runs the UAT conversational verifier; Hivemind uses dual-signal protocol (doer + independent verifier) with fresh evidence requirement. Hivemind exposes `hivemind-sdk-supervisor` and `delegation-status` for runtime lifecycle. |

You can use either; the Hivemind path is canonical, the GSD path is supported via the equivalence map.

## Overview

`hm-loop-completion` is the guardrail skill that prevents premature task completion by enforcing verification loops. The Iron Law is the same in every variant:

```
A task is not done when the subagent says it is done.
A task is done when verification proves it is done.
```

The skill merges two layers:
1. **Loop mechanics** (from `hm-l2-completion-looping`): bounded iteration, durable cursors, three gates, the three loop types.
2. **Detection discipline** (from `completion-detection`): the dual-signal protocol, the fresh-evidence rule, completion-claim grading.

The Hivemind binding layer exposes the runtime tools that make the loop executable end-to-end: `hivemind-sdk-supervisor` for session lifecycle, `delegation-status` for agent return polling, and the standard `delegate-task` custom tool for re-dispatch on failure.

## When This Skill Loads — Do This First

1. **Classify the failure mode.** Decide which loop type fits: `verify-after` (subagent returns → verify → loop if fail), `verify-during` (subagent works in iterations, verifies each), or `guardrail` (external monitor watches for premature completion).
2. **Set the iteration budget.** Default: 5 for verify-after, 10 for verify-during, 3 for guardrail. Hard cap: do not exceed without explicit re-authorization.
3. **Write a durable cursor BEFORE the first dispatch.** A loop that can resume later MUST persist `task_id`, `iteration`, `verification_command`, `last_gate_result`, `termination_predicates`, and `resume_pointer` to `.hivemind/state/`.
4. **Define the dual-signal pair.** Decide which agent is the doer and which is the verifier. The verifier must be a different session — a doer cannot verify its own completion.
5. **Define the fresh-evidence rule.** Every verification must run the actual command (test, build, runtime) in the current turn, not reference prior runs.

## The Iron Law (canonical)

```
A task is not done when the subagent says it is done.
A task is done when verification proves it is done.
```

The Iron Law has two invariants: (1) the doer declares, the verifier confirms; (2) verification evidence is fresh, not historical. Both invariants must hold for completion to be accepted.

## The Three Gates

| Gate | Check | Failure Action |
|------|-------|---------------|
| **Output Gate** | Did the subagent produce the expected artifacts? | Re-dispatch with corrected scope |
| **Quality Gate** | Do artifacts pass basic validation (syntax, structure, references)? | Return `DONE_WITH_CONCERNS`, fix then re-verify |
| **Scope Gate** | Does output match the task envelope (nothing extra, nothing missing)? | Re-dispatch with spec-compliance emphasis |

All three gates MUST pass before completion is accepted. Skipping a gate is a violation; passing one gate while another fails is a mismatch.

## Loop Types

| Type | Use When | Max Iterations |
|------|----------|----------------|
| **Verify-After** | Subagent returns → verify → loop if fail | 5 |
| **Verify-During** | Subagent works in iterations, verifies each | 10 |
| **Guardrail** | External monitor watches for premature completion | 3 |

If you need more than the cap, stop and escalate — the loop pattern is wrong for the task, not the cap.

## Durable Cursor Schema

Every loop that can resume later MUST write a cursor before stopping or asking a human:

```yaml
task_id: "<stable task/session id>"
iteration: 2
max_iterations: 5
verification_command: "<command or manual check>"
last_gate_result: "output:pass quality:fail scope:pass"
termination_predicates: [output_gate, quality_gate, scope_gate, max_iteration, external_stop]
resume_pointer: "rerun quality gate after fixing <specific issue>"
```

No cursor means no resume claim. Restart from a verified checkpoint, not from chat memory.

## Self-Verification Envelope

When dispatching a subagent that must self-verify, include the verification requirements in the task envelope:

```
## Your Task
<full task text>

## Verification Requirements
Before returning DONE, you MUST:
1. [ ] Run <verification command>
2. [ ] Confirm <output condition>
3. [ ] If any check fails, return DONE_WITH_CONCERNS, not DONE

## Loop-Back Trigger
If verification fails, you will be re-dispatched with:
- Previous attempt findings
- Specific check that failed
- Corrected scope if needed
```

## Dual-Signal Completion Protocol

The doer (who declares completion) and the verifier (who confirms with fresh evidence) must agree. Both must run; both must succeed.

### Protocol Flow

```
PHASE 1: SUBAGENT COMPLETES WORK
  Subagent: "Task complete. Here are the changes: [list]"
  → Do NOT accept this as completion yet

PHASE 2: VERIFY WITH FRESH EVIDENCE (mandatory)
  Run verification commands with the ACTUAL current state:
    - build → check exit code 0
    - test → check all tests pass
    - linter → check no errors
    - runtime → actual execution produces expected output
  → Record the verification output verbatim

PHASE 3: COMPARISON — does the claim match the evidence?
  Match → completion confirmed
  Mismatch → completion REJECTED

PHASE 4: RESOLUTION
  If match → mark as COMPLETE, proceed
  If mismatch → return to doer with verification output; do NOT proceed
```

### Separation Rule

The verifier must NOT be the same session or the same agent that did the work. A doer cannot verify its own completion — the incentive to confirm its own claim is too strong. Use `delegate-task` with `stackOnSessionId: <previous_session_id>` for re-dispatch, and `delegation-status({ action: "list" })` to confirm the verifier session is independent.

## Fresh Evidence Rule

Every verification must produce fresh output in the current turn. No reference to prior runs, no "I already checked," no "it was working before."

| Claim | Acceptable | Unacceptable |
|-------|------------|--------------|
| "Tests pass" | `npm test` output in this turn with pass counts | "Tests passed earlier", "They should pass because..." |
| "Code compiles" | `npm run build` exit 0 + no errors | "It compiled last build" |
| "Feature works" | Actual runtime execution evidence | "The logic looks correct" |
| "Change is applied" | File read or `git diff` showing the change | "I just wrote it" |

If the verification command produces no output (silent success), wrap it: `echo "EXIT: $?" && <command>`. No output is not evidence. Silent exit 0 is acceptable only if the command is well-known to produce exit codes reliably (e.g., `grep -q`).

## What Completion Detection Detects

### Signal 1: Hollow "Done" Claims

The subagent declares completion without evidence. Detection: claim lacks test output, file references, or exit criteria. Response: request fresh verification; if none, mark `NOT_COMPLETE`.

### Signal 2: Mock-Only Evidence

The subagent claims runtime behavior without runtime execution. Detection: "Tests pass" but tests were never run; "Code compiles" but build was never invoked. Response: require actual command output with exit codes.

### Signal 3: Stale Verification

The subagent references verification from earlier in the session. Detection: "Tests passed earlier"; "I already verified this". Response: re-run all verification in the current turn.

### Signal 4: Missing Runtime Proof

The subagent asserts behavior that could only be proven by running the system. Detection: "should work because the filter is correct"; "feature works end-to-end" without end-to-end execution. Response: run the system; block on "should work" → require "does work" with output.

## Completion Claim Grading

| Grade | Definition | Action |
|-------|------------|--------|
| **CONFIRMED** | Claim backed by fresh verification output in the current turn | Accept — mark complete |
| **PLAUSIBLE** | Claim is consistent with what was implemented, but no fresh evidence | Request fresh verification before accepting |
| **SUSPICIOUS** | Claim contradicts available evidence or lacks specifics | Reject — request verification + clarification |
| **FALSE** | Claim directly contradicted by fresh verification | Reject — escalate with evidence |

## Hivemind Runtime Bindings

The skill is **framework-agnostic** in its discipline; the binding layer that makes it executable in a Hivemind runtime is named here. Platform-specific calls live in the platform reference, not in the body.

| Concern | Hivemind binding |
|---------|-----------------|
| Dispatch a doer / re-dispatch after failure | `delegate-task({ agent, prompt, stackOnSessionId })` |
| Poll for subagent return | `delegation-status({ action: "list" })` |
| Verify a subagent session ended cleanly | `hivemind-sdk-supervisor({ sessionId })` |
| Persist a durable cursor for resume | write to `.hivemind/state/loops/<task_id>.yaml` (per `hm-engine-state` reference) |
| Audit the loop log for regression | `hivemind-trajectory({ rootSessionId, depth: "summary" })` |

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|--------------|-----------|------------|
| **Self-verification** | The agent that did the work also claims verification | Use dual-signal: verifier must be a separate session via `delegate-task` with new `stackOnSessionId` |
| **Stale evidence** | "Tests passed yesterday" or "I checked earlier" | Re-run all verification after every change |
| **Mock evidence** | "Tests should pass" or "The logic is correct so it works" | Require actual command execution with output |
| **Selective reporting** | Test output shown but only passing tests reported | Show full output including failures |
| **Rubber-stamp verifier** | A verifier that always passes regardless of evidence | Rotate verifiers or enforce fresh evidence requirement |
| **Trusted shortcut** | "I trust this agent, no need to verify" | Trust is not verification. Rules apply equally |
| **Implicit completion** | Silence = done (agent stops, no completion claim made) | Require explicit completion declaration before verifying |
| **Verification without running** | Reading test files instead of executing them | Execution is the only verification. Read-only is review, not verification. |
| **Exit code only** | "Exit 0" without output content | Capture both exit code AND output. Exit 0 can be faked. |
| **Premature Done** | Subagent returns DONE without running tests/validation | Enforce verification requirements in task envelope |
| **Infinite Loop** | Same failing approach retried >5 times | Cap iterations, escalate to orchestrator |
| **Silent Fix** | Loop iteration makes changes without logging | Require progress logging in each iteration |
| **Skipped Gate** | Quality gate passes but scope gate fails | Run ALL gates before accepting completion |

## Self-Correction

### When the Task Keeps Failing

If completion keeps failing to verify, first check whether the verification command is actually runnable — sometimes plan-specified commands reference missing scripts, wrong paths, or tools not installed. If the verification references a test file that doesn't exist, report it as a planning gap rather than a completion failure. If the same verification gate fails 3 times, stop retrying and escalate with the exact command output, expected result, and actual result.

### When Unsure About the Next Step

Default to the most conservative interpretation. If you cannot verify completion, treat the task as incomplete and report exactly why verification failed. Do not guess at what "done" means. The safe default is always: unverified = incomplete.

### When the User Contradicts Skill Guidance

If the user says "it's done" but automated verification fails, run the failing verification command in front of the user and show the specific output. If the user wants to accept a partial completion, document which acceptance criteria passed and which were waived, along with the user's rationale. The user can override verification, but the override must be explicit and documented.

### When an Edge Case Is Encountered

If a task has no automated verification at all, flag it as a Nyquist gap — a missing verification that means completion cannot be objectively assessed. If a subagent returns `DONE_WITH_CONCERNS` but the concerns are out of scope, accept the result and note the concerns separately. If the loop count exceeds the maximum for the loop type, escalate immediately rather than adjusting the cap.

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `hm-loop-phase` | Owns iterative phase semantics. This skill adds completion guardrails to those iterations. |
| `hm-coord-loop` | Owns general multi-agent dispatch. This skill adds the dual-signal verification layer to that dispatch. |
| `hm-debug-systematic` | Owns the debug cycle. This skill enforces the verification gates inside that cycle. |
| `hivemind-sdk-supervisor` | Runtime tool for session lifecycle. This skill prescribes when to call it. |
| `delegation-status` | Runtime tool for polling returns. This skill uses it to confirm independent verifier sessions. |
