# Doc Intelligence Feature Guidance

**Parent sector:** `src/features/AGENTS.md` | **Architecture:** `.planning/codebase/ARCHITECTURE.md` | **Classification:** Hard Harness — runtime-feature (read-side: markdown parsing/chunking)

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/features/doc-intelligence/` owns markdown parsing, chunking, and document routing helpers. `parser.ts` parses markdown into structured segments. `chunker.ts` splits documents into processable chunks. `router.ts` routes documents to appropriate handlers. `types.ts` defines doc intelligence contracts. This feature is consumed by `hivemind-doc.ts` tool. Source evidence: `.planning/codebase/ARCHITECTURE.md:136-183`.

## 2. Allowed mutation authority

- Doc-intelligence may parse, chunk, and route markdown documents.
- Doc-intelligence may produce structured output consumed by tools.
- All operations are read-side; no durable state mutation.

## 3. Forbidden mutations / explicit no-go boundaries

- Doc-intelligence SHALL NOT perform durable writes or filesystem mutations.
- Doc-intelligence SHALL NOT store runtime state in `.opencode/`. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Doc-intelligence SHALL NOT exceed the 500 LOC module cap. Source evidence: `.planning/codebase/CONVENTIONS.md:19-28`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/hivemind/hivemind-doc.ts` | Queries document intelligence | Tools own CQRS mutation; feature owns parsing |
| `src/schema-kernel/doc-intelligence.schema.ts` | Provides validation contracts | Schemas are leaf; feature owns behavior |
| Tests | Validate parsing and chunking accuracy | Must test edge cases in markdown structure |

## 5. Naming and placement conventions

- Modules use `kebab-case.ts` in `src/features/doc-intelligence/`. Source evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- Barrel export at `index.ts`.
- Tests mirror under `tests/features/doc-intelligence/`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tests. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Parsing changes must verify determinism (same input → same output).
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.
