# Evidence Truth Evaluation Checklist

Per-dimension audit criteria for gate-evidence-truth. Use during STEP 1–8 of the core workflow.

## Dimension 1: Evidence Classification

- [ ] Every artifact mapped to exactly one level (L1–L5)
- [ ] Mock-containing tests classified as L4 (not L3) regardless of test name
- [ ] Continuity records verified as from real sessions (not synthetic) before L2 classification
- [ ] Documentation and conversation summaries classified as L5 only
- [ ] Live session evidence verified as from actual OpenCode instance before L1 classification
- [ ] When ambiguous between two levels, classified at the lower level

## Dimension 2: Runtime Proof

- [ ] L1 evidence shows actual feature exercised in OpenCode instance
- [ ] L2 evidence contains delegation dispatch ID, session ID, and completion signal
- [ ] Runtime evidence includes timestamps and session metadata
- [ ] For milestone gates: at least one L1 artifact exists
- [ ] For deployment gates: L1 artifact covers the exact feature being deployed
- [ ] No runtime evidence claim relies solely on developer assertion

## Dimension 3: Test Integrity

- [ ] Integration tests actually hit real SDK boundaries (no mocks on external interfaces)
- [ ] Test file names do not claim "integration" while mocking all dependencies
- [ ] Mock scope is limited to internal collaborators, not external system boundaries
- [ ] Test coverage includes error paths and failure modes, not just happy path
- [ ] Mock teardown is verified — no leaked mock state between tests
- [ ] Async test flows have proper await/timeout handling (no false positives from timing)

## Dimension 4: Completion Honesty

- [ ] Every "done" or "complete" claim has at least one L3+ artifact
- [ ] Phase completion artifacts reference actual test results, not summaries
- [ ] No "working as expected" claims without corresponding test output
- [ ] Implementation claims match test surface — if code touches 3 modules, tests cover all 3
- [ ] Partial completions are labeled as such, not marked complete
- [ ] Skipped tests are documented with reason, not silently omitted from results

## Dimension 5: Regression Awareness

- [ ] Dependency graph consulted for transitive closure of affected modules
- [ ] Direct dependency boundary tests exist and pass
- [ ] Indirect dependency contracts verified (interface signatures unchanged)
- [ ] Cross-phase impact assessed — changes in one phase don't break artifacts from previous phases
- [ ] Regression test selection covers the transitive dependency set, not just the changed file
- [ ] Module-level regression tests selected using dependency graph, not file proximity

## Gate-Specific Minimum Checks

### PR Review Gate (L3 minimum)
- [ ] At least one integration test exists
- [ ] Integration test hits real SDK boundary (not mocked)
- [ ] Test output attached to PR or linked in CI

### Phase Completion Gate (L2 minimum)
- [ ] Continuity record exists in `.hivemind/state/`
- [ ] Record contains session ID and delegation IDs
- [ ] Record timestamps match the phase execution window

### Merge Gate (L2 minimum)
- [ ] Continuity record from real execution exists
- [ ] All integration tests pass in CI environment
- [ ] No L5-only evidence supporting the merge

### Milestone Completion Gate (L2 + one L1)
- [ ] At least one live OpenCode session proving a feature works
- [ ] Continuity records exist for all phases in the milestone
- [ ] Cross-phase regression tests pass

### Release/Deployment Gate (L1 minimum)
- [ ] Live runtime proof for every user-facing feature
- [ ] No mock-dependent evidence in the release artifact set
- [ ] Production-equivalent environment used for L1 evidence
