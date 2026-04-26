# Perspective Rubrics

Contextual evaluation rubrics activated based on gate context. Each context loads a primary and secondary evaluation lens.

## Activation Rules

1. Identify the current gate context from the workflow stage
2. Activate primary lens — apply its rubric to all 5 evaluation dimensions
3. Activate secondary lens — apply as a cross-check on dimensions the primary may undervalue
4. For deployment readiness — activate all three lenses equally

## Dev Lens (Primary for Code Review)

### Evidence Classification
- Verify test file contents match test names — no "integration test" that only mocks
- Check import statements for mock patterns on SDK boundaries
- Assert test assertions are meaningful (not `expect(true).toBe(true)`)

### Test Integrity (highest emphasis)
- Every mocked boundary must have a justification comment
- Mock scope must not extend beyond the unit under test
- Integration tests must import from real module paths, not mock aliases
- Test coverage ratio must follow 70-20-10 pyramid within the module

### Completion Honesty
- "Done" claims must link to specific test output or CI run
- No asserting completion based on code review alone

### Regression
- Check that the changed file's direct dependents have passing tests
- Verify no import path changes break downstream type signatures

## Architect Lens (Primary for Phase Audit, Integration Check)

### Evidence Hierarchy Compliance (highest emphasis)
- Every phase artifact must have at least L2 evidence
- L5-only artifacts are flagged as insufficient
- Evidence must span the full module surface, not just the happy path

### Regression (secondary emphasis)
- Transitive dependency closure checked via import graph
- Contract tests at module boundaries verified
- Cross-phase artifact compatibility confirmed

### Runtime Proof
- L2 continuity records validated against session lifecycle
- Delegation records cross-referenced with actual dispatch completion
- Hook execution logs verified against event subscription declarations

### Integration Check Specific
- Live verification of cross-boundary data flow
- Module interface contracts tested with real (not synthetic) data
- Error propagation across boundaries verified (not just happy path)

## PM Lens (Primary for Milestone Verification)

### Runtime Proof (highest emphasis)
- At least one L1 artifact per milestone — feature exercised in live OpenCode
- L1 evidence covers user-facing behavior, not just internal APIs
- Timestamps and session metadata prove the test happened during the milestone window

### Completion Honesty (secondary emphasis)
- Phase completion claims cross-referenced with actual test results
- Milestone-level "done" requires L2+ for every phase, L1 for at least one phase
- No milestone completion without addressing all phase audit findings

### Evidence Classification
- Verify evidence levels are honestly reported (not inflated)
- L5 summaries do not substitute for L2+ records
- Historical summaries clearly labeled as L5 and not counted toward gate minimums

## All-Three Lens (Deployment Readiness)

Apply all three rubrics simultaneously. Deployment requires:

1. **Dev:** All test integrity checks pass, no mock-only claims for integration surfaces
2. **Architect:** Full evidence hierarchy compliance, regression tests pass for transitive closure
3. **PM:** Live runtime proof for every user-facing feature, honest completion claims

Any single lens failure blocks deployment.

## Severity Scaling

| Context | Critical (blocks gate) | Warning (document but proceed) |
|---------|----------------------|-------------------------------|
| Code review | Mock-only integration claim | Excessive mock scope within unit tests |
| Phase audit | L5-only evidence for phase completion | Missing error-path test coverage |
| Milestone verification | No L1 artifact for milestone | Weak L1 evidence (minimal feature exercise) |
| Integration check | Cross-boundary mock | Partial boundary coverage |
| Deployment readiness | Any lens failure | N/A — all findings block deployment |
