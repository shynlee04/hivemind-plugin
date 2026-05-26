# Assumption Verification Template

Use this to verify design assumptions or prove whether a behavior exists in a codebase.

| Assumption | Evidence path 1 | Evidence path 2 | Classification | Confidence | Next action |
|---|---|---|---|---|---|
| [falsifiable claim] | file:line / query | file:line / query | confirmed / discrepancy / addition / missing / blocked | high / medium / low | continue / ask / defer / fix plan |

## Classifications

- **confirmed:** code and at least one corroborating artifact support the assumption.
- **discrepancy:** code exists but differs materially from the assumption.
- **addition:** code has adjacent behavior the assumption omitted.
- **missing:** scoped searches found no implementation.
- **blocked:** required source is inaccessible or search scope is unsafe/incomplete.

## Report Shape

Start with the answer, then show evidence. Keep implementation suggestions separate from investigation truth.
