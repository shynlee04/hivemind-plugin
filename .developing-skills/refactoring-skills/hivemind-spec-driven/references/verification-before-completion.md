# Verification Before Completion

**MANDATORY for all doer skills. Load this BEFORE claiming any work is complete.**

## The Iron Law
```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

## The Gate Function
1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
5. ONLY THEN: Make the claim

Skip any step = lying, not verifying.

## Common Failures
| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
| Build succeeds | Build command: exit 0 | Linter passing |
| Bug fixed | Test original symptom: passes | Code changed, assumed fixed |
| Agent completed | VCS diff shows changes | Agent reports "success" |

## Red Flags - STOP
- Using "should", "probably", "seems to"
- Expressing satisfaction before verification
- Trusting agent success reports
- Thinking "just this once"

## Rationalization Prevention
| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence ≠ evidence |
| "Agent said success" | Verify independently |
| "I'm tired" | Exhaustion ≠ excuse |

## Bottom Line
No shortcuts. Run the command. Read the output. THEN claim.
This is non-negotiable.
