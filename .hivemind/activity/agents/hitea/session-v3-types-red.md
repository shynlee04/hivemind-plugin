# Testing Report — SessionV3 Types (RED Phase)

**Scope:** SessionV3 interface type existence and shape (ADR-017)
**Phase:** RED — test MUST fail until SessionV3 is added to types.ts

## Test File Created

`src/features/event-tracker/session-v3-types.test.ts`

**Location rationale:** Originally scoped to `tests/features/event-tracker/` per delegation packet, but that directory is excluded from `tsc --noEmit` in tsconfig.json. Moved to colocated `src/` location (following existing `types.test.ts` convention) so the type checker catches the missing type at compile time. The `tests/` copy was deleted to avoid confusion.

## 23 Tests (all defined, will pass once SessionV3 exists)

| Test Name | What It Asserts |
|-----------|----------------|
| SessionV3 _schema is literal "session/v3" | `_schema` field is the literal string |
| SessionV3 has sessionId string | `sessionId` field exists as string |
| SessionV3 has semanticSessionId string | `semanticSessionId` field exists as string |
| SessionV3 has parentSessionId as string \| null | Nullable parent reference |
| SessionV3 has lineage as hivefiver \| hiveminder | Lineage union type |
| SessionV3 has purposeClass with valid PurposeClass value | 8 valid purpose classes |
| SessionV3 has agent string | Agent field |
| SessionV3 has startedAt string | Start timestamp |
| SessionV3 has endedAt as string \| null | Nullable end timestamp |
| SessionV3 has turnCount number | Turn count field |
| SessionV3 has status as active \| completed \| errored | 3-state status |
| SessionV3 has summary string | Summary field |
| SessionV3 has keyFindings string[] | Array of findings |
| SessionV3 has subsessionIds string[] | Array of subsession IDs |
| SessionV3 has resumable boolean | Resumable flag |
| SessionV3.counters has userMessageCount | Counter field |
| SessionV3.counters has assistantOutputCount | Counter field |
| SessionV3.counters has toolCallCount | Counter field |
| SessionV3.counters has delegationCount | Counter field |
| SessionV3.counters has compactionCount | Counter field |
| SessionV3.toc is array | TOC array exists |
| SessionV3 toc entry has turnNumber, timestamp, type, summary | TOC entry shape |
| SessionV3 toc type accepts 5 valid values | TOC type union |

## RED Gate Validation

### tsc --noEmit → FAILS (correct)

```
src/features/event-tracker/session-v3-types.test.ts(14,15): error TS2305: Module '"./types.js"' has no exported member 'SessionV3'.
```

Single clean compile error proving SessionV3 does not exist in types.ts.

### tsx --test → passes (expected)

`tsx` strips type annotations at transpile time, so the runtime tests pass against the plain fixture object. The type-checker (`tsc`) is the actual RED gate for this type-existence test. This follows the existing project pattern where `types.test.ts` runtime tests validate sentinel constants while `tsc` validates type shapes.

### Existing tests → no regression

534 existing colocated tests pass with the new file present.

## Edge Cases Covered

| Case | Test | Status |
|------|------|--------|
| Null parentSessionId | SessionV3 has parentSessionId as string \| null | Defined |
| Null endedAt | SessionV3 has endedAt as string \| null | Defined |
| Empty arrays | fixture has `keyFindings: []`, `subsessionIds: []`, `toc: []` | Defined |
| Zero counters | SessionV3 counters accepts zero values | Defined |
| All purposeClass values | purposeClass test with 8 values | Defined |
| All toc type values | TOC type test with 5 values | Defined |

## Gaps

- Runtime tests can't enforce type-level constraints (TypeScript unions, literal types) — these are `tsc`'s responsibility
- The `SessionV3['toc'][number]` type indexing will only resolve once SessionV3 is added

## Next: GREEN Phase

To make this test pass, add the `SessionV3` interface to `src/features/event-tracker/types.ts` with the shape defined in ADR-017.
