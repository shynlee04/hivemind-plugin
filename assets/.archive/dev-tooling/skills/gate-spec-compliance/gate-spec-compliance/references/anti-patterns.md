# Anti-Patterns Catalog

Seven lethal anti-patterns detected during spec compliance evaluation. Each entry includes severity, detection method, correction protocol, and real-world indicators.

## AP-01: Coverage Theater

**Severity:** HIGH
**Aliases:** Shallow testing, percentage gaming

**Definition:** Test suite reports high coverage percentage but tests assert trivial properties (existence checks, type checks) rather than behavioral correctness. A 90% line coverage number masks that zero requirements are actually verified.

**Detection Signals:**
- Test assertions count is disproportionately low relative to test count
- Assertions check only `expect(result).toBeDefined()` or `expect(typeof x).toBe('string')`
- No negative path tests (no error case coverage)
- No boundary tests (no edge case coverage)
- Coverage report shows high percentage but mutation testing score is below 50%

**Detection Method:**
1. Count assertions per test file: if average < 2 assertions per test, flag
2. Grep for assertion patterns: `toBeDefined`, `toBeTruthy` without behavioral assertions
3. Check for error path tests: grep for `throw`, `reject`, `Error` in test files
4. If available, run mutation testing and compare with line coverage

**Correction Protocol:**
1. Identify which requirements the shallow tests claim to cover
2. Rewrite tests to assert actual behavioral outcomes per SPEC success criteria
3. Add negative and boundary test cases per acceptance criteria
4. Re-verify coverage measures behavioral correctness, not line execution

## AP-02: Stale Matrix

**Severity:** HIGH
**Aliases:** Outdated traceability, ghost mappings

**Definition:** Traceability matrix was last updated more than one sprint ago. Code, tests, or specifications have changed since the matrix was generated, making it unreliable as compliance evidence.

**Detection Signals:**
- Matrix file modification date is older than latest code commit
- Matrix references files that have been renamed, moved, or deleted
- Matrix contains requirement IDs not present in current SPEC
- Matrix does not contain requirement IDs added in current sprint

**Detection Method:**
1. Compare matrix file timestamp with latest commit timestamp in implementation files
2. Cross-reference matrix requirement IDs with current SPEC.md requirement list
3. Cross-reference matrix code file paths with actual file system
4. Check for PLAN.md task IDs in matrix vs current PLAN.md

**Correction Protocol:**
1. Regenerate matrix from current SPEC.md, PLAN.md, and code
2. Validate every entry against actual file system and test results
3. Timestamp the regenerated matrix
4. Establish matrix update trigger: regenerate on every merge to main branch

## AP-03: Single-Source Verification

**Severity:** MEDIUM
**Aliases:** One-evidence wonder

**Definition:** Each requirement has only one type of verification evidence (e.g., only unit tests, or only manual review). No requirement benefits from multiple evidence types that cross-validate compliance.

**Detection Signals:**
- Every requirement's verification column lists only one method type
- No requirement has both automated test AND manual review evidence
- No requirement has both unit test AND integration test
- Verification methods are homogenous across all requirements

**Detection Method:**
1. Tally verification method types per requirement
2. Flag requirements with single evidence type
3. Check for diversity: unit tests + integration tests + manual checks + code review

**Correction Protocol:**
1. For each single-source requirement, identify a second verification method
2. Prefer automated verification as primary, manual/inspection as secondary
3. Add integration-level verification for requirements tested only at unit level
4. Re-evaluate with dual-evidence requirement per requirement

## AP-04: Trust Without Evidence

**Severity:** CRITICAL
**Aliases:** Word-of-mouth compliance, faith-based verification

**Definition:** Compliance claims are based on developer assertions, meeting notes, or verbal confirmation rather than runnable verification commands, test output, or inspectable artifacts.

**Detection Signals:**
- Compliance report contains "Developer confirmed" without test output
- Requirement marked as verified with no verification command or test reference
- AC marked PASS without corresponding test case or command output
- Evidence is a prose description rather than command output, test result, or artifact

**Detection Method:**
1. Check every PASS entry for runnable verification evidence
2. Reject prose-only evidence for HIGH severity requirements
3. Grep for "confirmed", "verified by", "agreed" without command output
4. Ensure each PASS has at minimum: command + output + pass criteria match

**Correction Protocol:**
1. For each trust-without-evidence finding, require runnable verification
2. If no test exists, write one — do not accept verbal confirmation
3. If test exists but output is not recorded, re-run and capture output
4. Mark requirement as BLOCKED until evidence is produced

## AP-05: Measuring Without Acting

**Severity:** MEDIUM
**Aliases:** Report-and-ignore, gap theater

**Definition:** Gap reports and compliance evaluations are generated regularly but the identified gaps are never fixed. The measurement activity becomes a ritual without corrective action.

**Detection Signals:**
- Previous compliance report identified gaps that remain in current report
- Gap count is stable or increasing across successive evaluations
- No commits between evaluations that address previously identified gaps
- Team has compliance meeting notes but no corresponding fix commits

**Detection Method:**
1. Compare current gap list with previous evaluation gap list
2. Check if previously identified gaps have been resolved in code
3. Verify gap resolution has corresponding commits
4. Calculate gap resolution rate (resolved / identified)

**Correction Protocol:**
1. For each recurring gap, escalate severity by one level
2. Require gap resolution plan with timeline before next evaluation
3. Block PASS if previously identified HIGH gaps remain unresolved
4. Track gap resolution rate as a compliance health metric

## AP-06: Orphan Artifact Drift

**Severity:** HIGH
**Aliases:** Specification drift, desynchronized artifacts

**Definition:** SPEC.md is updated but downstream artifacts (PLAN.md, test files, traceability matrix) are not regenerated or updated to match. The specification and implementation diverge silently.

**Detection Signals:**
- SPEC.md modification date is newer than PLAN.md modification date
- SPEC.md contains requirements not referenced in PLAN.md
- Test files reference requirement IDs not in current SPEC
- Traceability matrix does not cover all current SPEC requirements

**Detection Method:**
1. Compare SPEC.md timestamp with PLAN.md and test file timestamps
2. Cross-reference SPEC requirement IDs with PLAN task references
3. Cross-reference SPEC requirement IDs with test file references
4. Check for requirements in SPEC that have no downstream artifact chain

**Correction Protocol:**
1. Regenerate PLAN.md tasks for new SPEC requirements
2. Update or write tests for modified requirements
3. Regenerate traceability matrix
4. Establish artifact chain validation as pre-commit hook or CI step

## AP-07: Self-Certification

**Severity:** CRITICAL
**Aliases:** Fox-guarding-henhouse, own-work-approval

**Definition:** The same agent or person who wrote the implementation also performs the spec compliance verification. No independent review validates the compliance claim.

**Detection Signals:**
- Compliance report author matches implementation commit author
- No code review from a different reviewer on compliance-relevant code
- Test author matches implementation author with no review
- Review is performed by the same session/agent that did the implementation

**Detection Method:**
1. Compare git commit author with compliance report author
2. Check for code review by a different reviewer
3. Verify test review is independent of implementation review
4. Check if the compliance evaluation session is different from the implementation session

**Correction Protocol:**
1. Require independent reviewer for compliance evaluation
2. In agent workflows, use a different agent for compliance checking than for implementation
3. Separate implementation commit from compliance verification commit
4. Log reviewer identity in compliance report
