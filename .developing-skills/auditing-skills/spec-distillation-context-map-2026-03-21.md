# Spec Distillation Context Map

## Files to Modify

| File | Purpose | Changes Needed |
|---|---|---|
| `.developing-skills/refactored-skills/spec-distillation/SKILL.md` | Isolated working copy of the package entry contract | Remove phantom `entry-resolution` routing, make direct invocation explicit, document package-local script, add local test resource |
| `.developing-skills/refactored-skills/spec-distillation/tests/direct-invocation.md` | New package-local validation scenario | Add a standalone scenario proving the package works without sibling routers |

## Dependencies

| File | Relationship |
|---|---|
| `skills/spec-distillation/SKILL.md` | Source-authority original used as baseline for the isolated copy |
| `.developing-skills/refactored-skills/spec-distillation/references/ambiguity-taxonomy.md` | Local reference already bundled by the package |
| `.developing-skills/refactored-skills/spec-distillation/templates/spec-candidate.md` | Local template already bundled by the package |
| `.developing-skills/refactored-skills/spec-distillation/scripts/extract-requirements.sh` | Local helper script already bundled by the package |

## Test Files

| Test | Coverage |
|---|---|
| `.developing-skills/refactored-skills/spec-distillation/tests/direct-invocation.md` | Confirms the skill can be triggered directly without `entry-resolution` or sibling-package routing |

## Reference Patterns

| File | Pattern |
|---|---|
| `skills/agent-role-boundary/SKILL.md` | Compact, package-local authority with local refs/templates |
| `skills/use-hivemind-detox-refactor/SKILL.md` | Bounded markdown-first package with explicit use/do-not-use sections |
| `skills/git-atomic-memory/SKILL.md` | Granular local reference-loading pattern |

## Verified Risks

- Root issue is narrow: phantom `entry-resolution` coupling in `skills/spec-distillation/SKILL.md:3` and `skills/spec-distillation/SKILL.md:13`
- Package is otherwise already close to self-contained
- Isolated copy already exists in `.developing-skills/refactored-skills/spec-distillation/`; do not assume it was newly created this turn
- Keep changes in the isolated copy only for this wave; no root `skills/**` edits yet
