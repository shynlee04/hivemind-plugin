# Phase 25: Ultimate Integration Stress Test v2

**Date:** 2026-05-29
**Updated:** 2026-05-29 (post P25.1-P25.3 integration)
**Purpose:** Stress test the full Hivemind system through a real user's perspective — no internal terminology, just natural language delegation using OpenCode's native primitives.
**Execution:** Run as a single prompt in a fresh worktree after `npm run build`.

---

## What This Test Exercises (invisible to user)

| System Component | How It's Exercised |
|------------------|-------------------|
| **Trajectory module** | Auto-created on every delegation, events recorded, immutable after close |
| **Agent-work-contract** | Auto-created on every delegation, lifecycle transitions tested |
| **Pressure system** | Escalating delegation load triggers pressure decisions |
| **Session-tracker** | Real-time delegation visibility, hierarchy tracking |
| **Native task tool** | Primary delegation mechanism (via session-tracker hook) |
| **Lifecycle state machine** | created→running→blocked→completed→cancelled transitions |
| **Closed trajectory guard** | Immutability enforcement after work completes |
| **Cross-linking** | Trajectory ↔ contract bidirectional references |
| **Compaction bounds** | Bounded text fields in contracts |
| **Evidence contract** | Proof requirements on contract completion |

---

## The Prompt (copy verbatim into fresh OpenCode session)

```
I need you to help me fix a real bug and coordinate the work across multiple agents. Here's the situation:

There's a bug in the session-tracker module where delegation events aren't being recorded properly when using the native task tool. I need you to:

## Step 1: Investigate the bug

Use the task tool to delegate to an explore agent. Ask it to:
- Find where the task tool hooks into session-tracker
- Check if trajectory records are being created when delegations happen
- Look at `src/features/session-tracker/tool-delegation.ts` for the integration point
- Report back what it finds

After the agent returns, tell me what it found.

## Step 2: Write a fix

Based on what the explore agent found, use the task tool to delegate to a general agent. Ask it to:
- Implement the necessary fix to ensure trajectory records are created on delegation
- Make sure both the native task tool and delegate-task create trajectory events
- Add a test to verify the fix works
- Run typecheck and tests to make sure nothing breaks

After the agent returns, tell me if the fix was successful.

## Step 3: Write integration tests

Use the task tool to delegate to another general agent. Ask it to:
- Write integration tests that verify the full delegation lifecycle
- Test that contracts are created automatically when delegating
- Test that trajectory events are recorded on dispatch and completion
- Test that closed trajectories can't be modified
- Run all tests and report results

After the agent returns, tell me the test results.

## Step 4: Code review

Use the task tool to delegate to another general agent. Ask it to:
- Review all the changes made in steps 2 and 3
- Check for bugs, security issues, and code quality problems
- Look at the integration between trajectory, contracts, and delegation
- Report any issues found

After the agent returns, tell me the review findings.

## Step 5: Fix any issues found

If the code review found issues, use the task tool to delegate to a general agent to fix them. Ask it to:
- Fix all critical and warning issues from the review
- Run typecheck and tests to verify fixes
- Report what was fixed

After the agent returns, tell me what was fixed.

## Step 6: Final verification

Use the task tool to delegate to a final general agent. Ask it to:
- Run the full test suite and report results
- Run typecheck and report results
- Verify that all delegation events were recorded in session-tracker
- Check that trajectory records exist for all delegations from steps 1-5
- Report the total number of delegations tracked

After the agent returns, give me a summary of everything that was done.

## Important notes:
- Use the task tool (not delegate-task) for all delegations
- Each delegation should be a separate task tool call
- Wait for each agent to complete before starting the next
- If any agent fails, tell me what went wrong and we'll figure out how to proceed
- I want to see the session-tracker showing all the delegations in real-time
```

---

## What The Test Exposes (post-mortem analysis)

After running the prompt, verify these system behaviors:

### Automatic (user doesn't check — system should do this)

