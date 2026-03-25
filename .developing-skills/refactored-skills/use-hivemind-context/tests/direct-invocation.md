# Direct Invocation Validation

## Purpose

Verify that the isolated `context-intelligence-entry` package behaves as a standalone package and that its three advertised modes are real.

## Commands

Run from `.developing-skills/refactored-skills/context-intelligence-entry/` or from the repo root with an explicit path.

```bash
node scripts/context-harness-init.cjs --quick --json
node scripts/context-harness-init.cjs --rot --json
node scripts/context-harness-init.cjs --full --json
```

## Expected Results

### Quick

- exits successfully
- returns `mode: "quick"`
- includes `state` and `can_proceed`

### Rot

- exits successfully
- returns `mode: "rot"`
- returns `result`, `passes`, `failures`, and `action_gate`
- does not silently fall through to the full-analysis payload

### Full

- exits successfully
- returns `mode: "full"`
- includes `rot_level`, `trust`, `dimensions`, `context_flood`, `action_gate`, and `recommendations`
- can be validated with `schemas/output.schema.ts`

## Package Independence Checks

- no bundled runtime cache file under `scripts/.hivemind/`
- no required sibling-package script dependency
- no projection-only file is needed for successful direct invocation
