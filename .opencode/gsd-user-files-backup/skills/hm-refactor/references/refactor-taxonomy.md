# Refactor Taxonomy

## Surgical Refactor

Scope: single function, rename, inline
Risk: low
Tests: existing must pass
Rollback: git checkout -- file
Time: minutes

## Structural Refactor

Scope: module boundaries, dependencies
Risk: high
Tests: existing + new integration
Rollback: git revert or branch delete
Time: hours to days

## Decision Tree

Does change alter behavior?
→ YES: not a refactor. Stop.
→ NO: how many files?
  → 1 file, 1 function: surgical
  → multiple: structural
