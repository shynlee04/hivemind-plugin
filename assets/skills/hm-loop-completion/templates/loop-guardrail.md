# Loop Guardrail Template

A guardrail for any loop that needs to detect "fake completion".

```markdown
# Loop Guardrail: <LOOP-NAME>

**Loop ID:** <unique-id>
**Max iterations:** 5
**Exit condition:** <literal condition>

## Completion Checks (run before declaring done)

1. **Output check**: <file> exists and non-empty
   ```bash
   test -s <file>
   ```

2. **Verification check**: <command> exits 0
   ```bash
   <command>
   ```

3. **Acceptance criteria**: all of these pass
   - [ ] <criterion 1>
   - [ ] <criterion 2>
   - [ ] <criterion 3>

4. **Cursor state**: <cursor.json> has iteration count + completed steps
   ```bash
   jq -e '.iteration and .completed_steps' <cursor.json>
   ```

5. **No silent suppression**: no `|| true`, no `2>/dev/null` in agent output

## On Failure

- **Iteration 1-2**: Re-dispatch with augmented context
- **Iteration 3**: WARN — "2 iterations remaining"
- **Iteration 4**: WARN — "1 iteration remaining"
- **Iteration 5**: HARD STOP. Summarize. Escalate to user.

## On Hard Stop

Present to user:
- What was tried (iterations 1-5)
- What remains unresolved
- Options: (1) user takes over, (2) change approach, (3) accept partial
```

## Usage

Save as `assets/skills/<skill>/templates/loop-guardrail.md` and
fill the placeholders. Reference from SKILL.md when the loop is
invoked.
