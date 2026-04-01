# Harness Recovery Plan

Date: 2026-04-02
Status: proposed
Scope: recover the stalled spec/debug loop before new implementation work

## Goal
Convert the current standalone `opencode-harness` repo from "pack-ready but spec-unsafe" into a repo with corrected forward-looking requirements, aligned user stories, and a staged path to close missing/broken feature gaps.

## Root Cause Summary
- The previous loop failed because it optimized for validation output instead of artifact convergence.
- `session-ses_2b52.md` and `session-ses_2b53.md` repeated the same diagnosis instead of editing the target docs.
- The current docs still contain platform-model contradictions, invented APIs, and underspecified tool semantics.
- Feature-gap implementation is therefore blocked on spec repair.

## Recovery Options

### Option 1: Spec-First Recovery (recommended)
- Cycle 1: rewrite requirements to remove OpenCode/OMO contradictions and clearly mark harness-owned vs platform-owned behavior.
- Cycle 2: realign user stories to the corrected requirements and trim anything not supportable in MVP.
- Cycle 3: audit current code and `.opencode/` assets against the corrected docs, then group missing/broken work into implementation waves.
- Cycle 4+: execute implementation waves with explicit verification gates.

Why this is best:
- It fixes the highest-leverage source of failure first: contradictory execution inputs.
- It prevents another round of code-gap analysis based on assumptions the docs cannot yet support.

### Option 2: Parallel Spec Repair + Feature Audit
- Run doc correction and feature-gap audit at the same time, then reconcile later.

Why this is weaker:
- The feature audit would still depend on unstable requirements and would likely need to be redone.
- This repeats the same churn pattern already visible in the failed sessions.

### Option 3: Code-First Gap Fixing
- Ignore the doc contradictions for now and repair obvious missing/broken behavior directly in code.

Why this is worst:
- It turns the current spec ambiguity into implementation debt.
- It maximizes rework risk and makes later validation less trustworthy.

## Recommended Route

### Cycle 1: Requirements Repair
Objective:
- Correct `docs/requirements-2026-04-02.md` so it is a usable forward-looking requirement source.

Focus areas:
- Fix `doom_loop` vs circuit-breaker framing.
- Replace invented APIs with requirement-level behavior statements.
- Reframe harness-specific environment variables as harness-owned configuration.
- Clarify custom tool implementation expectations and `permission.task` semantics.
- Reduce `/harness-doctor` to a grounded, testable MVP surface.

Exit gate:
- Updated requirements doc exists and is internally consistent.
- User explicitly approves moving to Cycle 2.

### Cycle 2: User Story Realignment
Objective:
- Rewrite `docs/user-stories-2026-04-02.md` so stories and acceptance criteria match the corrected requirements.

Focus areas:
- Remove story criteria that assume nonexistent platform APIs.
- Preserve useful OMO-inspired role intent while documenting MVP simplifications.
- Keep only stories that can be traced to corrected requirements.

Exit gate:
- Story doc traces cleanly to the updated requirements doc.
- User explicitly approves moving to Cycle 3.

### Cycle 3: Feature Gap Audit
Objective:
- Compare current `src/` and `.opencode/` behavior against the corrected docs and identify actual missing or broken features.

Focus areas:
- Map each requirement/story to code, commands, tools, agents, rules, and plugin surfaces.
- Separate missing features, partially implemented features, and broken behaviors.
- Group the resulting work into small implementation waves with verification targets.

Exit gate:
- Gap matrix exists with prioritized implementation waves.
- User explicitly approves moving to implementation.

### Cycle 4+: Implementation Waves
Objective:
- Execute the gap matrix in small, verifiable slices.

Wave shape:
- one wave per bounded concern
- verification before claiming completion
- no cross-wave scope creep

Candidate wave groups:
- control-plane/runtime semantics
- delegation and routing behavior
- checkpoint/continuity surfaces
- command/doctor observability
- documentation and smoke-verification closure

## Stop Conditions
- Stop if a recovery cycle uncovers a larger decomposition issue that invalidates the current doc set.
- Stop if a cycle produces more validation text than artifact changes.
- Stop if implementation pressure appears before Cycle 3 is approved.

## Next Authorized Action Needed
- User approval to execute Cycle 1 only: repair `docs/requirements-2026-04-02.md`.
