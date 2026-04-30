---
phase: 25-session-journal-execution-lineage-bridge
artifact: architecture-audit
date: 2026-04-26
status: replanned
---

# Phase 25 Architecture Audit: Event Tracker Replan

## Scope

Audit of the previous Phase 25 automatic journey writer against the corrected requirement: automatic event-tracker parser/writer/meta-writer behavior with E2E filesystem proof under `.hivemind/event-tracker/`.

## Product-Detox Evidence Read

- `code-ske.md`: diagnostics-only Markdown skeleton; confirms event tracker may produce sparse but structured Markdown sections.
- `ses_2b7a.json` + `ses_2b7a.md`: session/v3 JSON has `_schema`, `sessionId`, `semanticSessionId`, status, counters, and empty `toc`; Markdown has `# ses_2b7a`, `**Session ID:**`, `Created`, `Updated`, and table-of-contents headings.
- `ses_2b7b.md`: large Markdown session artifact with skill/tool blocks; JSON counterpart exists but was unreadable as text in this environment.
- `ses_2b92.json` + `ses_2b92.md`: same compact JSON schema, Markdown includes skill invocation blocks.
- `ses_2b93.json` + `ses_2b93.md`: compact JSON with high counters and compaction count; Markdown includes assistant metadata and table structure.
- Source patterns reviewed: `paths.ts`, `consolidated-writer.ts`, `parser/header-parser.ts`, `parser/meta-parser.ts`, `classifier/writer-adapter.ts`.

## Findings

1. **Wrong target path** — previous writer emitted `.hivemind/sessions/journey-events/`, but corrected acceptance requires `.hivemind/event-tracker/`.
2. **Broad src/lib litter** — `session-artifact-parser.ts` and `session-journey-events.ts` were placed as broad peers under `src/lib/` instead of a coherent event-tracker deep module boundary.
3. **Insufficient E2E coverage** — existing tests proved direct writer calls only, not a named automatic flow that creates both JSON and Markdown in a temp project root and parses required metadata back.
4. **Failure behavior unproven** — existing tests did not fail explicitly on directory creation, JSON write, Markdown write, or missing parse metadata.
5. **Sanitization incomplete for corrected requirement** — previous sanitization preserved long/raw stem patterns; corrected acceptance requires a sanitized four-character session suffix such as `ses_2b7a` and path traversal proof.
6. **Markdown/JSON parse-back missing** — previous parser focused product-detox-style transcript Markdown, not selective event-tracker JSON/Markdown read-model validation.

## Fix Plan

- Move implementation into `src/lib/event-tracker/` with `types.ts`, `parser.ts`, `writer.ts`, and `index.ts`.
- Keep compatibility re-export shims only if needed to avoid breaking public imports during the correction, but direct plugin/index imports to the new boundary.
- Implement filesystem adapter injection for deterministic failure tests.
- Add focused E2E tests under `tests/lib/event-tracker/` for automatic write/parse and negative paths.
- Update Phase 25 docs to mark the previous completion as corrected by this guarded fix loop.

## AGENTS.md Compliance

- Hard Harness code remains under `src/`.
- Runtime state target remains `.hivemind/`, not `.opencode/`.
- No new user-invoked tool surface is introduced.
- New errors use `[Harness]` prefix.
- New code is TypeScript strict, no `any`, and each module remains below 500 LOC.
