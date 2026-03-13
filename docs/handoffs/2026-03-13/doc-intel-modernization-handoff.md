# Doc-Intelligence Modernization Handoff

## Verified current state

- The narrow YAML/XML `createDocument` hardening slice is complete in `src/lib/doc-intel.ts`.
- The earlier Markdown/JSON create-materialize hardening and governance write-boundary protections remain in place.
- Independent verification already passed for this slice:
  - `npx tsx --test tests/hivemind-doc.test.ts`
  - `npx tsc --noEmit`
- `src/tools/hivemind-doc.ts` was not required for the YAML/XML slice.

## Current workspace state

- Product-relevant workspace state now shows:
  - modified: `docs/synthesis/tools-plugins-organized-structured.md`
  - untracked: `docs/planning-draft/modernize-doc-intelligence-layer.md`
- Ignore `.hivemind/state/brain.json` as runtime/session noise unless explicitly working on governance internals.

## Refactor objective for the next session

Refactor, split, and modernize the document-intelligence layer centered on:

- `src/lib/doc-intel.ts`
- `src/lib/code-intel/doc-weaver.ts`
- `src/tools/hivemind-doc.ts`

Use these as the main design inputs:

- `docs/planning-draft/modernize-doc-intelligence-layer.md`
- `docs/synthesis/tools-plugins-organized-structured.md`

## Constraints that must carry forward

- Standalone-first: do not make doc tooling depend on planning artifacts, sessions, state systems, or task systems.
- Keep `src/lib/doc-intel.ts` as the canonical standalone contract until the redesign deliberately splits responsibilities.
- Keep filesystem truth authoritative: write success requires read-after-write verification.
- Preserve governance-owned path protections.
- Treat format-aware behavior as first-class: Markdown, JSON, YAML, and XML must not be forced through one Markdown-shaped model.
- Do not re-open or redo the completed YAML/XML create slice unless new evidence shows regression.

## Recommended starting sequence for the new session

1. Read `docs/planning-draft/modernize-doc-intelligence-layer.md` fully and treat it as the primary refactor brief.
2. Read `docs/synthesis/tools-plugins-organized-structured.md` as a candidate architecture/synthesis input, not final truth.
3. Produce a concrete architecture split and migration map before touching code.
4. Define what stays in `hivemind_doc`, what moves into a new `hivemind_handoff`, and what belongs in `hivemind_inspect`.
5. Preserve backward-compatible shims only where they reduce migration risk.
6. Start implementation from the highest-value, lowest-fragility library split first.

## Suggested architecture direction

- Keep SDK/tool registration isolated in `src/tools/*`.
- Move reusable format logic into a dedicated parser layer.
- Move locking/read-before-write/hash/integrity behavior into a reusable file CRUD layer.
- Keep handoff generation and resume artifacts in a separate handoff-focused tool family.
- Keep investigation/structure/JSDoc/comment analysis in a separate inspect-focused tool family.

## Deferred and known gaps

- YAML/XML create hardening is done, but broader structured CRUD for YAML/XML is not finished.
- XML validation is intentionally minimal right now.
- `tests/planning-materializer-doc-intel.test.ts` references a missing planning-materializer module; treat that as unrelated to the doc-tool hardening/refactor lane unless explicitly pulled into scope.

## Resume note

The next session should begin as an architecture/specification-first refactor session, not as a continuation of the completed YAML/XML bugfix slice.

