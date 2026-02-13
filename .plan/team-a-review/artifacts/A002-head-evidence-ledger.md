# A002 - HEAD Evidence Ledger

## Confirmed regressions at HEAD

- Recursive flatten tree: `src/lib/hierarchy-tree.ts:422`
- Duplicate render paths: `src/lib/hierarchy-tree.ts:585`, `src/lib/hierarchy-tree.ts:616`
- Sync lock operations: `src/lib/persistence.ts:77`, `src/lib/persistence.ts:109`
- Sequential backup cleanup loop: `src/lib/persistence.ts:38`
- Backup copy still read+write: `src/lib/persistence.ts:241`
- Raw stamp fallback path joins: `src/lib/planning-fs.ts:324`, `src/lib/planning-fs.ts:327`
- Cli formatter duplication currently in tools:
  - `src/tools/list-shelves.ts:28`
  - `src/tools/recall-mems.ts:49`
- Levenshtein utility local in detection:
  - `src/lib/detection.ts:508`

## Partial retention signals

- Backup warn exists in save path: `src/lib/persistence.ts:250`
- `withState` backup rename remains silent: `src/lib/persistence.ts:289`
- SDK-context behavior still directly tested in consolidated suite: `tests/sdk-foundation.test.ts:58`, `tests/sdk-foundation.test.ts:100`
- GOV-08 behavior check still present: `tests/governance-stress.test.ts:141`

## Runtime verification

- `npm test` -> pass
- `npm run typecheck` -> pass
- `npm run lint:boundary` -> pass
