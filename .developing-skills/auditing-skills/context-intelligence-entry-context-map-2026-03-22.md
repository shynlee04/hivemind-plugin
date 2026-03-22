# Context Map

## Files to Modify

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `.developing-skills/refactored-skills/context-intelligence-entry/SKILL.md` | package contract | align docs with real three-mode behavior; remove hard-enforcement wording |
| `.developing-skills/refactored-skills/context-intelligence-entry/scripts/context-harness-init.cjs` | executable surface | replace duplicated, drifted implementation with one deterministic script |
| `.developing-skills/refactored-skills/context-intelligence-entry/schemas/output.schema.ts` | output contract | match quick, rot, and full outputs with a package-local Zod union |
| `.developing-skills/refactored-skills/context-intelligence-entry/tests/direct-invocation.md` | package validation | add direct-invocation checks for the isolated package |

## Dependencies (may need updates)

| File | Relationship |
|------|--------------|
| `skills/context-intelligence-entry/SKILL.md` | source/root authority version currently diverges from desired isolated package contract |
| `skills/context-intelligence-entry/scripts/context-harness-init.cjs` | root script is the copy source and shows the same contract drift as the isolated baseline |
| `.opencode/skills/context-intelligence-entry/scripts/context-harness-init.cjs` | projected script is stale and syntactically broken; evidence of projection drift |

## Test Files

| Test | Coverage |
|------|----------|
| `.developing-skills/refactored-skills/context-intelligence-entry/tests/direct-invocation.md` | manual validation for `--quick`, `--rot`, and `--full` |

## Reference Patterns

| File | Pattern |
|------|---------|
| `.developing-skills/refactored-skills/spec-distillation/tests/direct-invocation.md` | prior isolated-package validation pattern |
| `.developing-skills/refactored-skills/context-entry-verify/tests/direct-invocation.md` | prior wave validation placement and style |

## Root-Cause Findings

- The projected `.opencode` script fails immediately with `SyntaxError: Identifier 'CACHE_FILE' has already been declared`.
- The broken projection comes from duplicated appended blocks in the script body (`CACHE_FILE`, cache helpers, and `generateFixes` are declared twice).
- The root/isolated baseline script is not syntactically broken, but it still violates the package contract:
  - `--rot` is documented yet ignored by CLI parsing.
  - `--rot` and `--full` currently return the same full-analysis payload.
  - the shipped schema does not match actual full output fields.
- The copied package also included a runtime cache artifact at `scripts/.hivemind/context-check.json`, which is not part of a clean package payload.

## Risk Assessment

- [ ] Breaking changes to public API
- [ ] Database migrations needed
- [ ] Configuration changes required
