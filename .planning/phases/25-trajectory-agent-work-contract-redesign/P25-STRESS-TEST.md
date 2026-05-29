# Phase 25: Ultimate Integration Stress Test

**Date:** 2026-05-29
**Purpose:** Expose design flaws, compliance gaps, integration failures, and shallow implementations across trajectory, agent-work-contract, delegation, pressure, lifecycle, and continuity modules.
**Execution:** Run as a single prompt in a simulated one-time worktree after `npm run build`.

---

## Scenario: Multi-Agent Emergency Hotfix Under Pressure

A production incident requires a 3-wave coordinated hotfix. The coordinator must delegate to 4 specialist agents under escalating pressure, with contract lifecycle management, trajectory evidence tracking, cross-session continuity, and failure recovery. The test deliberately includes invalid transitions, pressure blocks, concurrent contracts, crash recovery, and evidence gaps to stress every boundary.

---

## The Prompt

```
You are the L0 orchestrator handling a P0 production incident. The incident requires a 3-wave coordinated hotfix across 4 specialist agents. Execute the following workflow end-to-end, using the Hivemind delegation, trajectory, and contract systems. Every step MUST use the actual runtime tools — no mocks, no shortcuts.

═══════════════════════════════════════════════════════════════
 WAVE 0: INCIDENT DECLARATION — Trajectory + Contract Bootstrap
═══════════════════════════════════════════════════════════════

1. Create an incident trajectory:
   - trajectoryId: "incident-p0-hotfix"
   - rootSessionId: use your current session ID
   - Record an event: eventType="incident_declared", summary="P0 production incident: session-tracker corruption causing delegation loss"
   - Attach evidence ref: "incident:p0-hotfix:declared"

2. Create an agent-work-contract for yourself as coordinator:
   - id: "awc-coordinator-p0"
   - owner.agent: "hm-l0-orchestrator"
   - owner.sessionId: your current session ID
   - scope.taskBoundary: "Coordinate 3-wave hotfix for session-tracker corruption"
   - scope.allowedSurfaces: ["src/task-management/", "src/coordination/", "src/features/"]
   - scope.dependencies: ["phase-23", "phase-24", "phase-25"]
   - scope.nonGoals: ["UI changes", "new features", "performance optimization"]
   - evidence.minimumEvidenceLevel: "L2"
   - evidence.requiredProof: ["typecheck clean", "all tests pass", "no regressions"]
   - evidence.verificationCommands: ["npm run typecheck", "npm run test"]
   - compaction.briefing: "P0 hotfix: session-tracker delegation loss. Root cause: missing trajectory cross-linking on contract creation."
   - compaction.summary: "Wave 1: investigate root cause. Wave 2: implement fixes. Wave 3: verify integration."
   - compaction.anchors: ["session-tracker", "trajectory", "agent-work-contract", "delegation"]
   - compaction.reinjectionPayload: "Continue hotfix. Wave 1 complete, proceed to Wave 2."
   - trajectoryId: "incident-p0-hotfix"
   - pressureScore: 0.85 (elevated but not blocking)
   - pressureTier: "high"

3. Start the coordinator contract:
   - Transition "awc-coordinator-p0" from created → running
   - Verify the contract status is now "running"

4. Checkpoint the trajectory:
   - checkpointId: "wave-0-bootstrap"
   - summary: "Incident declared. Coordinator contract active. Waves 1-3 planned."

═══════════════════════════════════════════════════════════════
 WAVE 1: INVESTIGATION — Parallel Delegation with Contracts
═══════════════════════════════════════════════════════════════

5. Create contracts for 3 investigation agents (all in parallel):

   Agent A — Debugger:
   - id: "awc-debugger-wave1"
   - owner.agent: "hm-debugger"
   - scope.taskBoundary: "Investigate session-tracker delegation loss root cause"
   - scope.allowedSurfaces: ["src/features/session-tracker/", "src/task-management/"]
   - scope.nonGoals: ["fix the bug", "modify production code"]
   - evidence.minimumEvidenceLevel: "L2"
   - evidence.requiredProof: ["root cause identified", "reproduction steps"]
   - compaction.briefing: "Investigate session-tracker delegation loss. Check continuity store, delegation persistence, and trajectory cross-linking."
   - trajectoryId: "incident-p0-hotfix"
   - pressureScore: 0.7
   - pressureTier: "moderate"

   Agent B — Code Reviewer:
   - id: "awc-reviewer-wave1"
   - owner.agent: "hm-code-reviewer"
   - scope.taskBoundary: "Audit trajectory and contract modules for design gaps"
   - scope.allowedSurfaces: ["src/task-management/trajectory/", "src/features/agent-work-contracts/"]
   - scope.nonGoals: ["implement fixes", "run tests"]
   - evidence.minimumEvidenceLevel: "L3"
   - evidence.requiredProof: ["REVIEW.md with findings"]
   - compaction.briefing: "Audit trajectory and contract modules. Check state machines, cross-linking, bounds consistency."
   - trajectoryId: "incident-p0-hotfix"
   - pressureScore: 0.5
   - pressureTier: "moderate"

   Agent C — Integration Checker:
   - id: "awc-integration-wave1"
   - owner.agent: "hm-integration-checker"
   - scope.taskBoundary: "Verify trajectory ↔ contract ↔ delegation integration"
   - scope.allowedSurfaces: ["src/task-management/", "src/features/agent-work-contracts/", "src/coordination/delegation/"]
   - scope.nonGoals: ["modify code", "write tests"]
   - evidence.minimumEvidenceLevel: "L2"
   - evidence.requiredProof: ["integration report", "gap analysis"]
   - compaction.briefing: "Check trajectory ↔ contract ↔ delegation integration. Verify cross-linking, lifecycle alignment, pressure gating."
   - trajectoryId: "incident-p0-hotfix"
   - pressureScore: 0.6
   - pressureTier: "moderate"

6. Start all 3 contracts (created → running):
   - startContract("awc-debugger-wave1")
   - startContract("awc-reviewer-wave1")
   - startContract("awc-integration-wave1")

7. Record trajectory events for each contract:
   - eventTrajectory: eventType="contract_started", summary="Debugger contract started for wave 1 investigation"
   - eventTrajectory: eventType="contract_started", summary="Reviewer contract started for wave 1 audit"
   - eventTrajectory: eventType="contract_started", summary="Integration checker contract started for wave 1 verification"

═══════════════════════════════════════════════════════════════
 WAVE 1 STRESS: FAILURE + RECOVERY + INVALID TRANSITIONS
═══════════════════════════════════════════════════════════════

8. Simulate the debugger agent hitting a blocking issue:
   - blockContract("awc-debugger-wave1", "Requires access to deleted session-tracker file — needs escalation")
   - Verify contract status is "blocked"
   - Record trajectory event: eventType="contract_blocked", summary="Debugger blocked: missing file access"

9. Attempt INVALID transitions (these MUST throw errors):
   - Try to completeContract("awc-debugger-wave1") — should FAIL (blocked → completed is invalid)
   - Try to startContract("awc-reviewer-wave1") — should FAIL (running → running is invalid, already running)
   - Try to blockContract("awc-integration-wave1", "test") then completeContract("awc-integration-wave1") — should FAIL (blocked → completed is invalid)
   - Record each failure as a trajectory event: eventType="transition_rejected", summary="[what was attempted]"

10. Unblock the debugger:
    - startContract("awc-debugger-wave1") — blocked → running
    - Record trajectory event: eventType="contract_unblocked", summary="Debugger unblocked after escalation"

11. Complete the reviewer with proof:
    - completeContract("awc-reviewer-wave1", "REVIEW.md: 3 warnings, 0 critical. WR-001 off-by-one, WR-002 double-persistence, WR-003 missing .max().")
    - Record trajectory event: eventType="contract_completed", summary="Reviewer completed with proof: REVIEW.md findings"

12. Cancel the integration checker (scope changed):
    - cancelContract("awc-integration-wave1", "Scope changed: integration check deferred to Wave 3 verification")
    - Record trajectory event: eventType="contract_cancelled", summary="Integration checker cancelled: scope deferred"

13. Attempt to re-start the cancelled integration checker (MUST FAIL):
    - Try startContract("awc-integration-wave1") — should FAIL (cancelled is terminal)
    - Record trajectory event: eventType="transition_rejected", summary="Cannot restart cancelled contract"

14. Find all contracts linked to the incident trajectory:
    - findContractsByTrajectory("incident-p0-hotfix")
    - Verify: should return 4 contracts (coordinator + debugger + reviewer + integration)
    - Verify: reviewer status = completed, integration status = cancelled, debugger status = running, coordinator status = running

15. Checkpoint Wave 1:
    - checkpointTrajectory: checkpointId="wave-1-investigation", summary="Wave 1 complete. Root cause identified: missing trajectoryId in contract creation. 1 blocked, 1 completed, 1 cancelled."

═══════════════════════════════════════════════════════════════
 WAVE 2: IMPLEMENTATION — Escalating Pressure + Concurrent Contracts
═══════════════════════════════════════════════════════════════

16. Create 2 implementation contracts with HIGHER pressure:

    Agent D — Code Fixer:
    - id: "awc-fixer-wave2"
    - owner.agent: "hm-code-fixer"
    - scope.taskBoundary: "Implement trajectory cross-linking fix in createAgentWorkContract"
    - scope.allowedSurfaces: ["src/features/agent-work-contracts/operations.ts"]
    - scope.nonGoals: ["refactor lifecycle module", "change schema"]
    - evidence.minimumEvidenceLevel: "L2"
    - evidence.requiredProof: ["fix committed", "tests pass"]
    - compaction.briefing: "Fix: pass rootSessionId to attachTrajectoryEvidence in createAgentWorkContract."
    - trajectoryId: "incident-p0-hotfix"
    - pressureScore: 0.92 (CRITICAL pressure)
    - pressureTier: "critical"

    Agent E — Test Writer:
    - id: "awc-tester-wave2"
    - owner.agent: "hm-nyquist-auditor"
    - scope.taskBoundary: "Write integration tests for trajectory ↔ contract cross-linking"
    - scope.allowedSurfaces: ["tests/features/agent-work-contracts/", "tests/task-management/trajectory/"]
    - scope.nonGoals: ["modify source code", "run production"]
    - evidence.minimumEvidenceLevel: "L2"
    - evidence.requiredProof: ["test file created", "tests pass"]
    - compaction.briefing: "Write integration tests: contract creation with trajectoryId populates trajectory ledger."
    - trajectoryId: "incident-p0-hotfix"
    - pressureScore: 0.88 (HIGH pressure)
    - pressureTier: "high"

17. Attempt to create a contract with BLOCKING pressure (MUST BE BLOCKED):
    - createAgentWorkContract with pressureScore=0.98, pressureTier="critical", toolName="hivemind-agent-work-create"
    - Verify: result.status === "pressure-blocked"
    - Record trajectory event: eventType="contract_pressure_blocked", summary="Emergency contract blocked by critical pressure"

18. Start implementation contracts:
    - startContract("awc-fixer-wave2")
    - startContract("awc-tester-wave2")

19. Record trajectory events:
    - eventTrajectory: eventType="wave2_started", summary="Wave 2: implementation under critical pressure"

20. Complete the fixer with proof:
    - completeContract("awc-fixer-wave2", "Fix committed: rootSessionId now passed to attachTrajectoryEvidence. Typecheck clean, 54 tests pass.")
    - Record trajectory event: eventType="contract_completed", summary="Fixer completed: cross-linking fix verified"

21. Block the tester (dependency on fixer):
    - blockContract("awc-tester-wave2", "Waiting for fixer to commit before writing integration tests")
    - Record trajectory event: eventType="contract_blocked", summary="Tester blocked: waiting for fixer commit"

22. Unblock and complete the tester:
    - startContract("awc-tester-wave2") — blocked → running
    - completeContract("awc-tester-wave2", "Integration test created: cross-linking.test.ts with 6 tests. All pass.")
    - Record trajectory events for both transitions

23. Checkpoint Wave 2:
    - checkpointTrajectory: checkpointId="wave-2-implementation", summary="Wave 2 complete. Fix committed, integration tests written. 1 pressure-blocked contract."

═══════════════════════════════════════════════════════════════
 WAVE 3: VERIFICATION — Cross-Session Traversal + Export
═══════════════════════════════════════════════════════════════

24. Complete the debugger contract (from Wave 1):
    - completeContract("awc-debugger-wave1", "Root cause: createAgentWorkContract did not pass rootSessionId to attachTrajectoryEvidence. Fixed in Wave 2.")
    - Record trajectory event: eventType="contract_completed", summary="Debugger completed: root cause confirmed"

25. Complete the coordinator contract:
    - completeContract("awc-coordinator-p0", "Hotfix complete. All waves verified. 54 tests pass, typecheck clean.")
    - Record trajectory event: eventType="contract_completed", summary="Coordinator completed: hotfix verified"

26. Export the coordinator contract as Markdown:
    - exportAgentWorkContract({ projectRoot, contractId: "awc-coordinator-p0", format: "markdown" })
    - Verify: output contains "Status: completed", "Allowed Surfaces", "Evidence Contract"

27. Traverse the full incident trajectory:
    - traverseTrajectory({ projectRoot, trajectoryId: "incident-p0-hotfix" })
    - Verify: returns all trajectories and edges
    - Verify: parent-child relationships are correct

28. Traverse by root session:
    - traverseTrajectory({ projectRoot, rootSessionId: [your session ID] })
    - Verify: returns the incident trajectory and all child trajectories

29. Inspect the full trajectory ledger:
    - inspectTrajectoryLedger({ projectRoot, trajectoryId: "incident-p0-hotfix" })
    - Verify: trajectory has events, checkpoints, evidence refs, status

30. Close the incident trajectory:
    - closeTrajectory({ projectRoot, trajectoryId: "incident-p0-hotfix", summary: "P0 hotfix complete. 5 contracts, 3 waves, 1 pressure-blocked, 1 cancelled. All evidence attached." })
    - Verify: trajectory status is "closed"
    - Record final event: eventType="incident_closed", summary="Hotfix verified and closed"

═══════════════════════════════════════════════════════════════
 FINAL VERIFICATION: System Integrity Checks
═══════════════════════════════════════════════════════════════

31. Run typecheck:
    - npm run typecheck
    - Verify: zero errors

32. Run full test suite:
    - npm run test
    - Verify: all tests pass, no regressions

33. Verify contract store integrity:
    - readAgentWorkContracts(projectRoot)
    - Verify: 6 contracts total (1 coordinator + 1 debugger + 1 reviewer + 1 integration + 1 fixer + 1 tester)
    - Verify: all have correct status (coordinator=completed, debugger=completed, reviewer=completed, integration=cancelled, fixer=completed, tester=completed)
    - Verify: all have trajectoryId "incident-p0-hotfix"

34. Verify trajectory store integrity:
    - inspectTrajectoryLedger({ projectRoot })
    - Verify: incident trajectory is "closed"
    - Verify: events array has ≥12 events
    - Verify: checkpoints array has 3 checkpoints (wave-0, wave-1, wave-2)
    - Verify: evidence refs array is non-empty

35. Verify cross-linking:
    - findContractsByTrajectory(projectRoot, "incident-p0-hotfix")
    - Verify: returns all 6 contracts
    - Verify: each contract's trajectoryEvidenceRef is present

36. Attempt to modify a closed trajectory (MUST SUCPEND — trajectories don't have status guards):
    - Try eventTrajectory on "incident-p0-hotfix" — note whether it succeeds or fails
    - This tests whether closed trajectories are truly immutable

37. Attempt to transition a completed contract (MUST FAIL):
    - Try startContract("awc-coordinator-p0") — should FAIL (completed is terminal)
    - Try cancelContract("awc-coordinator-p0", "test") — should FAIL (completed is terminal)

═══════════════════════════════════════════════════════════════
 REPORT
═══════════════════════════════════════════════════════════════

After completing all steps, produce a report:

1. **Integration Gaps Found**: List any places where modules didn't integrate properly
2. **State Machine Violations**: Did invalid transitions throw correctly? Were terminal states enforced?
3. **Pressure System**: Did pressure blocking work? Did the approval gate fire?
4. **Cross-Linking**: Did findContractsByTrajectory return correct results? Were trajectoryEvidenceRefs populated?
5. **Evidence Completeness**: Did all contracts have proof? Were any evidence requirements violated?
6. **Compaction Bounds**: Did bounded text work? Were limits enforced?
7. **Concurrency Issues**: Any race conditions or data loss?
8. **Closed Trajectory Behavior**: Was the closed trajectory immutable? If not, that's a bug.
9. **Overall Assessment**: Is the system production-ready? What needs fixing before Phase 26?
```

