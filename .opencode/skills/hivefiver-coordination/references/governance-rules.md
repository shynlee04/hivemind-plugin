# Governance Rules Reference

> Loaded by orchestrator in `guard`, `build`, and `validate` modes.

## Source of Truth Hierarchy

1. `.opencode/` = working copy (edits happen here first)
2. Root dirs (`agents/`, `commands/`, `skills/`, `workflows/`) = parity mirror
3. On conflict: `.opencode/` wins. Root is overwritten during sync.
4. Exception: root user-customizations → merge, don't overwrite, flag for review.

## Change Safety

### Classification

| Type | Examples | Action |
|------|---------|--------|
| **Additive** | New optional field, new workflow step, expanded description | Direct write, bump version minor |
| **Breaking** | Renamed required field, removed step, changed kind | Compatibility window + migration note |
| **Destructive** | File deletion, contract version downgrade | Explicit user authorization required |

### Compatibility Windows (Breaking Changes)

1. **Cycle 1**: Add new alongside old. Mark old as `deprecated: true` with `removal_target`.
2. **Cycle 2**: Remove deprecated. Update all consumers.
3. Document migration inline or in CHANGELOG.

## Parity Enforcement

### Sync Protocol

1. Validate changes in `.opencode/`.
2. Copy to root counterpart path.
3. Verify with diff — must return zero differences.
4. Root extra content not in `.opencode/` → flag for review, don't drop.

### Parity Paths

| `.opencode/` | Root |
|--------------|------|
| `.opencode/agents/*.md` | `agents/*.md` |
| `.opencode/commands/*.md` | `commands/*.md` |
| `.opencode/workflows/*.yaml` | `workflows/*.yaml` |
| `.opencode/workflows/hivefiver/*.md` | `workflows/hivefiver/*.md` |
| `.opencode/skills/*/SKILL.md` | `skills/*/SKILL.md` |

### Drift Detection Triggers

- Every `/hivefiver audit` invocation
- Before any workflow gate that depends on asset integrity
- After bulk asset modifications

## Blocked Anti-Patterns

| ID | Anti-Pattern | Detection |
|----|-------------|-----------|
| G-01 | Wildcard delegation | `tasks: { "*": allow }` |
| G-02 | Unrestricted bash | `bash: { "*": allow }` |
| G-03 | Orphan alias | `kind: alias` without matching router action |
| G-04 | Version downgrade | New version < old version |
| G-05 | Selector collision | Two workflows, same precedence, same lane |
| G-06 | Missing exit criteria | Workflow step without exit_criteria |
| G-07 | Skill avalanche | Loading 5+ skills in single operation |
| G-08 | Contract-free command | Command without contract_version |
| G-09 | Parity drift | .opencode/ and root differ after sync |
| G-10 | Silent unknown action | Router ignoring unrecognized actions |

## Evidence Requirements

Before claiming any framework change complete:

1. **Syntax valid**: YAML frontmatter parses without error
2. **Contract checks pass**: all blocking checks in asset-contracts.md
3. **Parity verified**: diff returns zero
4. **No blocked anti-patterns**: cross-check list above
