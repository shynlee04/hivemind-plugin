# Six-Step Debug Workflow

The systematic protocol for debugging a bug. Each step produces
evidence.

## Step 1: Reproduction

Write a reproduction command that reliably triggers the symptom.
Capture to `evidence/repro-<id>.txt` using `scripts/repro-template.sh`.

**Verification**: Symptom matches user's report. Reproducible in
<10 runs.

## Step 2: Minimize

Reduce to smallest input that still triggers. Techniques:
- Bisect: binary search on parameters
- Strip dependencies
- Time-shift (cache, clock?)
- State-shift (clean vs. dirty state)

## Step 3: Hypothesize

List ≥3 candidate root causes. Rank by likelihood. For each:
- Supporting evidence
- Refuting evidence
- Cheapest way to test

Common categories: state, boundary, type, API, env, config, build, test.

## Step 4: Instrument

Add cheapest possible measurement:
1. Log line / print
2. Conditional breakpoint
3. Tracer / debugger
4. Bisect commit (git log --oneline, git checkout, repeat)
5. Profiler

Narrow to ONE root cause.

## Step 5: Fix

Apply smallest change that addresses ROOT CAUSE, not symptom.
Document why this addresses cause vs. symptom.

## Step 6: Regression Test

Convert repro to permanent test:
- Was in suite before fix (fails before, passes after)
- Stays in suite forever

## Stop Conditions

- 3 attempts on same hypothesis → return blocked handoff
- Cannot find cause → escalate, don't loop theater
- Fix breaks other tests → revert, escalate
