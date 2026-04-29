# Evidence Anti-Patterns

Catalog of 7 anti-patterns that undermine evidence truth. Detect these during STEP 7 of the evaluation workflow.

## AP-1: Grading Paths Not Outcomes

**Severity:** CRITICAL (blocks gate)

**Description:** Verifying code structure (file existence, import patterns, class hierarchy) instead of runtime behavior. "The module exists and exports the right functions" is not evidence that it works.

**Detection:**
- Check that verification commands actually execute the code, not just inspect file structure
- Grep for verification steps that only check `ls`, `cat`, or `import` without running the module
- Look for "verified by inspection" or "code looks correct" claims

**Remediation:** Replace structural checks with behavioral tests that exercise the code path.

## AP-2: One-Sided Evaluations

**Severity:** HIGH (blocks gate unless error-path evidence exists elsewhere)

**Description:** Only testing the happy path. Success-case tests without corresponding failure-mode tests give false confidence.

**Detection:**
- Count test cases: if >80% test success paths, flag as one-sided
- Search for error handling in source code without corresponding test coverage
- Look for `try/catch` blocks in source with no test exercising the catch path
- Check for `Promise.reject` or `throw` paths without test assertions

**Remediation:** Add error-path and edge-case tests covering failure modes.

## AP-3: Accepting Documentation as Proof

**Severity:** CRITICAL (blocks gate)

**Description:** Treating L5 evidence (specs, design docs, conversation summaries) as sufficient proof of implementation correctness.

**Detection:**
- Gate passage based solely on design documents or conversation history
- "We discussed this and agreed it works" without runtime evidence
- SPEC.md or PLAN.md used as the sole evidence artifact
- ADRs or RFCs cited as proof of implementation

**Remediation:** Require L3+ evidence. Documentation is context, not proof.

## AP-4: Mock-Only for Integration Claims

**Severity:** CRITICAL (blocks gate)

**Description:** Tests named "integration" that mock SDK boundaries. If core API modules (session API, continuity/store, delegation/orchestration) are mocked, the test is a unit test (L4), not an integration test (L3). In the harness project, these are `session-api.ts`, `continuity.ts`, and `delegation-manager.ts` — adapt to your project's equivalent boundary modules.

**Detection:**
```bash
grep -rn "vi.mock\|jest.mock\|sinon.stub" tests/ --include="*.test.ts"
grep -l "integration" tests/ | xargs grep -l "vi.mock\|jest.mock"
```
- Test file contains "integration" in name but mocks external boundaries
- Import paths mock core SDK wrappers or external API boundaries
- Test creates synthetic state instead of exercising real I/O

**Remediation:** Create true integration tests that hit real SDK boundaries. Keep mocked tests as L4 unit tests.

## AP-5: Uncalibrated LLM-as-Judge

**Severity:** HIGH (flags for review)

**Description:** Subjective LLM evaluation ("the code looks correct", "this implementation seems sound") treated as objective evidence. LLM review is useful but not calibrated — it cannot substitute for runtime verification.

**Detection:**
- Review comments used as evidence artifacts
- "AI reviewed and approved" without corresponding test output
- LLM-generated test plans without executed test results
- Subjective quality scores without objective backing

**Remediation:** Accept LLM review as supplementary signal, never as primary evidence. Require runtime test results.

## AP-6: False Confidence from Synthetic Benchmarks

**Severity:** MEDIUM (document and flag)

**Description:** Passing synthetic tests that don't represent real usage patterns. A test that calls `delegation-manager.dispatch()` with a perfect input doesn't prove dispatch works under real OpenCode session conditions.

**Detection:**
- Test inputs are hardcoded perfect-case values
- No variation in test data (same payload every time)
- Test environment doesn't match production constraints (no concurrency, no timeouts)
- Performance claims based on artificial benchmarks

**Remediation:** Add property-based testing or realistic scenario tests. Use actual OpenCode session data when possible.

## AP-7: Confusing Test Count with Quality

**Severity:** MEDIUM (document and flag)

**Description:** 100 shallow tests that each assert one trivial thing are less valuable than 10 deep integration tests that verify end-to-end behavior. Quantity of tests is not evidence of quality.

**Detection:**
- Test file has >50 tests but each is <5 lines
- Most tests are simple getter/setter or constructor tests
- No test exercises a multi-step flow (e.g., dispatch→poll→complete→cleanup)
- Coverage percentage is high but integration coverage is near zero

**Remediation:** Prioritize integration and E2E test depth. Reduce shallow unit tests if they provide no unique coverage value.

## Anti-Pattern Severity Summary

| Anti-Pattern | Severity | Gate Impact | Auto-Detectable |
|-------------|----------|-------------|-----------------|
| AP-1: Grading paths not outcomes | CRITICAL | Blocks | Partial (grep patterns) |
| AP-2: One-sided evaluations | HIGH | Blocks if no error-path evidence | Yes (test ratio analysis) |
| AP-3: Documentation as proof | CRITICAL | Blocks | Yes (evidence level check) |
| AP-4: Mock-only integration | CRITICAL | Blocks | Yes (grep mock patterns) |
| AP-5: Uncalibrated LLM-as-judge | HIGH | Flags for review | Partial (review detection) |
| AP-6: Synthetic benchmarks | MEDIUM | Document | Partial (test data analysis) |
| AP-7: Test count vs quality | MEDIUM | Document | Yes (test depth analysis) |