---

## What This Test Exposes

### Design Flaws
- **Closed trajectory immutability**: No guard prevents events on closed trajectories — test step 36 exposes this
- **Terminal state enforcement**: Tests that completed/cancelled contracts can't be transitioned — step 37
- **Pressure-bypass evidence**: Step 17 creates a pressure-blocked contract with no trajectory event — exposes GA-6 gap

### Integration Gaps
- **Trajectory ↔ Contract**: Cross-linking tested end-to-end (steps 2, 5, 14, 27, 35)
- **Contract ↔ Pressure**: Pressure gating tested with real scores (steps 2, 17)
- **Contract ↔ Lifecycle**: State machine tested with valid + invalid transitions (steps 8-13, 21-22, 37)
- **Trajectory ↔ Continuity**: Traversal by rootSessionId tested (step 28)

### Compliance Issues
- **Bounds consistency**: Compaction fields tested with real values (steps 2, 5, 16)
- **Evidence contract**: Required proof tested — contracts complete with/without proof (steps 11, 20, 24-25)
- **TDD compliance**: All tests run against actual runtime code, not mocks

### Stress Scenarios
- **6 concurrent contracts** with different statuses and pressure levels
- **3 waves** of delegation with failure recovery
- **Invalid transitions** that must throw
- **Pressure escalation** from moderate → critical
- **Cross-session traversal** with parent-child relationships
- **Contract export** as Markdown

### Edge Cases
- **Blocked → start → complete** lifecycle (steps 8, 10, 11)
- **Cancelled contract restart attempt** (step 13)
- **Pressure-blocked contract creation** (step 17)
- **Closed trajectory event recording** (step 36)
- **Terminal state transition attempts** (step 37)

---

## Expected Outcomes

| Step | Expected | What It Tests |
|------|----------|---------------|
| 8 | blockContract succeeds | Lifecycle: running→blocked |
| 9 (1) | completeContract throws | Invalid: blocked→completed |
| 9 (2) | startContract throws | Invalid: running→running |
| 9 (3) | completeContract throws | Invalid: blocked→completed |
| 10 | startContract succeeds | Lifecycle: blocked→running |
| 13 | startContract throws | Terminal: cancelled is final |
| 14 | Returns 4 contracts | Cross-linking query |
| 17 | Returns pressure-blocked | Pressure gating |
| 36 | Event recorded OR throws | Closed trajectory guard |
| 37 | Both throw | Terminal enforcement |

---

*Phase: 25-trajectory-agent-work-contract-redesign*
*Test created: 2026-05-29*
*Purpose: Ultimate integration stress test for trajectory + agent-work-contract systems*
