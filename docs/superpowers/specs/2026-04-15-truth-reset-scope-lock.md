# Cycle 0 Truth Reset / Scope Lock

> Date: 2026-04-15
> Status: Cycle 0 scope-lock artifact for execution alignment; governing unless later live-runtime evidence or an explicitly newer approved scope-lock supersedes it

## 1. Goal of Cycle 0

Reset execution truth before further implementation so the runtime-adapter recovery proceeds from authoritative evidence instead of inherited completion theater, mock-only confidence, or stale summaries.

## 2. Trusted Inputs

Cycle 0 uses a stricter authority hierarchy than the master plan's broader list of artifacts that may be trusted enough to execute from. A code path may be trustworthy enough to inspect or execute from without becoming top-tier authoritative truth, and a planning artifact may still be usable for scoping while remaining caveated rather than fully trusted.

- `docs/superpowers/specs/2026-04-15-real-opencode-sdk-runtime-adapter-design.md` — approved execution design for the immediate recovery slice
- `docs/superpowers/specs/2026-04-15-delegate-task-single-path-recovery-design.md` — trusted prior recovery design input where it does not conflict with the runtime-adapter design or master plan
- `docs/superpowers/plans/2026-04-15-delegate-task-single-path-recovery.md` — trusted prior recovery plan input where it does not conflict with the runtime-adapter design or master plan
- `docs/superpowers/plans/2026-04-15-real-opencode-sdk-runtime-adapter-master-plan.md` — authoritative cycle structure, gates, and evidence model
- `AGENTS.md` — current repo-level operating constraints, including the explicit notice that `delegate-task` is broken

## 3. Usable-with-Caveat Inputs

- `.planning/STATE.md` — useful for current project positioning and caveat tracking, but it is still planning metadata, not runtime proof
- `.planning/ROADMAP.md` — present and useful for sequencing/history, but it contains historical execution language that must not be treated as proof of runtime correctness
- `.planning/DELEGATION-AUDIT-REPORT-2026-04-15.md` — useful as a forensic warning document and confusion map, but it is an audit summary, not a substitute for live runtime evidence

## 4. Untrusted Inputs

- Historical completion claims, reconciliation notes, or contaminated status language from Phases 09 through 13, including 09, 09.1, 09.2, 12, and 13, when they are not backed by live delegated-child runtime evidence
- Mock-only or self-check verification that proves internal logic or file presence without proving the real OpenCode runtime contract
- Any artifact that treats async dispatch acceptance, queue placement, or prompt acknowledgment as proof that meaningful work started
- Any artifact that blends Option 2 adapter recovery with partial Option 3 event-stream redesign assumptions

## 5. Scope Lock Statement

Option 2 now, Option 3 later, no blended redesign.

Cycle 0 locks the immediate corridor to runtime-adapter repair inside the current polling/continuity model. Downstream cycles may preserve clean seams for Option 3, but they must not partially land event-stream architecture, mixed truth models, or redesign work under the label of Option 2 recovery.

## 6. Artifact Classes That Can Mislead Downstream Execution

- Completion summaries that say "passed," "complete," or "verified" without live runtime evidence
- Tests that only encode fantasy message shapes, legacy tool-part fields, or synthetic lifecycle promotion
- Planning/state/audit summaries that compress historical work into status labels stronger than the underlying evidence supports
- Reconciliation notes or recovery summaries that are accurate about history but are mistakenly reused as proof that the runtime works now
- Architecture notes that assume SSE/event-stream behavior for the immediate repair slice

## 7. Evidence Hierarchy

Live runtime > continuity from live run > mock tests > historical summaries.

Operational interpretation:

- Live runtime evidence is the final authority for delegated-child correctness
- Continuity data only outranks tests when it came from a real live run
- Mock/unit tests can prove local logic but never end-to-end runtime truth
- Historical summaries are for forensic context only unless re-proven by stronger evidence

## 8. Execution Lock for Downstream Cycles

- Cycle 1 and Cycle 2 may only implement the approved Option 2 adapter/truth-model repair described in the 2026-04-15 design and master plan
- No downstream cycle may claim runtime success from code inspection, mock-heavy tests, or planning metadata alone
- Cycle 3 live validation is the first allowed gate for saying the Option 2 corridor works against the real runtime
- Historical artifacts may remain readable for traceability, but any conflict with the trusted inputs and evidence hierarchy above means those artifacts are non-authoritative now and must be explicitly annotated, quarantined, or archived in later cleanup cycles rather than merely interpreted cautiously

## 9. Operator Note

Prior completion claims are not sufficient because this repo already contains documented cases where code existed, tests passed, and summaries said "complete" while async delegated child sessions still failed or never produced trustworthy runtime evidence. Cycle 0 exists to stop those claims from steering the next implementation cycles, and any later-discovered conflicting historical artifact should be marked for annotation/quarantine in cleanup work instead of being allowed to silently compete with the trusted scope-lock inputs.
