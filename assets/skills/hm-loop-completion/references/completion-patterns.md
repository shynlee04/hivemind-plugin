# Completion Detection Patterns

5 patterns for detecting when a task is actually complete (vs. seemingly
done but actually not).

## Pattern 1: Output File Exists + Non-Empty

**Check**: The expected output file exists and has content.

```bash
test -s path/to/output.md && echo COMPLETE || echo NOT_DONE
```

**Anti-pattern**: "I see output in the agent's response, so it's done."
The output might be a partial artifact, not the expected deliverable.

## Pattern 2: Acceptance Criteria Pass

**Check**: Every acceptance criterion in the task envelope has a
falsifiable assertion that passes.

```bash
for criterion in "${CRITERIA[@]}"; do
  test_criterion "$criterion" || { echo "FAIL: $criterion"; exit 1; }
done
echo "ALL CRITERIA PASS"
```

**Anti-pattern**: "It works on my machine." Falsifiable means runnable.

## Pattern 3: Verification Command Exits 0

**Check**: The verification command from the envelope ran and exited 0.

```bash
bash <verification.command>
test $? -eq 0 && echo VERIFIED || echo VERIFY_FAIL
```

**Anti-pattern**: "I ran the test and it passed." Did the test actually
exit 0? Or did you abort early?

## Pattern 4: Loop-Back for Unexpected Output

**Check**: If the agent's output doesn't match expected format, loop back.

```bash
# Expected: JSON with required fields
output=$(cat agent-output.json)
echo "$output" | jq -e '.required_field' >/dev/null 2>&1 || {
  echo "MISSING REQUIRED FIELD; LOOP BACK"
  delegate-task({ agent: "<same>", prompt: <augmented-envelope> })
}
```

**Anti-pattern**: "Close enough." Match the expected format or restart.

## Pattern 5: Durable Cursor Verification

**Check**: For multi-step loops, the cursor state must be persisted.

```bash
# Cursor file at .hivemind/state/loops/<loop-id>/cursor.json
test -f .hivemind/state/loops/$LOOP_ID/cursor.json && \
  jq -e '.iteration, .completed_steps' .hivemind/state/loops/$LOOP_ID/cursor.json
```

**Anti-pattern**: "The agent said it was at step 3." Check the actual
persisted state.

## When to Loop Back

| Signal | Action |
|---|---|
| Output file missing | Re-dispatch with explicit output path |
| Output file empty | Re-dispatch with format requirements |
| Verification exits non-zero | Re-dispatch with augmented context (don't change approach unless 3 fails) |
| Acceptance criterion unfalsifiable | STOP, fix envelope first |
| Cursor not persisted | Re-dispatch with explicit "save state to cursor" instruction |
| Same error 3x in different agents | Escalate, not loop |
