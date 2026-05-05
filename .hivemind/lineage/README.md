# .hivemind/lineage/

## Purpose

Execution lineage tracking for delegation chains. Records the parent→child relationships across delegated sessions and their outcomes.

## What Goes Here

- Delegation chain records (parent session → child sessions)
- Execution outcome artifacts (success, failure, timeout)
- Cross-session dependency graphs
- Recovery breadcrumbs for interrupted delegation chains

## Architecture

Execution lineage is a **derived projection** combining:
- Continuity data from `session-continuity.json`
- Delegation records from `delegations.json`
- Journal entries from `journal/`

See `src/lib/execution-lineage.ts` for the projection module.

## Related

- `src/lib/execution-lineage.ts` — Lineage projection module
- `src/lib/delegation-persistence.ts` — Delegation record I/O
- `.hivemind/state/delegations.json` — Raw delegation records
- `.hivemind/journal/` — Event source for lineage reconstruction

## Status

Directories may be empty until the lineage module writes projection artifacts here. The core delegation records are stored in `.hivemind/state/delegations.json`.
