<purpose>
Systematically diagnose, reproduce, and repair compile, test, or logic failures, ensuring that fixes are verified by reproducing tests.
</purpose>

<required_reading>
@.opencode/references/hm-coordination-contracts.md
</required_reading>

<downstream_awareness>
The fix and its reproducing tests restore the green path:
1. **automated test suite**: Runs successfully without failure.
2. **harness state**: Records the resolution of the incident in active session trajectory logs.
</downstream_awareness>

<scope_guardrail>
**CRITICAL: Minimal changes.** Keep edits strictly focused on resolving the bug. Avoid cosmetic changes, formatting updates, or refactoring code unrelated to the defect.
</scope_guardrail>

<process>

<step name="initialize" priority="first">
Collect failure context from argument ($ARGUMENTS) and logs:
- Extract error messages, stack traces, and affected files.
- Identify the active session or task that encountered the failure.
</step>

<step name="create_reproducer">
Write a minimal reproducer script or test case inside the scratch directory (`.scratch/` or `.hivemind/state/`).
Execute the reproducer to confirm that it fails exactly as reported.
</step>

<step name="locate_root_cause">
Scan the codebase to isolate the defect:
- Grep for error symbols or function signatures.
- Inspect the logic and dependency paths of the affected modules.
- Formulate the hypothesis explaining the failure mechanism.
</step>

<step name="implement_fix">
Apply target code modifications to resolve the defect. Follow codebase design guidelines (prefixes, errors, deep cloning).
</step>

<step name="verify_fix">
Run the reproducer script/test to confirm that the failure is resolved.
Execute the full automated test suite to verify that no regressions were introduced.
</step>

<step name="atomic_commit">
Stage the code modifications and the reproducing test case.
Commit atomically using a meaningful message:
```bash
git commit -m "fix(harness): resolve {{bug_domain}} - include reproducing test"
```
</step>

</process>

<success_criteria>
- Defect successfully reproduced.
- Root cause isolated and documented.
- Fix implemented and verified against reproducer.
- All other tests pass.
- Atomic commit containing both fix and test succeeded.
</success_criteria>
