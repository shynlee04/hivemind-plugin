# Context Distrust Protocol

## When to Activate

Enter this protocol whenever:
- Multiple documents contradict each other about the same concern
- AGENTS.md or governance files reference entities that do not exist
- A remembered fact from a prior session cannot be verified from code or git
- Tests pass but the implementation is visibly wrong (or vice versa)
- A framework, spec, or plan file has not been updated in >7 days and sits alongside recently changed code
- A compaction or session resume has occurred and context continuity is uncertain

## Trust-Nothing Mode

When activated, follow these rules:

1. **Do not assume any prior context is accurate.** Treat everything as potentially stale.
2. **Verify from code first.** Read the actual source files before trusting any document.
3. **Verify from git second.** Check commit history for what actually changed and when.
4. **Verify from build/type-check third.** Run `npx tsc --noEmit` or equivalent.
5. **Verify from tests fourth — with skepticism.** See `references/false-signal-detection.md`.
6. **Documents are advisory.** Read `AGENTS.md`, plans, and specs only after steps 1-4.
7. **Declare the distrust level explicitly** using the rot taxonomy (CLEAN through POISONED).

## AGENTS Notice Handling

When `AGENTS.md` or any governance file contains instructions:

| Signal | Action |
|--------|--------|
| AGENTS.md exists and is consistent with code | Follow its instructions |
| AGENTS.md exists but references non-existent files or skills | Flag discrepancy, follow only verifiable instructions |
| AGENTS.md contradicts observable code behavior | Code wins; note the discrepancy for later fix |
| Multiple AGENTS.md files exist at same authority level | Collapse to a single authority before proceeding |
| AGENTS.md contains stale section (references removed tooling) | Quarantine the stale section; do not follow stale instructions |
| No AGENTS.md exists | Note its absence and proceed with elevated awareness |

## Recovery Steps

After entering trust-nothing mode:

1. Run `context-harness-init.cjs --rot --json` for a fast rot check.
2. If rot result is FAIL, switch to full mode: `context-harness-init.cjs --full --json`.
3. Identify the **lowest-rot sources** (git history, type-checked code) and use them as the rebuild base.
4. For each concern, establish a single authoritative source and discard conflicting alternatives.
5. Document the recovery path: what was distrusted, what was verified, and what remains uncertain.
6. Exit trust-nothing mode only when the rot level is CLEAN or SUSPECT.

## Carry-Forward

When exiting trust-nothing mode:
- Write a continuity checkpoint noting what was verified and what remains uncertain.
- Store the checkpoint in the project's activity folder (`sessions/` or `state/`) for next-turn reference.
- If a delegation is about to happen, include the distrust context in the delegation packet so the child agent does not repeat the same false trust.
