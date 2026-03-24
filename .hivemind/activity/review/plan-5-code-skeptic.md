# Plan #5 Code-Skeptic Review — 2026-03-24

## Files Reviewed
- `src/features/event-tracker/classifier/event-classifier.ts`
- `src/features/event-tracker/classifier/event-id.ts`
- `src/features/event-tracker/classifier/delegation-returned-evidence.ts`
- `src/features/event-tracker/classifier/writer-adapter.ts`
- `src/features/event-tracker/classifier/event-classifier.test.ts`
- `src/features/event-tracker/classifier/event-id.test.ts`
- `src/features/event-tracker/classifier/delegation-returned-evidence.test.ts`
- `src/features/event-tracker/classifier/writer-adapter.test.ts`
- `src/features/event-tracker/classifier/classifier-integration.test.ts`

## Findings
### Critical
- None.

### High
- **Semantic mismatch risk: `delegation_returned` is emitted for every delegation target even when no return evidence exists.** The classifier always pushes a `delegation_returned` event inside the loop regardless of whether any return data exists, which can encode a non-returned delegation as if it has returned with `N/A` fields (`src/features/event-tracker/classifier/event-classifier.ts:73`, `src/features/event-tracker/classifier/event-classifier.ts:101`, `src/features/event-tracker/classifier/event-classifier.ts:102`). If downstream analytics treat event type as authoritative state, this is incorrect behavior, not just missing detail.

### Medium
- **Actor mapping is lossy for non-delegation events.** Adapter always reads actor from `event.data.delegatedTo`, so `user_message` and `assistant_output` events become `N/A` actor even though identity context exists elsewhere (`src/features/event-tracker/classifier/writer-adapter.ts:56`). This weakens auditability and can break actor-based filtering.
- **Inconsistent fallback policy across related event types.** `delegation_returned` canonicalizes multiple fields with fallback (`src/features/event-tracker/classifier/delegation-returned-evidence.ts:40`), but `delegation_created` only normalizes `packetId` and leaves other user-facing fields raw (`src/features/event-tracker/classifier/event-classifier.ts:80`, `src/features/event-tracker/classifier/event-classifier.ts:81`, `src/features/event-tracker/classifier/event-classifier.ts:82`, `src/features/event-tracker/classifier/event-classifier.ts:83`). This creates inconsistent `N/A` semantics within one classifier pass.
- **Hidden runtime hazard in details generation.** Non-`delegation_returned` details rely on direct `JSON.stringify(event.data)` with no guard (`src/features/event-tracker/classifier/writer-adapter.ts:35`). A circular or unserializable data object would throw at runtime and block event writing.

### Low
- **Fallback helper duplication with slight semantic drift risk.** Both `withFallback` and `asText` implement similar trim-and-default logic in separate files (`src/features/event-tracker/classifier/delegation-returned-evidence.ts:29`, `src/features/event-tracker/classifier/writer-adapter.ts:4`). This is small now, but divergence risk grows as fallback rules evolve.
- **No lint gate evidence available for this slice.** `npm run lint` fails because script is missing, so style/static rule coverage is currently unverifiable for this package path (command evidence below).

## Assumption Risks
- Assumption: every `delegationTargets` entry has a corresponding same-turn return record; risk if wrong: timeline corruption and inflated completion metrics (`src/features/event-tracker/classifier/event-classifier.ts:73`, `src/features/event-tracker/classifier/event-classifier.ts:102`).
- Assumption: actor is always `data.delegatedTo`; risk if wrong: non-delegation events lose actor identity and degrade observability (`src/features/event-tracker/classifier/writer-adapter.ts:56`).
- Assumption: all `event.data` payloads are JSON-stringifiable; risk if wrong: adapter throw during markdown rendering (`src/features/event-tracker/classifier/writer-adapter.ts:35`).
- Assumption: fallback normalization can differ between creation/return events without side effects; risk if wrong: inconsistent UI/reporting behavior for empty/whitespace fields (`src/features/event-tracker/classifier/event-classifier.ts:80`, `src/features/event-tracker/classifier/delegation-returned-evidence.ts:41`).

## Edge Cases Not Covered
- Classifier behavior when `ParsedDelegation.packetId` is `null` at source and no evidence map entry exists (type allows this in parser, but no classifier test covers it) (`src/features/event-tracker/parser/types.ts:31`, `src/features/event-tracker/classifier/event-classifier.test.ts:21`).
- Multiple delegation targets in a single turn verifying deterministic ID ordering and one-to-one created/returned pairing (`src/features/event-tracker/classifier/event-classifier.ts:73`).
- Whitespace-only `delegatedTo`, `subagentType`, and `description` handling consistency between created vs returned payloads (`src/features/event-tracker/classifier/event-classifier.ts:81`, `src/features/event-tracker/classifier/delegation-returned-evidence.ts:41`).
- Adapter behavior when `event.data` is circular or non-serializable for non-`delegation_returned` events (`src/features/event-tracker/classifier/writer-adapter.ts:35`).
- Actor mapping expectations for `user_message` and `assistant_output` events (currently untested; only shape checks exist) (`src/features/event-tracker/classifier/writer-adapter.test.ts:23`).

## Verdict
CONDITIONAL

## Required Changes
1. Gate `delegation_returned` emission behind explicit return evidence presence, or encode explicit pending/not-returned status to preserve timeline semantics.
2. Replace global actor mapping from `data.delegatedTo` with type-specific actor derivation (at minimum preserve user/assistant actor context).
3. Align fallback policy between `delegation_created` and `delegation_returned` fields to avoid mixed normalization behavior.
4. Add safe serialization guard for non-`delegation_returned` details path (try/catch with deterministic fallback string).
5. Add tests for null packet IDs, multi-delegation ordinal/id ordering, whitespace normalization parity, and actor mapping by event type.
6. Add or document lint command coverage for this repo so static-quality checks are part of evidence gates.

---

Evidence collected:
- `git status --short` (workspace is heavily dirty; review scoped strictly to requested files)
- `git diff -- src/features/event-tracker/classifier/...` (no staged/unstaged diff in tracked slice output)
- `git log --oneline --decorate -n 10 -- src/features/event-tracker/classifier` (no recent history emitted for this path in current state)
- `npx tsc --noEmit` (pass; no output)
- `npx tsx --test src/features/event-tracker/classifier/*.test.ts` (pass; 16/16)
- `npm run lint` (fails: missing script `lint`)
