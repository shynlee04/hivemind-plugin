# Evidence-Based Gatekeeping

A gate without evidence is theater. It creates false confidence, ships broken code, and wastes everyone's time. This reference defines what counts as evidence, what doesn't, and how to prevent the excuses that erode gate discipline.

## Evidence Requirements

Every gate check must point to a verifiable artifact — command output, file content, or a concrete artifact. Claims are not evidence.

| Claim | Required Evidence | Not Sufficient |
|-------|-------------------|----------------|
| Tests pass | `npm test` output with 0 failures | Previous run, "should pass", agent said green |
| Build succeeds | `npm run build` exit code 0 with output | Linter passing, no red in terminal |
| Bug fixed | Original failing test now passes, symptom reproduced and resolved | Code changed, assumed fixed |
| Agent completed | `git diff` shows expected changes, file content matches intent | Agent reports "success", "done" status |
| Types clean | `npx tsc --noEmit` output shows 0 errors | "Looks typed", IDE no squiggles |
| Lint clean | `npm run lint` exit 0 with output shown | No visible lint errors, "style looks fine" |

The pattern: **run the command, capture the output, record it.** Anything less is a claim.

## Excuse Prevention

Excuses are how gates rot from the inside. Every excuse below has been used to skip verification. Every one has shipped a bug.

| Excuse | Reality |
|--------|---------|
| "Should work now" | Should ≠ does. RUN the verification. |
| "I'm confident" | Confidence ≠ evidence. Period. |
| "Agent said success" | Verify independently. Agents lie about completion. |
| "Tests haven't changed" | Implementation changed. Evidence is stale. |
| "It's just a rename" | Renames break references, imports, and build paths. |
| "I'm tired" | Exhaustion ≠ excuse. Run the gate or stop working. |
| "It compiles locally" | Local ≠ CI. Run it in the target environment. |
| "Small change, skip tests" | Small changes cause the biggest regressions. |

If you hear yourself saying any of these — stop talking and run the command.

## Gate Evidence Record Format

Every gate result must include structured evidence. No evidence field means the check failed.

```json
{
  "gate_id": "synthesis-3",
  "timestamp": "2026-03-28T02:00:00Z",
  "checks": {
    "tsc_clean": {
      "command": "npx tsc --noEmit",
      "exit_code": 0,
      "output_excerpt": "No errors found",
      "status": "pass"
    },
    "tests_green": {
      "command": "npm test",
      "exit_code": 0,
      "output_excerpt": "42/42 passed (1.2s)",
      "status": "pass"
    },
    "build_ok": {
      "command": "npm run build",
      "exit_code": 0,
      "output_excerpt": "Build completed in 3.1s",
      "status": "pass"
    }
  },
  "gate_result": "pass"
}
```

Fields:
- `command` — the exact command that was run
- `exit_code` — process exit code (0 = success)
- `output_excerpt` — key line from output proving the result (first and last relevant lines)
- `status` — `pass` or `fail`

If a check is missing `command` or `exit_code`, it fails. No exceptions.

## Evidence Classification

Not all evidence carries the same weight. Classify it before trusting it.

| Class | Definition | Example |
|-------|------------|---------|
| `confirmed` | Directly observed via command output in this run | `npm test` output captured just now |
| `inferred` | Reconstructed from multiple signals, not directly observed | Tests passed 5 minutes ago, no files changed since |
| `unverified` | Claimed but not checked with a command | Agent reports success, no output shown |

**Rule:** Gates may only pass on `confirmed` evidence. `inferred` is acceptable for carry-forward summaries but not for gate decisions. `unverified` never passes a gate.

## Red Flags

Signals that evidence is weak, stale, or fabricated:

- Using hedging language: "should", "probably", "seems to", "looks like"
- Expressing satisfaction before verification: "this should be done now"
- Trusting agent success reports without independent verification
- Reusing old evidence for new changes — if code changed, evidence is stale
- Evidence missing command or exit code — it's a claim, not evidence
- Output excerpt is too clean — real test runs have timing, counts, file paths
- Gate records created in bulk after the fact — evidence should be captured in real time

If you spot any of these, demand fresh evidence with captured output.

## Sibling Skills

- **`use-hivemind-context`** — context health verification. Before trusting any source (docs, memory, prior sessions), check it here. Evidence-based gatekeeping applies to gate decisions; context integrity applies to the sources feeding those decisions.
- **`use-hivemind-delegation`** — delegation return contracts. When a subagent returns, the return contract must include evidence. Gate checks validate that evidence against the contract.

## Anti-Pattern Summary

| Anti-Pattern | What Happens | Fix |
|--------------|-------------|-----|
| Gate on claims | False confidence, broken code ships | Require command output |
| Reuse old evidence | Stale proof for changed code | Re-run verification after changes |
| Skip gate on "trivial" | Trivial changes break trivially | Every change gets a gate |
| Bulk gate records | Evidence fabricated after the fact | Capture in real time |
| Trust agent reports | Agents over-report success | Independent verification |
