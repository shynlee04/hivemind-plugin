# Core Evaluation Workflow — Detailed Steps

Extracted from SKILL.md for progressive disclosure. Referenced by the high-level checklist.

---

## STEP 1: GATHER

Identify the gate type. Collect all artifacts that claim to prove the implementation works: test results, continuity records, live session logs, design docs, conversation summaries. Include negative evidence (failing tests, missing records).

## STEP 2: CLASSIFY

Map each artifact to its evidence level. Be conservative: if a test mocks an SDK boundary, classify as L4 regardless of the test name. If a continuity record references a real session with actual dispatch, classify as L2. If a developer ran the feature in OpenCode and captured output, classify as L1.

Run `scripts/run-evidence-check.sh <module-path>` to automate mock pattern detection and continuity record scanning. If the script is unavailable, manually grep for mock patterns (`vi.mock(`, `jest.mock(`, `sinon.stub(`) and classify evidence using the hierarchy table in SKILL.md.

## STEP 3: CHECK MINIMUM

Compare highest evidence level against gate-type minimum from the Gate Type table in SKILL.md. If insufficient, verdict is FAIL with the specific gap documented.

## STEP 4: DETECT MOCKS

Scan test files for patterns indicating mocked SDK boundaries:

- `vi.mock(`, `jest.mock(`, `sinon.stub(` — SDK boundary mocks
- Test names containing "integration" but mocking external calls
- Import paths that mock core SDK/API boundaries (in the harness project: `src/lib/session-api.ts`, `src/lib/continuity.ts`, `src/lib/delegation-manager.ts`; adapt to your project's equivalent session API, persistence, or orchestration modules)

Load `references/harness-verification-trees.md` for module-specific mock detection rules.

## STEP 5: CHECK COMPLETION HONESTY

Verify every "done", "complete", "working", or "verified" claim has at least one L3+ artifact backing it. Claims without evidence are dishonest by definition.

## STEP 6: REGRESSION CHECK

Using the dependency graph (`.hivemind/state/` or `src/` imports), identify modules that transitively depend on the changed module. Verify that regression tests exist for at least the direct-dependency boundary.

## STEP 7: ANTI-PATTERN SCAN

Match gathered evidence against the 7 anti-patterns in `references/anti-patterns.md`. Flag any match as a deduction in the evidence report.

## STEP 8: VERDICT

Produce an evidence truth report using `templates/evidence-report.md`. If any dimension fails, verdict is FAIL. Include remediation plan specifying what evidence is needed and how to produce it.
