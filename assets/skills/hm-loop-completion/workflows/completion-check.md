# Completion Detection Workflow

The 5-step protocol for detecting true loop completion.

## Step 1: Capture Agent's Claim

The agent reports DONE. Don't trust yet.

```yaml
agent_claim:
  status: "DONE"
  output: "<path or text>"
  evidence: "<what the agent cites>"
```

## Step 2: Run Output Check

Is the expected output file real, non-empty, parseable?

```bash
test -s <output_path> || { echo "FAIL: output missing or empty"; exit 1; }
file <output_path>  # check format
head -1 <output_path>  # sanity check
```

## Step 3: Run Verification

Run the verification command from the task envelope:

```bash
<verification.command>
exit_code=$?
test $exit_code -eq 0 || { echo "VERIFY FAIL: exit $exit_code"; exit 1; }
```

## Step 4: Check Acceptance Criteria

For each criterion in the envelope, run an automated check:

```bash
for c in "${CRITERIA[@]}"; do
  eval "test_$c" || { echo "FAIL: $c"; exit 1; }
done
```

## Step 5: Persist Cursor + Declare Complete

If all checks pass:
1. Persist cursor state: `.hivemind/state/loops/<id>/cursor.json`
2. Emit completion marker: `LOOP_<id> COMPLETE`
3. Move to next iteration or exit loop

## Anti-Patterns

| Anti-pattern | Why it fails | Fix |
|---|----|---|---|
| "Agent said DONE" | Trust without verify | Always run checks 2-4 |
| Skipping acceptance criteria | Output may not match spec | Run all criteria |
| Ignoring exit codes | "I ran it" is not "it passed" | Check $? explicitly |
| Same loop, no iteration count | Infinite loops | Track and enforce max 5 |
| Loop with no exit condition | Unbounded | Define literal exit |
