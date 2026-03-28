# Hard Stop Conditions

Conditions that require an immediate, non-negotiable halt to delegation. When any of these conditions is detected, the delegation stops — no continuation, no improvisation, no "just one more thing."

## What Is a Hard Stop

A hard stop is an immediate, non-negotiable halt to a delegation. Unlike a `partial` return (where the child made progress but could not finish) or a `blocked` return (where the child hit a resolvable obstacle), a hard stop means something fundamental went wrong and continuing would make it worse.

Hard stops are triggered by the orchestrator when it detects a condition that violates the delegation contract. The child may also self-report a hard stop condition if it detects one during execution.

**Hard stop ≠ failure.** A hard stop is a safety mechanism. The delegation may be re-attempted after the condition is resolved.

## Scope Violation

**Trigger:** The delegated agent touched files outside its `authority_surfaces`.

**Detection:**
- The child's return includes `files_modified` that are not within the delegated scope
- `git diff` shows changes to files outside `authority_surfaces`
- The child's return references files or modules not in the scope

**Action:**
1. Mark the return as `scope_violation`
2. Do NOT merge the child's output — quarantine it
3. Revert any out-of-scope changes using `git checkout` on affected files
4. Re-delegate with tighter constraints or escalate to user

**Prevention:** Always include explicit `out_of_scope` in delegation packets. The child should check file paths before writing.

## Circular Dependency

**Trigger:** The delegated agent's work depends on its own output.

**Detection:**
- The child requests access to files it was supposed to create
- The delegation chain forms a loop (A delegates to B, B delegates to A)
- The child's `dependency_ids` include its own `task_id`

**Action:**
1. Break the cycle immediately
2. Identify which step in the cycle should be the entry point
3. Re-delegate from the entry point with the circular dependency broken
4. If the cycle cannot be broken, decompose the task into acyclic subtasks

**Prevention:** Before delegating, trace the dependency graph. If any agent's output feeds back to its own input, restructure the decomposition.

## Safety Breach

**Trigger:** The delegated agent modified shared state without coordination.

**Detection:**
- The child wrote to files that another active delegation is also writing to
- The child modified `AGENTS.md`, `opencode.json`, or other governance files without explicit permission
- The child wrote to `.hivemind/` state files outside its delegated output path

**Action:**
1. Halt ALL active delegations touching the affected state
2. Assess damage: did the breach corrupt shared state?
3. If corrupted: revert to the last known good state
4. Re-delegate with explicit coordination constraints (sequential mode, not parallel)

**Prevention:** For parallel delegations, ensure no two agents share write targets. Use `authority_surfaces` that are mutually exclusive for concurrent dispatches.

## Timeout Exceeded

**Trigger:** The delegated agent did not return within 2x the expected completion window.

**Detection:**
- The orchestrator tracks dispatch time and expected window
- No return received within 2x the window
- No heartbeat or progress signal from the child

**Action:**
1. Emit a status probe to check if the child is still running
2. If no response within a reasonable grace period (1/4 of the original window), abort
3. Check if the child produced any partial output at its `output_path`
4. Re-delegate from the last known good state, incorporating partial output if available

**Timeout heuristics:**
- Read-only scan: expected window 5 minutes, hard timeout 10 minutes
- Single-file edit: expected window 3 minutes, hard timeout 6 minutes
- Multi-file refactor: expected window 10 minutes, hard timeout 20 minutes
- Full verification suite: expected window 15 minutes, hard timeout 30 minutes

**Prevention:** Set explicit `expected_duration` in delegation packets. Children should report progress for long-running tasks.

## Contradiction Detected

**Trigger:** The delegated agent's output contradicts prior verified findings.

**Detection:**
- The child reports a file as "clean" that a prior verification marked as "affected"
- The child's findings conflict with git history (e.g., claims a function exists but it was deleted last week)
- The child's return data is internally inconsistent (e.g., claims 100% coverage but lists unverified files)

**Action:**
1. Do NOT merge the contradictory return
2. Mark the return as `contradiction_detected`
3. Identify the source of truth (git history, prior verification, fresh file read)
4. Re-delegate with explicit guidance on the contradiction and the correct source of truth

**Prevention:** Include `known_facts` in delegation packets — a list of verified findings the child must not contradict. If the child discovers these facts are wrong, it should report the discrepancy rather than silently overriding them.

## Recovery Protocol

After a hard stop, recovery follows this sequence:

1. **Assess.** Determine which hard stop condition triggered. Isolate the affected delegation from all other active delegations.
2. **Quarantine.** Do NOT merge the halted delegation's output. Store it at `{activity}/delegation/{packet_id}-quarantined.json` for post-mortem analysis.
3. **Decide.** Choose one of:
   - **Re-delegate:** Same scope, tighter constraints, address the trigger condition
   - **Decompose:** Split the scope into smaller slices that avoid the trigger
   - **Escalate:** If the trigger indicates a fundamental design issue, escalate to the user
   - **Abort:** If the scope is no longer needed or the trigger is unrecoverable
4. **Execute.** Apply the chosen recovery action. Record the hard stop event in the delegation audit trail.
5. **Verify.** After recovery, verify that the trigger condition is resolved before re-dispatching.

### Recovery Decision Matrix

| Condition | First Recovery | If Recurs | Final Option |
|-----------|---------------|-----------|-------------|
| Scope violation | Re-delegate with tighter scope | Decompose into smaller slices | Escalate to user |
| Circular dependency | Break cycle, re-delegate | Redesign decomposition | Escalate to user |
| Safety breach | Sequential re-delegate | Reduce parallelism to 1 | Escalate to user |
| Timeout exceeded | Re-delegate from partial output | Reduce scope | Decompose further |
| Contradiction | Re-delegate with known_facts | Fresh investigation | Escalate to user |

## HiveMind Conventions

Hard stops integrate with the HiveMind failure recovery framework:

- **Escalation ladder alignment.** Hard stop recovery follows the same escalation ladder as `failure-recovery.md`: re-delegate → decompose → escalate to user → abort. Hard stops simply enter the ladder at a higher urgency.
- **Delegation registry.** Record hard stop events in `{activity}/delegation/registry.json` with `hard_stop: true`, `trigger_condition`, and `recovery_action`.
- **Audit trail.** Each hard stop generates a quarantined return file and a registry entry for post-mortem analysis.
- **Gatekeeping integration.** If a hard stop occurs during an iterative loop, the loop's gatekeeping skill (`hivemind-gatekeeping`) is notified to prevent re-entry into the same loop without the trigger being resolved.
- **Session continuity.** Hard stop events are included in the session continuity checkpoint so subsequent turns are aware of the condition.
