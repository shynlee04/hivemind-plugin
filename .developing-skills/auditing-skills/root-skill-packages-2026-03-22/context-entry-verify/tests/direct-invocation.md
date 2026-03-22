# Direct Invocation Validation

## Scenario

Verify that `context-entry-verify` works as a standalone package without any sibling routing skill, upstream triage, or auto-run enforcement.

## Steps

1. Run the verification script directly from the skill package:
   ```bash
   node skills/context-entry-verify/scripts/hm-verify.cjs project build --raw
   ```

2. Verify the output is valid JSON with `gate`, `passed`, and `data` fields.

3. Run `gate-chain` to verify sequential execution:
   ```bash
   node skills/context-entry-verify/scripts/hm-verify.cjs gate-chain --raw
   ```

4. Verify that no sibling skill was required to activate or interpret the output.

5. Run `landscape` to verify non-blocking full report:
   ```bash
   node skills/context-entry-verify/scripts/hm-verify.cjs landscape --raw
   ```

## Expected Results

- The script runs with only Node.js built-ins (no npm deps)
- JSON output is self-explanatory and machine-parseable
- No references to `context-intelligence-entry` or other sibling skills appear in the output
- No auto-run gating is enforced; the agent chose to invoke this tool

## Pass Criteria

- All three commands produce valid JSON output
- The SKILL.md can be read and followed without loading any other skill
- The verification results are actionable on their own
