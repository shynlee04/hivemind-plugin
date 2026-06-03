[LANGUAGE: Write this file in en per Language Governance.]
You are a gsd-planner specialist. Execute the gsd-plan-phase workflow for Phase 58 of the Hivemind harness project.

WORKFLOW: Read /Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-phase.md and follow it exactly.

PHASE 58 CONTEXT (LOCKED - do NOT re-research or re-discuss):
- Phase 58: tmux-orchestration-programmatic-pool (depends on Phase 55)
- ROADMAP entry: /Users/apple/hivemind-plugin-private/.planning/ROADMAP.md line 2042
- Spec: /Users/apple/hivemind-plugin-private/.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-SPEC.md (6 requirements REQ-58-01..06, ambiguity 0.075)
- Context: /Users/apple/hivemind-plugin-private/.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-CONTEXT.md (17 decisions D-58-01..17)
- Research: /Users/apple/hivemind-plugin-private/.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-RESEARCH.md (559 lines, commit af7a814d, confidence 0.85)

6 GAPS MAPPED TO 6 BATS SCENARIOS (slots 61-66):
- G1/REQ-58-01: delegate-task guard-rail against native task tool (src/tools/delegation/delegate-task.ts)
- G2/REQ-58-02: DelegationManager.getPoolSnapshot() returning frozen DelegationPool (src/coordination/delegation/manager.ts)
- G3/REQ-58-03: abort+resume cycle with state paused (src/features/tmux/persistence.ts has paused literal)
- G4/REQ-58-04: tmux-copilot forward-prompt action with sentinel (src/tools/tmux-copilot.ts)
- G5/REQ-58-05: take-over/release + manualOverride flag (3 wiring points: plugin.ts:920, G4 forward-prompt, G5 actions)
- G6/REQ-58-06: 3-event lifecycle (delegation-queued/dispatched/terminal) with tmuxSessionId cross-link

3 RESEARCH DRIFTS to surface in PLAN.md (do NOT silently contradict):
- Q1: delegation-queued event type does NOT exist in current source - G6 must create SessionTrackerEvent union from scratch
- Q2: SSE pool is at src/sidecar/server/sse/pool.ts (not src/sidecar/sse-pool.ts); filter is 6 CATEGORIES at events.ts:15-31 - events flow through existing delegation category
- Q3: Delegation interface (not DelegationRecord) is the field-add target at types.ts:28

YOUR DELIVERABLES (3 files + atomic commits):

1. /Users/apple/hivemind-plugin-private/.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-PATTERNS.md
   Document these 8 patterns:
   - 6 BATS scenario patterns (one per gap, slots 61-66)
   - Frozen DelegationPool JSON contract shape
   - __-prefix test seam pattern (D-58-03)
   - Object.freeze deep-freeze pattern
   - Sentinel-prepended forward-prompt pattern
   - Grep-based regression guard pattern (G1)
   - manualOverride flag check pattern (3 wiring points)
   - 3-event lifecycle emission pattern (G6)

2. /Users/apple/hivemind-plugin-private/.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-PLAN.md
   6 execution waves with parallelization for atomic commits:

   Wave 1 (Parallel): Foundation files
   - 1a: Create src/coordination/delegation/pool-types.ts (~60 LOC) - D-58-04, D-58-05
   - 1b: Add policy comment block to src/tools/delegation/delegate-task.ts (D-58-01) + create tests/scripts/tmux/61-delegate-task-no-native-task-tool.bats
   - 1c: Update src/coordination/delegation/types.ts:28 to add tmuxSessionId field to Delegation interface (per Q3)

   Wave 2 (Sequential): G2 pool API + G3 abort+resume
   - 2a: Wire getPoolSnapshot() + __getDelegationsForTesting test seam
   - 2b: Add action:pool to delegation-status.ts discriminated union
   - 2c: Create tests/scripts/tmux/62-pool-status-api.bats
   - 2d: Wire paused transition in manager.ts:abortDelegation + sessionManager.persist
   - 2e: Wire respawnIfKnown BEFORE sendPromptAsync in manager.ts:resume (D-58-07)
   - 2f: Wire paused-to-ready transition in manager.ts:handleResume (D-58-08)
   - 2g: Create tests/scripts/tmux/63-abort-resume-pane-survival.bats

   Wave 3 (Sequential): G4 forward-prompt + G5 manualOverride
   - 3a: Add forward-prompt action to tmux-copilot.ts (D-58-09, D-58-10)
   - 3b: Add take-over + release actions to tmux-copilot.ts (D-58-11, D-58-12)
   - 3c: Add manualOverride field to SessionRecord
   - 3d: Wire manualOverride check at plugin.ts:920 appendTuiPrompt wrapper
   - 3e: Wire manualOverride check in G4 forward-prompt action
   - 3f: Create tests/scripts/tmux/64-forward-prompt.bats
   - 3g: Create tests/scripts/tmux/65-takeover-release.bats

   Wave 4 (Sequential): G6 session-tracker events
   - 4a: Add delegation-dispatched and delegation-terminal event types (per Q1)
   - 4b: Extend recordChildTaskDelegation to emit delegation-dispatched (per Q1)
   - 4c: Add recordDelegationTerminal method
   - 4d: Wire recordDelegationTerminal at terminalFallback AND abortDelegation
   - 4e: Verify SSE pool accepts 3 new event types (per Q2 - via existing delegation category)
   - 4f: Create tests/scripts/tmux/66-session-tracker-delegation-events.bats

   Wave 5 (Parallel): Regression checks + BATS helper extension
   - 5a: Extend tests/scripts/tmux/helpers.bash:tmux_bats_require_dist to require dist/coordination/delegation/pool-types.js
   - 5b: Run npm run typecheck (must exit 0)
   - 5c: Run npm test (all 3,203+ vitest must pass)
   - 5d: Run all 6 new BATS scenarios + 40+ existing BATS (regression check)

   Wave 6 (Sequential): Acceptance verification
   - 6a: Verify all 13 SPEC acceptance criteria via tests/scripts/tmux/61-66-*.bats
   - 6b: Verify 27-tool-key invariant via tests/integration/hook-registration.test.ts
   - 6c: Verify tsc --noEmit clean (no any in new types)

3. /Users/apple/hivemind-plugin-private/.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-PLAN-CHECK.md
   Run gsd-plan-checker (looped by gsd-planner itself) on 58-PLAN.md. Iterate until PASS. If any HIGH concerns, address them in the plan.

ATOMIC COMMITS (one per artifact):
- phase-58: PATTERNS - 58-PATTERNS.md (BATS patterns + frozen contract)
- phase-58: PLAN - 58-PLAN.md (6 waves, ~20 tasks)
- phase-58: PLAN-CHECK - gsd-plan-checker PASS verdict

RETURN FORMAT:
- Files created with LOC and atomic commit SHAs
- Wave count and task count
- gsd-plan-checker verdict (PASS/FAIL with details)
- Any blockers / unresolved questions
- Gate triad verdict (lifecycle/spec/evidence) for this docs-only artifact

BOUNDARY RULES:
- READ-ONLY on src/, tests/, .opencode/, .hivemind/
- WRITE-ONLY to .planning/phases/58-.../58-PATTERNS.md, 58-PLAN.md, 58-PLAN-CHECK.md
- 50,000 chars max per file
- Cite file:line for all code references
- Honor 3 research drifts (Q1-Q3) - do NOT silently contradict them
- This is PLANNING ONLY - do NOT run gsd-execute-phase
