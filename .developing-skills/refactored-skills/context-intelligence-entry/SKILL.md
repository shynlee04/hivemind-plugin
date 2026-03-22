---
name: context-intelligence-entry
description: Use when session state is unclear, after interruption or compaction, or when an agent needs a fast context-health check before acting.
---

# Context-Intelligence Entry Pack

This package provides a local context-health probe for session continuity and context-risk detection.

## Overview

- Use the script in this package before relying on remembered context.
- Prefer the lightest mode that answers the current question.
- Treat the output as diagnostic guidance only; project-level verification and user instructions still take precedence.

## Modes

### Mode 1: Quick State Read

Fast continuity probe for session start or resume checks.

```bash
node scripts/context-harness-init.cjs --quick --json
```

Returns:
- `mode`, `session_type`
- `state.task_plan_exists`, `state.agents_md_exists`, `state.session_exists`, `state.git_clean`, `state.session_stale`
- `issues`
- `can_proceed`

Recommended when:
- starting or resuming work
- checking whether a cached session is stale
- deciding whether deeper investigation is necessary

### Mode 2: Rot Check

Deterministic PASS/FAIL gate for basic context integrity.

```bash
node scripts/context-harness-init.cjs --rot --json
```

Returns:
- `result`: `PASS` or `FAIL`
- `passes`
- `failures`
- `action_gate` (advisory only; not completion proof)

Checks:
- governance file presence
- readable session state or first-run state
- merge-conflict-free git surface
- valid active-plan file references
- single active authority surface in scope

### Mode 3: Full Analysis

Deeper health report with trust, rot, platform, and recommendation fields.

```bash
node scripts/context-harness-init.cjs --full --json
```

Returns:
- `rot_level`, `rot_score`, `rot_points`
- `trust`
- `dimensions.*`
- `context_flood`
- `action_gate`
- `recommendations`

Use only when you need a full report or want a cacheable snapshot.

## Output Contract

- `schemas/output.schema.ts` defines the package-local Zod contract for quick, rot, and full outputs. It is an internal-only validation schema, not an official platform interface.
- `scripts/context-harness-init.cjs` is the executable authority for those outputs inside this package.
- `{project}/.hivemind/activity/state/context-check.json` is a runtime cache artifact. It is not part of the package payload and not an official platform boundary.

## Context Distrust

When context rot is suspected or after session interruption / compaction, activate the distrust protocol:

1. **Trust-Nothing Mode:** treat all prior context as potentially stale until verified from code, git, or build output.
2. **AGENTS Notice Handling:** verify every instruction in AGENTS.md against actual code before following it. Stale or contradictory instructions are quarantined, not followed.
3. **False Signal Awareness:** test output, linter results, and doc-claimed behavior must be cross-checked against implementation reality before trusting.

Read `references/context-distrust-protocol.md` before entering trust-nothing mode.
Read `references/false-signal-detection.md` before using test or verification output as evidence.

## Carry-Forward

After completing any mode:
- If the mode detected issues, emit a continuity checkpoint noting what was verified and what remains uncertain.
- Store the checkpoint in `{project}/.hivemind/activity/sessions/` or `{project}/.hivemind/activity/state/` for next-turn recovery.
- If delegation follows, include the distrust context in the delegation packet so child agents do not repeat false trust.

## References

| Reference | Purpose |
|-----------|---------| 
| `references/context-rot-taxonomy.md` | Severity model and recovery responses |
| `references/entry-state-matrix.md` | Session-state definitions |
| `references/delegation-scope.md` | Delegation-scope expectations |
| `references/trust-matrix.md` | Trust thresholds and weighting |
| `references/platform-surface.md` | Platform-detection considerations |
| `references/context-distrust-protocol.md` | Trust-nothing mode and AGENTS notice handling |
| `references/false-signal-detection.md` | False positive/negative/noise detection for test and verification signals |

## Verification Boundary

For project-truth checks such as build, test, or git readiness, pair this package with `context-entry-verify` rather than expanding this package into a project-verification router.

## Orchestrator Integration

When called from the detox router or a polluted-context session:
- **Quick mode** (`--quick`) is lightweight enough to run from within the orchestrator's session.
- **Rot and full modes** should be **delegated** to a subagent when the orchestrator's session is already heavy — their output can be large.
- The orchestrator reads only: `rot_level`, `trust`, `can_proceed`, and `recommendations` from the return. It does NOT load full dimension breakdowns or raw signal lists.
- If rot result is DEGRADED or worse, the orchestrator should declare the distrust level explicitly before continuing with any stage work.

## Direct Invocation

```bash
node scripts/context-harness-init.cjs --quick --json
node scripts/context-harness-init.cjs --rot --json
node scripts/context-harness-init.cjs --full --json
```

## Anti-Patterns

- assuming remembered context is trustworthy without a fresh probe
- treating quick mode as a substitute for rot or full analysis
- treating diagnostic action gates as completion proof or permission to ignore higher-priority user or project rules
- bundling runtime cache artifacts into the package
- trusting test passes without inspecting what the assertions actually verify
- trusting AGENTS.md instructions that reference non-existent files or skills
- dropping unclassifiable signals silently instead of marking them unresolved