| Behavior | How to Verify | Expected |
|----------|--------------|----------|
| Trajectory auto-created | Check `inspectTrajectoryLedger()` — should have entries for each delegation | 6 trajectories (one per step) |
| Contract auto-created | Check `readAgentWorkContracts()` — should have entries | 6 contracts |
| Dispatch events recorded | Check trajectory events array | `delegation_dispatched` events |
| Completion events recorded | Check trajectory events array | `delegation_completed` events |
| Cross-linking | Check `findContractsByTrajectory()` | Each contract linked to trajectory |
| Contract lifecycle | Check contract statuses | All should be `completed` |
| Closed trajectories | Check trajectory statuses | All should be `closed` |

### Manual (user can check if they know what to look for)

| Behavior | How to Verify | Expected |
|----------|--------------|----------|
| Session-tracker visibility | Check session-tracker files | All delegations logged |
| Pressure decisions | Check if any contracts were pressure-blocked | None (moderate load) |
| Bounded text | Check contract compaction fields | All within limits |
| Immutable closures | Try to add event to closed trajectory | Should throw |

### Stress Scenarios (edge cases)

| Scenario | How to Trigger | Expected |
|----------|---------------|----------|
| Invalid lifecycle transition | Try to start a completed contract | Should throw |
| Closed trajectory mutation | Try to add event to closed trajectory | Should throw |
| Pressure blocking | Create many delegations simultaneously | Some may be pressure-blocked |
| Concurrent contracts | Delegate to 6+ agents at once | Each gets unique contract |
| Large compaction payload | Create contract with very long briefing | Should be truncated |

---

## Post-Test Verification Commands

After the user completes the prompt, run these to verify system integrity:

```bash
# Typecheck
npm run typecheck

# Full test suite
npm run test

# Check trajectory records (programmatic)
node -e "
const { inspectTrajectoryLedger } = require('./dist/task-management/trajectory/store-operations.js');
const result = inspectTrajectoryLedger({ projectRoot: process.cwd() });
console.log('Trajectories:', Object.keys(result.ledger.trajectories).length);
for (const [id, t] of Object.entries(result.ledger.trajectories)) {
  console.log('  ', id, ':', t.status, '- events:', t.events.length, '- checkpoints:', t.checkpoints.length);
}
"

# Check contract records (programmatic)
node -e "
const { readAgentWorkContracts } = require('./dist/features/agent-work-contracts/store.js');
const store = readAgentWorkContracts(process.cwd());
console.log('Contracts:', Object.keys(store.contracts).length);
for (const [id, c] of Object.entries(store.contracts)) {
  console.log('  ', id, ':', c.status, '- agent:', c.owner.agent);
}
"

# Check cross-linking
node -e "
const { findContractsByTrajectory } = require('./dist/features/agent-work-contracts/operations.js');
const { readAgentWorkContracts } = require('./dist/features/agent-work-contracts/store.js');
const store = readAgentWorkContracts(process.cwd());
const trajectoryIds = new Set();
for (const c of Object.values(store.contracts)) {
  if (c.trajectoryId) trajectoryIds.add(c.trajectoryId);
}
for (const tid of trajectoryIds) {
  const contracts = findContractsByTrajectory(process.cwd(), tid);
  console.log(tid, '→', contracts.length, 'contracts');
}
"
```

---

## Expected Outcomes

### If system works correctly:
- 6 trajectories created automatically
- 6 contracts created automatically
- All contracts reach `completed` status
- All trajectories reach `closed` status
- Session-tracker shows all delegations
- Typecheck clean, all tests pass
- Cross-linking works (contracts reference trajectories)

### If system has bugs:
- Missing trajectories → P25.1 integration not working
- Missing contracts → P25.1 integration not working
- Contracts stuck in `created` → lifecycle transitions not working
- Trajectories still `active` → close not being called
- Closed trajectories accept events → P25.2 guard not working
- Pressure blocks unexpected contracts → P25.3 matrix incomplete
- Typecheck errors → regression in integration code
- Test failures → regression in existing functionality

---

## System State After Test

The test leaves the system with:
- 6 closed trajectories (immutable)
- 6 completed contracts (terminal state)
- Session-tracker records for all delegations
- Evidence trail for the entire workflow

This represents a realistic development lifecycle: investigate → fix → test → review → fix issues → verify.

---

*Phase: 25-trajectory-agent-work-contract-redesign*
*Test created: 2026-05-29*
*Updated: 2026-05-29 (post P25.1-P25.3 integration)*
*Purpose: User-facing stress test for full system integration*
